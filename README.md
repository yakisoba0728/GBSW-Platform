# GBSW Platform

Next.js, NestJS, PostgreSQL, Prisma, pgAdmin, Docker를 한 저장소에서 관리하는 모노레포입니다.

## 구조

- `apps/web`: Next.js 웹 앱
- `apps/api`: NestJS API 서버와 Prisma 스키마
- `docker-compose.yml`: 로컬 PostgreSQL, pgAdmin 개발 컨테이너
- `scripts/dev.mjs`: `pnpm dev` 전체 오케스트레이션
- `apps/web/Dockerfile`, `apps/api/Dockerfile`: 배포용 앱 컨테이너 빌드 예시

## 시작하기

```bash
pnpm install
cp .env.example .env
pnpm dev
```

처음 실행 전에 아래 인증 환경변수를 채워주세요.

- `INTERNAL_API_SECRET`
- `SUPER_ADMIN_ID`
- `SUPER_ADMIN_PASSWORD`
- `POSTGRES_PASSWORD`
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`
- `API_INTERNAL_URL`은 기본값이 이미 들어 있으므로 보통 수정할 필요가 없습니다.

`.env.example`에는 안전한 기본값이 아니라 교체용 플레이스홀더가 들어 있습니다. `pnpm dev` 전에 로컬 개발용 값으로 바꿔 두고, 운영 배포용 파일은 별도로 준비하세요.

## 기본 포트

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- pgAdmin: `http://localhost:5050`
- PostgreSQL: `localhost:5432`

## pgAdmin 로그인

- 이메일: `.env`의 `PGADMIN_DEFAULT_EMAIL`
- 비밀번호: `.env`의 `PGADMIN_DEFAULT_PASSWORD`
- 서버는 `GBSW Platform DB` 이름으로 미리 등록됩니다.
- DB 접속 비밀번호는 `.env`의 `POSTGRES_PASSWORD`와 같습니다.

## 자주 쓰는 명령어

```bash
pnpm dev
pnpm db:prepare
pnpm db:down
pnpm lint
pnpm build
pnpm test
```

## Docker 이미지 빌드 예시

```bash
docker build -f apps/web/Dockerfile .
docker build -f apps/api/Dockerfile .
```

## 운영 배포

이 프로젝트는 Docker Compose로 `web`, `api`, `db`, `pgAdmin`을 올리는 구성을 기준으로 운영할 수 있습니다. 운영에서는 reverse proxy를 외부 진입점으로 두고, `web`과 `pgAdmin`은 loopback/internal 전용으로 둡니다.

### 1. 운영 환경변수 준비

```bash
cp .env.production.example .env.production
```

- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `WEB_PORT`
- `INTERNAL_API_SECRET`
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`
- `NEXT_PUBLIC_API_URL`
- `SUPER_ADMIN_ID`
- `SUPER_ADMIN_PASSWORD`

위 값은 반드시 운영용으로 변경하세요.

- `SUPER_ADMIN_ID`, `SUPER_ADMIN_PASSWORD`는 런타임 환경변수로 읽히며 앱 안에서 별도로 생성되지 않습니다.
- `API_INTERNAL_URL`은 운영 Compose가 자동으로 `http://api:3001`을 주입하므로 `.env.production`에 따로 넣지 않습니다.
- `NEXT_PUBLIC_API_URL`은 공개 설정으로 노출되는 Nest API 원본 주소이며, 필요 시 서버 측 fallback에도 사용됩니다.
- `NEXT_PUBLIC_API_URL`을 `https://example.com/api`처럼 Next.js의 `/api` 경로로 지정하면 안 됩니다.
- `INTERNAL_API_SECRET`은 빌드 인자가 아니라 런타임 secret으로만 사용합니다.

### 2. 운영 컨테이너 기동

```bash
pnpm deploy:production
```

기본값은 루트의 `.env.production`을 사용합니다. 다른 파일을 쓰고 싶다면:

```bash
node scripts/deploy-production.mjs .env
```

이 스크립트는 다음 순서로 진행됩니다.

- `.env.production` 필수값과 `NEXT_PUBLIC_API_URL` 형식을 먼저 검증
- `docker compose config --quiet`로 Compose 구성을 먼저 검증
- `api`와 `web` 이미지를 먼저 빌드
- `db`와 `pgAdmin`을 먼저 기동
- `.env`의 `POSTGRES_PASSWORD`를 현재 DB 사용자 비밀번호로 동기화
- `prisma migrate deploy`를 api 이미지 안에서 명시적으로 실행
- `api`, `web`을 기동
- healthcheck가 통과할 때까지 대기

`web` 이미지는 `NEXT_PUBLIC_API_URL`만 빌드 인자로 받아서, 공개 API 원본 주소가 빌드 산출물과 런타임 설정에 함께 반영되도록 맞춥니다.

기존 PostgreSQL 볼륨이 남아 있어도 `.env`의 DB 비밀번호를 기준으로 다시 맞춰 주기 때문에, `P1000: Authentication failed` 같은 재배포 오류를 줄일 수 있습니다.

필요할 때만 pgAdmin을 다시 띄우려면:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml --profile admin up -d pgadmin
```

pgAdmin은 기본적으로 `127.0.0.1:${PGADMIN_PORT}`에만 바인딩됩니다. 서버 정의와 DB 비밀번호 파일은 컨테이너 시작 시 운영 환경변수 기준으로 자동 생성되므로, 별도 서버 등록 없이 바로 사용할 수 있습니다.

Docker Compose의 `Bake/buildx` 경고를 없애고 싶다면 Docker 공식 패키지로 설치하거나 업그레이드하세요. 공식 Ubuntu 설치 문서에는 `docker-buildx-plugin`과 `docker-compose-plugin` 패키지를 함께 설치하도록 안내되어 있습니다.

### 3. Nginx 연결

예시 설정은 [deploy/nginx/gbsw-platform.conf.example](/Users/yakihyuk0728/Documents/GitHub/GBSW-Platform/deploy/nginx/gbsw-platform.conf.example)에 있습니다.

- Nginx를 함께 쓸 경우 `127.0.0.1:${WEB_PORT}`로 바인딩된 Next.js 앱 앞단에 리버스 프록시를 둘 수 있습니다.
- Nest API는 외부에 직접 노출하지 않고, Next 서버가 내부적으로 `api` 컨테이너에 연결합니다.

### 4. 운영 확인

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs -f
```

`/health` 엔드포인트는 Prisma로 데이터베이스 연결까지 확인하므로, DB 장애가 나면 API healthcheck도 함께 실패합니다.

## 인증/구성 메모

- 최고관리자 인증은 현재 데이터베이스 테이블이 아니라 `SUPER_ADMIN_ID`, `SUPER_ADMIN_PASSWORD` 환경변수로 관리합니다.
- `pnpm db:prepare`는 데이터베이스와 pgAdmin을 준비하고 Prisma 마이그레이션을 적용하지만, 최고관리자 계정을 따로 시드하지 않습니다.
- `pnpm db:migrate`는 운영과 동일한 Prisma deploy 단계를 수동으로 실행할 때 씁니다.
- 서버 사이드 Next.js 호출은 `API_INTERNAL_URL`을 우선 사용하고, Docker Compose 운영 구성에서는 `http://api:3001`로 자동 설정됩니다.
- `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`은 모두 절대 URL이어야 하며 `/api` 같은 경로를 포함할 수 없습니다.

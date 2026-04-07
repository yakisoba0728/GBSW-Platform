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

## 기본 포트

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- pgAdmin: `http://localhost:5050`
- PostgreSQL: `localhost:5432`

## pgAdmin 로그인

- 이메일: `admin@gbsw.com`
- 비밀번호: `gbswadmin`
- 서버는 `GBSW Platform DB` 이름으로 미리 등록됩니다.
- DB 접속 비밀번호는 기본값 기준 `gbsw`입니다.

## 자주 쓰는 명령어

```bash
pnpm dev
pnpm db:prepare
pnpm db:down
pnpm lint
pnpm build
```

## Docker 이미지 빌드 예시

```bash
docker build -f apps/web/Dockerfile .
docker build -f apps/api/Dockerfile .
```

운영용 이미지는 GitHub Actions에서 자동 빌드해 GHCR에 푸시하는 구성을 권장합니다.

## 운영 이미지 자동 빌드

- `main` 브랜치에 push되면 GitHub Actions가 `api`, `web` 이미지를 병렬로 빌드합니다.
- 이미지는 기본값 기준 `ghcr.io/yakisoba0728/gbsw-platform-api:latest`, `ghcr.io/yakisoba0728/gbsw-platform-web:latest`로 올라갑니다.
- 같은 워크플로에서 BuildKit 레이어 캐시와 Next.js 빌드 캐시를 함께 재사용해 재빌드 시간을 줄입니다.
- 서버 배포는 해당 워크플로가 끝난 뒤 진행해야 최신 `latest` 이미지를 가져옵니다.

## 운영 배포

이 프로젝트는 Docker Compose로 `web`, `api`, `db`를 올리는 구성을 기준으로 운영할 수 있습니다. 현재 기본 배포 설정은 `web` 포트를 서버 외부에서 바로 접근할 수 있도록 공개합니다.

### 1. 운영 환경변수 준비

```bash
cp .env.production.example .env.production
```

- `POSTGRES_PASSWORD`
- `INTERNAL_API_SECRET`
- `NEXT_PUBLIC_API_URL`
- `API_IMAGE`
- `WEB_IMAGE`
- `SUPER_ADMIN_ID`
- `SUPER_ADMIN_PASSWORD`

위 값은 반드시 운영용으로 변경하세요.

GHCR 패키지가 비공개라면 서버에서 한 번만 로그인해 두면 됩니다.

```bash
docker login ghcr.io
```

### 2. 운영 컨테이너 기동

```bash
pnpm deploy:production
```

기본값은 루트의 `.env.production`을 사용합니다. 다른 파일을 쓰고 싶다면:

```bash
node scripts/deploy-production.mjs .env
```

이 스크립트는 다음 순서로 진행됩니다.

- `db` 컨테이너를 먼저 기동
- `.env`의 `POSTGRES_PASSWORD`를 현재 DB 사용자 비밀번호로 동기화
- `api`, `web` 최신 이미지를 각각 먼저 pull
- pull에 실패한 서비스만 서버에서 병렬 로컬 빌드
- `api`, `web`을 `--no-build`로 재기동
- healthcheck가 통과할 때까지 대기

기존 PostgreSQL 볼륨이 남아 있어도 `.env`의 DB 비밀번호를 기준으로 다시 맞춰 주기 때문에, `P1000: Authentication failed` 같은 재배포 오류를 줄일 수 있습니다.

즉, 평소에는 GHCR 이미지를 받아 더 빠르게 배포하고, GHCR 로그인이나 권한이 없는 서버에서도 기존처럼 로컬 빌드로 자동 복구됩니다.

필요할 때만 pgAdmin을 띄우려면:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml --profile admin up -d
```

pgAdmin은 기본적으로 `127.0.0.1:${PGADMIN_PORT}`에만 바인딩됩니다. 서버 정의와 DB 비밀번호 파일은 컨테이너 시작 시 운영 환경변수 기준으로 자동 생성되므로, 별도 서버 등록 없이 바로 사용할 수 있습니다.

### 3. Nginx 연결

예시 설정은 [deploy/nginx/gbsw-platform.conf.example](/Users/yakihyuk0728/Documents/GitHub/GBSW-Platform/deploy/nginx/gbsw-platform.conf.example)에 있습니다.

- Nginx를 함께 쓸 경우 `0.0.0.0:${WEB_PORT}`로 공개된 Next.js 앱 앞단에 리버스 프록시를 둘 수 있습니다.
- Nest API는 외부에 직접 노출하지 않고, Next 서버가 내부적으로 `api` 컨테이너에 연결합니다.

### 4. 운영 확인

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs -f
```

`/health` 엔드포인트는 Prisma로 데이터베이스 연결까지 확인하므로, DB 장애가 나면 API healthcheck도 함께 실패합니다.

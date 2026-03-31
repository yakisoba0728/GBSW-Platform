# GBSW Platform

Next.js, NestJS, PostgreSQL, Prisma, pgAdmin, Docker를 한 저장소에서 관리하는 최소 실행용 모노레포입니다.

## 구조

- `apps/web`: Next.js 웹 앱
- `apps/api`: NestJS API 서버와 Prisma 스키마
- `docker-compose.yml`: 로컬 PostgreSQL, pgAdmin 개발 컨테이너
- `scripts/dev.mjs`: `pnpm dev` 전체 오케스트레이션
- `apps/web/Dockerfile`, `apps/api/Dockerfile`: 배포용 앱 컨테이너 빌드 예시

## 시작하기

```bash
pnpm install
pnpm dev
```

처음 실행 시 루트 `.env`가 없으면 `.env.example`을 자동으로 복사합니다.

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

## 운영 배포

외부 Nginx가 서버에서 리버스 프록시를 맡고, 이 프로젝트는 Docker Compose로 `web`, `api`, `db`를 올리는 구성을 권장합니다.

### 1. 운영 환경변수 준비

```bash
cp .env.production.example .env.production
```

- `POSTGRES_PASSWORD`
- `AUTH_SESSION_SECRET`
- `SUPER_ADMIN_PASSWORD`
- `NEXT_PUBLIC_API_URL`

위 값은 반드시 운영용으로 변경하세요.

### 2. 운영 컨테이너 기동

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

필요할 때만 pgAdmin을 띄우려면:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml --profile admin up -d
```

pgAdmin은 기본적으로 `127.0.0.1:${PGADMIN_PORT}`에만 바인딩됩니다. 서버 정의와 DB 비밀번호 파일은 컨테이너 시작 시 운영 환경변수 기준으로 자동 생성되므로, 별도 서버 등록 없이 바로 사용할 수 있습니다.

Docker Compose의 `Bake/buildx` 경고를 없애고 싶다면 Docker 공식 패키지로 설치하거나 업그레이드하세요. 공식 Ubuntu 설치 문서에는 `docker-buildx-plugin`과 `docker-compose-plugin` 패키지를 함께 설치하도록 안내되어 있습니다.

### 3. Nginx 연결

예시 설정은 [deploy/nginx/gbsw-platform.conf.example](/Users/yakihyuk0728/Documents/GitHub/GBSW-Platform/deploy/nginx/gbsw-platform.conf.example)에 있습니다.

- Nginx는 `127.0.0.1:3000`의 Next.js 앱만 프록시하면 됩니다.
- Nest API는 외부에 직접 노출하지 않고, Next 서버가 내부적으로 `api` 컨테이너에 연결합니다.

### 4. 운영 확인

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs -f
```

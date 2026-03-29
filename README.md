# GBSW Platform

Next.js, NestJS, PostgreSQL, Prisma, Prisma Studio, Docker를 한 저장소에서 관리하는 최소 실행용 모노레포입니다.

## 구조

- `apps/web`: Next.js 웹 앱
- `apps/api`: NestJS API 서버와 Prisma 스키마
- `docker-compose.yml`: 로컬 PostgreSQL 개발 컨테이너
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
- Prisma Studio: `http://localhost:5555`
- PostgreSQL: `localhost:5432`

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

# Design Spec: Account Management, DB Admin, Onboarding Flow

**Date:** 2026-04-09  
**Status:** Approved

---

## Overview

이 스펙은 다음 4가지 기능을 다룬다:

1. **역할 재편** — Super Admin에서 학생 관리 제거, Teacher로 이관
2. **교사 학생 관리** — 교사 인터페이스에 학생 생성/수정/삭제/일괄생성 추가
3. **Admin DB 관리 페이지** — SQL 에디터 + 테이블 인라인 편집
4. **첫 로그인 온보딩 플로우** — 비밀번호 변경 → 이메일 연동 → 전화번호 연동

---

## 1. DB Schema 변경

### 1.1 Student 모델

```prisma
model Student {
  studentId          String   @id
  school             School
  currentYear        Int
  currentClass       Int
  currentNumber      Int
  majorSubject       String?
  name               String?          // nullable (일괄 생성 시 이름 없음)
  phone              String?          // nullable (온보딩에서 본인 입력)
  email              String?          // 신규 필드 (온보딩에서 본인 입력)
  hasLinkedPhone     Boolean  @default(false)  // 신규
  hasLinkedEmail     Boolean  @default(false)  // 신규
  isActive           Boolean  @default(true)
  passwordHash       String
  mustChangePassword Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

**변경 요약:**
- `name`: `String` → `String?`
- `phone`: `String` → `String?`
- `email`: 신규 (nullable)
- `hasLinkedPhone`, `hasLinkedEmail`: 신규 Boolean (default false)

### 1.2 Teacher 모델

```prisma
model Teacher {
  teacherId          String   @id
  name               String              // 개별 생성이므로 필수 유지
  phone              String?             // nullable로 변경 (온보딩에서 본인 입력)
  email              String?             // 신규 필드
  hasLinkedPhone     Boolean  @default(false)  // 신규
  hasLinkedEmail     Boolean  @default(false)  // 신규
  isActive           Boolean  @default(true)
  passwordHash       String
  mustChangePassword Boolean  @default(true)
  isDormTeacher      Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

**변경 요약:**
- `phone`: `String` → `String?`
- `email`: 신규 (nullable)
- `hasLinkedPhone`, `hasLinkedEmail`: 신규 Boolean (default false)

### 1.3 AuthSession 모델

온보딩 단계를 미들웨어에서 라우팅할 수 있도록 세션에 상태 반영:

```prisma
model AuthSession {
  // 기존 필드 모두 유지
  mustChangePassword Boolean @default(false)
  // 신규
  hasLinkedEmail     Boolean @default(false)
  hasLinkedPhone     Boolean @default(false)
}
```

### 1.4 임시 비밀번호 규칙 변경

`apps/api/src/admin/admin.service.ts`의 `generateTemporaryPassword()` 수정:

| 대상 | 기존 | 변경 후 |
|------|------|---------|
| Student | 랜덤 16자 hex | `studentId` 문자열 자체 |
| Teacher | 랜덤 16자 hex | `teacherId` 문자열 자체 |

---

## 2. 역할 재편

### 2.1 Super Admin 기능 범위 축소

**제거:**
- `/admin/students/create` 페이지 및 라우트
- `/admin/students` 목록 페이지 및 라우트
- `POST /api/admin/students` 엔드포인트
- `GET /api/admin/students` 엔드포인트
- `PATCH /api/admin/students/:id` 엔드포인트
- `DELETE /api/admin/students/:id` 엔드포인트
- Admin 네비게이션에서 학생 관련 항목 제거

**유지 (변경사항 포함):**
- `/admin/teachers/*` (교사 계정 생성/관리) — 교사 생성 폼에서 phone 필드를 선택 사항으로 변경 (schema nullable 반영)
- `/admin/mileage/*`, `/admin/dorm-mileage/*` (마일리지 규칙)
- `/admin/security` (보안 설정)
- `/admin/db` (신규: DB 관리 페이지)

### 2.2 역할별 기능 대조표

| 기능 | Super Admin | Teacher |
|------|:-----------:|:-------:|
| 학생 계정 단건 생성 | ❌ (제거) | ✅ (신규) |
| 학생 계정 일괄 생성 | ❌ (제거) | ✅ (신규) |
| 학생 정보 조회/수정/삭제 | ❌ (제거) | ✅ (신규) |
| 학생 비밀번호 초기화 | ❌ (제거) | ✅ (신규) |
| 교사 계정 생성/관리 | ✅ (유지) | ❌ |
| 마일리지 규칙 관리 | ✅ (유지) | ❌ |
| DB 관리 | ✅ (신규) | ❌ |

---

## 3. 교사 학생 관리

### 3.1 API 엔드포인트 (Teacher 권한)

모든 엔드포인트는 Teacher 세션 인증 필요 (`x-internal-api-secret` + 세션 헤더).

```
GET    /api/teacher/students
  Query: year?, class?, majorSubject?, search?, page?, limit?
  Response: { students: StudentSummary[], total: number }

POST   /api/teacher/students
  Body: { school, year, class, number, majorSubject? }
  Response: { studentId, temporaryPassword }

POST   /api/teacher/students/bulk
  Body: { school, year, class, majorSubject?, startNumber, endNumber }
  Response: { created: CreatedStudent[], skipped: SkippedEntry[] }

GET    /api/teacher/students/:studentId
  Response: StudentDetail

PATCH  /api/teacher/students/:studentId
  Body: { name?, phone?, email?, year?, class?, number?, majorSubject?, isActive? }
  Response: StudentDetail

DELETE /api/teacher/students/:studentId
  Response: { success: true }

POST   /api/teacher/students/:studentId/reset-password
  Response: { studentId, newPassword: studentId }
  (비밀번호를 studentId 값으로 초기화, mustChangePassword = true로 재설정)
```

### 3.2 프론트엔드 구조

**탭 추가 위치:** `apps/web/app/teacher/` 내 기존 탭 옆에 "학생 관리" 탭 추가

```
/teacher/
  /mileage        → 기존 마일리지 탭
  /students       → 신규 학생 관리 탭
```

**학생 관리 탭 레이아웃:**

- 상단 필터 바: 학년 select / 반 select / 과 text / 이름·학번 검색 input
- 우측 버튼: "단건 생성", "일괄 생성"
- 학생 테이블: 학번 / 이름 / 학년 / 반 / 번호 / 과 / 이메일 / 전화번호 / 상태
- 행 클릭 → 상세 모달

**상세 모달 내용:**
- 모든 필드 인라인 편집 (학번 제외)
- "비밀번호 초기화" 버튼 (클릭 시 확인 다이얼로그 → studentId로 초기화)
- "계정 비활성화/활성화" 버튼
- "계정 삭제" 버튼 (확인 다이얼로그 필수)

### 3.3 일괄 생성 플로우 (2단계)

**1단계 — 입력 폼 (모달 or 별도 페이지):**

| 필드 | 타입 | 비고 |
|------|------|------|
| 학교 | select | GBSW / BYMS |
| 학년 | select | 1 / 2 / 3 |
| 반 | number | 직접 입력 |
| 과 | text | 선택 사항 |
| 시작번호 | number | 예: 1 |
| 끝번호 | number | 예: 30 |

"미리보기" 버튼 → API 호출 없이 클라이언트에서 목록 생성 후 2단계로 이동

**2단계 — 미리보기 + 확인:**

```
학번       학년  반  번호  과        임시비밀번호
GB260101   1    1   1    소프트웨어  GB260101
GB260102   1    1   2    소프트웨어  GB260102
...
```

"생성 확인" 버튼 → API 호출 → 결과 표시 → txt 자동 다운로드

**충돌 처리:** 이미 존재하는 학번은 건너뜀, `skipped` 목록으로 UI에 표시

**txt 파일 형식:**
```
학번,학년,반,번호,과,임시비밀번호
GB260101,1,1,1,소프트웨어,GB260101
```
파일명: `students_{year}학년_{class}반_{YYYYMMDD}.txt`

**학번 연도 규칙 명확화:**
- 학번의 연도 부분(예: `26`)은 계정 생성 시점의 캘린더 연도(2자리)를 사용
- 일괄 생성 폼의 "학년" 필드는 학교 내 학년(1~3학년)을 의미하며 학번 연도와 무관
- 예: 2026년에 생성된 1학년 1반 1번 학생 → `GB260101`

---

## 4. Admin DB 관리 페이지

### 4.1 라우트

```
/admin/db   → DB 관리 메인 페이지 (Super Admin 전용)
```

Admin 네비게이션에 "DB 관리" 항목 추가.

### 4.2 API 엔드포인트 (Super Admin 전용)

```
GET    /api/admin/db/tables
  Response: { tables: string[] }
  (prisma_migrations 테이블 제외)

GET    /api/admin/db/tables/:tableName
  Query: page?, limit? (default 50)
  Response: { columns: ColumnMeta[], rows: any[][], total: number }

PATCH  /api/admin/db/tables/:tableName/:rowId
  Body: { column: string, value: any }
  Response: { success: true }

DELETE /api/admin/db/tables/:tableName/:rowId
  Response: { success: true }

POST   /api/admin/db/query
  Body: { sql: string }
  Response: { columns?: string[], rows?: any[][], rowsAffected?: number, error?: string }
```

NestJS 내부에서 `PrismaService.$queryRawUnsafe()` 사용.

### 4.3 프론트엔드 레이아웃

```
┌─ 좌측 사이드바 ──────┐ ┌─ 우측 메인 ───────────────────────────────┐
│ 테이블 목록          │ │  [테이블 뷰 탭]  [SQL 탭]                  │
│                      │ │                                            │
│ > AuthSession        │ │  테이블 뷰: 선택한 테이블 데이터 그리드     │
│   DormMileageEntry   │ │  - 셀 클릭 → 인라인 편집                   │
│   DormMileageRule    │ │  - 행 삭제 버튼 (확인 모달)                 │
│   LoginThrottle      │ │  - 페이지네이션 (50행)                      │
│   SchoolMileageEntry │ │                                            │
│   SchoolMileageRule  │ │  SQL 탭: Monaco 에디터                     │
│   Student            │ │  - SQL 문법 하이라이팅                      │
│   Teacher            │ │  - "실행" 버튼                              │
│   ...                │ │  - 결과: 행 테이블 or "X행 영향받음"        │
│                      │ │  - 에러: PostgreSQL 메시지 그대로 출력      │
└──────────────────────┘ └────────────────────────────────────────────┘
```

### 4.4 보안

- Super Admin 세션 검증 필수 (기존 `requireSuperAdmin` 가드)
- `INTERNAL_API_SECRET` 헤더 인증 (기존 패턴)
- DDL 위험 키워드 감지 (`DROP`, `TRUNCATE`, `ALTER` 등) → 실행 전 확인 모달
- `prisma_migrations` 테이블: 테이블 목록에서 제외 (SQL로는 조회 가능)

---

## 5. 첫 로그인 온보딩 플로우

### 5.1 온보딩 단계 순서

```
로그인
  ↓
session.mustChangePassword = true  →  /onboarding/change-password
  ↓
session.hasLinkedEmail = false     →  /onboarding/link-email
  ↓
session.hasLinkedPhone = false     →  /onboarding/link-phone
  ↓
정상 페이지 (/student or /teacher)
```

적용 대상: Student, Teacher 모두 동일.

### 5.2 라우트 구조

기존 `/change-password`는 유지 (로그인 후 수동 변경 용도).  
온보딩 전용 경로 신규 추가:

```
/onboarding/change-password   → 1단계: 비밀번호 변경
/onboarding/link-email        → 2단계: 이메일 연동
/onboarding/link-phone        → 3단계: 전화번호 연동
```

각 페이지 상단에 진행 단계 표시: `1/3 비밀번호 변경`, `2/3 이메일 연동`, `3/3 전화번호 연동`

### 5.3 각 단계 상세

**1단계: `/onboarding/change-password`**
- 기존 `ChangePasswordForm` 컴포넌트 재사용 (embedded 모드)
- 현재 비밀번호 입력 없이 새 비밀번호만 입력 (임시 비밀번호 = ID이므로)
- 완료 시: `mustChangePassword = false` DB 저장 + 세션 갱신 → 2단계로 redirect

**2단계: `/onboarding/link-email`**
- 이메일 입력 필드
- "저장하고 다음" 버튼: `email` DB 저장 + `hasLinkedEmail = true` + 세션 갱신 → 3단계
- "나중에 하기" 버튼: 아무것도 저장하지 않고 3단계로 이동 (`hasLinkedEmail` 여전히 false)
- 로그아웃 후 재로그인 시 이 단계부터 다시 표시됨

**3단계: `/onboarding/link-phone`**
- 전화번호 입력 필드 (`010-XXXX-XXXX` 형식 검증)
- "저장하고 다음" 버튼: `phone` DB 저장 + `hasLinkedPhone = true` + 세션 갱신 → 메인 페이지
- "나중에 하기" 버튼: 아무것도 저장하지 않고 메인 페이지로 이동 (`hasLinkedPhone` 여전히 false)

### 5.4 라우트 가드 변경

`apps/web/lib/route-guards.ts` 수정:

```typescript
// 기존
if (session.mustChangePassword) redirect('/change-password')

// 변경 후
if (session.mustChangePassword) redirect('/onboarding/change-password')
else if (!session.hasLinkedEmail) redirect('/onboarding/link-email')
else if (!session.hasLinkedPhone) redirect('/onboarding/link-phone')
```

온보딩 페이지는 각 단계 가드를 통해 이전 단계가 완료되지 않으면 접근 불가.

### 5.5 신규 API 엔드포인트

```
PATCH  /api/auth/link-email
  Body: { email: string }
  Response: { success: true }
  (Student.email, hasLinkedEmail = true 저장 + 세션 갱신)

PATCH  /api/auth/link-phone
  Body: { phone: string }
  Response: { success: true }
  (Student/Teacher.phone, hasLinkedPhone = true 저장 + 세션 갱신)

POST   /api/auth/session/refresh-onboarding
  Response: { session: SessionData }
  (DB에서 최신 hasLinkedEmail, hasLinkedPhone 읽어서 세션 쿠키 갱신)
```

---

## 6. 마이그레이션 순서

1. Prisma 스키마 변경 (`Student`, `Teacher`, `AuthSession`)
2. `npx prisma migrate dev` — `name`, `phone` nullable, `email`/`hasLinked*` 추가
3. 기존 데이터 backfill: 기존 `phone`이 있는 Student/Teacher는 `hasLinkedPhone = true`로 업데이트
4. Super Admin에서 학생 관련 엔드포인트/페이지 제거
5. Teacher 학생 관리 API 구현
6. Teacher 학생 관리 프론트엔드 구현
7. 임시 비밀번호 규칙 변경 (`generateTemporaryPassword`)
8. 온보딩 플로우 구현 (라우트 가드 + 페이지)
9. Admin DB 관리 페이지 구현

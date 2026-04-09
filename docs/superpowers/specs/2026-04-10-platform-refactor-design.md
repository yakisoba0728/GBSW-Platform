# GBSW Platform 전면 리팩토링 설계 문서

**날짜**: 2026-04-10  
**범위**: 보안 수정 · DB 마이그레이션 · 백엔드 중복 제거 · `[scope]` 라우트 통합 · UI/UX·접근성 · 테스트  
**접근 방법**: 레이어드 순차 리팩토링 (6개 독립 레이어)

---

## 1. 핵심 아키텍처 결정

### 1.1 Scope 통합 패턴

현재 `school-mileage`와 `dorm-mileage`는 백엔드/프론트엔드 전반에 걸쳐 이중화되어 있다.
백엔드는 이미 `MileageScope` enum(`SCHOOL` | `DORM`)으로 통합되어 있으므로,
프론트엔드도 이를 따라 `scope: 'school' | 'dorm'` 단일 파라미터로 전환한다.

```ts
type MileageScope = 'school' | 'dorm'
```

### 1.2 URL 구조 변경

| 역할 | 기존 | 변경 후 |
|------|------|---------|
| Teacher | `/teacher/mileage/*` | `/teacher/school/*` |
| Teacher | `/teacher/dorm-mileage/*` | `/teacher/dorm/*` |
| Student | `/student/mileage/*` | `/student/school/*` |
| Student | `/student/dorm-mileage/*` | `/student/dorm/*` |
| Admin | `/admin/mileage/*` | `/admin/school/*` |
| Admin | `/admin/dorm-mileage/*` | `/admin/dorm/*` |

기존 URL에는 Next.js `[[...slug]]` catch-all redirect를 추가해 하위 호환성을 유지한다.

### 1.3 컴포넌트 계층

```
Before:
SchoolMileageGrant.tsx  ─┐
                          ├─► SharedMileageGrantView.tsx
DormMileageGrant.tsx    ─┘

After:
[scope]/grant/page.tsx  ──► MileageGrantView.tsx (scope prop)
```

- `DormMileageX.tsx` / `SchoolMileageX.tsx` 파일 14개 삭제
- `SharedXxx.tsx` → `XxxView.tsx` (Shared prefix 제거)
- `scope: MileageScope` prop으로 경로·레이블 분기

### 1.4 Next.js API Route 통합

```
Before: app/api/teacher/school-mileage/entries/route.ts
        app/api/teacher/dorm-mileage/entries/route.ts

After:  app/api/teacher/[scope]/entries/route.ts
```

`params.scope` → `'school-mileage'` | `'dorm-mileage'` 백엔드 경로 매핑:

```ts
const apiPrefix = scope === 'school' ? 'school-mileage' : 'dorm-mileage'
```

---

## 2. Layer 1 — 보안 긴급 수정

### 2.1 Super-admin 타이밍 공격

- **파일**: `apps/api/src/auth/auth.service.ts:392`, `apps/api/src/admin/admin.controller.ts:244`
- **문제**: `===` 문자열 비교로 super-admin 비밀번호 검증 → 타이밍 공격 가능
- **수정**: `crypto.timingSafeEqual`을 사용하는 `safeStringEqual` 헬퍼를 `config/runtime-env.ts`에 추출하고 두 곳 모두 교체
- **추가**: 중복된 credential fingerprint 계산(`auth.service.ts:934`, `auth-access.ts:104`)을 `getSuperAdminCredentialFingerprint()` 단일 함수로 추출

### 2.2 Docker 보안

- **파일**: `apps/web/Dockerfile:16-18`
- **문제**: `ARG INTERNAL_API_SECRET` + `ENV INTERNAL_API_SECRET`로 빌드 타임에 시크릿이 이미지에 포함됨 (`docker history`로 노출)
- **수정**: Dockerfile에서 ARG/ENV 제거, `docker-compose.production.yml`에서 런타임 환경변수 주입으로 전환
- **추가**: `.gitignore`에 `.env.production`, `.env.local`, `.env.*.local`, `.env.test` 패턴 추가

### 2.3 세션·쿠키 버그

- **link-email/phone 세션 미갱신**  
  `apps/web/app/api/auth/link-email/route.ts:62`, `link-phone/route.ts:62`  
  성공 후 갱신된 세션(`hasLinkedEmail`/`hasLinkedPhone` 포함)을 쿠키에 재발급

- **change-password 세션 필드 누락**  
  `apps/web/app/api/auth/change-password/route.ts:127-175`  
  로컬 `parseAuthSession`이 `hasLinkedEmail`, `hasLinkedPhone` 필드를 반환 타입에서 누락
  → 필드 추가 및 검증 로직 보완

- **logout 502 시 쿠키 삭제 의미 모호**  
  `apps/web/app/api/auth/logout/route.ts:17-21`  
  NestJS 502 시에도 쿠키가 삭제되어 HTTP 상태(502 = 실패)와 실제 결과(쿠키 삭제 = 로그아웃)가 모순
  → 502 응답에도 쿠키 삭제를 유지하되 응답 body에 `{ ok: false, loggedOutLocally: true }` 명시

### 2.4 Login throttle IP 수정

- **파일**: `apps/web/app/api/auth/login/route.ts:37-47`
- **문제**: `x-real-ip`만 전달, Nginx 기본 설정(`X-Forwarded-For`)에서 throttle 무력화
- **수정**: `x-forwarded-for` 헤더도 NestJS에 전달

### 2.5 파일 다운로드 수정 *(모든 export 기능 broken)*

- **파일**: `apps/web/lib/api-proxy.ts:197-200`
- **문제**: `buildProxyResponse`가 `content-type`만 전달, `Content-Disposition` 누락 → 브라우저가 파일로 저장하지 않음
- **추가**: `Content-Disposition`, `Content-Length` 헤더 포워딩
- **추가**: `response.text()` 전체 버퍼 → `Response.body` 스트림 패스스루로 전환

### 2.6 기숙사 교사 권한 누락

- **파일**: `apps/api/src/mileage/mileage.students.service.ts:51`
- **문제**: `getStudentSummary`가 `assertTeacherExists`를 호출, 비기숙사 교사도 기숙사 학생 요약 조회 가능
- **수정**: `assertTeacherReadAccess`로 교체

---

## 3. Layer 2 — DB 마이그레이션

### 마이그레이션 1: `add_contact_uniqueness`

```sql
-- 중복 데이터 사전 확인 쿼리 포함 (중복 존재 시 migration 실패 전 명확한 에러)
DO $$
BEGIN
  IF EXISTS (
    SELECT phone, COUNT(*) FROM students WHERE phone IS NOT NULL
    GROUP BY phone HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate student phones exist'; END IF;
END$$;

CREATE UNIQUE INDEX students_email_unique_idx ON students(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX students_phone_unique_idx ON students(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX teachers_email_unique_idx ON teachers(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX teachers_phone_unique_idx ON teachers(phone) WHERE phone IS NOT NULL;
```

Prisma schema: `Student.email`, `Student.phone`, `Teacher.email`, `Teacher.phone`에 `@unique` 반영

### 마이그레이션 2: `add_mileage_performance_indexes`

```sql
-- rule_id FK 인덱스 (누락)
CREATE INDEX mileage_entries_rule_id_idx ON mileage_entries(rule_id);

-- 교사 audit FK 인덱스 (partial)
CREATE INDEX mileage_entries_created_by_teacher_idx
  ON mileage_entries(created_by_teacher_id)
  WHERE created_by_teacher_id IS NOT NULL;

CREATE INDEX mileage_entries_updated_by_teacher_idx
  ON mileage_entries(updated_by_teacher_id)
  WHERE updated_by_teacher_id IS NOT NULL;

-- 활성 항목 전용 partial index (가장 빈번한 쿼리 패턴)
CREATE INDEX mileage_entries_active_idx
  ON mileage_entries(scope, student_id, awarded_at DESC)
  WHERE deleted_at IS NULL;

-- students 연도 포함 복합 인덱스
CREATE INDEX students_school_year_class_number_idx
  ON students(school, is_active, current_year, current_class_number, current_student_number);
```

### 마이그레이션 3: `add_session_cleanup_index`

```sql
CREATE INDEX auth_sessions_cleanup_idx
  ON auth_sessions(expires_at)
  WHERE revoked_at IS NULL AND expires_at < NOW();
```

앱 레벨 cleanup: `PrismaService.onModuleInit`에 스케줄링:
```ts
// 앱 시작 시 만료 세션 정리 (1시간 이상 만료된 세션)
await this.prisma.authSession.deleteMany({
  where: { expiresAt: { lt: new Date(Date.now() - 3600_000) } }
})
```

---

## 4. Layer 3 — 백엔드 코드 중복 제거

### 4.1 `assertTeacherReadAccess` 통합

- **현재**: `entries.service.ts`, `analytics.service.ts`, `students.service.ts` 각각에 동일 private 메서드 존재
- **수정**: `mileage.access.ts`로 이동, 3개 서비스에서 import

### 4.2 `changePassword` 통합

- **현재**: `changeStudentPassword` / `changeTeacherPassword` ~100줄 중복
- **수정**: `changeAccountPassword(role: 'student' | 'teacher', id: string, ...)` 단일 메서드

### 4.3 `linkContactField` 통합

- **현재**: `linkEmail` / `linkPhone` 동일 트랜잭션 구조
- **수정**: `linkContactField(field: 'email' | 'phone', value: string, sessionId: string)` 단일 메서드

### 4.4 `buildEntryWhere` 통합

- **현재**: `getEntries` / `getEntriesExport`에 copy-paste
- **수정**: `buildEntryWhere(scope, filters, studentIds?)` 헬퍼 추출 → `common/mileage-analytics.ts`의 SQL 버전과 나란히 배치

### 4.5 버그 수정

| 파일 | 라인 | 수정 내용 |
|------|------|----------|
| `teacher-student.service.ts` | 228-239 | 학생 비활성화 → `$transaction([student.update, authSession.updateMany])` 원자화 |
| `mileage-summary.ts` | 129-131 | `bottomStudents` guard `> 3` → `> 6` 으로 수정, top3 제외 로직 추가 |
| `mileage.analytics.service.ts` | 144-153 | `filter(has)` 제거 → 0 항목 학생도 포함 (netScore: 0으로 표시) |
| `teacher-student.service.ts` | 97 | `new Date().getFullYear()` → 3월 기준 학업연도 계산 |
| `teacher-student.service.ts` | 62-76 | `findMany` → `findMany({ skip, take })` DB 레벨 페이지네이션 |
| `mileage.parsers.ts` | 328 | `는`/`은` 조사 동적 처리 헬퍼 추가 |

---

## 5. Layer 4 — `[scope]` 라우트 통합

### 5.1 Next.js 페이지 구조

삭제 파일 (42개 → 21개):
```
app/teacher/mileage/*/page.tsx        (7개) → 삭제
app/teacher/dorm-mileage/*/page.tsx   (7개) → 삭제
app/student/mileage/*/page.tsx        (3개) → 삭제
app/student/dorm-mileage/*/page.tsx   (3개) → 삭제
app/admin/mileage/*/page.tsx          (1개) → 삭제
app/admin/dorm-mileage/*/page.tsx     (2개) → 삭제
```

추가 파일:
```
app/teacher/[scope]/grant/page.tsx
app/teacher/[scope]/history/page.tsx
... (각 역할별 [scope] 공통 페이지)
```

리다이렉트 (하위 호환):
```
app/teacher/mileage/[[...slug]]/page.tsx  → redirect('/teacher/school/' + slug)
app/teacher/dorm-mileage/[[...slug]]/page.tsx → redirect('/teacher/dorm/' + slug)
```

### 5.2 Next.js API Route 통합

삭제 파일 (60개 → 30개):
```
app/api/teacher/school-mileage/**  (11개) → 삭제
app/api/teacher/dorm-mileage/**   (11개) → 삭제
app/api/student/school-mileage/** (5개)  → 삭제
app/api/student/dorm-mileage/**   (5개)  → 삭제
app/api/admin/school-mileage/**   (3개)  → 삭제
app/api/admin/dorm-mileage/**     (3개)  → 삭제
```

추가 파일:
```
app/api/teacher/[scope]/entries/route.ts
app/api/teacher/[scope]/entries/[id]/route.ts
app/api/teacher/[scope]/entries/export/route.ts
app/api/teacher/[scope]/rules/route.ts
app/api/teacher/[scope]/students/route.ts
app/api/teacher/[scope]/students/[studentId]/summary/route.ts
app/api/teacher/[scope]/analytics/overview/route.ts
app/api/teacher/[scope]/analytics/classes/route.ts
app/api/teacher/[scope]/analytics/students/route.ts
app/api/teacher/[scope]/analytics/export/route.ts
app/api/teacher/[scope]/access/route.ts   (dorm only — scope guard 필요)
app/api/student/[scope]/entries/route.ts
app/api/student/[scope]/entries/export/route.ts
app/api/student/[scope]/rules/route.ts
app/api/student/[scope]/stats/route.ts
app/api/student/[scope]/summary/route.ts
app/api/admin/[scope]/rules/route.ts
app/api/admin/[scope]/rules/[id]/route.ts
app/api/admin/[scope]/rules/[id]/toggle/route.ts
```

`access` 라우트는 `dorm` scope에만 의미 있으므로 `school` scope 시 404 반환.

### 5.3 컴포넌트 통합

삭제 (14개):
```
SchoolMileageGrant.tsx, DormMileageGrant.tsx
SchoolMileageHistory.tsx, DormMileageHistory.tsx
SchoolMileageRules.tsx, DormMileageRules.tsx
SchoolMileageStats.tsx, DormMileageStats.tsx
SchoolMileageClass.tsx, DormMileageClass.tsx
SchoolMileageReport.tsx, DormMileageReport.tsx
SchoolMileageReportPreview.tsx, DormMileageReportPreview.tsx
SchoolMileageStudentView.tsx, DormMileageStudentView.tsx
StudentMileageHistory.tsx, StudentDormMileageHistory.tsx
StudentMileageRules.tsx, StudentDormMileageRules.tsx
StudentMileageStats.tsx, StudentDormMileageStats.tsx
```

변경 (Shared prefix 제거 + scope prop 추가):
```
SharedMileageGrantView      → MileageGrantView
SharedMileageHistoryView    → MileageHistoryView
SharedMileageRulesView      → MileageRulesView
SharedMileageStatsView      → MileageStatsView
SharedMileageClassView      → MileageClassView
SharedMileageReportView     → MileageReportView
SharedMileageReportPreview  → MileageReportPreview
SharedMileageStudentView    → MileageStudentView
SharedStudentMileageHistoryView → StudentMileageHistoryView
SharedStudentMileageRulesView   → StudentMileageRulesView
SharedStudentMileageStatsView   → StudentMileageStatsView
```

### 5.4 타입 통합

```
삭제:
components/teacher/school-mileage-types.ts
components/teacher/dorm-mileage-types.ts
components/student/student-dorm-mileage-types.ts

변경:
components/teacher/shared-mileage-types.ts → components/mileage/mileage-types.ts (통합)
components/student/student-mileage-types.ts (school + dorm 통합, MileageType export 수정)
components/mileage/shared-types.ts (유지, mileage-types.ts에서 re-export)
```

`MileageType`을 dorm 타입에서도 export하도록 수정.

### 5.5 Navigation 수정

**Teacher navigation.tsx**:
- `section: '학생 관리'` 중복 제거 → school mileage 섹션만 유지
- dorm mileage 섹션에 `section: '기숙사 마일리지'` 레이블 추가
- dorm 그룹 아이콘 `ShieldCheckIcon` → `HomeIcon` (또는 `BuildingIcon`)으로 차별화
- href: `/teacher/mileage/*` → `/teacher/school/*`, `/teacher/dorm-mileage/*` → `/teacher/dorm/*`

**Student navigation**:
- 동일 패턴으로 href 업데이트

**Admin navigation**:
- 동일 패턴으로 href 업데이트
- dorm 섹션 `section` 레이블 추가

### 5.6 RulesContext 정리

현재 `useRulesContext` / `useDormRulesContext` 두 개의 분리된 컨텍스트 존재
→ `useRulesContext(scope: MileageScope)` 단일 컨텍스트 훅으로 통합
→ `app/teacher/[scope]/layout.tsx`에서만 `RulesProvider` 제공
→ `app/teacher/page.tsx`의 `RulesProvider` 중복 마운트 제거 (`/teacher` 홈 페이지는 rules 컨텍스트 불필요하면 직접 fetch로 대체)

---

## 6. Layer 5 — UI/UX · 접근성 · 다크모드

### 6.1 모바일 레이아웃 수정

| 파일 | 수정 내용 |
|------|----------|
| `toast.tsx:163` | `minWidth: 280` → `width: max(calc(100vw - 40px), 280px)` |
| `modal.tsx:151` | 패널에 `maxHeight: 'calc(100dvh - 32px)'` + `overflowY: 'auto'` 추가 |
| `filter-bar.tsx:96` | 픽셀 width 필드에 `maxWidth: '100%'` + `flexShrink: 1` fallback |
| `AuthShell.tsx:9` + `BrandPanel.tsx:7` | `100vh` → `100dvh` 통일 |
| `DashboardShell.tsx:302` | `paddingBottom: 'max(24px, env(safe-area-inset-bottom))'` |
| `DashboardShell.tsx:165` | sidebar `height: '100vh'` → `100dvh` |

### 6.2 접근성 수정

| 파일 | 수정 내용 |
|------|----------|
| `animated-checkbox.tsx` | `aria-label` prop 추가 필수화; `padding: 12px` 추가로 44px 터치 타겟 확보 |
| `DashboardShell.tsx` | 모바일 drawer focus trap 구현 (`Tab`/`Shift+Tab` 인터셉트, 배경 `aria-hidden`) |
| `DashboardShell.tsx:191` | `<h1>` 페이지 레이블 → `<p>` 변경 |
| `modal.tsx` | `role="dialog"` 위치를 overlay → panel로 이동; 미제목 modal에 `aria-label` prop |
| `modal.tsx:178`, `success-modal.tsx:197`, `toast.tsx:88` | 닫기 button에 `type="button"` 추가 |
| `data-table.tsx:195` | clickable row에 `tabIndex={0}` + `onKeyDown` Enter 핸들러 |
| `filter-bar.tsx:107` | `<span>` 레이블 → `<label htmlFor>` |
| `notice.tsx:23` | error variant `role="status"` → `role="alert"` |
| `primitives.tsx:181` | 활성 페이지 버튼에 `aria-current="page"` |
| `LogoutButton.tsx:77` | 에러 메시지 `<p>` → `role="alert"` |
| `dashboard-shell-navigation.tsx:266` | section `<p>` → `role="group"` + `aria-label` |
| `StudentMileageHistoryView` (구 `SharedStudentMileageHistoryView`) | date input에 `aria-label`, filter select에 `<label>` |
| `ClassAnalyticsCard.tsx:133` (구 `SharedClassAnalyticsCard`) | 확장/축소 버튼에 `aria-expanded` |
| `StudentReportTable.tsx:463` (구 `SharedStudentReportTable`) | `<tr onClick>` → `role="button"` + `tabIndex` + `onKeyDown` |

### 6.3 다크모드 수정

| 파일 | 수정 내용 |
|------|----------|
| `notice.tsx:29-30` | `'#166534'`/`'#991b1b'` → `var(--reward)`/`var(--penalty)` |
| `modal.tsx:507` ALERT_CONFIG | hex 색상 → `var(--reward)`, `var(--penalty)`, `var(--warning)` |
| `input-styles.ts:29` | SVG chevron `stroke='%236b7280'` → CSS filter 방식 또는 `var(--fg-muted)` |
| `list.tsx:127` shimmer | `rgba(255,255,255,0.12)` → `var(--shimmer-highlight)` (globals.css에 변수 추가) |
| 컴포넌트 6곳 | `#15803d`/`#b91c1c` → `var(--reward-text)`/`var(--penalty-text)` |

### 6.4 코드 재사용 통합

| 추출 대상 | 현재 중복 위치 | 결과 |
|-----------|--------------|------|
| `GradeSelect` 컴포넌트 | 6곳 인라인 | `components/ui/GradeSelect.tsx` |
| `formatSignedScore` 사용 통일 | 5곳 인라인 | `components/mileage/shared.tsx`의 기존 함수 사용 |
| `CategoryBar` 컴포넌트 통합 | `StudentReportTable` + `MileageStatsParts` | `components/ui/CategoryBar.tsx` |
| `useMountedAnimation` hook | 2곳 double rAF | `components/ui/useMountedAnimation.ts` |
| Lottie cache 싱글턴 | `AccessDeniedOverlay` + `SuccessModal` 별도 Map | `lib/lottie-cache.ts` |
| `UserPlusNavIcon` 중복 | `icons.tsx:38-40` | 삭제 |

### 6.5 컴포넌트 버그 수정

| 파일 | 수정 내용 |
|------|----------|
| `MileageRulesView.tsx:247` (구 `SharedMileageRulesView`) | ESLint 억제 제거, `handleToggle`/`handleEdit`에 `useCallback` 적용 |
| `MileageReportView.tsx:283` (구 `SharedMileageReportView`) | `hasPreviewData` dep → `useRef`로 전환해 circular 제거 |
| `StudentHome.tsx:60-96` | school/dorm fetch 분리 error handling (학교 fetch 실패가 기숙사 데이터까지 숨기는 문제) |
| `OnboardingProgress.tsx:16-19` | 완료 상태를 실제 step 완료 기반으로 수정 |
| `link-email/LinkEmailForm.tsx:31-32` | `router.refresh()` → 제거 (destination 서버 컴포넌트가 직접 세션 재확인) |
| `ChangePasswordForm.tsx:212` | 빈 필드 시 submit 버튼 `disabled`, heading을 prop으로 외부 주입 가능하게 수정 |
| `link-phone/LinkPhoneForm.tsx:58` | "다음 단계" 문구 → "마이페이지로" 로 수정 (마지막 온보딩 단계) |
| `DashboardShell.tsx:73` | 10초 navigation timeout → 5초로 단축 |

### 6.6 xlsx → ExcelJS 교체

- `apps/web/package.json`: `xlsx` 제거, `exceljs` 추가
- 영향 범위: 모든 export 라우트 핸들러 및 관련 컴포넌트
- ExcelJS API는 Promise 기반; 스트리밍 방식으로 `Content-Disposition` 포함 응답 생성
- 기존 xlsx 기반 export 로직을 ExcelJS로 재작성

### 6.7 기타

- `layout.tsx:13-17`: `Noto_Sans_KR` weight 배열에 `"600"` 추가
- Admin navigation: dorm 섹션 `section` 레이블, 아이콘 차별화
- `ConfirmModal`과 `AlertModal`의 prop 이름을 `isOpen` → `open`으로 통일해 `Modal`과 동일한 인터페이스 제공 (내부 구현 변경 없음, 호출부 일괄 업데이트 포함)

---

## 7. Layer 6 — 테스트

### 7.1 API 테스트 추가 (vitest)

**`apps/api/src/auth/auth.service.test.ts`**:
- Super-admin 비밀번호 비교가 `timingSafeEqual`을 사용하는지 검증
- `refreshOnboardingSession` — 학생/교사 각 역할, 존재하지 않는 세션
- `revokeSession` — 존재하는/존재하지 않는 세션 ID
- `changePassword` — `mustChangePassword: true`일 때 throttle bypass 경로

**`apps/api/src/common/mileage-summary.test.ts`**:
- 학생 4명 케이스에서 `topStudents`/`bottomStudents` 겹침 없음 검증

**`apps/api/src/mileage/mileage.analytics.service.test.ts`**:
- 마일리지 0인 학생이 analytics 결과에 포함되는지 검증

**`apps/api/src/common/auth-access.test.ts`**:
- `assertTeacherOrSuperAdmin`에 유효한 super-admin ID 전달 시 `assertSuperAdmin` 경로 실행 검증

### 7.2 Web 테스트 추가 (vitest)

**`apps/web/app/admin/db/_components/admin-db-utils.test.ts`**:
- `EXPLAIN WITH ... (DELETE ...) SELECT ...` 패턴 → `shouldConfirmAdminDbSql` true 반환 검증

**새 `apps/web/lib/api-proxy.test.ts`**:
- `buildProxyResponse`가 upstream `Content-Disposition` 헤더를 포워딩하는지 검증
- binary 응답 스트리밍 검증

**새 `apps/web/app/api/auth/link-email.test.ts`**:
- 성공 후 세션 쿠키가 `hasLinkedEmail: true`로 갱신되는지 검증

---

## 8. 실행 순서 및 의존 관계

```
Layer 1 (보안)
    └─► Layer 2 (DB 마이그레이션)
            └─► Layer 3 (백엔드 중복 제거)
                    └─► Layer 4 ([scope] 통합)
                                └─► Layer 5 (UI/UX)
                                            └─► Layer 6 (테스트)
```

- Layer 1은 Layer 2 이전에 배포 가능 (독립)
- Layer 3은 Layer 2 이후 (unique 제약 추가 후 중복 방지 로직 단순화 가능)
- Layer 4는 Layer 3 이후 (리팩토링된 백엔드 위에서 프론트 통합)
- Layer 5는 Layer 4와 병렬 일부 가능 (UI 전용 수정은 라우트 구조와 무관한 것들)
- Layer 6은 각 Layer 완료 직후 바로 작성 가능 (회귀 방지)

---

## 9. 영향 범위 요약

| 항목 | Before | After | 변화 |
|------|--------|-------|------|
| Next.js page 파일 수 | ~42 (dorm/school 쌍) | ~21 | -50% |
| Next.js API route 파일 수 | ~60 (dorm/school 쌍) | ~30 | -50% |
| Teacher 컴포넌트 파일 수 | 45 | ~28 | -38% |
| Student 컴포넌트 파일 수 | 13 | ~8 | -38% |
| 보안 취약점 | 9 Critical/High | 0 | 전부 수정 |
| 파일 다운로드 기능 | broken | 정상 | |
| 모바일 toast 오버플로 | 발생 | 수정 | |
| 다크모드 하드코딩 색상 | 11곳 | 0 | 전부 CSS 변수화 |

# Layer 4: Scope Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 20+ mirrored `school-mileage`/`dorm-mileage` route pairs with a single `[scope]` dynamic segment. URL shape: `/teacher/school/grant`, `/teacher/dorm/grant`, `/student/school/history`, `/admin/school/rules`, etc.

**Architecture:** New `lib/scope-utils.ts` maps URL scope values (`school`, `dorm`) to upstream API path prefixes (`school-mileage`, `dorm-mileage`). Each existing duplicate pair is replaced by one `[scope]` file. Old URLs get redirect pages (Next.js `redirect()`) so bookmarks don't break. Frontend pages receive the scope as a string prop/param and pass it to shared components. Navigation items updated to use new URLs.

**Tech Stack:** Next.js App Router `params`, TypeScript template literals, `next/navigation` redirect

---

## File Map

**New files created:**
- `apps/web/lib/scope-utils.ts` — scope ↔ api-prefix mapping and validation
- `apps/web/app/api/teacher/[scope]/entries/route.ts`
- `apps/web/app/api/teacher/[scope]/entries/[id]/route.ts`
- `apps/web/app/api/teacher/[scope]/entries/export/route.ts`
- `apps/web/app/api/teacher/[scope]/students/route.ts`
- `apps/web/app/api/teacher/[scope]/students/[studentId]/summary/route.ts`
- `apps/web/app/api/teacher/[scope]/rules/route.ts`
- `apps/web/app/api/teacher/[scope]/analytics/overview/route.ts`
- `apps/web/app/api/teacher/[scope]/analytics/classes/route.ts`
- `apps/web/app/api/teacher/[scope]/analytics/students/route.ts`
- `apps/web/app/api/teacher/[scope]/analytics/export/route.ts`
- `apps/web/app/api/student/[scope]/entries/route.ts`
- `apps/web/app/api/student/[scope]/entries/export/route.ts`
- `apps/web/app/api/student/[scope]/rules/route.ts`
- `apps/web/app/api/student/[scope]/stats/route.ts`
- `apps/web/app/api/student/[scope]/summary/route.ts`
- `apps/web/app/api/admin/[scope]/rules/route.ts`
- `apps/web/app/api/admin/[scope]/rules/[id]/route.ts`
- `apps/web/app/api/admin/[scope]/rules/[id]/toggle/route.ts`
- `apps/web/app/teacher/[scope]/grant/page.tsx` (+ loading.tsx)
- `apps/web/app/teacher/[scope]/history/page.tsx` (+ loading.tsx)
- `apps/web/app/teacher/[scope]/students/page.tsx` (+ loading.tsx)
- `apps/web/app/teacher/[scope]/stats/page.tsx` (+ loading.tsx)
- `apps/web/app/teacher/[scope]/classes/page.tsx` (+ loading.tsx)
- `apps/web/app/teacher/[scope]/rules/page.tsx` (+ loading.tsx)
- `apps/web/app/teacher/[scope]/report/page.tsx` (+ loading.tsx)
- `apps/web/app/teacher/[scope]/layout.tsx` — scope validation + RulesProvider
- `apps/web/app/student/[scope]/history/page.tsx` (+ loading.tsx)
- `apps/web/app/student/[scope]/rules/page.tsx` (+ loading.tsx)
- `apps/web/app/student/[scope]/stats/page.tsx` (+ loading.tsx)
- `apps/web/app/student/[scope]/layout.tsx`
- `apps/web/app/admin/[scope]/rules/page.tsx` (+ loading.tsx)
- `apps/web/app/admin/[scope]/layout.tsx`
- Redirect pages: `apps/web/app/teacher/mileage/...`, `apps/web/app/teacher/dorm-mileage/...`, etc.

**Files deleted (after all new routes work):**
All files under:
- `apps/web/app/api/teacher/school-mileage/`
- `apps/web/app/api/teacher/dorm-mileage/` (keep `access/route.ts` — dorm-only, no school equivalent)
- `apps/web/app/api/student/school-mileage/`
- `apps/web/app/api/student/dorm-mileage/`
- `apps/web/app/api/admin/school-mileage/`
- `apps/web/app/api/admin/dorm-mileage/`
- `apps/web/app/teacher/mileage/` (after redirects added)
- `apps/web/app/teacher/dorm-mileage/` (after redirects added)
- `apps/web/app/student/mileage/` (after redirects added)
- `apps/web/app/student/dorm-mileage/` (after redirects added)
- `apps/web/app/admin/school-mileage/`
- `apps/web/app/admin/dorm-mileage/`

---

### Task 1: Create `lib/scope-utils.ts`

**Files:**
- Create: `apps/web/lib/scope-utils.ts`

- [ ] **Step 1: Write the scope utilities**

Create `apps/web/lib/scope-utils.ts`:

```typescript
export type MileageScope = 'school' | 'dorm'
export type MileageScopeApiPrefix = 'school-mileage' | 'dorm-mileage'

const SCOPE_TO_API_PREFIX: Record<MileageScope, MileageScopeApiPrefix> = {
  school: 'school-mileage',
  dorm: 'dorm-mileage',
}

export function parseScopeParam(value: string): MileageScope | null {
  if (value === 'school' || value === 'dorm') return value
  return null
}

export function scopeToApiPrefix(scope: MileageScope): MileageScopeApiPrefix {
  return SCOPE_TO_API_PREFIX[scope]
}

export function scopeLabel(scope: MileageScope): string {
  return scope === 'school' ? '그린 마일리지' : '기숙사 상벌점'
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/scope-utils.ts
git commit -m "feat: add scope-utils for [scope] dynamic segment mapping"
```

---

### Task 2: Create `[scope]` teacher API routes

**Files:** Create all `apps/web/app/api/teacher/[scope]/...` route files

Each new file replaces two old files. The scope param is validated with `parseScopeParam`; invalid scope returns 404.

- [ ] **Step 1: Create `entries/route.ts`**

Create `apps/web/app/api/teacher/[scope]/entries/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest, proxyTeacherWriteRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(request, `/${scopeToApiPrefix(scope)}/entries` as any)
}

export async function POST(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherWriteRequest(request, `/${scopeToApiPrefix(scope)}/entries/batch` as any, 'POST')
}
```

- [ ] **Step 2: Create `entries/export/route.ts`**

Create `apps/web/app/api/teacher/[scope]/entries/export/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(request, `/${scopeToApiPrefix(scope)}/entries/export` as any)
}
```

- [ ] **Step 3: Create `entries/[id]/route.ts`**

Create `apps/web/app/api/teacher/[scope]/entries/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { proxyTeacherWriteRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

type Params = { scope: string; id: string }

export async function PATCH(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherWriteRequest(
    request,
    `/${scopeToApiPrefix(scope)}/entries/${encodeURIComponent(id)}` as any,
    'PATCH',
  )
}

export async function DELETE(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherWriteRequest(
    request,
    `/${scopeToApiPrefix(scope)}/entries/${encodeURIComponent(id)}` as any,
    'DELETE',
  )
}
```

- [ ] **Step 4: Create `rules/route.ts`**

Create `apps/web/app/api/teacher/[scope]/rules/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(request, `/${scopeToApiPrefix(scope)}/rules` as any)
}
```

- [ ] **Step 5: Create `students/route.ts`**

Create `apps/web/app/api/teacher/[scope]/students/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(request, `/${scopeToApiPrefix(scope)}/students` as any)
}
```

- [ ] **Step 6: Create `students/[studentId]/summary/route.ts`**

Create `apps/web/app/api/teacher/[scope]/students/[studentId]/summary/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

type Params = { scope: string; studentId: string }

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, studentId } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(
    request,
    `/${scopeToApiPrefix(scope)}/students/${encodeURIComponent(studentId)}/summary` as any,
  )
}
```

- [ ] **Step 7: Create the 4 analytics routes**

Create `apps/web/app/api/teacher/[scope]/analytics/overview/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(request, `/${scopeToApiPrefix(scope)}/analytics/overview` as any)
}
```

Repeat the same pattern for:
- `analytics/classes/route.ts` → path: `/${scopeToApiPrefix(scope)}/analytics/classes`
- `analytics/students/route.ts` → path: `/${scopeToApiPrefix(scope)}/analytics/students`
- `analytics/export/route.ts` → path: `/${scopeToApiPrefix(scope)}/analytics/export`

- [ ] **Step 8: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep 'api/teacher/\[scope\]' | head -20
```
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/api/teacher/\[scope\]/
git commit -m "feat: add [scope] dynamic teacher API routes (replaces school-mileage + dorm-mileage pairs)"
```

---

### Task 3: Create `[scope]` student and admin API routes

**Files:** student and admin `[scope]` routes

- [ ] **Step 1: Create student scope API routes**

Create `apps/web/app/api/student/[scope]/entries/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyStudentGetRequest } from '@/lib/student-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyStudentGetRequest(request, `/${scopeToApiPrefix(scope)}/my/entries` as any)
}
```

Create `apps/web/app/api/student/[scope]/entries/export/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyStudentGetRequest } from '@/lib/student-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyStudentGetRequest(request, `/${scopeToApiPrefix(scope)}/my/entries/export` as any)
}
```

Create `apps/web/app/api/student/[scope]/rules/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyStudentGetRequest } from '@/lib/student-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyStudentGetRequest(request, `/${scopeToApiPrefix(scope)}/my/rules` as any)
}
```

Create `apps/web/app/api/student/[scope]/stats/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyStudentGetRequest } from '@/lib/student-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyStudentGetRequest(request, `/${scopeToApiPrefix(scope)}/my/stats` as any)
}
```

Create `apps/web/app/api/student/[scope]/summary/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyStudentGetRequest } from '@/lib/student-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyStudentGetRequest(request, `/${scopeToApiPrefix(scope)}/my/summary` as any)
}
```

- [ ] **Step 2: Create admin scope API routes**

Read `apps/web/lib/admin-api.ts` first to understand the proxy function signatures:
```bash
cat apps/web/lib/admin-api.ts
```

Create `apps/web/app/api/admin/[scope]/rules/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyAdminMileageGetRequest, proxyAdminMileageWriteRequest } from '@/lib/admin-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageGetRequest(request, `/${scopeToApiPrefix(scope)}/rules` as any)
}

export async function POST(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageWriteRequest(request, `/${scopeToApiPrefix(scope)}/rules` as any, 'POST')
}
```

Create `apps/web/app/api/admin/[scope]/rules/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { proxyAdminMileageGetRequest, proxyAdminMileageWriteRequest } from '@/lib/admin-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

type Params = { scope: string; id: string }

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageGetRequest(
    request,
    `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}` as any,
  )
}

export async function PATCH(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageWriteRequest(
    request,
    `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}` as any,
    'PATCH',
  )
}

export async function DELETE(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageWriteRequest(
    request,
    `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}` as any,
    'DELETE',
  )
}
```

Create `apps/web/app/api/admin/[scope]/rules/[id]/toggle/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { proxyAdminMileageWriteRequest } from '@/lib/admin-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

type Params = { scope: string; id: string }

export async function POST(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageWriteRequest(
    request,
    `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}/toggle` as any,
    'POST',
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep '\[scope\]' | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/student/\[scope\]/ apps/web/app/api/admin/\[scope\]/
git commit -m "feat: add [scope] dynamic API routes for student and admin"
```

---

### Task 4: Create `[scope]` frontend page routes

**Files:** All `apps/web/app/teacher/[scope]/`, `apps/web/app/student/[scope]/`, `apps/web/app/admin/[scope]/`

The strategy: read the existing page components and wire them into `[scope]` pages that pass the scope down. For pages that use different components for school vs dorm, use conditional rendering.

- [ ] **Step 1: Read existing teacher grant pages to understand the pattern**

```bash
cat apps/web/app/teacher/mileage/grant/page.tsx
cat apps/web/app/teacher/dorm-mileage/grant/page.tsx
cat apps/web/app/teacher/mileage/layout.tsx 2>/dev/null || echo "no layout"
```

- [ ] **Step 2: Create `teacher/[scope]/layout.tsx`**

This layout provides the `RulesProvider` for the scope and validates the scope param. If the scope is invalid, it shows a 404.

Create `apps/web/app/teacher/[scope]/layout.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { RulesProvider } from '@/app/components/mileage/rules-context'
import { parseScopeParam } from '@/lib/scope-utils'

export default async function TeacherScopeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)

  if (!scope) {
    notFound()
  }

  return (
    <RulesProvider scope={scope}>
      {children}
    </RulesProvider>
  )
}
```

Note: `RulesProvider` must accept a `scope` prop. Read `apps/web/app/components/mileage/rules-context.tsx` to check — if it doesn't accept `scope` yet, update it to do so.

- [ ] **Step 3: Update `RulesProvider` to accept a `scope` prop if needed**

Read `apps/web/app/components/mileage/rules-context.tsx`:
```bash
cat apps/web/app/components/mileage/rules-context.tsx
```

If `RulesProvider` hardcodes the API endpoint to `/api/teacher/school-mileage/rules`, update it to accept `scope: MileageScope`:

```typescript
// In rules-context.tsx, update the provider to use the scope:
import type { MileageScope } from '@/lib/scope-utils'

export function RulesProvider({
  scope = 'school',
  children,
}: {
  scope?: MileageScope
  children: React.ReactNode
}) {
  // ... use scope to build the API URL
  const apiPath = `/api/teacher/${scope}/rules`
  // rest of existing logic
}
```

- [ ] **Step 4: Create `teacher/[scope]/grant/page.tsx`**

Read both grant pages to understand which components they use:
```bash
cat apps/web/app/teacher/mileage/grant/page.tsx
cat apps/web/app/teacher/dorm-mileage/grant/page.tsx
```

Create `apps/web/app/teacher/[scope]/grant/page.tsx`:

```typescript
'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import SchoolMileageGrant from '@/app/components/teacher/SchoolMileageGrant'
import DormMileageGrant from '@/app/components/teacher/DormMileageGrant'
import { LoadingSpinner } from '@/app/components/ui/list'
import { useLoadingGate } from '@/app/components/ui/useLoadingGate'
import { useRulesContext } from '@/app/components/mileage/rules-context'
import { parseScopeParam } from '@/lib/scope-utils'

export default function TeacherScopedGrantPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = use(params)
  const scope = parseScopeParam(rawScope)
  const { rules, isRulesLoading, rulesError, isDormTeacher } = useRulesContext()

  if (!scope) notFound()

  const showLoading = useLoadingGate({
    active: scope === 'dorm' && isDormTeacher === null,
    initialVisible: false,
  })

  if (showLoading || (scope === 'dorm' && isDormTeacher === null)) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (scope === 'dorm') {
    return (
      <div className="flex flex-col h-full">
        <DormMileageGrant isDormTeacher={isDormTeacher ?? false} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <SchoolMileageGrant
        rules={rules}
        isRulesLoading={isRulesLoading}
        rulesError={rulesError}
      />
    </div>
  )
}
```

Create `apps/web/app/teacher/[scope]/grant/loading.tsx`:
```typescript
export { default } from '@/app/teacher/mileage/grant/loading'
```
(Or copy the loading component content if the import path won't work after deletion.)

- [ ] **Step 5: Create remaining `teacher/[scope]` pages**

For each sub-page (`history`, `students`, `stats`, `classes`, `rules`, `report`), apply the same pattern:

1. Read both existing pages (school and dorm versions)
2. Create the `[scope]` page that conditionally renders based on scope

Example `history/page.tsx`:
```typescript
'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
// Import school and dorm history components
import SchoolMileageHistory from '@/app/components/teacher/SchoolMileageHistory'
import DormMileageHistory from '@/app/components/teacher/DormMileageHistory'

export default function TeacherScopedHistoryPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = use(params)
  const scope = parseScopeParam(rawScope)

  if (!scope) notFound()

  return scope === 'dorm'
    ? <DormMileageHistory />
    : <SchoolMileageHistory />
}
```

Repeat for `students`, `stats`, `classes`, `rules`, `report` sub-pages.

- [ ] **Step 6: Create `student/[scope]` pages**

Same pattern. Read:
```bash
cat apps/web/app/student/mileage/history/page.tsx
cat apps/web/app/student/dorm-mileage/history/page.tsx
```

Create `apps/web/app/student/[scope]/layout.tsx`:
```typescript
import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'

export default async function StudentScopeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  if (!parseScopeParam(rawScope)) notFound()
  return <>{children}</>
}
```

Create `apps/web/app/student/[scope]/history/page.tsx`, `rules/page.tsx`, `stats/page.tsx` with the same conditional pattern as teacher pages.

- [ ] **Step 7: Create `admin/[scope]/rules` pages**

Read existing:
```bash
cat apps/web/app/admin/school-mileage/rules/page.tsx
cat apps/web/app/admin/dorm-mileage/rules/page.tsx
```

Create `apps/web/app/admin/[scope]/layout.tsx`:
```typescript
import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'

export default async function AdminScopeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  if (!parseScopeParam(rawScope)) notFound()
  return <>{children}</>
}
```

Create `apps/web/app/admin/[scope]/rules/page.tsx`:
```typescript
import { use } from 'react'
import { notFound } from 'next/navigation'
import { parseScopeParam, scopeLabel } from '@/lib/scope-utils'
// Import the shared AdminMileageRulesPage component (or render conditionally)
import SchoolMileageRulesPage from '@/app/admin/school-mileage/rules/_components/SchoolMileageRulesPage'
import DormMileageRulesPage from '@/app/admin/dorm-mileage/rules/_components/DormMileageRulesPage'

export default function AdminScopeRulesPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = use(params)
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return scope === 'dorm' ? <DormMileageRulesPage /> : <SchoolMileageRulesPage />
}
```

Note: Read the actual admin rules page components first before writing this — adjust imports to match the actual component names.

- [ ] **Step 8: Update navigation to use new URLs**

In `apps/web/app/teacher/_components/navigation.tsx`, replace old hrefs:

```typescript
export const TEACHER_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'teacher-home',
    label: '홈',
    href: '/teacher',
    icon: <HomeIcon />,
  },
  {
    id: 'teacher-mileage',
    label: '그린 마일리지',
    section: '학생 관리',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/teacher/school/grant', label: '상벌점 부여' },
      { href: '/teacher/school/history', label: '상벌점 내역' },
      { href: '/teacher/school/students', label: '학생별 조회' },
      { href: '/teacher/school/stats', label: '통계 보기' },
      { href: '/teacher/school/classes', label: '학급별 현황' },
      { href: '/teacher/school/rules', label: '상벌점 항목' },
      { href: '/teacher/school/report', label: '보고서 출력' },
    ],
  },
  {
    id: 'teacher-students',
    label: '학생 관리',
    section: '학생 관리',
    icon: <UsersNavIcon />,
    children: [
      { href: '/teacher/students', label: '학생 목록' },
    ],
  },
  {
    id: 'teacher-dorm-mileage',
    label: '기숙사 상벌점',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/teacher/dorm/grant', label: '기숙사 상벌점 부여' },
      { href: '/teacher/dorm/history', label: '기숙사 상벌점 내역' },
      { href: '/teacher/dorm/students', label: '기숙사 학생별 조회' },
      { href: '/teacher/dorm/stats', label: '기숙사 통계 보기' },
      { href: '/teacher/dorm/classes', label: '기숙사 학급별 현황' },
      { href: '/teacher/dorm/rules', label: '기숙사 상벌점 항목' },
      { href: '/teacher/dorm/report', label: '기숙사 보고서 출력' },
    ],
  },
]
```

Update student and admin navigation files similarly.

- [ ] **Step 9: Add redirect pages for old URLs**

Create `apps/web/app/teacher/mileage/grant/page.tsx`:
```typescript
import { redirect } from 'next/navigation'
export default function RedirectPage() {
  redirect('/teacher/school/grant')
}
```

Repeat for all 7 teacher/mileage sub-pages and all 7 teacher/dorm-mileage sub-pages, student pages, and admin pages.

- [ ] **Step 10: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 11: Commit navigation and frontend changes**

```bash
git add apps/web/app/teacher/\[scope\]/ apps/web/app/student/\[scope\]/ apps/web/app/admin/\[scope\]/
git add apps/web/app/teacher/_components/navigation.tsx
git add apps/web/app/student/_components/ apps/web/app/admin/components/
git commit -m "feat: add [scope] frontend pages and update navigation to school/dorm URLs"
```

---

### Task 5: Delete old duplicate route files

Only delete old files after confirming the new routes work (TypeScript passes and dev server starts).

- [ ] **Step 1: Verify dev server starts without errors**

```bash
cd apps/web && pnpm dev &
sleep 10 && curl -s http://localhost:3000/teacher/school/grant -o /dev/null -w "%{http_code}"
# Expected: 200 or 307 (redirect to login)
kill %1
```

- [ ] **Step 2: Delete old API routes**

```bash
rm -rf apps/web/app/api/teacher/school-mileage
rm -rf apps/web/app/api/teacher/dorm-mileage
rm -rf apps/web/app/api/student/school-mileage
rm -rf apps/web/app/api/student/dorm-mileage
rm -rf apps/web/app/api/admin/school-mileage
rm -rf apps/web/app/api/admin/dorm-mileage
```

- [ ] **Step 3: Delete old frontend page routes (the original pages, NOT the redirect stubs)**

The old page directories (`mileage/`, `dorm-mileage/`) should now contain ONLY the redirect stubs. Since the redirect stubs ARE in those folders, we keep them. The sub-page layout files (if any) may need to be removed and recreated in `[scope]/layout.tsx`.

Verify old page directories:
```bash
find apps/web/app/teacher/mileage -name "*.tsx" | head -20
find apps/web/app/admin/school-mileage -name "*.tsx" | head -10
```

Delete old admin page directories (redirects should be added before deletion):
```bash
rm -rf apps/web/app/admin/school-mileage
rm -rf apps/web/app/admin/dorm-mileage
```

- [ ] **Step 4: Final TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit deletions**

```bash
git add -A
git commit -m "refactor: remove duplicate school-mileage/dorm-mileage route files after [scope] unification"
```

---

### Final verification

- [ ] **Run full test suite**

```bash
cd /path/to/repo && pnpm test
```
Expected: all tests pass.

- [ ] **Count remaining duplicates**

```bash
find apps/web/app/api -name "route.ts" | grep -E "school-mileage|dorm-mileage" | wc -l
```
Expected: 0 (all replaced by `[scope]` routes).

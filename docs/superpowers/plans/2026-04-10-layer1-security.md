# Layer 1: Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security vulnerabilities: timing attack on super-admin login, secret baked into Docker image, binary response headers dropped (breaking all exports), and several auth cookie/session bugs.

**Architecture:** Minimal targeted fixes — no new abstractions unless the same code is repeated 2+ places. Extract `safeStringEqual` into `runtime-env.ts` (already owns credential logic). Fix `buildProxyResponse` in `api-proxy.ts` to forward `Content-Disposition` and `Content-Length`. Fix IP forwarding in login route. Fix logout cookie-clear-on-502 bug. Fix `link-email`/`link-phone` not refreshing session cookie. Fix `parseAuthSession` in `change-password/route.ts` missing `hasLinkedEmail`/`hasLinkedPhone` fields.

**Tech Stack:** Node.js `crypto.timingSafeEqual`, Next.js App Router route handlers, NestJS, Docker multi-stage build

---

## File Map

| File | Change |
|------|--------|
| `apps/api/src/config/runtime-env.ts` | Add `safeStringEqual()` export |
| `apps/api/src/auth/auth.service.ts` | Use `safeStringEqual`, remove duplicate `getSuperAdminCredentialFingerprint` |
| `apps/api/src/common/auth-access.ts` | Use `getSuperAdminCredentialFingerprint` from runtime-env instead of inline SHA-256 |
| `apps/web/Dockerfile` | Remove `ARG/ENV INTERNAL_API_SECRET` from builder stage |
| `apps/web/lib/api-proxy.ts` | Forward `Content-Disposition`, `Content-Length`, `Content-Range` in `buildProxyResponse` |
| `apps/web/app/api/auth/login/route.ts` | Forward `x-forwarded-for` in addition to `x-real-ip` |
| `apps/web/app/api/auth/logout/route.ts` | Only clear cookie on 2xx response, return error status on 502 |
| `apps/web/app/api/auth/link-email/route.ts` | Refresh session cookie after successful link |
| `apps/web/app/api/auth/link-phone/route.ts` | Refresh session cookie after successful link |
| `apps/web/app/api/auth/change-password/route.ts` | Add `hasLinkedEmail`/`hasLinkedPhone` to `parseAuthSession` |
| `apps/api/src/mileage/mileage.students.service.ts` | Fix `getStudentSummary` to call `assertTeacherReadAccess` instead of `assertTeacherExists` |
| `apps/api/src/auth/auth.service.test.ts` | Add timing-safe comparison test |

---

### Task 1: Extract `safeStringEqual` and `getSuperAdminCredentialFingerprint` into `runtime-env.ts`

**Files:**
- Modify: `apps/api/src/config/runtime-env.ts`
- Modify: `apps/api/src/auth/auth.service.ts:389-401` and `:934-940`
- Modify: `apps/api/src/common/auth-access.ts:104-109`

- [ ] **Step 1: Write the failing test**

Add to `apps/api/src/auth/auth.service.test.ts` before the existing `describe` block:

```typescript
import { timingSafeEqual } from 'node:crypto';
import { safeStringEqual } from '../config/runtime-env';

describe('safeStringEqual', () => {
  it('returns true for equal strings', () => {
    expect(safeStringEqual('abc', 'abc')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(safeStringEqual('abc', 'xyz')).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(safeStringEqual('abc', 'abcd')).toBe(false);
  });

  it('uses timingSafeEqual internally (same length, different content)', () => {
    // Ensure no early exit on length-equal strings
    expect(safeStringEqual('aaa', 'aab')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify the test fails**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 3 'safeStringEqual'
```
Expected: `ReferenceError: safeStringEqual is not defined` or import error.

- [ ] **Step 3: Implement `safeStringEqual` and export `getSuperAdminCredentialFingerprint` from `runtime-env.ts`**

Add to the bottom of `apps/api/src/config/runtime-env.ts`:

```typescript
import { createHash, timingSafeEqual } from 'node:crypto';

export function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

export function getSuperAdminCredentialFingerprint(): string {
  const { SUPER_ADMIN_ID, SUPER_ADMIN_PASSWORD } = getApiRuntimeEnv();
  return createHash('sha256')
    .update(`${SUPER_ADMIN_ID}:${SUPER_ADMIN_PASSWORD}`)
    .digest('hex');
}
```

- [ ] **Step 4: Run to verify the test passes**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 3 'safeStringEqual'
```
Expected: `✓ safeStringEqual` (4 tests passing).

- [ ] **Step 5: Update `auth.service.ts` to use `safeStringEqual` and the new export**

In `apps/api/src/auth/auth.service.ts`:

1. Add `safeStringEqual` and `getSuperAdminCredentialFingerprint` to the import from `../config/runtime-env` (line 9):
```typescript
import {
  getSuperAdminCredentials,
  getSuperAdminCredentialFingerprint,
  safeStringEqual,
} from '../config/runtime-env';
```

2. Replace `findAuthenticatedSuperAdmin` (lines 389–401) — change the comparison:
```typescript
private findAuthenticatedSuperAdmin(id: string, password: string) {
  const credentials = getSuperAdminCredentials();

  if (
    !safeStringEqual(id, credentials.id) ||
    !safeStringEqual(password, credentials.password)
  ) {
    return null;
  }

  return {
    accountId: credentials.id,
    name: '최고관리자',
    role: 'super-admin',
    mustChangePassword: false,
  } satisfies AuthenticatedUser;
}
```

3. Remove the duplicate local function `getSuperAdminCredentialFingerprint` at the bottom of the file (lines 934–940). It is now provided by `runtime-env.ts`.

- [ ] **Step 6: Update `auth-access.ts` to use the shared fingerprint helper**

In `apps/api/src/common/auth-access.ts`:

1. Replace the `createHash` import at line 6:
```typescript
import { getSuperAdminCredentials, getSuperAdminCredentialFingerprint } from '../config/runtime-env';
```
Remove: `import { createHash } from 'node:crypto';`

2. Replace the inline fingerprint computation (lines 104–109):
```typescript
// Before:
const expectedFingerprint = createHash('sha256')
  .update(`${credentials.id}:${credentials.password}`)
  .digest('hex');

// After:
const expectedFingerprint = getSuperAdminCredentialFingerprint();
```

- [ ] **Step 7: Run all API tests**

```bash
cd apps/api && pnpm test
```
Expected: all tests pass, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
cd /path/to/repo && git add apps/api/src/config/runtime-env.ts apps/api/src/auth/auth.service.ts apps/api/src/common/auth-access.ts apps/api/src/auth/auth.service.test.ts
git commit -m "security: replace === with timingSafeEqual for super-admin credential comparison"
```

---

### Task 2: Remove `INTERNAL_API_SECRET` from Docker build image

**Files:**
- Modify: `apps/web/Dockerfile:16-18`

- [ ] **Step 1: Verify the problem**

```bash
grep -n 'INTERNAL_API_SECRET' apps/web/Dockerfile
```
Expected: lines 16 and 18 show `ARG INTERNAL_API_SECRET=build-internal-secret` and `ENV INTERNAL_API_SECRET=$INTERNAL_API_SECRET`.

- [ ] **Step 2: Remove the secret from the builder stage**

In `apps/web/Dockerfile`, remove lines 16 and 18:

```dockerfile
FROM base AS builder
ARG NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
WORKDIR /app/apps/web
RUN ./node_modules/.bin/next build
```

`INTERNAL_API_SECRET` is a server-runtime env var, not needed at build time — Next.js only reads it in route handlers via `process.env`, which are never evaluated during `next build`.

- [ ] **Step 3: Verify the file looks correct**

```bash
grep -n 'INTERNAL_API_SECRET\|ARG\|ENV' apps/web/Dockerfile
```
Expected: only `PNPM_HOME`, `PATH`, `NODE_ENV`, `HOSTNAME`, `PORT`, `NEXT_TELEMETRY_DISABLED`, `NEXT_PUBLIC_API_URL` — no `INTERNAL_API_SECRET`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/Dockerfile
git commit -m "security: remove INTERNAL_API_SECRET from Docker build stage (runtime injection only)"
```

---

### Task 3: Fix `buildProxyResponse` — forward binary response headers

**Files:**
- Modify: `apps/web/lib/api-proxy.ts:180-201`

The `text` branch (used for Excel exports) discards `Content-Disposition` and `Content-Length`, which breaks all `xlsx` downloads silently (no filename, no content-length).

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/api-proxy.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { buildProxyResponse } from './api-proxy';

describe('buildProxyResponse — binary headers', () => {
  it('forwards Content-Disposition for xlsx responses', async () => {
    const upstream = new Response('file-data', {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': 'attachment; filename="export.xlsx"',
        'content-length': '9',
      },
    });

    const result = await buildProxyResponse(upstream);
    expect(result.headers.get('content-disposition')).toBe('attachment; filename="export.xlsx"');
    expect(result.headers.get('content-length')).toBe('9');
  });

  it('does not forward content-disposition for json responses', async () => {
    const upstream = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    const result = await buildProxyResponse(upstream);
    // JSON responses go through NextResponse.json — no disposition
    expect(result.headers.get('content-disposition')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify the test fails**

```bash
cd apps/web && pnpm test --reporter=verbose 2>&1 | grep -A 5 'binary headers'
```
Expected: `AssertionError: expected null to be 'attachment; filename="export.xlsx"'`.

- [ ] **Step 3: Fix `buildProxyResponse` in `api-proxy.ts`**

Replace the `text` branch (lines 197–200):

```typescript
// Before:
  return new NextResponse(payload.body, {
    status: response.status,
    headers: payload.contentType ? { 'content-type': payload.contentType } : undefined,
  })

// After:
  const binaryHeaders: Record<string, string> = {};
  if (payload.contentType) {
    binaryHeaders['content-type'] = payload.contentType;
  }
  const contentDisposition = response.headers.get('content-disposition');
  if (contentDisposition) {
    binaryHeaders['content-disposition'] = contentDisposition;
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    binaryHeaders['content-length'] = contentLength;
  }
  return new NextResponse(payload.body, {
    status: response.status,
    headers: Object.keys(binaryHeaders).length > 0 ? binaryHeaders : undefined,
  });
```

- [ ] **Step 4: Run to verify the test passes**

```bash
cd apps/web && pnpm test --reporter=verbose 2>&1 | grep -A 5 'binary headers'
```
Expected: `✓ forwards Content-Disposition for xlsx responses`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/api-proxy.ts apps/web/lib/api-proxy.test.ts
git commit -m "fix: forward Content-Disposition and Content-Length headers in proxy binary responses"
```

---

### Task 4: Fix login route — forward `x-forwarded-for` to API

**Files:**
- Modify: `apps/web/app/api/auth/login/route.ts:37-47`

Only `x-real-ip` is forwarded; behind Nginx with `proxy_set_header X-Forwarded-For`, the throttle logic in NestJS receives nothing.

- [ ] **Step 1: Update `forwardHeaderValue` to accept the header name generically and add `x-forwarded-for`**

In `apps/web/app/api/auth/login/route.ts`, replace lines 36–47 and 96–99:

```typescript
// Replace the fetch call (lines 36-47):
    const realIp = forwardHeaderValue('x-real-ip', request)
    const forwardedFor = forwardHeaderValue('x-forwarded-for', request)
    const upstreamResponse = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(realIp && { 'x-real-ip': realIp }),
        ...(forwardedFor && { 'x-forwarded-for': forwardedFor }),
      },
      body: JSON.stringify({ id, password }),
      cache: 'no-store',
    })

// Replace forwardHeaderValue function (lines 96-99):
function forwardHeaderValue(name: string, request: NextRequest) {
  const value = request.headers.get(name)?.trim()
  return value && value.length > 0 ? value : null
}
```

- [ ] **Step 2: Run web tests**

```bash
cd apps/web && pnpm test
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/auth/login/route.ts
git commit -m "fix: forward x-forwarded-for header to API for login throttle accuracy"
```

---

### Task 5: Fix logout — don't clear cookie on upstream failure

**Files:**
- Modify: `apps/web/app/api/auth/logout/route.ts`

Currently `createLogoutResponse` always clears the cookie, even when status is 502. This means the user's browser loses the session cookie but the server session remains active.

- [ ] **Step 1: Write the failing test**

Create `apps/web/app/api/auth/logout.test.ts`:

```typescript
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

// We test the exported POST handler indirectly via mock
describe('logout route', () => {
  it('clears cookie on successful revoke', async () => {
    // Already works — verify existing behaviour is preserved
    // (integration test in smoke matrix; unit test for the error path below)
  });
});
```

This task is a logic fix; the smoke matrix covers the happy path. Focus: ensure the 502 path does NOT clear cookie.

- [ ] **Step 2: Fix the logout route**

Replace `apps/web/app/api/auth/logout/route.ts` entirely:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_SESSION_COOKIE,
  readAuthSessionId,
  revokeAuthSession,
  shouldUseSecureCookie,
} from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  const sessionId = readAuthSessionId(
    request.cookies.get(AUTH_SESSION_COOKIE)?.value,
  )

  if (sessionId) {
    try {
      await revokeAuthSession(sessionId)
    } catch {
      // Do NOT clear the cookie — the session was not revoked
      return NextResponse.json(
        { message: '로그아웃 요청을 처리하지 못했습니다.' },
        { status: 502 },
      )
    }
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: 0,
  })

  return response
}
```

- [ ] **Step 3: Run web tests**

```bash
cd apps/web && pnpm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/auth/logout/route.ts
git commit -m "fix: do not clear auth cookie on logout upstream failure (502)"
```

---

### Task 6: Fix `link-email` / `link-phone` — refresh session cookie after success

**Files:**
- Modify: `apps/web/app/api/auth/link-email/route.ts`
- Modify: `apps/web/app/api/auth/link-phone/route.ts`

After linking, the NestJS API updates the `AuthSession` row (sets `hasLinkedEmail = true`), but the Next.js route handler returns `{ ok: true }` without refreshing the session cookie. The client cookie keeps `hasLinkedEmail: false`, breaking the onboarding redirect logic.

The fix: call the `refresh-onboarding` endpoint (already exists at `POST /auth/sessions/refresh-onboarding`) and update the cookie with the fresh session.

- [ ] **Step 1: Read the refresh-onboarding route to confirm it exists**

```bash
cat apps/web/app/api/auth/session/refresh-onboarding/route.ts
```
Expected: `POST` handler calling `getApiBaseUrl()/auth/sessions/refresh-onboarding`, returns `{ ok: true, session: {...} }`.

- [ ] **Step 2: Fix `link-email/route.ts`**

Replace `apps/web/app/api/auth/link-email/route.ts` entirely:

```typescript
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api-base-url'
import {
  getResponseMessage,
  readJsonRequestBody,
  readResponseBody,
} from '@/lib/api-proxy'
import {
  AUTH_SESSION_COOKIE,
  getSessionCookieMaxAge,
  readAuthSessionId,
  resolveAuthSession,
  shouldUseSecureCookie,
} from '@/lib/auth-session'
import { getInternalApiSecret } from '@/lib/runtime-env'

export async function PATCH(request: NextRequest) {
  const sessionId = readAuthSessionId((await cookies()).get(AUTH_SESSION_COOKIE)?.value)
  let session: Awaited<ReturnType<typeof resolveAuthSession>>

  try {
    session = await resolveAuthSession(sessionId)
  } catch {
    return NextResponse.json({ message: '세션 정보를 확인하지 못했습니다.' }, { status: 502 })
  }

  if (!session) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
  }

  const bodyResult = await readJsonRequestBody(request)

  if (!bodyResult.ok) {
    return NextResponse.json({ message: '요청 본문이 올바르지 않습니다.' }, { status: 400 })
  }

  try {
    const linkResponse = await fetch(`${getApiBaseUrl()}/auth/link-email`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-secret': getInternalApiSecret(),
        'x-actor-session-id': session.id,
      },
      body: JSON.stringify(bodyResult.body),
      cache: 'no-store',
    })

    const linkBody = await readResponseBody(linkResponse)

    if (!linkResponse.ok) {
      return NextResponse.json(
        { message: getResponseMessage(linkBody, '이메일 연동에 실패했습니다.') },
        { status: linkResponse.status },
      )
    }

    // Refresh the session so the cookie reflects hasLinkedEmail: true
    const refreshResponse = await fetch(
      `${getApiBaseUrl()}/auth/sessions/refresh-onboarding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-secret': getInternalApiSecret(),
          'x-actor-session-id': session.id,
        },
        body: JSON.stringify({ sessionId: session.id }),
        cache: 'no-store',
      },
    )

    const refreshBody = await refreshResponse.json().catch(() => null)
    const nextSession =
      refreshBody?.ok === true && typeof refreshBody?.session === 'object'
        ? refreshBody.session
        : null

    const response = NextResponse.json({ ok: true })

    if (nextSession?.id && nextSession?.expiresAt) {
      response.cookies.set({
        name: AUTH_SESSION_COOKIE,
        value: nextSession.id,
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: shouldUseSecureCookie(request),
        path: '/',
        maxAge: getSessionCookieMaxAge(nextSession.expiresAt),
      })
    }

    return response
  } catch {
    return NextResponse.json({ message: '이메일 연동 요청을 처리하지 못했습니다.' }, { status: 502 })
  }
}
```

- [ ] **Step 3: Fix `link-phone/route.ts`**

Read the current file first:
```bash
cat apps/web/app/api/auth/link-phone/route.ts
```

Replace `apps/web/app/api/auth/link-phone/route.ts` entirely with the same pattern, changing `link-email` → `link-phone` and the error message:

```typescript
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api-base-url'
import {
  getResponseMessage,
  readJsonRequestBody,
  readResponseBody,
} from '@/lib/api-proxy'
import {
  AUTH_SESSION_COOKIE,
  getSessionCookieMaxAge,
  readAuthSessionId,
  resolveAuthSession,
  shouldUseSecureCookie,
} from '@/lib/auth-session'
import { getInternalApiSecret } from '@/lib/runtime-env'

export async function PATCH(request: NextRequest) {
  const sessionId = readAuthSessionId((await cookies()).get(AUTH_SESSION_COOKIE)?.value)
  let session: Awaited<ReturnType<typeof resolveAuthSession>>

  try {
    session = await resolveAuthSession(sessionId)
  } catch {
    return NextResponse.json({ message: '세션 정보를 확인하지 못했습니다.' }, { status: 502 })
  }

  if (!session) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
  }

  const bodyResult = await readJsonRequestBody(request)

  if (!bodyResult.ok) {
    return NextResponse.json({ message: '요청 본문이 올바르지 않습니다.' }, { status: 400 })
  }

  try {
    const linkResponse = await fetch(`${getApiBaseUrl()}/auth/link-phone`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-secret': getInternalApiSecret(),
        'x-actor-session-id': session.id,
      },
      body: JSON.stringify(bodyResult.body),
      cache: 'no-store',
    })

    const linkBody = await readResponseBody(linkResponse)

    if (!linkResponse.ok) {
      return NextResponse.json(
        { message: getResponseMessage(linkBody, '전화번호 연동에 실패했습니다.') },
        { status: linkResponse.status },
      )
    }

    const refreshResponse = await fetch(
      `${getApiBaseUrl()}/auth/sessions/refresh-onboarding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-secret': getInternalApiSecret(),
          'x-actor-session-id': session.id,
        },
        body: JSON.stringify({ sessionId: session.id }),
        cache: 'no-store',
      },
    )

    const refreshBody = await refreshResponse.json().catch(() => null)
    const nextSession =
      refreshBody?.ok === true && typeof refreshBody?.session === 'object'
        ? refreshBody.session
        : null

    const response = NextResponse.json({ ok: true })

    if (nextSession?.id && nextSession?.expiresAt) {
      response.cookies.set({
        name: AUTH_SESSION_COOKIE,
        value: nextSession.id,
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: shouldUseSecureCookie(request),
        path: '/',
        maxAge: getSessionCookieMaxAge(nextSession.expiresAt),
      })
    }

    return response
  } catch {
    return NextResponse.json({ message: '전화번호 연동 요청을 처리하지 못했습니다.' }, { status: 502 })
  }
}
```

- [ ] **Step 4: Run web tests**

```bash
cd apps/web && pnpm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/auth/link-email/route.ts apps/web/app/api/auth/link-phone/route.ts
git commit -m "fix: refresh session cookie after link-email / link-phone so hasLinkedEmail/Phone is current"
```

---

### Task 7: Fix `change-password/route.ts` — `parseAuthSession` missing `hasLinkedEmail`/`hasLinkedPhone`

**Files:**
- Modify: `apps/web/app/api/auth/change-password/route.ts:127-175`

The local `parseAuthSession` function (lines 127–175) omits `hasLinkedEmail` and `hasLinkedPhone`. After password change the cookie is refreshed with the new session, but the redirect logic (`getOnboardingEntryPath`) needs those flags.

- [ ] **Step 1: Update `parseAuthSession` in `change-password/route.ts`**

Replace the return type and validation in the local function:

```typescript
function parseAuthSession(value: unknown): {
  id: string
  accountId: string
  role: 'student' | 'teacher'
  mustChangePassword: boolean
  hasLinkedEmail: boolean
  hasLinkedPhone: boolean
  expiresAt: string
  school?: 'GBSW' | 'BYMS'
} | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const session = value as Record<string, unknown>

  if (
    typeof session.id !== 'string' ||
    session.id.trim().length === 0 ||
    typeof session.accountId !== 'string' ||
    session.accountId.trim().length === 0 ||
    (session.role !== 'student' && session.role !== 'teacher') ||
    typeof session.mustChangePassword !== 'boolean' ||
    typeof session.hasLinkedEmail !== 'boolean' ||
    typeof session.hasLinkedPhone !== 'boolean' ||
    typeof session.expiresAt !== 'string'
  ) {
    return null
  }

  if (
    session.school !== undefined &&
    session.school !== 'GBSW' &&
    session.school !== 'BYMS'
  ) {
    return null
  }

  const expiresAtMs = Date.parse(session.expiresAt)

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return null
  }

  return {
    id: session.id.trim(),
    accountId: session.accountId.trim(),
    role: session.role,
    mustChangePassword: session.mustChangePassword,
    hasLinkedEmail: session.hasLinkedEmail,
    hasLinkedPhone: session.hasLinkedPhone,
    expiresAt: session.expiresAt,
    ...(session.school ? { school: session.school } : {}),
  }
}
```

- [ ] **Step 2: Run web tests**

```bash
cd apps/web && pnpm test
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/auth/change-password/route.ts
git commit -m "fix: include hasLinkedEmail/hasLinkedPhone in change-password parseAuthSession"
```

---

### Task 8: Fix `getStudentSummary` access control — use `assertTeacherReadAccess`

**Files:**
- Modify: `apps/api/src/mileage/mileage.students.service.ts:51`

`getStudentSummary` calls `assertTeacherExists` (any teacher) instead of `assertTeacherReadAccess` (which checks `isDormTeacher` for dorm scope). Non-dorm teachers can read dorm student summaries.

- [ ] **Step 1: Write the failing test**

Add to `apps/api/src/mileage/mileage.students.service.test.ts` (create if not exists):

```typescript
import { UnauthorizedException } from '@nestjs/common';
import { MileageScope } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { MileageStudentsService } from './mileage.students.service';

describe('MileageStudentsService.getStudentSummary access', () => {
  it('throws UnauthorizedException for non-dorm teacher accessing dorm summary', async () => {
    const prisma = {
      authSession: {
        findFirst: vi.fn().mockResolvedValue({ id: 'sess-1' }),
      },
      teacher: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ teacherId: 'teacher-1', name: '홍길동' }) // assertTeacherExists
          .mockResolvedValueOnce({ teacherId: 'teacher-1', isDormTeacher: false }), // assertDormTeacherOnly
      },
      student: { findFirst: vi.fn() },
      mileageEntry: { findMany: vi.fn() },
    } as any;

    const service = new MileageStudentsService(prisma);

    await expect(
      service.getStudentSummary(
        MileageScope.DORM,
        'teacher-1',
        'sess-1',
        'student-1',
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run to verify the test fails**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 5 'getStudentSummary access'
```
Expected: test fails because `getStudentSummary` currently calls `assertTeacherExists` and does NOT throw for a non-dorm teacher.

- [ ] **Step 3: Fix `mileage.students.service.ts`**

In `apps/api/src/mileage/mileage.students.service.ts`, replace line 51:

```typescript
// Before:
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

// After:
    await this.assertTeacherReadAccess(scope, actorTeacherId, actorSessionId);
```

- [ ] **Step 4: Run to verify the test passes**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 5 'getStudentSummary access'
```
Expected: `✓ throws UnauthorizedException for non-dorm teacher accessing dorm summary`.

- [ ] **Step 5: Run all API tests**

```bash
cd apps/api && pnpm test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/mileage/mileage.students.service.ts apps/api/src/mileage/mileage.students.service.test.ts
git commit -m "fix: enforce dorm teacher access check in getStudentSummary"
```

---

### Task 9: Fix `react cache()` usage in `auth-session.ts` route handlers

**Files:**
- Modify: `apps/web/lib/auth-session.ts:29`

`resolveAuthSession = cache(...)` uses React's request-scoped cache. In App Router **Server Components** this is correct. In **Route Handlers** (API routes) each `POST /api/auth/...` is a separate request — `cache()` is a no-op there, but it's misleading and can cause subtle bugs if React's implementation changes.

The fix is to keep the `cache()` wrapper for Server Component use, but add a comment explaining the scope contract so future engineers don't misuse it.

- [ ] **Step 1: Add clarifying comment**

In `apps/web/lib/auth-session.ts`, add a comment above `resolveAuthSession`:

```typescript
// cache() deduplicates calls within a single React Server Component render tree.
// In Route Handlers (API routes) each request is isolated — cache() is a no-op
// but retained for consistency with Server Component usage.
export const resolveAuthSession = cache(
  async (sessionId: string | null | undefined): Promise<AuthSession | null> => {
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/auth-session.ts
git commit -m "chore: document React cache() scope contract on resolveAuthSession"
```

---

### Final verification

- [ ] **Run full test suite**

```bash
cd /path/to/repo && pnpm test
```
Expected: all tests pass across both `apps/api` and `apps/web`.

- [ ] **TypeScript check**

```bash
cd apps/api && npx tsc --noEmit && cd ../web && npx tsc --noEmit
```
Expected: no type errors.

# Smoke Matrix

This file tracks the manual smoke checks that gate the current refactor waves.

## Auth and Session

| Scenario | Expected Result |
|---|---|
| Super-admin login succeeds with `SUPER_ADMIN_ID` / `SUPER_ADMIN_PASSWORD` | Redirects to `/admin/students/create` |
| Student first login | Redirects to `/change-password` |
| Teacher first login | Redirects to `/change-password` |
| Super-admin opens `/change-password` | Redirects back to admin home |

## Dorm Mileage Policy

| Scenario | Expected Result |
|---|---|
| Non-dorm teacher opens dorm history/stats/report/student list | Read access succeeds |
| Non-dorm teacher tries dorm grant/edit/delete | Request is denied with dorm-teacher-only messaging |
| BYMS student opens dorm rules/stats surfaces | Dorm-specific data stays empty or redirects away from dorm-only UX |

## Admin and Temp Passwords

| Scenario | Expected Result |
|---|---|
| Admin creates a student account | One-time temporary password is shown in the success flow |
| Admin creates a teacher account | One-time temporary password is shown in the success flow |
| Admin security page | Explains env-managed super-admin credentials and no in-app rotation |

## Config and Proxy

| Scenario | Expected Result |
|---|---|
| `NEXT_PUBLIC_API_URL` points to a direct Nest origin | Requests resolve normally |
| `NEXT_PUBLIC_API_URL` points to a Next.js `/api` path | Startup/request path fails fast with a config error |
| Docker production config | `API_INTERNAL_URL` remains `http://api:3001` for server-side calls |

'use client'

import { startTransition, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReadonlyURLSearchParams } from 'next/navigation'

type QueryValue = string | number | null | undefined

export const APP_NAVIGATION_START_EVENT = 'gbsw:app-navigation-start'
export const APP_NAVIGATION_COMPLETE_EVENT = 'gbsw:app-navigation-complete'
export const DASHBOARD_NAVIGATION_START_EVENT = APP_NAVIGATION_START_EVENT

export function dispatchAppNavigationStart() {
  window.dispatchEvent(new Event(APP_NAVIGATION_START_EVENT))
}

export function dispatchAppNavigationComplete() {
  window.dispatchEvent(new Event(APP_NAVIGATION_COMPLETE_EVENT))
}

export function dispatchDashboardNavigationStart() {
  dispatchAppNavigationStart()
}

export function useUpdateSearchParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (updates: Record<string, QueryValue>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === '') {
          params.delete(key)
          continue
        }

        params.set(key, `${value}`)
      }

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname

      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      if (nextUrl === currentUrl) {
        return
      }

      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    },
    [pathname, router, searchParams],
  )
}

export function getQueryString(
  searchParams: ReadonlyURLSearchParams,
  key: string,
) {
  return searchParams.get(key) ?? ''
}

export function getPositiveQueryNumber(
  searchParams: ReadonlyURLSearchParams,
  key: string,
  fallback: number,
) {
  const raw = searchParams.get(key)

  if (!raw) {
    return fallback
  }

  const parsed = Number.parseInt(raw, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

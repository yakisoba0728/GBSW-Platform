'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { SharedMileageRuleSummary } from '../teacher/shared-mileage-types'
import type { DormMileageRuleSummary } from '../teacher/dorm-mileage-types'
import type { MileageScope } from '@/lib/scope-utils'

type RulesContextValue = {
  rules: SharedMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
  isDormTeacher: boolean | null
  loadRules: () => Promise<void>
}

const RulesContext = createContext<RulesContextValue | null>(null)

export function RulesProvider({
  children,
  apiPath,
  scope,
}: {
  children: React.ReactNode
  apiPath?: string
  scope?: MileageScope
}) {
  const resolvedApiPath =
    apiPath ??
    (scope === 'dorm'
      ? '/api/teacher/dorm-mileage/rules'
      : '/api/teacher/school-mileage/rules')

  const [rules, setRules] = useState<SharedMileageRuleSummary[]>([])
  const [isRulesLoading, setIsRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const [isDormTeacher, setIsDormTeacher] = useState<boolean | null>(null)

  const isDorm = resolvedApiPath.includes('/dorm-mileage/')
  const shouldLoadDormAccess = isDorm && resolvedApiPath.startsWith('/api/teacher/')

  const loadRules = useCallback(async () => {
    setIsRulesLoading(true)
    setRulesError(null)

    try {
      const response = await fetch(resolvedApiPath, {
        cache: 'no-store',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setRulesError(result?.message ?? '상벌점 규칙을 불러오지 못했습니다.')
        setRules([])
        return
      }

      setRules(
        Array.isArray(result?.rules)
          ? (result.rules as SharedMileageRuleSummary[])
          : [],
      )
    } catch {
      setRulesError('상벌점 규칙 조회 중 문제가 발생했습니다.')
      setRules([])
    } finally {
      setIsRulesLoading(false)
    }
  }, [resolvedApiPath])

  const loadDormAccess = useCallback(async () => {
    if (!shouldLoadDormAccess) {
      setIsDormTeacher(null)
      return
    }

    try {
      const response = await fetch('/api/teacher/dorm-mileage/access', {
        cache: 'no-store',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setIsDormTeacher(false)
        return
      }

      setIsDormTeacher(result?.isDormTeacher ?? false)
    } catch {
      setIsDormTeacher(false)
    }
  }, [shouldLoadDormAccess])

  useEffect(() => {
    void loadRules()
  }, [loadRules])

  useEffect(() => {
    void loadDormAccess()
  }, [loadDormAccess])

  const value = useMemo(
    () => ({
      rules,
      isRulesLoading,
      rulesError,
      isDormTeacher,
      loadRules,
    }),
    [isDormTeacher, isRulesLoading, loadRules, rules, rulesError],
  )

  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>
}

export function useRulesContext() {
  const value = useContext(RulesContext)

  if (!value) {
    throw new Error('RulesContext must be used within RulesProvider.')
  }

  return value
}

// ─── Backward-compatible aliases ─────────────────────────────────────────────
// These allow existing dorm-mileage imports to work without changes to every
// consumer file. DormRulesProvider uses the dorm apiPath by default.

export function DormRulesProvider({
  children,
  apiPath = '/api/teacher/dorm-mileage/rules',
}: {
  children: React.ReactNode
  apiPath?: string
}) {
  return (
    <RulesProvider apiPath={apiPath}>
      {children}
    </RulesProvider>
  )
}

export function useDormRulesContext() {
  const ctx = useRulesContext()
  return {
    ...ctx,
    rules: ctx.rules as DormMileageRuleSummary[],
  }
}

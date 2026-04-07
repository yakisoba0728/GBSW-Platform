'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { DormMileageRuleSummary } from '../teacher/dorm-mileage-types'

type DormRulesContextValue = {
  rules: DormMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
  isDormTeacher: boolean | null
  loadRules: () => Promise<void>
}

const DormRulesContext = createContext<DormRulesContextValue | null>(null)

export function DormRulesProvider({
  children,
  apiPath = '/api/teacher/dorm-mileage/rules',
}: {
  children: React.ReactNode
  apiPath?: string
}) {
  const [rules, setRules] = useState<DormMileageRuleSummary[]>([])
  const [isRulesLoading, setIsRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const [isDormTeacher, setIsDormTeacher] = useState<boolean | null>(null)
  const shouldLoadDormAccess = apiPath.startsWith('/api/teacher/')

  const loadRules = useCallback(async () => {
    setIsRulesLoading(true)
    setRulesError(null)

    try {
      const response = await fetch(apiPath, {
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
          ? (result.rules as DormMileageRuleSummary[])
          : [],
      )
    } catch {
      setRulesError('상벌점 규칙 조회 중 문제가 발생했습니다.')
      setRules([])
    } finally {
      setIsRulesLoading(false)
    }
  }, [apiPath])

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

  return <DormRulesContext.Provider value={value}>{children}</DormRulesContext.Provider>
}

export function useDormRulesContext() {
  const value = useContext(DormRulesContext)

  if (!value) {
    throw new Error('DormRulesContext must be used within DormRulesProvider.')
  }

  return value
}

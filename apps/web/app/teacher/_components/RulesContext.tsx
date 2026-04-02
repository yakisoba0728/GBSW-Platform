'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { SchoolMileageRuleSummary } from '@/app/components/teacher/school-mileage-types'

type RulesContextValue = {
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
  loadRules: () => Promise<void>
}

const RulesContext = createContext<RulesContextValue | null>(null)

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<SchoolMileageRuleSummary[]>([])
  const [isRulesLoading, setIsRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState<string | null>(null)

  const loadRules = useCallback(async () => {
    setIsRulesLoading(true)
    setRulesError(null)

    try {
      const response = await fetch('/api/teacher/school-mileage/rules', {
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
          ? (result.rules as SchoolMileageRuleSummary[])
          : [],
      )
    } catch {
      setRulesError('상벌점 규칙 조회 중 문제가 발생했습니다.')
      setRules([])
    } finally {
      setIsRulesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRules()
  }, [loadRules])

  const value = useMemo(
    () => ({
      rules,
      isRulesLoading,
      rulesError,
      loadRules,
    }),
    [isRulesLoading, loadRules, rules, rulesError],
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

export type SharedSchoolCode = 'GBSW' | 'BYMS'
export type SharedMileageType = 'reward' | 'penalty'

export type SharedMileageRuleSummary = {
  id: number
  type: SharedMileageType
  category: string
  name: string
  defaultScore: number
  displayOrder: number
  isActive: boolean
  minScore?: number | null
  maxScore?: number | null
}

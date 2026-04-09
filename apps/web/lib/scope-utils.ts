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

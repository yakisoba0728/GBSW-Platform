import {
  Home,
  ShieldCheck,
  UserPlus,
  Users,
  UserCheck,
  ChevronRight,
  Building2,
  User,
  FileText,
  Search,
  Plus,
  Pencil,
  Ban,
  Trash2,
  X,
  LogOut,
  Lock,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { ReactNode } from 'react'

type IconProps = LucideProps & { size?: number }

// ─── 버튼 내 아이콘 (default 14px) ────────────────────────────
export function HomeIcon({ size = 14, ...props }: IconProps) {
  return <Home size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function ShieldCheckIcon({ size = 14, ...props }: IconProps) {
  return <ShieldCheck size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function UserPlusIcon({ size = 14, ...props }: IconProps) {
  return <UserPlus size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function UserPlusNavIcon({ size = 14, ...props }: IconProps) {
  return <UserPlus size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function UsersNavIcon({ size = 14, ...props }: IconProps) {
  return <Users size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function UserPlusCompactIcon({ size = 12, ...props }: IconProps) {
  return <UserPlus size={size} strokeWidth={2.5} aria-hidden="true" {...props} />
}

export function UserCheckIcon({ size = 14, ...props }: IconProps) {
  return <UserCheck size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function SearchIcon({ size = 14, ...props }: IconProps) {
  return <Search size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function PlusIcon({ size = 14, ...props }: IconProps) {
  return <Plus size={size} strokeWidth={2.5} aria-hidden="true" {...props} />
}

export function EditIcon({ size = 14, ...props }: IconProps) {
  return <Pencil size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function TrashIcon({ size = 14, ...props }: IconProps) {
  return <Trash2 size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function XIcon({ size = 14, ...props }: IconProps) {
  return <X size={size} strokeWidth={2.5} aria-hidden="true" {...props} />
}

export function LogOutIcon({ size = 14, ...props }: IconProps) {
  return <LogOut size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

export function LockIcon({ size = 14, ...props }: IconProps) {
  return <Lock size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

// ─── 리스트/인터랙티브 아이콘 (default 16px) ──────────────────
export function ChevronRightIcon({ size = 16, ...props }: IconProps) {
  return <ChevronRight size={size} strokeWidth={2.5} aria-hidden="true" {...props} />
}

export function SlashIcon({ size = 16, ...props }: IconProps) {
  return <Ban size={size} strokeWidth={2} aria-hidden="true" {...props} />
}

// ─── 빈 상태/강조 아이콘 (default 20px / 24px) ───────────────────────
export function BuildingIcon({ size = 20, ...props }: IconProps) {
  return <Building2 size={size} strokeWidth={1.5} aria-hidden="true" {...props} />
}

export function FeatureBadge({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-lg"
      style={{ backgroundColor: 'var(--accent-subtle)' }}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}

export function SearchFeatureIcon({ size = 20, style, ...props }: IconProps) {
  return (
    <FeatureBadge>
      <Search
        size={size}
        strokeWidth={1.7}
        aria-hidden="true"
        style={{ color: 'var(--accent)', ...style }}
        {...props}
      />
    </FeatureBadge>
  )
}

export function BuildingFeatureIcon({ size = 20, style, ...props }: IconProps) {
  return (
    <FeatureBadge>
      <Building2
        size={size}
        strokeWidth={1.5}
        aria-hidden="true"
        style={{ color: 'var(--accent)', ...style }}
        {...props}
      />
    </FeatureBadge>
  )
}

export function UserPlusFeatureIcon({ size = 24, style, ...props }: IconProps) {
  return (
    <FeatureBadge>
      <UserPlus
        size={size}
        strokeWidth={1.7}
        aria-hidden="true"
        style={{ color: 'var(--accent)', ...style }}
        {...props}
      />
    </FeatureBadge>
  )
}

export function UsersFeatureIcon({ size = 24, style, ...props }: IconProps) {
  return (
    <FeatureBadge>
      <Users
        size={size}
        strokeWidth={1.7}
        aria-hidden="true"
        style={{ color: 'var(--accent)', ...style }}
        {...props}
      />
    </FeatureBadge>
  )
}

export function UserFeatureIcon({ size = 24, style, ...props }: IconProps) {
  return (
    <FeatureBadge>
      <User
        size={size}
        strokeWidth={1.7}
        aria-hidden="true"
        style={{ color: 'var(--accent)', ...style }}
        {...props}
      />
    </FeatureBadge>
  )
}

// Backward-compatible alias for stale dev bundles that still import the old name.
export function PersonFeatureBadgeIcon(props: IconProps) {
  return <UserFeatureIcon {...props} />
}

export function FileIcon({ size = 20, ...props }: IconProps) {
  return <FileText size={size} strokeWidth={1.5} aria-hidden="true" {...props} />
}

export function FileFeatureIcon({ size = 20, style, ...props }: IconProps) {
  return (
    <FeatureBadge>
      <FileText
        size={size}
        strokeWidth={1.5}
        aria-hidden="true"
        style={{ color: 'var(--accent)', ...style }}
        {...props}
      />
    </FeatureBadge>
  )
}

export function DatabaseIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14a9 3 0 0 0 18 0V5"/>
      <path d="M3 12a9 3 0 0 0 18 0"/>
    </svg>
  )
}

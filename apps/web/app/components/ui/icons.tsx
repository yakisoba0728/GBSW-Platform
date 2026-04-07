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

export function UsersIcon({ size = 14, ...props }: IconProps) {
  return <Users size={size} strokeWidth={2} aria-hidden="true" {...props} />
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

// ─── 빈 상태/강조 아이콘 (default 20px) ───────────────────────
export function BuildingIcon({ size = 20, ...props }: IconProps) {
  return <Building2 size={size} strokeWidth={1.5} aria-hidden="true" {...props} />
}

export function UserIcon({ size = 20, ...props }: IconProps) {
  return <User size={size} strokeWidth={1.5} aria-hidden="true" {...props} />
}

export function FileIcon({ size = 20, ...props }: IconProps) {
  return <FileText size={size} strokeWidth={1.5} aria-hidden="true" {...props} />
}

import BrandPanel from '../BrandPanel'

export default function AuthShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen w-full">
      <BrandPanel />
      {children}
    </main>
  )
}

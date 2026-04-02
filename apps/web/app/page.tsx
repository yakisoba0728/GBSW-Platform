import BrandPanel from './components/BrandPanel'
import LoginForm from './components/LoginForm'
import { redirectAuthenticatedSession } from '@/lib/route-guards'

export default async function Home() {
  await redirectAuthenticatedSession()

  return (
    <main className="flex min-h-screen w-full">
      <BrandPanel />
      <LoginForm />
    </main>
  )
}

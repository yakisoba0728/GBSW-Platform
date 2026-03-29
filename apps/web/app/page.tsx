import BrandPanel from './components/BrandPanel'
import LoginForm from './components/LoginForm'

export default function Home() {
  return (
    <main className="flex min-h-screen w-full">
      <BrandPanel />
      <LoginForm />
    </main>
  )
}

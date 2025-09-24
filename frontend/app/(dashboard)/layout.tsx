import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// Dashboard layout with header and footer
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
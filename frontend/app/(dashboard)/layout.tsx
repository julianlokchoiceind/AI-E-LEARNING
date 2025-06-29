// Simple layout without auth check to avoid conflicts with auth layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
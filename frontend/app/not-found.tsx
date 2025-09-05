import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Container variant="auth" className="space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="mt-5 space-y-4">
          <Link href="/" className="block">
            <Button className="w-full">
              Go to Homepage
            </Button>
          </Link>
          <Link href="/courses" className="block">
            <Button variant="outline" className="w-full">
              Browse Courses
            </Button>
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Error code: 404
        </p>
      </Container>
    </div>
  )
}
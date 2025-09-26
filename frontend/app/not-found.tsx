import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Header } from '@/components/layout/Header'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <Header />
      <div className="flex-1 flex items-center justify-center">
      {/* Background Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden z-0 opacity-30" style={{ lineHeight: 0 }}>
        <svg
          className="w-full h-40 sm:h-52 md:h-72 lg:h-96 xl:h-[32rem] 2xl:h-[40rem]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="rgba(0,127,255,1)" />
              <stop offset="100%" stopColor="rgba(42,82,190,1)" />
            </linearGradient>
          </defs>
          <path
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="url(#waveGradient)"
          />
        </svg>
      </div>

      <Container variant="public" className="relative z-20">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-20">
          {/* SVG Illustration */}
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex-shrink-0">
            <div className="animate-[sway_4s_ease-in-out_infinite] hover:animate-none transition-all duration-1000">
              <Image
                src="/images/illustrations/404-computer-fire.svg"
                alt="Page not found illustration"
                width={900}
                height={600}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left flex-1 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold gradient-text mb-4 sm:mb-6 lg:mb-8 leading-none">
              Oops,
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-primary mb-8 sm:mb-10 lg:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              The page you are trying to access cannot be found.
            </h2>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/" className="flex-1 md:flex-initial">
                <Button size="lg" className="w-full">Back To Home</Button>
              </Link>
              <Link href="/contact" className="flex-1 md:flex-initial">
                <Button size="lg" variant="outline" className="w-full">Contact</Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
      </div>
    </div>
  )
}
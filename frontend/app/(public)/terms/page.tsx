'use client'

import { Container } from '@/components/ui/Container'
import { useI18n } from '@/lib/i18n/context'
import { Scale, User, Ban, Copyright, CreditCard, AlertTriangle, Shield, Lock, Globe, Bell, BookOpen, Mail } from 'lucide-react'
import React from 'react'

/* ─── Reusable Section Header ─── */
function SectionHeader({ icon: Icon, number, title }: { icon: React.ElementType; number: number; title: string }) {
  return (
    <div className="flex items-start gap-4 mb-5 pb-4 border-b border-border/50">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mt-0.5">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-500/60 mb-0.5 block">
          {String(number).padStart(2, '0')}
        </span>
        <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">{title}</h2>
      </div>
    </div>
  )
}

/* ─── Styled List ─── */
function StyledList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
          <span className="text-muted-foreground leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

const TOC_ITEMS = [
  { id: 'section1', icon: Scale },
  { id: 'section2', icon: BookOpen },
  { id: 'section3', icon: User },
  { id: 'section4', icon: Ban },
  { id: 'section5', icon: Copyright },
  { id: 'section6', icon: CreditCard },
  { id: 'section7', icon: AlertTriangle },
  { id: 'section8', icon: Shield },
  { id: 'section9', icon: Lock },
  { id: 'section10', icon: Globe },
  { id: 'section11', icon: Bell },
]

export default function TermsPage() {
  const { t } = useI18n()

  const tocTitles: Record<string, string> = {
    section1: t('terms.section1Title'),
    section2: t('terms.section2Title'),
    section3: t('terms.section3Title'),
    section4: t('terms.section4Title'),
    section5: t('terms.section5Title'),
    section6: t('terms.section6Title'),
    section7: t('terms.section7Title'),
    section8: t('terms.section8Title'),
    section9: t('terms.section9Title'),
    section10: t('terms.section10Title'),
    section11: t('terms.section11Title'),
  }

  return (
    <div className="min-h-screen bg-mesh-muted">
      {/* ─── Hero ─── */}
      <div className="bento-featured noise-overlay">
        <Container variant="public" className="py-10 md:py-14 relative z-10">
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
              <Scale className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-1">Legal</p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{t('terms.title')}</h1>
              <p className="text-blue-200/50 mt-1 text-sm">{t('terms.lastUpdated')}</p>
            </div>
          </div>
        </Container>
      </div>

      {/* ─── Content ─── */}
      <Container variant="public" className="py-10 md:py-14">
        <div className="flex gap-8 lg:gap-12 items-start">

          {/* Sticky TOC — desktop only */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-24 self-start">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary px-2 mb-3">Contents</p>
              <nav className="space-y-0.5">
                {TOC_ITEMS.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-blue-500/5 transition-colors group"
                    >
                      <span className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        {i + 1}
                      </span>
                      <span className="truncate text-xs">{tocTitles[item.id]}</span>
                    </a>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-4">

            <section id="section1" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Scale} number={1} title={t('terms.section1Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section1Content')}</p>
            </section>

            <section id="section2" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={BookOpen} number={2} title={t('terms.section2Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section2Content')}</p>
            </section>

            <section id="section3" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={User} number={3} title={t('terms.section3Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section3Intro')}</p>
              <StyledList items={[
                t('terms.section3List1'),
                t('terms.section3List2'),
                t('terms.section3List3'),
                t('terms.section3List4'),
              ]} />
            </section>

            <section id="section4" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Ban} number={4} title={t('terms.section4Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section4Intro')}</p>
              <StyledList items={[
                t('terms.section4List1'),
                t('terms.section4List2'),
                t('terms.section4List3'),
                t('terms.section4List4'),
                t('terms.section4List5'),
              ]} />
            </section>

            <section id="section5" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Copyright} number={5} title={t('terms.section5Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section5Intro')}</p>
              <StyledList items={[
                t('terms.section5List1'),
                t('terms.section5List2'),
                t('terms.section5List3'),
                t('terms.section5List4'),
              ]} />
            </section>

            <section id="section6" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={CreditCard} number={6} title={t('terms.section6Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section6Intro')}</p>
              <StyledList items={[
                t('terms.section6List1'),
                t('terms.section6List2'),
                t('terms.section6List3'),
                t('terms.section6List4'),
                t('terms.section6List5'),
              ]} />
            </section>

            <section id="section7" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={AlertTriangle} number={7} title={t('terms.section7Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section7Content')}</p>
            </section>

            <section id="section8" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Shield} number={8} title={t('terms.section8Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section8Content')}</p>
            </section>

            <section id="section9" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Lock} number={9} title={t('terms.section9Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section9Content')}</p>
            </section>

            <section id="section10" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Globe} number={10} title={t('terms.section10Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section10Content')}</p>
            </section>

            <section id="section11" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Bell} number={11} title={t('terms.section11Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('terms.section11Content')}</p>
            </section>

            {/* Disclaimer */}
            <div className="rounded-2xl p-[1.5px] bg-gradient-to-r from-blue-500/40 to-blue-700/40">
              <div className="rounded-2xl bg-background/80 backdrop-blur-sm p-6 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.disclaimer')}</p>
              </div>
            </div>

          </main>
        </div>
      </Container>
    </div>
  )
}

'use client'

import { Container } from '@/components/ui/Container'
import { useI18n } from '@/lib/i18n/context'
import { Shield, Database, Share2, Settings, Lock, Clock, UserCheck, Cookie, Baby, Globe, RefreshCw, Mail, Eye } from 'lucide-react'
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

/* ─── Subsection header (h3) ─── */
function SubHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm md:text-base font-semibold text-foreground mt-5 mb-2 pl-3 border-l-2 border-blue-500/40">
      {title}
    </h3>
  )
}

/* ─── Styled List ─── */
function StyledList({ items }: { items: (string | React.ReactNode)[] }) {
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

/* ─── Third-party service pill ─── */
function ServiceItem({ name, desc }: { name: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
      <span className="text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">{name}:</span> {desc}
      </span>
    </li>
  )
}

/* ─── Right item (bolded key + value) ─── */
function RightItem({ text }: { text: string }) {
  const [key, ...rest] = text.split(':')
  const value = rest.join(':').trim()
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
      <span className="text-muted-foreground leading-relaxed">
        {value ? <><span className="font-semibold text-foreground">{key}:</span> {value}</> : <>{key}</>}
      </span>
    </li>
  )
}

const TOC_ITEMS = [
  { id: 'section1', icon: Eye },
  { id: 'section2', icon: Database },
  { id: 'section3', icon: Settings },
  { id: 'section4', icon: Share2 },
  { id: 'section5', icon: Globe },
  { id: 'section6', icon: Lock },
  { id: 'section7', icon: Clock },
  { id: 'section8', icon: UserCheck },
  { id: 'section9', icon: Cookie },
  { id: 'section10', icon: Baby },
  { id: 'section11', icon: Globe },
  { id: 'section12', icon: RefreshCw },
  { id: 'section13', icon: Mail },
]

export default function PrivacyPage() {
  const { t } = useI18n()

  const tocTitles: Record<string, string> = {
    section1: t('privacy.section1Title'),
    section2: t('privacy.section2Title'),
    section3: t('privacy.section3Title'),
    section4: t('privacy.section4Title'),
    section5: t('privacy.section5Title'),
    section6: t('privacy.section6Title'),
    section7: t('privacy.section7Title'),
    section8: t('privacy.section8Title'),
    section9: t('privacy.section9Title'),
    section10: t('privacy.section10Title'),
    section11: t('privacy.section11Title'),
    section12: t('privacy.section12Title'),
    section13: t('privacy.section13Title'),
  }

  return (
    <div className="min-h-screen bg-mesh-muted">
      {/* ─── Hero ─── */}
      <div className="bento-featured noise-overlay">
        <Container variant="public" className="py-10 md:py-14 relative z-10">
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-1">Legal</p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{t('privacy.title')}</h1>
              <p className="text-blue-200/50 mt-1 text-sm">{t('privacy.lastUpdated')}</p>
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
              <SectionHeader icon={Eye} number={1} title={t('privacy.section1Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section1Content')}</p>
            </section>

            <section id="section2" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Database} number={2} title={t('privacy.section2Title')} />
              <SubHeader title={t('privacy.personalInfoTitle')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.personalInfoIntro')}</p>
              <StyledList items={[
                t('privacy.personalInfoList1'),
                t('privacy.personalInfoList2'),
                t('privacy.personalInfoList3'),
                t('privacy.personalInfoList4'),
                t('privacy.personalInfoList5'),
              ]} />
              <SubHeader title={t('privacy.usageInfoTitle')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.usageInfoIntro')}</p>
              <StyledList items={[
                t('privacy.usageInfoList1'),
                t('privacy.usageInfoList2'),
                t('privacy.usageInfoList3'),
                t('privacy.usageInfoList4'),
                t('privacy.usageInfoList5'),
              ]} />
              <SubHeader title={t('privacy.aiInfoTitle')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.aiInfoContent')}</p>
            </section>

            <section id="section3" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Settings} number={3} title={t('privacy.section3Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section3Intro')}</p>
              <StyledList items={[
                t('privacy.section3List1'),
                t('privacy.section3List2'),
                t('privacy.section3List3'),
                t('privacy.section3List4'),
                t('privacy.section3List5'),
                t('privacy.section3List6'),
                t('privacy.section3List7'),
              ]} />
            </section>

            <section id="section4" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Share2} number={4} title={t('privacy.section4Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section4Intro')}</p>
              <StyledList items={[
                t('privacy.section4List1'),
                t('privacy.section4List2'),
                t('privacy.section4List3'),
                t('privacy.section4List4'),
                t('privacy.section4List5'),
              ]} />
            </section>

            <section id="section5" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Globe} number={5} title={t('privacy.section5Title')} />
              <p className="text-muted-foreground leading-relaxed mb-3">{t('privacy.section5Intro')}</p>
              <ul className="space-y-2">
                <ServiceItem name="Stripe" desc={t('privacy.section5Stripe').replace('Stripe: ', '')} />
                <ServiceItem name="Google OAuth" desc={t('privacy.section5Google').replace('Google OAuth: ', '')} />
                <ServiceItem name="GitHub OAuth" desc={t('privacy.section5GitHub').replace('GitHub OAuth: ', '')} />
                <ServiceItem name="Microsoft OAuth" desc={t('privacy.section5Microsoft').replace('Microsoft OAuth: ', '')} />
                <ServiceItem name="Anthropic Claude" desc={t('privacy.section5Anthropic').replace('Anthropic Claude: ', '')} />
                <ServiceItem name="YouTube" desc={t('privacy.section5YouTube').replace('YouTube: ', '')} />
                <ServiceItem name="Cloudflare" desc={t('privacy.section5Cloudflare').replace('Cloudflare: ', '')} />
              </ul>
            </section>

            <section id="section6" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Lock} number={6} title={t('privacy.section6Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section6Content')}</p>
            </section>

            <section id="section7" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Clock} number={7} title={t('privacy.section7Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section7Content')}</p>
            </section>

            <section id="section8" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={UserCheck} number={8} title={t('privacy.section8Title')} />
              <p className="text-muted-foreground leading-relaxed mb-3">{t('privacy.section8Intro')}</p>
              <ul className="space-y-2">
                <RightItem text={t('privacy.section8Access')} />
                <RightItem text={t('privacy.section8Rectification')} />
                <RightItem text={t('privacy.section8Erasure')} />
                <RightItem text={t('privacy.section8Portability')} />
                <RightItem text={t('privacy.section8Objection')} />
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">{t('privacy.section8Contact')}</p>
            </section>

            <section id="section9" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Cookie} number={9} title={t('privacy.section9Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section9Intro')}</p>
              <StyledList items={[
                t('privacy.section9List1'),
                t('privacy.section9List2'),
                t('privacy.section9List3'),
                t('privacy.section9List4'),
              ]} />
              <p className="text-muted-foreground leading-relaxed mt-4">{t('privacy.section9Note')}</p>
            </section>

            <section id="section10" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Baby} number={10} title={t('privacy.section10Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section10Content')}</p>
            </section>

            <section id="section11" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Globe} number={11} title={t('privacy.section11Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section11Content')}</p>
            </section>

            <section id="section12" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={RefreshCw} number={12} title={t('privacy.section12Title')} />
              <p className="text-muted-foreground leading-relaxed">{t('privacy.section12Content')}</p>
            </section>

            <section id="section13" className="glass-card rounded-2xl p-6 md:p-7">
              <SectionHeader icon={Mail} number={13} title={t('privacy.section13Title')} />
              <p className="text-muted-foreground leading-relaxed mb-3">{t('privacy.section13Intro')}</p>
              <ul className="space-y-2">
                <RightItem text={t('privacy.section13Email')} />
                <RightItem text={t('privacy.section13Address')} />
              </ul>
            </section>

            {/* Disclaimer */}
            <div className="rounded-2xl p-[1.5px] bg-gradient-to-r from-blue-500/40 to-blue-700/40">
              <div className="rounded-2xl bg-background/80 backdrop-blur-sm p-6 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('privacy.disclaimer')}</p>
              </div>
            </div>

          </main>
        </div>
      </Container>
    </div>
  )
}

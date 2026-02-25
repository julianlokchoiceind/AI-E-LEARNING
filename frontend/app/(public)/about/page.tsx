'use client'

import { Container } from '@/components/ui/Container'
import { HeroSection } from '@/components/ui/HeroSection'
import { useI18n } from '@/lib/i18n/context'
import { Bot, GraduationCap, TrendingUp, Globe, Mail, ArrowRight, Star, BarChart2, BookOpen, Cpu, Layers, Zap, Code2, Binary, Braces } from 'lucide-react'

/* ─── Scrolling code content per card ─── */
const AI_CODE_LINES = [
  'import anthropic',
  'client = Anthropic()',
  'model = "claude-sonnet-4"',
  'response = client.messages',
  '  .create(model=model,',
  '    max_tokens=1024,',
  '    messages=[{"role":',
  '    "user", "content":',
  '    question}])',
  'print(response.content)',
  '# AI Study Buddy online',
  'accuracy = 0.97',
  'loss = 0.023',
  'for epoch in range(100):',
  '  model.train(batch)',
  '  optimizer.step()',
  'torch.save(model, "best")',
  'embeddings = encode(text)',
  'similarity = cosine(a, b)',
  'rag_context = retrieve(q)',
]

const EXPERT_CODE_LINES = [
  '<Course>',
  '  <Lesson id="01">',
  '    <Video src="intro.mp4"',
  '      duration="12:34" />',
  '    <Quiz questions={8} />',
  '    <Certificate />',
  '  </Lesson>',
  '  <Lesson id="02">',
  '    <Video src="deep.mp4"',
  '      duration="24:10" />',
  '  </Lesson>',
  '</Course>',
  'const instructor = {',
  '  name: "Expert",',
  '  courses: 12,',
  '  students: 4820,',
  '  rating: 4.9',
  '}',
  'export default Course',
]

const PROGRESS_CODE_LINES = [
  'analytics.track({',
  '  event: "lesson_done",',
  '  duration: 840,',
  '  score: 96,',
  '})',
  'streak = 14 // days',
  'completed = 23 // lessons',
  'badge = "AI Pioneer"',
  'progress.update({',
  '  course: "LLM Basics",',
  '  percent: 78,',
  '  xp: +150',
  '})',
  'certificate.generate()',
  'rank = leaderboard[3]',
  'next_lesson = schedule[0]',
]

/* ─── Scrolling Code Animation Component ─── */
function CodeScroller({ lines, speed = 20 }: { lines: string[]; speed?: number }) {
  const doubled = [...lines, ...lines]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div
        className="font-mono text-[11px] leading-6 whitespace-pre opacity-[0.13]"
        style={{ animation: `about-code-scroll ${speed}s linear infinite` }}
      >
        {doubled.map((line, i) => (
          <div key={i} className="px-4 text-blue-200">{line}</div>
        ))}
      </div>
      {/* fade top & bottom */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0f172a] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0f172a] to-transparent" />
    </div>
  )
}

/* ─── Floating icon bg for light cards ─── */
function FloatingIcons({ icons }: { icons: React.ElementType[] }) {
  const positions = [
    { top: '10%', right: '10%', size: 48, delay: '0s', dur: '6s' },
    { top: '55%', right: '20%', size: 32, delay: '2s', dur: '8s' },
    { top: '25%', right: '40%', size: 24, delay: '4s', dur: '7s' },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {icons.map((Icon, i) => {
        const pos = positions[i % positions.length]
        return (
          <Icon
            key={i}
            style={{
              position: 'absolute',
              top: pos.top,
              right: pos.right,
              width: pos.size,
              height: pos.size,
              opacity: 0.06,
              animationDelay: pos.delay,
              animationDuration: pos.dur,
              animation: `about-icon-float ${pos.dur} ease-in-out ${pos.delay} infinite alternate`,
            }}
          />
        )
      })}
    </div>
  )
}

const STATS = [
  { value: '50+', labelKey: 'about.statCourses' },
  { value: '10K+', labelKey: 'about.statLearners' },
  { value: '24/7', labelKey: 'about.statSupport' },
  { value: '4.9★', labelKey: 'about.statRating' },
]

export default function AboutPage() {
  const { t } = useI18n()

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes about-code-scroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes about-icon-float {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-8px, -16px) scale(1.08); }
        }
        @keyframes about-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes about-pulse-scale {
          0%, 100% { transform: scale(1);    opacity: 0.07; }
          50%       { transform: scale(1.15); opacity: 0.12; }
        }
      `}</style>

      <div className="min-h-screen bg-mesh-gradient">

        {/* ─── Hero ─── */}
        <HeroSection
          title={t('about.heroTitle')}
          subtitle={t('about.heroSubtitle')}
          align="center"
          size="md"
          backgroundImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&h=600&fit=crop"
          tabletImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1024&h=400&fit=crop"
          mobileImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=768&h=300&fit=crop"
          overlayOpacity={0.55}
        />

        {/* ─── Stats Strip ─── */}
        <div className="border-b border-blue-500/10 bg-background/80 backdrop-blur-sm">
          <Container variant="public">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-blue-500/10">
              {STATS.map((stat) => (
                <div key={stat.value} className="py-6 px-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold gradient-text-bold">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">{t(stat.labelKey as any)}</div>
                </div>
              ))}
            </div>
          </Container>
        </div>

        {/* ─── Mission ─── */}
        <Container variant="public" className="py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
                {t('about.missionTitle')}
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {t('about.missionHeadline') || 'Education that'}{' '}
                <span className="gradient-text-bold">{t('about.missionHeadlineHighlight') || 'moves with AI'}</span>
              </h2>
            </div>
            <div className="relative">
              <div
                className="absolute -left-6 top-0 bottom-0 w-[3px] rounded-full"
                style={{ background: 'linear-gradient(to bottom, #60a5fa, #2563eb, transparent)' }}
              />
              <p className="text-lg text-muted-foreground leading-relaxed pl-4">
                {t('about.missionDescription')}
              </p>
            </div>
          </div>
        </Container>

        <div className="section-divider-gradient mx-auto max-w-5xl" />

        {/* ─── What Makes Us Different ─── */}
        <div className="bg-mesh-muted noise-overlay">
          <Container variant="public" className="py-16 md:py-24 relative z-10">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
                {t('about.differentTitle')}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                {t('about.differentHeadline') || 'Built different,'}{' '}
                <span className="gradient-text-bold">{t('about.differentHeadlineHighlight') || 'by design'}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── AI Study Buddy – featured dark card with scrolling code + Bot bg ── */}
              <div className="md:row-span-2 bento-featured rounded-xl overflow-hidden relative flex flex-col justify-end text-white group border border-white/[0.06] hover:border-blue-400/30 transition-colors duration-300 min-h-[340px]">
                {/* Scrolling code bg */}
                <CodeScroller lines={AI_CODE_LINES} speed={22} />
                {/* Large rotating CPU icon */}
                <Cpu
                  style={{
                    position: 'absolute', top: '12%', right: '8%',
                    width: 120, height: 120,
                    opacity: 0.07,
                    animation: 'about-spin-slow 20s linear infinite',
                    color: '#60a5fa',
                  }}
                />
                <Binary
                  style={{
                    position: 'absolute', top: '40%', left: '5%',
                    width: 56, height: 56,
                    opacity: 0.08,
                    animation: 'about-icon-float 9s ease-in-out 1s infinite alternate',
                    color: '#60a5fa',
                  }}
                />
                {/* Content */}
                <div className="relative z-10 p-8">
                  <div className="inline-flex p-3 rounded-lg bg-blue-500/20 mb-6 w-fit group-hover:scale-110 transition-transform duration-200">
                    <Bot className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{t('about.featureAI' as any)}</h3>
                  <p className="text-blue-100/80 leading-relaxed">{t('about.featureAIDesc' as any)}</p>
                </div>
              </div>

              {/* ── Expert Content – glass card ── */}
              <div className="glass-card rounded-xl overflow-hidden relative group min-h-[160px] flex flex-col justify-end transition-all duration-300">
                {/* Scrolling code */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                  <div
                    className="font-mono text-[11px] leading-6 whitespace-pre"
                    style={{ animation: 'about-code-scroll 18s linear infinite', opacity: 0.06, color: '#3b82f6' }}
                  >
                    {[...EXPERT_CODE_LINES, ...EXPERT_CODE_LINES].map((line, i) => (
                      <div key={i} className="px-4">{line}</div>
                    ))}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-900/50 dark:to-transparent" />
                </div>
                {/* Floating icons */}
                <GraduationCap style={{ position: 'absolute', top: '10%', right: '8%', width: 64, height: 64, opacity: 0.07, animation: 'about-pulse-scale 5s ease-in-out infinite', color: '#3b82f6' }} />
                <BookOpen style={{ position: 'absolute', top: '50%', right: '25%', width: 32, height: 32, opacity: 0.05, animation: 'about-icon-float 7s ease-in-out 1s infinite alternate', color: '#3b82f6' }} />
                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="inline-flex p-3 rounded-lg bg-blue-500/15 mb-4 w-fit group-hover:scale-110 transition-transform duration-200">
                    <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{t('about.featureExpert' as any)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t('about.featureExpertDesc' as any)}</p>
                </div>
              </div>

              {/* ── Progress Tracking – glass card ── */}
              <div className="glass-card rounded-xl overflow-hidden relative group min-h-[160px] flex flex-col justify-end transition-all duration-300">
                {/* Scrolling code */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                  <div
                    className="font-mono text-[11px] leading-6 whitespace-pre"
                    style={{ animation: 'about-code-scroll 14s linear infinite', opacity: 0.06, color: '#3b82f6' }}
                  >
                    {[...PROGRESS_CODE_LINES, ...PROGRESS_CODE_LINES].map((line, i) => (
                      <div key={i} className="px-4">{line}</div>
                    ))}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-900/50 dark:to-transparent" />
                </div>
                {/* Floating icons */}
                <TrendingUp style={{ position: 'absolute', top: '10%', right: '8%', width: 64, height: 64, opacity: 0.07, animation: 'about-pulse-scale 6s ease-in-out 1s infinite', color: '#3b82f6' }} />
                <BarChart2 style={{ position: 'absolute', top: '50%', right: '30%', width: 28, height: 28, opacity: 0.05, animation: 'about-icon-float 8s ease-in-out 3s infinite alternate', color: '#3b82f6' }} />
                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="inline-flex p-3 rounded-lg bg-blue-500/15 mb-4 w-fit group-hover:scale-110 transition-transform duration-200">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{t('about.featureProgress' as any)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t('about.featureProgressDesc' as any)}</p>
                </div>
              </div>

              {/* ── Vietnamese Focus – glass card full width ── */}
              <div className="glass-card md:col-span-2 rounded-xl p-6 relative overflow-hidden group transition-all duration-300">
                <Layers style={{ position: 'absolute', right: '3%', top: '50%', transform: 'translateY(-50%)', width: 80, height: 80, opacity: 0.06, color: '#3b82f6', animation: 'about-icon-float 10s ease-in-out infinite alternate' }} />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="inline-flex p-3 rounded-lg bg-blue-500/15 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{t('about.featureVietnam' as any)}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t('about.featureVietnamDesc' as any)}</p>
                  </div>
                </div>
              </div>

            </div>
          </Container>
        </div>

        <div className="section-divider-gradient mx-auto max-w-5xl" />

        {/* ─── Contact CTA ─── */}
        <Container variant="public" className="py-16 md:py-24">
          <div className="rounded-2xl p-[2px] bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="rounded-2xl bg-background p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10">
                <Mail className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('about.contactTitle')}</h2>
                <p className="text-muted-foreground">{t('about.contactDescription')}</p>
              </div>
              <a
                href="mailto:info@choiceind.com"
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity group bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                info@choiceind.com
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </Container>

      </div>
    </>
  )
}

'use client'

import React from 'react'
import { GraduationCap, Bot, TrendingUp, LucideIcon, BookOpen, Cpu, Binary, BarChart2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { TranslationKey } from '@/lib/i18n/utils'

interface Feature {
  id: number
  icon: LucideIcon
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  iconBg: string
  iconColor: string
  featured?: boolean
  accentGradient?: string
}

const features: Feature[] = [
  {
    id: 1,
    icon: GraduationCap,
    titleKey: 'homepage.featureQualityCourses',
    descriptionKey: 'homepage.featureQualityCoursesDesc',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    featured: true
  },
  {
    id: 2,
    icon: Bot,
    titleKey: 'homepage.featureAIBuddy',
    descriptionKey: 'homepage.featureAIBuddyDesc',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 3,
    icon: TrendingUp,
    titleKey: 'homepage.featureTrackProgress',
    descriptionKey: 'homepage.featureTrackProgressDesc',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  }
]

const COURSE_CODE_LINES = [
  '<Course id="llm-101">',
  '  <Instructor verified />',
  '  <Lesson src="intro.mp4"',
  '    duration="14:22" />',
  '  <Quiz questions={10} />',
  '  <Certificate auto />',
  '</Course>',
  'const course = await',
  '  Course.findById(id)',
  'rating = 4.9',
  'students = 4820',
  'export default Course',
  '<Video hd quality="4K" />',
  '<Subtitle lang="vi" />',
  'completion_rate = 0.94',
]

const AI_CODE_LINES = [
  'import anthropic',
  'client = Anthropic()',
  'model = "claude-sonnet-4"',
  'response = client.messages',
  '  .create(model=model,',
  '    messages=[{"role":',
  '    "user", "content":',
  '    question}])',
  'print(response.content)',
  'accuracy = 0.97',
  'embeddings = encode(text)',
  'rag_context = retrieve(q)',
  'similarity = cosine(a,b)',
]

const PROGRESS_CODE_LINES = [
  'analytics.track({',
  '  event: "lesson_done",',
  '  duration: 840,',
  '  score: 96,',
  '})',
  'streak = 14 // days',
  'completed = 23',
  'badge = "AI Pioneer"',
  'progress.update({',
  '  percent: 78,',
  '  xp: +150',
  '})',
  'certificate.generate()',
  'rank = leaderboard[3]',
]

function CodeScroller({ lines, color, speed = 20 }: { lines: string[]; color: string; speed?: number }) {
  const doubled = [...lines, ...lines]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div
        className="font-mono text-[11px] leading-6 whitespace-pre"
        style={{
          animation: `features-code-scroll ${speed}s linear infinite`,
          color,
          opacity: 0.08,
        }}
      >
        {doubled.map((line, i) => (
          <div key={i} className="px-4">{line}</div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f172a] to-transparent" />
    </div>
  )
}

export function FeaturesSection() {
  const { t } = useI18n()
  const featured = features.find(f => f.featured)
  const others = features.filter(f => !f.featured)

  return (
    <>
      <style>{`
        @keyframes features-code-scroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes features-icon-float {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-8px, -14px) scale(1.08); }
        }
        @keyframes features-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes features-pulse-scale {
          0%, 100% { transform: scale(1);    opacity: 0.06; }
          50%       { transform: scale(1.15); opacity: 0.11; }
        }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Featured card - Quality Courses - bento dark with course code */}
        {featured && (
          <div className="md:row-span-2 bento-featured rounded-xl overflow-hidden relative flex flex-col justify-end text-white group border border-white/[0.06] hover:border-blue-400/30 transition-colors duration-300 min-h-[300px]">
            {/* Scrolling code */}
            <CodeScroller lines={COURSE_CODE_LINES} color="#93c5fd" speed={20} />
            {/* Background icons */}
            <Cpu style={{ position: 'absolute', top: '10%', right: '8%', width: 110, height: 110, opacity: 0.07, color: '#60a5fa', animation: 'features-spin-slow 22s linear infinite' }} />
            <BookOpen style={{ position: 'absolute', top: '42%', left: '6%', width: 48, height: 48, opacity: 0.07, color: '#60a5fa', animation: 'features-icon-float 9s ease-in-out 1.5s infinite alternate' }} />
            {/* Content */}
            <div className="relative z-10 p-8">
              <div className={`inline-flex p-3 rounded-lg ${featured.iconBg} mb-4 w-fit group-hover:scale-110 transition-transform duration-200`}>
                <featured.icon className={`w-6 h-6 ${featured.iconColor}`} />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t(featured.titleKey)}</h3>
              <p className="text-blue-100/80">{t(featured.descriptionKey)}</p>
            </div>
          </div>
        )}

        {/* AI Buddy card - glass */}
        <div className="glass-card rounded-xl p-6 group relative overflow-hidden transition-all duration-300">
          {/* Scrolling code */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div
              className="font-mono text-[11px] leading-6 whitespace-pre"
              style={{ animation: 'features-code-scroll 16s linear infinite', color: '#3b82f6', opacity: 0.06 }}
            >
              {[...AI_CODE_LINES, ...AI_CODE_LINES].map((line, i) => (
                <div key={i} className="px-4">{line}</div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-900/50 dark:to-transparent" />
          </div>
          {/* Background icons */}
          <Bot style={{ position: 'absolute', top: '10%', right: '8%', width: 56, height: 56, opacity: 0.07, color: '#3b82f6', animation: 'features-pulse-scale 5s ease-in-out infinite' }} />
          <Binary style={{ position: 'absolute', bottom: '20%', right: '20%', width: 28, height: 28, opacity: 0.05, color: '#3b82f6', animation: 'features-icon-float 7s ease-in-out 2s infinite alternate' }} />
          {/* Content */}
          <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-lg ${features[1].iconBg} mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <Bot className={`w-6 h-6 ${features[1].iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t(features[1].titleKey)}</h3>
            <p className="text-muted-foreground">{t(features[1].descriptionKey)}</p>
          </div>
        </div>

        {/* Progress Tracking card - glass */}
        <div className="glass-card rounded-xl p-6 group relative overflow-hidden transition-all duration-300">
          {/* Scrolling code */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div
              className="font-mono text-[11px] leading-6 whitespace-pre"
              style={{ animation: 'features-code-scroll 18s linear infinite', color: '#3b82f6', opacity: 0.06 }}
            >
              {[...PROGRESS_CODE_LINES, ...PROGRESS_CODE_LINES].map((line, i) => (
                <div key={i} className="px-4">{line}</div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-900/50 dark:to-transparent" />
          </div>
          {/* Background icons */}
          <TrendingUp style={{ position: 'absolute', top: '10%', right: '8%', width: 56, height: 56, opacity: 0.07, color: '#3b82f6', animation: 'features-pulse-scale 6s ease-in-out 1s infinite' }} />
          <BarChart2 style={{ position: 'absolute', bottom: '20%', right: '22%', width: 28, height: 28, opacity: 0.05, color: '#3b82f6', animation: 'features-icon-float 8s ease-in-out 3s infinite alternate' }} />
          {/* Content */}
          <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-lg ${features[2].iconBg} mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <TrendingUp className={`w-6 h-6 ${features[2].iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t(features[2].titleKey)}</h3>
            <p className="text-muted-foreground">{t(features[2].descriptionKey)}</p>
          </div>
        </div>

      </div>
    </>
  )
}

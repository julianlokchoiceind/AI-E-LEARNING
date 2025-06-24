# 🌍 INTERNATIONALIZATION (i18n) IMPLEMENTATION PLAN

## 📋 **OVERVIEW**
Complete implementation guide for multi-language support covering Vietnamese and English, with architecture for future language expansion.

**Complexity:** Medium  
**Priority:** Phase 2-3  
**Languages:** Vietnamese (primary), English  

---

## 🎯 **i18n REQUIREMENTS FROM CLAUDE.md**

### **Language Support:**
- Vietnamese (vi) - Primary language
- English (en) - Secondary language
- User preference storage
- Automatic language detection
- Content translation workflow
- Multi-language course content

### **Localization Scope:**
- UI elements and navigation
- Course content (titles, descriptions)
- System messages and errors
- Email templates
- Date/time formatting
- Currency display
- Number formatting

---

## 🏗️ **i18n ARCHITECTURE**

### **Frontend Structure (NextJS):**
```
frontend/
├── public/locales/
│   ├── vi/
│   │   ├── common.json        # Common UI elements
│   │   ├── auth.json          # Authentication
│   │   ├── course.json        # Course-related
│   │   ├── payment.json       # Payment/billing
│   │   ├── dashboard.json     # Dashboard
│   │   ├── errors.json        # Error messages
│   │   └── emails.json        # Email templates
│   └── en/
│       └── [same structure]
├── lib/i18n/
│   ├── config.ts              # i18n configuration
│   ├── utils.ts               # Helper functions
│   └── hooks.ts               # Custom hooks
└── middleware.ts              # Language detection
```

---

## 📁 **TRANSLATION FILES**

### **Vietnamese Common (vi/common.json):**
```json
{
  "navigation": {
    "home": "Trang chủ",
    "courses": "Khóa học",
    "my_learning": "Học tập của tôi",
    "dashboard": "Bảng điều khiển",
    "profile": "Hồ sơ",
    "logout": "Đăng xuất"
  },
  "buttons": {
    "save": "Lưu",
    "cancel": "Hủy",
    "continue": "Tiếp tục",
    "back": "Quay lại",
    "next": "Tiếp theo",
    "submit": "Gửi",
    "delete": "Xóa",
    "edit": "Chỉnh sửa",
    "view": "Xem",
    "download": "Tải xuống"
  },
  "status": {
    "loading": "Đang tải...",
    "saving": "Đang lưu...",
    "success": "Thành công",
    "error": "Lỗi",
    "processing": "Đang xử lý..."
  },
  "time": {
    "minutes": "phút",
    "hours": "giờ",
    "days": "ngày",
    "weeks": "tuần",
    "months": "tháng",
    "ago": "trước",
    "remaining": "còn lại"
  }
}
```

### **Vietnamese Course (vi/course.json):**
```json
{
  "catalog": {
    "title": "Danh mục khóa học",
    "search_placeholder": "Tìm kiếm khóa học...",
    "filters": {
      "category": "Danh mục",
      "level": "Cấp độ",
      "price": "Giá",
      "free": "Miễn phí",
      "paid": "Có phí"
    },
    "levels": {
      "beginner": "Người mới bắt đầu",
      "intermediate": "Trung cấp",
      "advanced": "Nâng cao"
    },
    "categories": {
      "programming": "Lập trình cơ bản",
      "ai_fundamentals": "AI cơ bản",
      "machine_learning": "Học máy",
      "ai_tools": "Công cụ AI",
      "production_ai": "AI sản xuất"
    }
  },
  "details": {
    "overview": "Tổng quan",
    "curriculum": "Nội dung",
    "instructor": "Giảng viên",
    "reviews": "Đánh giá",
    "enroll": "Đăng ký học",
    "enrolled": "Đã đăng ký",
    "start_learning": "Bắt đầu học",
    "continue_learning": "Tiếp tục học",
    "duration": "Thời lượng",
    "lessons": "Bài học",
    "students": "Học viên",
    "language": "Ngôn ngữ",
    "last_updated": "Cập nhật lần cuối",
    "requirements": "Yêu cầu",
    "description": "Mô tả",
    "what_you_learn": "Bạn sẽ học được gì"
  },
  "player": {
    "complete_lesson": "Hoàn thành bài học",
    "next_lesson": "Bài tiếp theo",
    "previous_lesson": "Bài trước",
    "take_quiz": "Làm bài kiểm tra",
    "resources": "Tài liệu",
    "transcript": "Phụ đề",
    "notes": "Ghi chú",
    "ask_ai": "Hỏi AI"
  },
  "progress": {
    "completed": "Đã hoàn thành",
    "in_progress": "Đang học",
    "not_started": "Chưa bắt đầu",
    "locked": "Đã khóa",
    "unlock_previous": "Hoàn thành bài trước để mở khóa"
  }
}
```

### **Vietnamese Payment (vi/payment.json):**
```json
{
  "pricing": {
    "title": "Chọn gói phù hợp",
    "monthly": "Hàng tháng",
    "yearly": "Hàng năm",
    "save": "Tiết kiệm {{percent}}%",
    "course_price": "{{price}}đ",
    "free": "Miễn phí",
    "pro_plan": "Gói Pro",
    "pro_description": "Truy cập không giới hạn tất cả khóa học",
    "features": {
      "unlimited_courses": "Truy cập không giới hạn",
      "ai_support": "Hỗ trợ AI 24/7",
      "certificates": "Chứng chỉ hoàn thành",
      "offline_download": "Tải về học offline",
      "priority_support": "Hỗ trợ ưu tiên"
    }
  },
  "checkout": {
    "title": "Thanh toán",
    "order_summary": "Tóm tắt đơn hàng",
    "course": "Khóa học",
    "subtotal": "Tạm tính",
    "discount": "Giảm giá",
    "total": "Tổng cộng",
    "payment_method": "Phương thức thanh toán",
    "card": "Thẻ tín dụng/Ghi nợ",
    "complete_payment": "Hoàn tất thanh toán",
    "processing": "Đang xử lý thanh toán...",
    "secure_payment": "Thanh toán an toàn được mã hóa"
  },
  "success": {
    "title": "Thanh toán thành công!",
    "message": "Cảm ơn bạn đã mua khóa học",
    "access_course": "Truy cập khóa học",
    "receipt_sent": "Biên lai đã được gửi đến email của bạn"
  },
  "errors": {
    "payment_failed": "Thanh toán thất bại",
    "card_declined": "Thẻ bị từ chối",
    "insufficient_funds": "Số dư không đủ",
    "try_again": "Vui lòng thử lại"
  }
}
```

### **Vietnamese Auth (vi/auth.json):**
```json
{
  "login": {
    "title": "Đăng nhập",
    "email": "Email",
    "password": "Mật khẩu",
    "remember_me": "Ghi nhớ đăng nhập",
    "forgot_password": "Quên mật khẩu?",
    "login_button": "Đăng nhập",
    "no_account": "Chưa có tài khoản?",
    "sign_up": "Đăng ký ngay",
    "or_continue_with": "Hoặc tiếp tục với",
    "login_google": "Đăng nhập với Google",
    "login_github": "Đăng nhập với GitHub"
  },
  "register": {
    "title": "Đăng ký tài khoản",
    "full_name": "Họ và tên",
    "email": "Email",
    "password": "Mật khẩu",
    "confirm_password": "Xác nhận mật khẩu",
    "agree_terms": "Tôi đồng ý với điều khoản sử dụng",
    "register_button": "Đăng ký",
    "have_account": "Đã có tài khoản?",
    "sign_in": "Đăng nhập"
  },
  "errors": {
    "invalid_credentials": "Email hoặc mật khẩu không đúng",
    "email_exists": "Email đã được sử dụng",
    "weak_password": "Mật khẩu phải có ít nhất 8 ký tự",
    "passwords_not_match": "Mật khẩu không khớp",
    "email_not_verified": "Vui lòng xác thực email"
  }
}
```

---

## 🔧 **IMPLEMENTATION STEPS**

### **Week 1: NextJS i18n Setup**

#### **Day 1: Install and Configure**
```bash
# Install dependencies
npm install next-i18next react-i18next i18next
npm install @types/react-i18next --save-dev
```

```typescript
// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en'],
    localeDetection: true,
  },
  fallbackLng: 'vi',
  supportedLngs: ['vi', 'en'],
  ns: ['common', 'auth', 'course', 'payment', 'dashboard'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
}
```

#### **Day 2: Setup Middleware**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['vi', 'en']
const defaultLocale = 'vi'

function getLocale(request: NextRequest): string {
  // Check cookie
  const localeCookie = request.cookies.get('NEXT_LOCALE')
  if (localeCookie && locales.includes(localeCookie.value)) {
    return localeCookie.value
  }
  
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language')
  if (acceptLanguage) {
    const detectedLocale = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim())
      .find(lang => locales.includes(lang.substring(0, 2)))
    
    if (detectedLocale) {
      return detectedLocale.substring(0, 2)
    }
  }
  
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if locale is in pathname
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  if (!pathnameHasLocale) {
    const locale = getLocale(request)
    const newUrl = new URL(`/${locale}${pathname}`, request.url)
    
    // Redirect to localized path
    return NextResponse.redirect(newUrl)
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

#### **Day 3: Create Custom Hooks**
```typescript
// lib/i18n/hooks.ts
import { useTranslation as useNextTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

export const useTranslation = (namespace?: string) => {
  return useNextTranslation(namespace || 'common')
}

export const useLanguageSwitcher = () => {
  const router = useRouter()
  const { pathname, asPath, query, locale } = router
  
  const switchLanguage = useCallback((newLocale: string) => {
    // Save preference
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    
    // Update user preference in backend
    fetch('/api/v1/users/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: newLocale })
    })
    
    // Navigate to new locale
    router.push({ pathname, query }, asPath, { locale: newLocale })
  }, [pathname, query, asPath, router])
  
  return {
    currentLocale: locale,
    switchLanguage,
    availableLocales: ['vi', 'en']
  }
}

export const useLocalizedDate = () => {
  const { i18n } = useTranslation()
  
  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(i18n.language, options).format(date)
  }, [i18n.language])
  
  const formatRelativeTime = useCallback((date: Date) => {
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    const daysDiff = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    if (Math.abs(daysDiff) < 1) {
      const hoursDiff = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60))
      return rtf.format(hoursDiff, 'hour')
    }
    
    return rtf.format(daysDiff, 'day')
  }, [i18n.language])
  
  return { formatDate, formatRelativeTime }
}

export const useLocalizedCurrency = () => {
  const { i18n } = useTranslation()
  
  const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
    // Convert USD to VND for Vietnamese
    if (i18n.language === 'vi' && currency === 'USD') {
      const vndAmount = amount * 23000 // Use real exchange rate
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(vndAmount)
    }
    
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency
    }).format(amount)
  }, [i18n.language])
  
  return { formatCurrency }
}
```

#### **Day 4: Language Switcher Component**
```typescript
// components/common/LanguageSwitcher.tsx
import { useLanguageSwitcher } from '@/lib/i18n/hooks'
import { Menu } from '@headlessui/react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

const languages = {
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
  en: { name: 'English', flag: '🇺🇸' }
}

export const LanguageSwitcher: React.FC = () => {
  const { currentLocale, switchLanguage } = useLanguageSwitcher()
  
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
        <GlobeAltIcon className="w-5 h-5" />
        <span>{languages[currentLocale].flag}</span>
        <span className="hidden sm:inline">{languages[currentLocale].name}</span>
      </Menu.Button>
      
      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
        {Object.entries(languages).map(([code, lang]) => (
          <Menu.Item key={code}>
            {({ active }) => (
              <button
                onClick={() => switchLanguage(code)}
                className={`
                  w-full text-left px-4 py-2 flex items-center gap-3
                  ${active ? 'bg-gray-100' : ''}
                  ${currentLocale === code ? 'font-semibold' : ''}
                `}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLocale === code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  )
}
```

### **Week 2: Content Translation System**

#### **Day 1: Multi-language Content Model**
```typescript
// Backend models for multi-language content
interface MultilingualContent {
  vi: string
  en: string
}

interface Course {
  _id: string
  title: MultilingualContent
  description: MultilingualContent
  // ... other fields
}

// Mongoose schema
const multilingualSchema = new Schema({
  vi: { type: String, required: true },
  en: { type: String }
})

const courseSchema = new Schema({
  title: multilingualSchema,
  description: multilingualSchema,
  // ... other fields
})
```

#### **Day 2: Translation Management Interface**
```typescript
// components/creator/TranslationEditor.tsx
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'

interface TranslationEditorProps {
  content: MultilingualContent
  onChange: (content: MultilingualContent) => void
  field: string
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  content,
  onChange,
  field
}) => {
  const { t } = useTranslation('creator')
  const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi')
  
  return (
    <div className="translation-editor">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setActiveTab('vi')}
          className={`px-3 py-1 rounded ${
            activeTab === 'vi' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          🇻🇳 Tiếng Việt
        </button>
        <button
          onClick={() => setActiveTab('en')}
          className={`px-3 py-1 rounded ${
            activeTab === 'en' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          🇺🇸 English
        </button>
      </div>
      
      <div className="translation-content">
        {activeTab === 'vi' ? (
          <textarea
            value={content.vi}
            onChange={(e) => onChange({ ...content, vi: e.target.value })}
            placeholder={t(`fields.${field}.placeholder.vi`)}
            className="w-full p-2 border rounded"
            rows={4}
          />
        ) : (
          <textarea
            value={content.en || ''}
            onChange={(e) => onChange({ ...content, en: e.target.value })}
            placeholder={t(`fields.${field}.placeholder.en`)}
            className="w-full p-2 border rounded"
            rows={4}
          />
        )}
      </div>
      
      {!content.en && activeTab === 'en' && (
        <div className="mt-2 text-sm text-amber-600">
          {t('translation.missing_english')}
        </div>
      )}
    </div>
  )
}
```

#### **Day 3: Auto-Translation Helper**
```typescript
// lib/i18n/auto-translate.ts
import { translate } from '@vitalets/google-translate-api'

export class AutoTranslator {
  async translateContent(
    text: string,
    from: string = 'vi',
    to: string = 'en'
  ): Promise<string> {
    try {
      const result = await translate(text, { from, to })
      return result.text
    } catch (error) {
      console.error('Translation error:', error)
      return ''
    }
  }
  
  async suggestTranslation(content: MultilingualContent): Promise<MultilingualContent> {
    if (content.vi && !content.en) {
      const englishTranslation = await this.translateContent(content.vi, 'vi', 'en')
      return {
        ...content,
        en: englishTranslation
      }
    }
    
    if (content.en && !content.vi) {
      const vietnameseTranslation = await this.translateContent(content.en, 'en', 'vi')
      return {
        ...content,
        vi: vietnameseTranslation
      }
    }
    
    return content
  }
}
```

### **Week 3: Email Templates i18n**

#### **Day 1: Multi-language Email Templates**
```typescript
// backend/services/email/templates/
interface EmailTemplate {
  subject: MultilingualContent
  body: MultilingualContent
}

const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: {
      vi: 'Chào mừng bạn đến với AI E-Learning!',
      en: 'Welcome to AI E-Learning!'
    },
    body: {
      vi: `
        <h1>Xin chào {{name}}!</h1>
        <p>Chào mừng bạn đến với nền tảng học AI hàng đầu Việt Nam.</p>
        <p>Hãy bắt đầu hành trình học tập của bạn ngay hôm nay!</p>
        <a href="{{dashboardUrl}}">Vào trang học tập</a>
      `,
      en: `
        <h1>Hello {{name}}!</h1>
        <p>Welcome to the leading AI learning platform.</p>
        <p>Start your learning journey today!</p>
        <a href="{{dashboardUrl}}">Go to Dashboard</a>
      `
    }
  },
  courseEnrollment: {
    subject: {
      vi: 'Bạn đã đăng ký khóa học {{courseName}}',
      en: 'You have enrolled in {{courseName}}'
    },
    body: {
      vi: `
        <h2>Chúc mừng bạn đã đăng ký thành công!</h2>
        <p>Bạn vừa đăng ký khóa học: <strong>{{courseName}}</strong></p>
        <p>Thời lượng khóa học: {{duration}}</p>
        <a href="{{courseUrl}}">Bắt đầu học ngay</a>
      `,
      en: `
        <h2>Congratulations on your enrollment!</h2>
        <p>You have successfully enrolled in: <strong>{{courseName}}</strong></p>
        <p>Course duration: {{duration}}</p>
        <a href="{{courseUrl}}">Start Learning Now</a>
      `
    }
  }
}

// Email service with i18n
class EmailService {
  async sendEmail(
    to: string,
    templateName: string,
    data: any,
    language: string = 'vi'
  ) {
    const template = emailTemplates[templateName]
    if (!template) throw new Error(`Template ${templateName} not found`)
    
    const subject = this.interpolate(template.subject[language], data)
    const body = this.interpolate(template.body[language], data)
    
    // Send email with localized content
    await this.mailer.send({
      to,
      subject,
      html: body
    })
  }
  
  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match)
  }
}
```

### **Week 4: Testing & Optimization**

#### **Day 1: i18n Testing Suite**
```typescript
// tests/i18n/translation.test.ts
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../test-i18n-config'

describe('Translation Tests', () => {
  it('renders Vietnamese content by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage />
      </I18nextProvider>
    )
    
    expect(screen.getByText('Khóa học')).toBeInTheDocument()
  })
  
  it('switches to English', async () => {
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <HomePage />
      </I18nextProvider>
    )
    
    // Switch language
    await i18n.changeLanguage('en')
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <HomePage />
      </I18nextProvider>
    )
    
    expect(screen.getByText('Courses')).toBeInTheDocument()
  })
})
```

---

## 📊 **TRANSLATION MANAGEMENT**

### **Translation Workflow:**
1. **Content Creation** - Create in primary language (Vietnamese)
2. **Auto-Suggestion** - AI suggests translations
3. **Human Review** - Professional translator reviews
4. **Quality Check** - Native speaker validates
5. **Deployment** - Push to production

### **Translation Dashboard:**
```typescript
// Admin translation overview
interface TranslationStatus {
  totalStrings: number
  translatedStrings: {
    vi: number
    en: number
  }
  missingTranslations: string[]
  lastUpdated: Date
}
```

---

## ✅ **SUCCESS METRICS**

### **i18n Goals:**
- ✅ 100% UI translation coverage
- ✅ < 50ms language switch time
- ✅ SEO-friendly URLs for both languages
- ✅ Proper meta tags for each language
- ✅ RTL support ready (future Arabic)
- ✅ Accessible language switcher

### **Testing Requirements:**
- Unit tests for all translation hooks
- E2E tests for language switching
- Visual regression tests for both languages
- Performance tests for translation loading
- SEO tests for localized URLs

---

## 🚨 **BEST PRACTICES**

1. **Never hardcode text** - Always use translation keys
2. **Namespace organization** - Group related translations
3. **Fallback strategy** - Always have default text
4. **Context awareness** - Same word may need different translations
5. **Number/Date formatting** - Use Intl API
6. **Pluralization** - Handle correctly for each language
7. **Text expansion** - Design for 30% text expansion

This implementation ensures complete internationalization support as specified in CLAUDE.md.
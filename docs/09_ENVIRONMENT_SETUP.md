# 🔧 Environment Setup & Configuration

## 📁 Environment Files Structure (Shared Approach)

```bash
# Project Root Structure - Shared Environment Files
AI-E-LEARNING/
├── frontend/           # NextJS frontend application
├── backend/            # FastAPI backend application
├── .env.local          # Shared development environment (DO NOT COMMIT)
├── .env.production     # Shared production environment (DO NOT COMMIT)
├── .gitignore          # Include .env files
└── README.md           # Project overview
```

**Environment Priority:**
1. `.env.local` (Development - shared by frontend & backend)
2. `.env.production` (Production - shared by frontend & backend)
3. Platform environment variables (Vercel/deployment)

## 🔑 Required Environment Variables

```bash
# ===========================================
# AI E-LEARNING PLATFORM - SHARED ENVIRONMENT
# Frontend + Backend Shared Configuration
# ===========================================

# ---- DATABASE CONFIGURATION ----
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://elearning-admin:rizjez-9rotgy-kacXog@cluster1.wq3m07y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

# ---- AUTHENTICATION (NEXTAUTH) ----
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=qKkozD1CuYtJX59jsg3wOUEg2onqVHi53xq+fHo+vV8=
JWT_SECRET=N9mb4fNnbpOZIdvWaxQ2gGbbm59nUqJDXNaRvLmvPLk=

# ---- AI SERVICE (ANTHROPIC CLAUDE) ----
# Claude 3.5 Sonnet (June 2024) - Optimal balance for AI Study Buddy
ANTHROPIC_API_KEY=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
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620

# ---- OAUTH LOGIN PROVIDERS ----
# Google OAuth
GOOGLE_CLIENT_ID=18917206079-aid5ubqv9cntc3ob6q8r6k02i3ln5ltl.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23liSFvlSiXONKm9HA
GITHUB_CLIENT_SECRET=39b4653127b3e973c0c9deedd014ba5aad68e89e

# Microsoft OAuth
AZURE_AD_CLIENT_ID=958b8cf6-53ca-4bcb-91fc-fa7ba3c08412
AZURE_AD_CLIENT_SECRET=ykM8Q~VTCXIQFF.iCYInfMu0Lmd7qQ9IlnfySdeF
AZURE_AD_TENANT_ID=6906b6b5-5d7d-4b61-838b-b60393b4c357

# ---- PAYMENT SERVICE (STRIPE) ----
# Test Keys (Development)
STRIPE_PUBLISHABLE_KEY=pk_test_51RceLPQctoHjmRkjxJuEtrWeiHtJnSjXrKLEGYydZ3Xtav8xoKUt4AgAbi13IaA9G5wXywO60hRr10wrG0Zu4X9T00JJ6GA1Fo
STRIPE_SECRET_KEY=sk_test_51RceLPQctoHjmRkj0SvcOM8hZt5zCKHGllevlitAoQewJQzSSSkaQY7kK5XJAQE4RAZlol2n4mWJx66i6ThliqzY004vciWOJ5
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
# Production Keys (Live)
# STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
# STRIPE_SECRET_KEY=sk_live_your_secret_key
# STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# ---- EMAIL SERVICE ----
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=info@choiceind.com
SMTP_PASS=dycphhkfvnfjgqhj

# ---- CDN & STORAGE ----
CLOUDFLARE_API_TOKEN=your_cloudflare_token
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=elearning-videos

# ---- MONITORING & ERROR TRACKING ----
SENTRY_DSN=https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816

# ---- APPLICATION SETTINGS ----
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚡ Auto-Generation Scripts

**Method 1: Using OpenSSL (Recommended)**
```bash
# Generate NextAuth Secret
openssl rand -base64 32

# Generate JWT Secret  
openssl rand -hex 64
```

## 🔐 Quick Setup Guide

### OAuth Providers Setup:
| **Provider** | **Console URL** | **Callback URL** |
|--------------|-----------------|------------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com/) | `/api/auth/callback/google` |
| **GitHub** | [GitHub Developer Settings](https://github.com/settings/developers) | `/api/auth/callback/github` |
| **Microsoft** | [Azure Portal](https://portal.azure.com/) | `/api/auth/callback/azure-ad` |

### API Keys Setup:
| **Service** | **Dashboard URL** | **Key Type** |
|-------------|-------------------|--------------|
| **Anthropic Claude** | [Console](https://console.anthropic.com/) | API Key (sk-ant-api03-...) |
| **Stripe** | [Dashboard](https://dashboard.stripe.com/) | Test Keys (pk_test_... & sk_test_...) |

## 🔒 Security & Best Practices

### Environment File Security
```bash
# .gitignore
.env.local
.env.production
.env.development
.env.test
.env*.local

# Never commit environment files to Git
```

### Key Management Best Practices
1. **Separate Test/Live Keys:** Always use test keys in development
2. **Rotate Secrets:** Change secrets periodically
3. **Limit API Key Permissions:** Use minimum required permissions
4. **Monitor Usage:** Set up alerts for unusual API usage
5. **Environment Isolation:** Never use production keys in development

### Next.js Environment Variables Rules
```bash
# Server-only variables (secure)
NEXTAUTH_SECRET=...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620

# Client-exposed variables (public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
```

## 📝 Development Setup Checklist

### 🚀 Recommended: Use Complete Setup Script
```bash
# Use setup-complete.sh for 100% PRD-compliant structure
./setup-complete.sh

# This creates:
✅ Complete monorepo structure (frontend + backend)
✅ All PRD components (useAutosave, NavigationGuard, etc.)
✅ All 26+ API endpoints from PRD specification
✅ Sentry monitoring configuration
✅ Real environment variables and API keys
✅ Complete database models and schemas
✅ Next.js + FastAPI integration ready
```

### ⚠️ Alternative: Manual Setup (Not Recommended)
```bash
# Using npx create-next-app alone will NOT match PRD structure
# It creates basic Next.js without backend separation
# Missing: FastAPI backend, PRD patterns, Sentry, etc.

☐ 1. Clone repository & install dependencies
☐ 2. Create .env.local file with all variables above
☐ 3. Generate NextAuth & JWT secrets 
☐ 4. Add OAuth providers (Google, GitHub, Microsoft)
☐ 5. Add Claude API key & Stripe test keys
☐ 6. Test all integrations & start development
```

### 🎯 Why Use setup-complete.sh?
| **Aspect** | **setup-complete.sh** | **create-next-app alone** |
|------------|----------------------|---------------------------|
| **Structure** | ✅ 100% PRD-compliant monorepo | ❌ Basic Next.js only |
| **Backend** | ✅ Complete FastAPI structure | ❌ Missing backend |
| **Patterns** | ✅ All PRD patterns included | ❌ Manual implementation needed |
| **Sentry** | ✅ Full monitoring setup | ❌ Manual configuration |
| **API Keys** | ✅ Real environment variables | ❌ Manual setup required |
| **Database** | ✅ Complete models/schemas | ❌ Missing data layer |
| **Time to Start** | ✅ 5 minutes ready | ❌ Hours of manual work |

## 🚀 Quick Deployment Guide

| **Platform** | **Environment Setup** | **Key Notes** |
|--------------|----------------------|---------------|
| **Vercel** | Project Settings → Environment Variables | Auto-deployment from GitHub |
| **Railway** | Environment Variables tab | Built-in PostgreSQL & Redis |
| **Docker** | Use .env.production file | Container orchestration |

## 📊 Sentry Monitoring Configuration

**Project DSN:** `https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816`

### NextJS Sentry Setup Files:
- **Client:** `instrumentation-client.ts`
- **Server:** `sentry.server.config.ts` 
- **Edge:** `sentry.edge.config.ts`

### Baseline Configuration:
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e361b6f5a71325c0649205ce514e1a31@o4509546120675328.ingest.us.sentry.io/4509546126114816",
  _experiments: {
    enableLogs: true,
  },
});
```

### Exception Catching Pattern:
```javascript
try {
  await enrollInCourse(courseId);
} catch (error) {
  Sentry.captureException(error);
  toast.error("Enrollment failed");
}
```

### Performance Tracing Examples:
```javascript
// Course enrollment tracking
Sentry.startSpan({
  op: "ui.click.enroll",
  name: "Course Enrollment Click",
}, (span) => {
  span.setAttribute("courseId", courseId);
  span.setAttribute("userType", userType);
  enrollInCourse();
});

// AI assistant calls
async function askAI(question) {
  return Sentry.startSpan({
    op: "ai.chat.question",
    name: "AI Assistant Query",
  }, async () => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    return response.json();
  });
}
```

### Structured Logging for E-Learning:
```javascript
import * as Sentry from "@sentry/nextjs";
const { logger } = Sentry;

// Course interactions
logger.info("Course enrollment", { 
  courseId: "123", 
  userId: "456",
  enrollmentType: "premium" 
});

// Video performance
logger.info("Video playback", {
  videoId: "vid_123",
  duration: 1800,
  completionRate: 0.85
});

// AI usage
logger.debug(logger.fmt`AI response time: ${responseTime}ms`);

// Payment events
logger.warn("Payment retry", {
  orderId: "order_123",
  attempt: 2,
  errorCode: "CARD_DECLINED"
});
```

### Critical Monitoring Priorities:
- **User Flows:** Registration, enrollment, payment, video streaming
- **Performance:** Page load < 2s, video start < 3s, AI response < 5s
- **Business Metrics:** Enrollment rates, payment success, course completion
- **AI Operations:** Chat questions, code analysis, quiz generation
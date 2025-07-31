# 🎯 AI E-Learning Platform - Project Documentation

## 📚 Project Overview
This is the complete documentation for the AI E-Learning Platform - Vietnam's leading AI programming education platform built with NextJS 14+, FastAPI, and Claude 3.5 Sonnet.

## 📋 Documentation Structure
The documentation has been organized into focused modules for better readability and performance:

### [📋 01. Business Foundation](./docs/01_BUSINESS_FOUNDATION.md)
- Product Overview & Objectives
- User Personas & Target Audience  
- Business Model & Monetization
- Content Strategy & Course Structure

### [🎭 02. Product Features](./docs/02_PRODUCT_FEATURES.md)
- User Roles & Permissions
- Core Features & User Stories
- AI-Powered Features & Workflows
- Course Creation & Management

### [🏗️ 03. Technical Architecture](./docs/03_TECHNICAL_ARCHITECTURE.md)
- System Architecture & Tech Stack
- Code Organization & Standards  
- Development Patterns & Best Practices
- AI Memory & Critical Rules
- 🚀 **NEW**: Smart Backend + Dumb Frontend Learn Page Optimization

### [🗃️ 04. Database Design](./docs/04_DATABASE_DESIGN.md)
- MongoDB Schema Definitions
- Collection Structures & Relationships
- Indexing Strategies
- Data Model Optimization

### [📡 05. API Specification](./docs/05_API_SPECIFICATION.md)
- API Endpoints & Workflows
- Authentication & Authorization
- Request/Response Formats
- Error Handling Patterns

### [🧪 06. Quality Assurance](./docs/06_QUALITY_ASSURANCE.md)
- Testing Strategy & Requirements
- Accessibility Guidelines (WCAG 2.1 AA)
- Test Coverage & Automation
- Inclusive Design Principles

### [🏭 07. Production Operations](./docs/07_PRODUCTION_OPERATIONS.md)
- Security & Compliance (OWASP, GDPR)
- Analytics & Monitoring
- Performance Requirements
- Infrastructure & Deployment

### [🚀 08. Project Execution](./docs/08_PROJECT_EXECUTION.md)
- Development Phases & Timeline
- Launch Readiness & Quality Gates
- Future Roadmap & Innovation
- Document Control & Version History

### [🔧 09. Environment Setup](./docs/09_ENVIRONMENT_SETUP.md)
- Environment Configuration
- API Keys & Secrets
- Development Setup Guide
- Sentry Monitoring Configuration

### [❓ 10. FAQ & Troubleshooting](./docs/10_FAQ_TROUBLESHOOTING.md)
- Frequently Asked Questions
- Common Issues & Solutions
- Platform Usage Guidelines
- Support & Contact Information

## 🚀 Quick Start

1. **Development Setup:** Start with [Environment Setup](./docs/09_ENVIRONMENT_SETUP.md)
2. **Understand Architecture:** Review [Technical Architecture](./docs/03_TECHNICAL_ARCHITECTURE.md)
3. **Database Design:** Check [Database Schemas](./docs/04_DATABASE_DESIGN.md)
4. **API Reference:** See [API Specification](./docs/05_API_SPECIFICATION.md)
5. **Development Standards:** Follow patterns in [Technical Architecture](./docs/03_TECHNICAL_ARCHITECTURE.md)

## 🧠 Critical Development Rules

### 🔥 GOLDEN RULES - MUST READ
1. **ONLY CHANGE WHAT'S EXPLICITLY REQUESTED** - No scope creep allowed
2. **CONSISTENCY OVER CREATIVITY** - Copy existing patterns exactly
3. **PATTERN INHERITANCE** - If Feature A uses Pattern X, Feature B must use Pattern X

### 🚨 Key Reminders
- **React Query:** All CRUD operations use REALTIME cache (staleTime: 0)
- **NextAuth:** DO NOT modify session configuration - it's stable
- **Toast Notifications:** Automatic via useApiMutation - no manual calls
- **MongoDB IDs:** Backend MUST convert `_id` to `id` for frontend
- 🚀 **Learn Page:** Use consolidated `useLearnPage` hook instead of individual hooks

For complete development guidelines and patterns, see [Technical Architecture](./docs/03_TECHNICAL_ARCHITECTURE.md).

## 📊 Project Status
- **Version:** 1.0
- **Status:** ✅ Production Ready - Implementation Approved
- **Created:** January 20, 2025
- **Product Manager:** Julian
- **PRD Completeness:** 100%

## 🔗 Quick Links
- **Frontend:** `/frontend` - NextJS 14+ App Router
- **Backend:** `/backend` - FastAPI + PydanticAI
- **Database:** MongoDB Atlas
- **Deployment:** Railway + Cloudflare CDN

---

*This documentation is optimized for Claude Code performance. Each module is kept under 40k characters for optimal processing.*
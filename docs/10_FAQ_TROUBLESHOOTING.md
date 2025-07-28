# ❓ FAQ & Troubleshooting

## 🎯 General Platform Questions

**Q: Who is the primary target audience for this platform?**
A: The platform serves 3 main groups:
- **Students/Learners:** People who want to learn online with AI support
- **Content Creators:** Teachers and experts who want to create and sell courses
- **Admins:** Platform, user, and content managers

**Q: How is this platform different from Udemy, Coursera?**
A: Key differentiators:
- **Integrated AI Assistant:** Claude 3.5 Sonnet provides personalized learning support
- **Sequential Learning:** Learn in sequence, unlock lessons based on progress
- **Flexible Pricing:** Both subscription and pay-per-course options
- **Vietnamese-focused:** Optimized for the Vietnamese market

**Q: Does the platform support mobile?**
A: Yes, the platform is designed to be responsive and includes a mobile app (Progressive Web App) for learning anytime, anywhere.

## 💰 Pricing & Payment Questions

**Q: How can I tell which courses are Free and which are Paid?**
A: 
- **Free courses:** Have a green "Free" badge
- **Paid courses:** Display price and "Enroll Now" button  
- **Pro subscribers:** Access all courses for free
- **Premium users:** Admin sets free access to all courses

**Q: What are the benefits of Pro subscription?**
A: Pro subscription ($29/month) includes:
- Unlimited access to all courses
- Priority AI Assistant support
- Download courses for offline learning
- Certificate verification
- Ad-free experience

**Q: Can I get a refund if I'm not satisfied?**
A: Yes, the platform has a 14-day money-back guarantee for:
- Individual course purchases
- Pro subscription (prorated refund)
- Does not apply to courses >80% completed

## 📚 Course & Learning Questions

**Q: How does sequential learning work?**
A: 
- Must complete current lesson (watch 80% video + pass quiz) to unlock next lesson
- Chapter unlocks when completing all lessons in that chapter
- Course completion when finishing all chapters + final assessment

**Q: What if I get stuck on a lesson?**
A: Platform provides multiple support options:
- **AI Assistant:** Explains concepts, answers questions
- **Community Forum:** Q&A with other learners
- **Instructor Support:** Direct contact with course creator
- **Hint System:** Step-by-step hints for quizzes

**Q: What is the value of certificates?**
A: 
- **Digital Certificate:** Blockchain-verified, shareable on LinkedIn
- **Course Completion:** Completion certification with score
- **Skill Assessment:** Real skill evaluation
- **Industry Recognition:** Partnerships with Vietnamese tech companies

## 🎨 Content Creation Questions

**Q: Who can create courses on the platform?**
A: 
- **Content Creators:** Register and get approved by Admin
- **Admins:** Have full rights to create courses
- **Requirements:** Portfolio, expertise proof, content quality standards

**Q: How do Content Creators share revenue?**
A: Revenue sharing model:
- **Individual sales:** Creator receives 70%, Platform 30%
- **Pro subscription:** Shared based on watch time and engagement
- **Bonus:** Performance incentives for top-rated courses

**Q: What tools does the platform support for Content Creation?**
A: Built-in course builder includes:
- Video upload with auto-compression
- Quiz builder with multiple question types
- Rich text editor for descriptions
- Analytics dashboard for performance tracking
- Bulk upload tools for large courses

## 🔐 Technical & Security Questions

**Q: Is my data secure?**
A: Platform ensures security with:
- **SSL encryption** for all data transmission
- **JWT authentication** with refresh token
- **Role-based access control** 
- **Regular security audits**
- **GDPR compliance** for data privacy

**Q: Does the platform have offline support?**
A: Limited offline support:
- **Progressive Web App:** Cache basic functionality
- **Video download:** Pro subscribers can download
- **Sync when online:** Progress sync automatically
- **Offline quiz:** Cached questions, submit when internet available

**Q: How does the platform scale?**
A: Architecture designed for scalability:
- **CDN:** Video delivery through global CDN
- **Database sharding:** MongoDB with horizontal scaling
- **Microservices:** FastAPI backend can scale independently
- **Railway deployment:** Auto-scaling infrastructure

## 👥 User Management Questions

**Q: How to upgrade/downgrade account?**
A: Users can:
- **Self-service:** Upgrade/downgrade through billing page
- **Admin intervention:** Admin can set user roles manually
- **Automatic:** Pro subscription auto-renew, can cancel anytime

**Q: What if I forget my password?**
A: Password recovery process:
1. Click "Forgot Password" on login page
2. Enter email → receive reset link
3. Click link → set new password
4. Auto-login with new password

**Q: Can I have multiple accounts?**
A: 
- **Not recommended:** Each user should have 1 unique account
- **Role switching:** User can have multiple roles (Student + Creator)
- **Family accounts:** Planning for future release

## 🚀 Future Development Questions

**Q: What are the platform's development plans?**
A: Roadmap includes:
- **Phase 2:** Mobile native app (React Native)
- **Phase 3:** Live streaming classes
- **Phase 4:** VR/AR learning experiences
- **Phase 5:** Corporate training solutions

**Q: Is there an API for third-party integration?**
A: 
- **Public API:** Planning for Phase 2
- **Webhook support:** For payment notifications
- **SSO integration:** Enterprise customers
- **LMS integration:** Canvas, Moodle compatibility

**Q: Does the platform have multi-language support?**
A: 
- **Current:** Vietnamese and English
- **Future:** Planning to add Thai, Indonesian
- **Content:** Creators can upload multi-language subtitles

## 🛠️ Troubleshooting Questions

**Q: What if videos won't load?**
A: Troubleshooting steps:
1. Check internet connection
2. Try different browser/device
3. Clear browser cache
4. Contact support with error details

**Q: How to handle payment failures?**
A: 
- **Auto-retry:** System automatically retries 3 times
- **Alternative payment:** Suggest other payment methods
- **Manual process:** Admin can manually approve
- **Support:** 24/7 payment support team

**Q: What if AI Assistant doesn't respond?**
A: 
- **Check API status:** PydanticAI service health
- **Retry mechanism:** Auto-retry with exponential backoff
- **Fallback:** Pre-defined responses for common questions
- **Escalation:** Route to human support if needed

---

*📞 **Need More Help?** Contact our support team at support@elearning-platform.com or use in-app chat support.*
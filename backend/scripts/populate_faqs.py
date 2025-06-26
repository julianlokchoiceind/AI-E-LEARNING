"""
Script to populate sample FAQs
"""
# Standard library imports
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Third-party imports
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

# Local imports
from app.core.config import settings
from app.models.faq import FAQ, FAQCategory


SAMPLE_FAQS = [
    # General FAQs
    {
        "question": "What is the AI E-Learning Platform?",
        "answer": "The AI E-Learning Platform is Vietnam's leading online education platform for AI and machine learning. We offer high-quality video courses taught by industry experts, with an integrated AI Study Buddy powered by Claude 3.5 Sonnet to provide personalized learning support 24/7.",
        "category": FAQCategory.GENERAL,
        "priority": 100,
        "tags": ["platform", "overview", "ai-learning"],
    },
    {
        "question": "How is this platform different from Udemy or Coursera?",
        "answer": "Key differentiators include: 1) Integrated AI Assistant that provides real-time coding help and personalized learning support, 2) Sequential Learning system that ensures you master concepts in the right order, 3) Flexible pricing with both subscription and pay-per-course options, 4) Focus on the Vietnamese market with local language support and payment methods.",
        "category": FAQCategory.GENERAL,
        "priority": 95,
        "tags": ["comparison", "features", "unique"],
    },
    {
        "question": "Do I need programming experience to start?",
        "answer": "No! We offer courses for complete beginners. Our 'Programming Foundations' category includes courses on HTML/CSS, JavaScript, and Python basics. The AI Study Buddy will also help guide you based on your current skill level.",
        "category": FAQCategory.GENERAL,
        "priority": 90,
        "tags": ["beginner", "requirements", "getting-started"],
    },
    
    # Pricing FAQs
    {
        "question": "How much does the Pro subscription cost?",
        "answer": "The Pro subscription costs $29/month and includes: unlimited access to all courses, priority AI Assistant support, ability to download courses for offline learning, certificate verification, and an ad-free experience.",
        "category": FAQCategory.PRICING,
        "priority": 100,
        "tags": ["pro", "subscription", "pricing"],
    },
    {
        "question": "Can I purchase individual courses instead of subscribing?",
        "answer": "Yes! We offer a pay-per-course option. Individual courses range from $19-99 depending on the content and duration. Once purchased, you have lifetime access to that course.",
        "category": FAQCategory.PRICING,
        "priority": 95,
        "tags": ["individual-purchase", "lifetime-access"],
    },
    {
        "question": "Is there a refund policy?",
        "answer": "Yes, we offer a 14-day money-back guarantee for both individual course purchases and Pro subscriptions. The refund does not apply to courses where you've completed more than 80% of the content.",
        "category": FAQCategory.PRICING,
        "priority": 90,
        "tags": ["refund", "guarantee", "money-back"],
    },
    
    # Learning FAQs
    {
        "question": "What is the AI Study Buddy?",
        "answer": "The AI Study Buddy is your personal learning assistant powered by Claude 3.5 Sonnet. It can answer questions about course content, help debug your code, provide additional examples, suggest learning paths, and offer encouragement when you're stuck. It's available 24/7 for all enrolled students.",
        "category": FAQCategory.LEARNING,
        "priority": 100,
        "tags": ["ai-assistant", "study-buddy", "claude"],
    },
    {
        "question": "How does sequential learning work?",
        "answer": "Sequential learning ensures you build knowledge progressively. You must complete the current lesson (watch 80% of the video and pass any quiz with 70% or higher) before the next lesson unlocks. This prevents knowledge gaps and ensures solid understanding of fundamentals before moving to advanced topics.",
        "category": FAQCategory.LEARNING,
        "priority": 95,
        "tags": ["sequential", "progress", "unlock"],
    },
    {
        "question": "Can I download courses for offline viewing?",
        "answer": "Pro subscribers can download course videos for offline viewing through our mobile app (Progressive Web App). Downloaded content syncs automatically when you're back online to update your progress.",
        "category": FAQCategory.LEARNING,
        "priority": 85,
        "tags": ["offline", "download", "mobile"],
    },
    {
        "question": "How long do I have access to a course?",
        "answer": "For purchased courses, you have lifetime access. For Pro subscribers, you have access as long as your subscription is active. If you cancel Pro but previously accessed a course, you'll need to purchase it individually for continued access.",
        "category": FAQCategory.LEARNING,
        "priority": 80,
        "tags": ["access", "lifetime", "duration"],
    },
    
    # Technical FAQs
    {
        "question": "What browsers are supported?",
        "answer": "We support modern browsers including Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+. For mobile, we support iOS Safari 14+ and Chrome Mobile 90+. The platform also works as a Progressive Web App for offline capability.",
        "category": FAQCategory.TECHNICAL,
        "priority": 95,
        "tags": ["browser", "compatibility", "requirements"],
    },
    {
        "question": "Why can't I skip ahead in videos?",
        "answer": "To ensure proper learning progression, we've disabled video seeking for first-time viewing. This helps maintain our sequential learning approach. Once you've completed a lesson, you can replay it with full controls enabled.",
        "category": FAQCategory.TECHNICAL,
        "priority": 90,
        "tags": ["video", "controls", "sequential"],
    },
    {
        "question": "What should I do if videos won't load?",
        "answer": "Try these steps: 1) Check your internet connection, 2) Try a different browser or clear your cache, 3) Disable browser extensions that might block content, 4) Check if YouTube is accessible in your region. If issues persist, contact support with the error details.",
        "category": FAQCategory.TECHNICAL,
        "priority": 85,
        "tags": ["video", "troubleshooting", "loading"],
    },
    
    # Creator FAQs
    {
        "question": "How can I become a content creator?",
        "answer": "To become a content creator: 1) Register for an account, 2) Apply for creator status by submitting your portfolio and expertise proof, 3) Wait for admin approval, 4) Once approved, you can start creating courses using our built-in course builder.",
        "category": FAQCategory.CREATOR,
        "priority": 100,
        "tags": ["creator", "instructor", "apply"],
    },
    {
        "question": "What is the revenue sharing model?",
        "answer": "Content creators receive: 70% of individual course sales and a share of Pro subscription revenue based on watch time and engagement. We also offer performance bonuses for top-rated courses and consistent content creation.",
        "category": FAQCategory.CREATOR,
        "priority": 95,
        "tags": ["revenue", "earnings", "commission"],
    },
    {
        "question": "What tools are available for creating courses?",
        "answer": "Our course builder includes: video upload with auto-compression, interactive quiz builder, rich text editor for descriptions, student analytics dashboard, bulk upload tools, and AI-powered quiz generation from your content.",
        "category": FAQCategory.CREATOR,
        "priority": 90,
        "tags": ["tools", "course-builder", "features"],
    },
]


async def populate_faqs():
    """Populate sample FAQs"""
    # Connect to MongoDB directly
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client["ai-elearning"]
    
    # Initialize Beanie
    await init_beanie(database=db, document_models=[FAQ])
    
    # Clear existing FAQs
    await FAQ.delete_all()
    print("Cleared existing FAQs")
    
    # Insert sample FAQs
    for faq_data in SAMPLE_FAQS:
        faq = FAQ(**faq_data)
        await faq.save()
    
    print(f"Inserted {len(SAMPLE_FAQS)} sample FAQs")
    
    # Close connection
    client.close()


if __name__ == "__main__":
    asyncio.run(populate_faqs())
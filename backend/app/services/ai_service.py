"""
AI Service for PydanticAI integration with Claude 3.5 Sonnet
Handles chat functionality, context management, and AI responses
"""
# Standard library imports
import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

# Third-party imports
from anthropic import Anthropic
from pydantic_ai import Agent
from pydantic_ai.models.anthropic import AnthropicModel

# Local application imports
from app.core.config import get_settings
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.ai import GeneratedQuizQuestion, QuestionDifficulty, QuizOption

# Configure logging
logger = logging.getLogger(__name__)

class AIService:
    """
    AI Service class for handling PydanticAI operations
    Integrates Claude 3.5 Sonnet for educational assistance
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.anthropic_client = None
        self.agent = None
        self.rate_limits = {}  # Track usage per user
        self.conversation_history = {}  # Store conversation context
        self.response_cache = {}  # Cache for common responses
        self._initialize_ai()
    
    def _initialize_ai(self):
        """Initialize PydanticAI agent with Claude 3.5 Sonnet"""
        try:
            # Initialize Anthropic client
            api_key = self.settings.anthropic_api_key
            if not api_key:
                logger.error("ANTHROPIC_API_KEY not found in environment")
                raise ValueError("ANTHROPIC_API_KEY is required")
            
            # Set the API key as environment variable for PydanticAI
            os.environ['ANTHROPIC_API_KEY'] = api_key
            
            self.anthropic_client = Anthropic(api_key=api_key)
            
            # Initialize PydanticAI Agent with Claude 3.5 Sonnet
            model = AnthropicModel('claude-3-5-sonnet-20240620')
            
            # Create agent with system prompt for educational assistant
            self.agent = Agent(
                model=model,
                system_prompt=self._get_system_prompt(),
                retries=2
            )
            
            logger.info("PydanticAI agent initialized successfully with Claude 3.5 Sonnet")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {str(e)}")
            raise
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI Study Buddy"""
        return """
        You are an AI Study Buddy specializing in AI programming and software development.
        
        Your role is to help students learn effectively by:
        - Providing clear, practical explanations
        - Offering code examples when relevant
        - Breaking down complex concepts into digestible parts
        - Encouraging best practices
        - Adapting your language to the student's level
        
        Guidelines:
        - Be encouraging and supportive
        - Use simple language for beginners, technical depth for advanced students
        - Provide step-by-step explanations when needed
        - Include practical examples and code snippets
        - Ask follow-up questions to ensure understanding
        - Support both English and Vietnamese languages
        
        Always aim to educate and empower the student's learning journey.
        """
    
    async def chat(
        self,
        user_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process chat message with AI assistant
        
        Args:
            user_id: The user's unique identifier
            message: The user's message/question
            context: Optional context (course, lesson, etc.)
        
        Returns:
            Dict containing AI response and metadata
        """
        try:
            # Check rate limits
            if not await self._check_rate_limit(user_id):
                return {
                    "error": "Rate limit exceeded. Please wait before sending another message.",
                    "retry_after": 60
                }
            
            # Prepare context-aware prompt
            contextual_prompt = await self._prepare_contextual_prompt(message, context)
            
            # Check cache first
            cached_response = await self._get_cached_response(contextual_prompt)
            if cached_response:
                # Store conversation in history
                await self._store_conversation(user_id, message, cached_response["response"], context)
                # Track usage
                await self._track_usage(user_id)
                return cached_response
            
            # Get AI response using PydanticAI
            result = await self.agent.run(contextual_prompt)
            
            # Store conversation in history
            await self._store_conversation(user_id, message, result.data, context)
            
            # Track usage
            await self._track_usage(user_id)
            
            response_data = {
                "response": result.data,
                "context": context,
                "timestamp": datetime.utcnow().isoformat(),
                "model": "claude-3-5-sonnet-20240620"
            }
            
            # Cache common responses
            await self._cache_response(contextual_prompt, response_data)
            
            return response_data
            
        except Exception as e:
            logger.error(f"AI chat error: {str(e)}")
            return {
                "error": "I'm having trouble processing your request. Please try again.",
                "details": str(e) if self.settings.debug else None
            }
    
    async def _prepare_contextual_prompt(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Prepare a context-aware prompt for the AI"""
        
        if not context:
            return f"Student question: {message}"
        
        # Build comprehensive context
        context_parts = []
        
        # Course context
        if context.get("course_id"):
            course_context = await self._get_course_context(context["course_id"])
            if course_context:
                context_parts.append(f"""
                COURSE CONTEXT:
                - Course: "{course_context['title']}"
                - Description: {course_context['description']}
                - Level: {course_context['level']}
                - Category: {course_context['category']}
                """)
        
        # Lesson context
        if context.get("lesson_id"):
            lesson_context = await self._get_lesson_context(context["lesson_id"])
            if lesson_context:
                lesson_info = f"""
                CURRENT LESSON CONTEXT:
                - Lesson: "{lesson_context['title']}"
                - Description: {lesson_context['description']}
                - Lesson #{lesson_context['order']}
                """
                
                if lesson_context.get('chapter'):
                    lesson_info += f"""
                - Chapter: "{lesson_context['chapter']['title']}" (Chapter #{lesson_context['chapter']['order']})
                """
                
                if lesson_context.get('video_duration'):
                    lesson_info += f"""
                - Video Duration: {lesson_context['video_duration']} minutes
                """
                
                if lesson_context.get('has_quiz'):
                    lesson_info += f"""
                - Has Quiz: Yes
                """
                
                if lesson_context.get('content'):
                    lesson_info += f"""
                - Lesson Content: {lesson_context['content'][:500]}...
                """
                
                context_parts.append(lesson_info)
        
        # User level context
        if context.get("user_level"):
            context_parts.append(f"""
            STUDENT LEVEL: {context['user_level']}
            """)
        
        # Build final prompt
        full_context = "\n".join(context_parts)
        
        return f"""
        {full_context}
        
        STUDENT QUESTION: {message}
        
        INSTRUCTIONS: 
        - Provide a helpful, educational response
        - Use appropriate technical level for the student
        - Reference the course/lesson context when relevant
        - Include practical examples or code snippets if applicable
        - Encourage further learning and exploration
        """
    
    async def _get_course_context(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Get course context for AI prompting"""
        try:
            course = await Course.find_one(Course.id == course_id)
            if course:
                return {
                    "title": course.title,
                    "description": course.description,
                    "level": course.level,
                    "category": course.category
                }
        except Exception as e:
            logger.error(f"Error getting course context: {str(e)}")
        return None
    
    async def _get_lesson_context(self, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Get lesson context for AI prompting"""
        try:
            lesson = await Lesson.find_one(Lesson.id == lesson_id)
            if lesson:
                # Get lesson with video details and content
                context = {
                    "title": lesson.title,
                    "description": lesson.description,
                    "content": lesson.content,
                    "video_duration": lesson.video.duration if lesson.video else None,
                    "has_quiz": lesson.has_quiz if hasattr(lesson, 'has_quiz') else False,
                    "order": lesson.order
                }
                
                # Get chapter context
                if lesson.chapter_id:
                    from app.models.chapter import Chapter
                    chapter = await Chapter.find_one(Chapter.id == lesson.chapter_id)
                    if chapter:
                        context["chapter"] = {
                            "title": chapter.title,
                            "description": chapter.description,
                            "order": chapter.order
                        }
                
                return context
        except Exception as e:
            logger.error(f"Error getting lesson context: {str(e)}")
        return None
    
    async def _check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded rate limits"""
        now = datetime.utcnow()
        user_limits = self.rate_limits.get(user_id, {"count": 0, "window_start": now})
        
        # Reset if window expired (1 hour window)
        if now - user_limits["window_start"] > timedelta(hours=1):
            user_limits = {"count": 0, "window_start": now}
        
        # Check limit (50 messages per hour for free users)
        if user_limits["count"] >= 50:
            return False
        
        # Update limits
        user_limits["count"] += 1
        self.rate_limits[user_id] = user_limits
        
        return True
    
    async def _track_usage(self, user_id: str):
        """Track AI usage for analytics and billing"""
        # This could store usage in database for analytics
        # For now, just log the usage
        logger.info(f"AI usage tracked for user {user_id}")
    
    async def _store_conversation(
        self,
        user_id: str,
        question: str,
        answer: str,
        context: Optional[Dict[str, Any]] = None
    ):
        """Store conversation history for context continuity"""
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        
        conversation_entry = {
            "timestamp": datetime.utcnow(),
            "question": question,
            "answer": answer,
            "context": context
        }
        
        # Keep only last 10 conversations per user
        self.conversation_history[user_id].append(conversation_entry)
        if len(self.conversation_history[user_id]) > 10:
            self.conversation_history[user_id].pop(0)
    
    async def get_conversation_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for a user"""
        return self.conversation_history.get(user_id, [])
    
    async def clear_conversation_history(self, user_id: str):
        """Clear conversation history for a user"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]
    
    async def _cache_response(self, prompt: str, response_data: Dict[str, Any]):
        """Cache AI response for common queries"""
        try:
            # Create a cache key from the prompt (simplified version)
            cache_key = self._create_cache_key(prompt)
            
            # Store in cache with timestamp
            self.response_cache[cache_key] = {
                "response": response_data,
                "cached_at": datetime.utcnow(),
                "hits": 0
            }
            
            # Limit cache size to 100 entries
            if len(self.response_cache) > 100:
                # Remove oldest entry
                oldest_key = min(self.response_cache.keys(), 
                               key=lambda k: self.response_cache[k]["cached_at"])
                del self.response_cache[oldest_key]
                
        except Exception as e:
            logger.error(f"Error caching response: {str(e)}")
    
    def _create_cache_key(self, prompt: str) -> str:
        """Create a cache key from prompt"""
        import hashlib
        
        # Normalize prompt for better cache hits
        normalized = prompt.lower().strip()
        
        # Remove user-specific information for better cache hits
        normalized = normalized.replace("student question:", "").strip()
        
        # Create hash for cache key
        return hashlib.md5(normalized.encode()).hexdigest()
    
    async def _get_cached_response(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Get cached response if available and not expired"""
        try:
            cache_key = self._create_cache_key(prompt)
            
            if cache_key in self.response_cache:
                cached_entry = self.response_cache[cache_key]
                
                # Check if cache is still valid (24 hours)
                cache_age = datetime.utcnow() - cached_entry["cached_at"]
                if cache_age.total_seconds() < 86400:  # 24 hours
                    # Increment hit counter
                    cached_entry["hits"] += 1
                    
                    # Return cached response with updated timestamp
                    cached_response = cached_entry["response"].copy()
                    cached_response["timestamp"] = datetime.utcnow().isoformat()
                    cached_response["from_cache"] = True
                    
                    return cached_response
                else:
                    # Remove expired cache entry
                    del self.response_cache[cache_key]
                    
        except Exception as e:
            logger.error(f"Error retrieving cached response: {str(e)}")
        
        return None
    
    async def generate_quiz_questions(
        self,
        lesson_content: str,
        difficulty: str = "intermediate",
        num_questions: int = 5
    ) -> List[GeneratedQuizQuestion]:
        """
        Generate quiz questions from lesson content using AI
        
        Args:
            lesson_content: The lesson content/transcript
            difficulty: Question difficulty level
            num_questions: Number of questions to generate
        
        Returns:
            List of generated quiz questions
        """
        try:
            prompt = f"""
            Generate {num_questions} multiple choice quiz questions based on this lesson content:
            
            {lesson_content}
            
            Requirements:
            - Difficulty level: {difficulty}
            - Each question should have 4 options (A, B, C, D)
            - Include the correct answer index (0-3)
            - Provide a brief explanation for the correct answer
            - Focus on key concepts and practical understanding
            
            Return ONLY a JSON array with this exact format:
            [
                {{
                    "question": "The question text",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": 0,
                    "explanation": "Why this answer is correct"
                }}
            ]
            """
            
            result = await self.agent.run(prompt)
            
            # Parse the AI response and format as quiz questions
            # This would need additional parsing logic based on AI response format
            questions = self._parse_quiz_response(result.data)
            
            return questions
            
        except Exception as e:
            logger.error(f"Quiz generation error: {str(e)}")
            return []
    
    def _parse_quiz_response(self, ai_response: str) -> List[GeneratedQuizQuestion]:
        """Parse AI response into quiz question format"""
        questions = []
        try:
            # Try to parse JSON response from AI
            if ai_response.strip().startswith('['):
                # Direct JSON array
                parsed_questions = json.loads(ai_response)
            else:
                # Look for JSON content in the response
                import re
                json_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
                if json_match:
                    parsed_questions = json.loads(json_match.group())
                else:
                    # Fallback to sample question
                    parsed_questions = [{
                        "question": "What is the main concept discussed in this lesson?",
                        "options": [
                            "Concept A",
                            "Concept B", 
                            "Concept C",
                            "Concept D"
                        ],
                        "correct_answer": 0,
                        "explanation": "The main concept is Concept A as discussed throughout the lesson."
                    }]
            
            # Convert to GeneratedQuizQuestion objects
            for q in parsed_questions:
                options = []
                for i, opt in enumerate(q.get('options', [])):
                    options.append(QuizOption(
                        text=opt,
                        is_correct=(i == q.get('correct_answer', 0))
                    ))
                
                question = GeneratedQuizQuestion(
                    question=q.get('question', 'Question text'),
                    options=options,
                    correct_answer_index=q.get('correct_answer', 0),
                    explanation=q.get('explanation', 'Explanation not provided'),
                    difficulty=QuestionDifficulty.INTERMEDIATE,
                    points=1
                )
                questions.append(question)
                
        except Exception as e:
            logger.error(f"Quiz parsing error: {str(e)}")
            # Return a default question on error
            questions = [GeneratedQuizQuestion(
                question="What did you learn from this lesson?",
                options=[
                    QuizOption(text="Key concept A", is_correct=True),
                    QuizOption(text="Key concept B", is_correct=False),
                    QuizOption(text="Key concept C", is_correct=False),
                    QuizOption(text="Key concept D", is_correct=False)
                ],
                correct_answer_index=0,
                explanation="Key concept A is the main takeaway from this lesson.",
                difficulty=QuestionDifficulty.INTERMEDIATE,
                points=1
            )]
        
        return questions
    
    async def generate_contextual_suggestions(
        self,
        course_id: Optional[str] = None,
        lesson_id: Optional[str] = None,
        user_level: Optional[str] = None
    ) -> List[str]:
        """
        Generate contextual question suggestions based on current learning context
        
        Args:
            course_id: Current course ID
            lesson_id: Current lesson ID
            user_level: User's learning level
        
        Returns:
            List of suggested questions
        """
        try:
            # Build context for suggestions
            context_info = []
            
            if course_id:
                course_context = await self._get_course_context(course_id)
                if course_context:
                    context_info.append(f"Course: {course_context['title']} ({course_context['level']} level)")
            
            if lesson_id:
                lesson_context = await self._get_lesson_context(lesson_id)
                if lesson_context:
                    context_info.append(f"Current lesson: {lesson_context['title']}")
                    if lesson_context.get('description'):
                        context_info.append(f"Lesson focus: {lesson_context['description']}")
            
            # Create prompt for generating suggestions
            context_str = "\n".join(context_info) if context_info else "General programming/AI learning"
            user_level_str = user_level or "intermediate"
            
            prompt = f"""
            Generate 4 helpful question suggestions for a {user_level_str} student in this context:
            
            {context_str}
            
            The suggestions should be:
            - Relevant to the current lesson/course content
            - Appropriate for {user_level_str} level
            - Encourage deeper understanding
            - Be practical and actionable
            
            Format as a simple list of questions, one per line, without numbers or bullets.
            Keep each question under 60 characters.
            """
            
            result = await self.agent.run(prompt)
            
            # Parse suggestions from AI response
            suggestions = []
            if result.data:
                lines = result.data.strip().split('\n')
                for line in lines:
                    clean_line = line.strip()
                    # Remove any numbering or bullets
                    clean_line = clean_line.lstrip('1234567890.-• ')
                    if clean_line and len(clean_line) <= 80:
                        suggestions.append(clean_line)
            
            # Fallback to default suggestions if AI fails
            if not suggestions:
                suggestions = self._get_default_suggestions(course_id, lesson_id, user_level)
            
            return suggestions[:4]  # Return max 4 suggestions
            
        except Exception as e:
            logger.error(f"Error generating contextual suggestions: {str(e)}")
            return self._get_default_suggestions(course_id, lesson_id, user_level)
    
    def _get_default_suggestions(
        self,
        course_id: Optional[str] = None,
        lesson_id: Optional[str] = None,
        user_level: Optional[str] = None
    ) -> List[str]:
        """Get default suggestions when AI generation fails"""
        
        if lesson_id:
            return [
                "Explain this concept in simple terms",
                "Give me a practical example",
                "What should I focus on in this lesson?",
                "How does this relate to what I learned before?"
            ]
        elif course_id:
            return [
                "What should I learn next in this course?",
                "Help me understand the key concepts",
                "Can you summarize what I've learned so far?",
                "What are the most important takeaways?"
            ]
        else:
            return [
                "What should I study today?",
                "Explain a programming concept",
                "Help me with my coding problem",
                "Suggest a learning path for AI/ML"
            ]
    
    async def health_check(self) -> Dict[str, Any]:
        """Check AI service health"""
        try:
            # Simple test query
            result = await self.agent.run("Hello, are you working?")
            return {
                "status": "healthy",
                "model": "claude-3-5-sonnet-20240620",
                "response_received": bool(result.data),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

# Global AI service instance
ai_service = AIService()
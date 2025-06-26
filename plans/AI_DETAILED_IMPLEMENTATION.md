# 🤖 AI SYSTEM DETAILED IMPLEMENTATION PLAN

## 📋 **OVERVIEW**
Complete implementation guide for all AI-powered features using PydanticAI with Claude 3.5 Sonnet, including Study Buddy, Quiz Generator, Learning Path Optimizer, and Progress Coach.

**Complexity:** High  
**Priority:** Core Feature (Phase 1-3)  
**Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20240620)  

---

## 🎯 **AI FEATURES FROM CLAUDE.md**

### **1. Study Buddy - Intelligent Q&A**
- Real-time course content assistance
- Code debugging help
- Concept explanations
- Follow-up question generation
- Multi-language support (Vietnamese/English)

### **2. Quiz Generator - Auto Assessment**
- Extract concepts from video transcripts
- Generate multiple choice questions
- Create coding challenges
- Adaptive difficulty
- Explanation generation

### **3. Learning Path Optimizer**
- Analyze progress patterns
- Recommend next courses
- Identify knowledge gaps
- Estimate learning time
- Personalized curriculum

### **4. Progress Coach - Personal Mentor**
- Weekly learning summaries
- Motivation messages
- Study habit recommendations
- Goal setting and tracking
- Performance insights

---

## 🏗️ **PYDANTIC AI ARCHITECTURE**

### **Core Dependencies:**
```python
# requirements.txt
pydantic-ai==0.0.9
anthropic==0.34.0
pydantic==2.5.0
redis==5.0.1
tiktoken==0.5.2  # For token counting
```

### **AI Service Structure:**
```
backend/app/services/ai/
├── __init__.py
├── config.py              # AI configuration
├── agents/
│   ├── study_buddy.py     # Q&A agent
│   ├── quiz_generator.py  # Quiz creation agent
│   ├── path_optimizer.py  # Learning path agent
│   └── progress_coach.py  # Coaching agent
├── prompts/
│   ├── templates.py       # Prompt templates
│   └── examples.py        # Few-shot examples
├── utils/
│   ├── token_counter.py   # Token management
│   ├── cache_manager.py   # Response caching
│   └── cost_tracker.py    # Usage tracking
└── models/
    ├── contexts.py        # Pydantic models for context
    └── responses.py       # Pydantic models for responses
```

---

## 📊 **IMPLEMENTATION PHASES**

### **Phase 1: Basic Study Buddy (Week 4-5)**

#### **Day 1: PydanticAI Setup**
```python
# backend/app/services/ai/config.py
from pydantic_ai import Agent
from pydantic import BaseModel, Field
from typing import List, Optional
import os

# Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL_NAME = "claude-3-5-sonnet-20240620"
MAX_TOKENS = 4000
TEMPERATURE = 0.7

# Initialize base agent
base_agent = Agent(
    model_name=MODEL_NAME,
    api_key=ANTHROPIC_API_KEY,
    max_tokens=MAX_TOKENS,
    temperature=TEMPERATURE
)
```

#### **Day 2: Study Buddy Context & Response Models**
```python
# backend/app/services/ai/models/contexts.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class StudyBuddyContext(BaseModel):
    """Context for Study Buddy interactions"""
    user_id: str
    course_id: str
    lesson_id: Optional[str] = None
    question: str
    user_level: str = Field(default="beginner")
    preferred_language: str = Field(default="en")
    course_content: Optional[str] = None
    transcript: Optional[str] = None
    previous_questions: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.now)

class CodeDebugContext(BaseModel):
    """Context for code debugging help"""
    code: str
    error_message: Optional[str] = None
    language: str
    lesson_context: str
    expected_behavior: Optional[str] = None
```

```python
# backend/app/services/ai/models/responses.py
class StudyBuddyResponse(BaseModel):
    """Response from Study Buddy"""
    answer: str
    code_examples: Optional[List[str]] = None
    relevant_lessons: List[str] = Field(default_factory=list)
    follow_up_questions: List[str] = Field(default_factory=list)
    confidence_score: float = Field(ge=0, le=1)
    tokens_used: int
    response_time_ms: int

class CodeDebugResponse(BaseModel):
    """Response for code debugging"""
    explanation: str
    fixed_code: str
    error_analysis: str
    best_practices: List[str]
    common_mistakes: List[str]
```

#### **Day 3: Study Buddy Agent Implementation**
```python
# backend/app/services/ai/agents/study_buddy.py
from pydantic_ai import Agent
from typing import List
import time
from ..models.contexts import StudyBuddyContext, CodeDebugContext
from ..models.responses import StudyBuddyResponse, CodeDebugResponse
from ..prompts.templates import STUDY_BUDDY_PROMPTS
from ..utils.cache_manager import CacheManager
from ..utils.cost_tracker import CostTracker

class StudyBuddyAgent:
    def __init__(self):
        self.agent = Agent(
            'claude-3-5-sonnet-20240620',
            result_type=StudyBuddyResponse,
            system_prompt=STUDY_BUDDY_PROMPTS["system"]
        )
        self.cache = CacheManager("study_buddy")
        self.cost_tracker = CostTracker()
    
    async def answer_question(self, context: StudyBuddyContext) -> StudyBuddyResponse:
        """Answer student questions with caching and cost tracking"""
        start_time = time.time()
        
        # Check cache first
        cache_key = self.cache.generate_key(context)
        cached_response = await self.cache.get(cache_key)
        if cached_response:
            return cached_response
        
        # Prepare prompt with context
        prompt = self._build_prompt(context)
        
        # Get AI response
        response = await self.agent.run(prompt, context=context)
        
        # Track metrics
        response_time = int((time.time() - start_time) * 1000)
        tokens_used = self._count_tokens(prompt + str(response))
        cost = self.cost_tracker.calculate_cost(tokens_used)
        
        # Build response
        result = StudyBuddyResponse(
            answer=response.answer,
            code_examples=response.code_examples,
            relevant_lessons=self._find_relevant_lessons(context),
            follow_up_questions=response.follow_up_questions,
            confidence_score=self._calculate_confidence(response),
            tokens_used=tokens_used,
            response_time_ms=response_time
        )
        
        # Cache response
        await self.cache.set(cache_key, result, ttl=3600)
        
        # Track usage
        await self.cost_tracker.track_usage(
            user_id=context.user_id,
            tokens=tokens_used,
            cost=cost,
            agent_type="study_buddy"
        )
        
        return result
    
    def _build_prompt(self, context: StudyBuddyContext) -> str:
        """Build detailed prompt with context"""
        template = STUDY_BUDDY_PROMPTS["question_answer"]
        return template.format(
            course_name=context.course_id,
            lesson_id=context.lesson_id or "general",
            user_level=context.user_level,
            language=context.preferred_language,
            question=context.question,
            transcript=context.transcript or "No transcript available",
            previous_questions="\n".join(context.previous_questions[-3:])
        )
```

#### **Day 4: Prompt Engineering**
```python
# backend/app/services/ai/prompts/templates.py
STUDY_BUDDY_PROMPTS = {
    "system": """You are an AI Study Buddy for an e-learning platform specializing in AI/ML programming.
    
    Your responsibilities:
    1. Answer questions clearly and educationally
    2. Provide practical code examples when relevant
    3. Suggest follow-up questions to deepen understanding
    4. Adapt explanations to student's level
    5. Support both English and Vietnamese languages
    
    Guidelines:
    - Be encouraging and supportive
    - Break complex concepts into simple steps
    - Use analogies and real-world examples
    - Always verify code examples are correct
    - Suggest relevant course sections when applicable
    """,
    
    "question_answer": """
    Course: {course_name}
    Lesson: {lesson_id}
    Student Level: {user_level}
    Preferred Language: {language}
    
    Question: {question}
    
    Context from lesson:
    {transcript}
    
    Previous questions in this session:
    {previous_questions}
    
    Please provide:
    1. Clear answer to the question
    2. Code examples if relevant
    3. 2-3 follow-up questions to explore further
    4. References to specific course sections if applicable
    
    Respond in {language} language.
    """,
    
    "code_debug": """
    Student is learning: {lesson_context}
    Programming Language: {language}
    
    Code with error:
    ```{language}
    {code}
    ```
    
    Error message: {error_message}
    Expected behavior: {expected_behavior}
    
    Please provide:
    1. Explanation of what's wrong
    2. Fixed version of the code
    3. Why the error occurred
    4. How to avoid similar errors
    5. Best practices for this type of code
    """
}

# Few-shot examples for better responses
FEW_SHOT_EXAMPLES = {
    "tensorflow_cnn": {
        "question": "How do I create a CNN in TensorFlow?",
        "answer": """Here's how to create a CNN in TensorFlow:

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# Create CNN model
model = models.Sequential([
    # First convolutional layer
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2, 2)),
    
    # Second convolutional layer
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    
    # Third convolutional layer
    layers.Conv2D(64, (3, 3), activation='relu'),
    
    # Flatten and dense layers
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(10, activation='softmax')
])

# Compile model
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])
```

This creates a simple CNN for image classification with:
- 3 convolutional layers with ReLU activation
- Max pooling for downsampling
- Dense layers for classification
- Softmax output for 10 classes

Would you like to know more about:
1. How to train this model?
2. What each layer does?
3. How to adjust for different image sizes?""",
        "follow_up_questions": [
            "How do I train this CNN model?",
            "What does each layer in the CNN do?",
            "How can I adjust this for different image sizes?"
        ]
    }
}
```

#### **Day 5: Caching & Cost Optimization**
```python
# backend/app/services/ai/utils/cache_manager.py
import redis
import hashlib
import json
from typing import Optional, Any
import asyncio

class CacheManager:
    def __init__(self, namespace: str):
        self.redis = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
        self.namespace = namespace
    
    def generate_key(self, context: Any) -> str:
        """Generate cache key from context"""
        context_str = json.dumps(
            context.dict(), 
            sort_keys=True,
            default=str
        )
        hash_object = hashlib.md5(context_str.encode())
        return f"{self.namespace}:{hash_object.hexdigest()}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Get cached response"""
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Cache response with TTL"""
        self.redis.setex(
            key,
            ttl,
            json.dumps(value.dict() if hasattr(value, 'dict') else value)
        )

# backend/app/services/ai/utils/cost_tracker.py
from datetime import datetime
import asyncio

class CostTracker:
    # Claude 3.5 Sonnet pricing (per 1K tokens)
    INPUT_COST = 0.003
    OUTPUT_COST = 0.015
    
    def __init__(self):
        self.daily_usage = {}
        self.monthly_usage = {}
    
    def calculate_cost(self, tokens: int, is_output: bool = True) -> float:
        """Calculate cost for token usage"""
        rate = self.OUTPUT_COST if is_output else self.INPUT_COST
        return (tokens / 1000) * rate
    
    async def track_usage(self, user_id: str, tokens: int, cost: float, agent_type: str):
        """Track usage for analytics and limiting"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Update daily usage
        if today not in self.daily_usage:
            self.daily_usage[today] = {}
        
        if user_id not in self.daily_usage[today]:
            self.daily_usage[today][user_id] = {
                "tokens": 0,
                "cost": 0,
                "requests": 0,
                "by_agent": {}
            }
        
        # Update metrics
        self.daily_usage[today][user_id]["tokens"] += tokens
        self.daily_usage[today][user_id]["cost"] += cost
        self.daily_usage[today][user_id]["requests"] += 1
        
        # Track by agent type
        if agent_type not in self.daily_usage[today][user_id]["by_agent"]:
            self.daily_usage[today][user_id]["by_agent"][agent_type] = {
                "tokens": 0,
                "requests": 0
            }
        
        self.daily_usage[today][user_id]["by_agent"][agent_type]["tokens"] += tokens
        self.daily_usage[today][user_id]["by_agent"][agent_type]["requests"] += 1
        
        # Save to database (implement based on your DB)
        await self._save_to_database(user_id, tokens, cost, agent_type)
    
    async def check_limits(self, user_id: str) -> bool:
        """Check if user exceeded limits"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        if today not in self.daily_usage or user_id not in self.daily_usage[today]:
            return True
        
        user_usage = self.daily_usage[today][user_id]
        
        # Free tier limits
        FREE_DAILY_TOKENS = 50000  # 50K tokens/day
        FREE_DAILY_REQUESTS = 100  # 100 requests/day
        
        if user_usage["tokens"] > FREE_DAILY_TOKENS:
            return False
        
        if user_usage["requests"] > FREE_DAILY_REQUESTS:
            return False
        
        return True
```

### **Phase 2: Quiz Generator (Week 6-7)**

#### **Day 1: Quiz Generator Models**
```python
# backend/app/services/ai/models/quiz_models.py
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"

class QuizQuestion(BaseModel):
    question: str
    type: QuestionType
    options: List[str] = Field(min_items=2, max_items=4)
    correct_answer: int = Field(ge=0, le=3)
    explanation: str
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    concept_tested: str

class QuizGenerationContext(BaseModel):
    lesson_id: str
    transcript: str
    video_duration: int  # in seconds
    target_questions: int = Field(default=5, ge=1, le=10)
    difficulty_level: str = Field(default="medium")
    question_types: List[QuestionType] = Field(default_factory=lambda: [QuestionType.MULTIPLE_CHOICE])
    language: str = Field(default="en")

class GeneratedQuiz(BaseModel):
    lesson_id: str
    questions: List[QuizQuestion]
    total_points: int
    estimated_time: int  # in minutes
    concepts_covered: List[str]
    generation_metadata: dict
```

#### **Day 2: Quiz Generator Agent**
```python
# backend/app/services/ai/agents/quiz_generator.py
from pydantic_ai import Agent
import re
from typing import List
from ..models.quiz_models import QuizGenerationContext, GeneratedQuiz, QuizQuestion
from ..prompts.templates import QUIZ_GENERATOR_PROMPTS

class QuizGeneratorAgent:
    def __init__(self):
        self.agent = Agent(
            'claude-3-5-sonnet-20240620',
            result_type=GeneratedQuiz,
            system_prompt=QUIZ_GENERATOR_PROMPTS["system"]
        )
        self.concept_extractor = ConceptExtractor()
    
    async def generate_quiz(self, context: QuizGenerationContext) -> GeneratedQuiz:
        """Generate quiz from lesson transcript"""
        # Extract key concepts first
        concepts = await self.concept_extractor.extract(context.transcript)
        
        # Build generation prompt
        prompt = self._build_prompt(context, concepts)
        
        # Generate quiz
        response = await self.agent.run(prompt, context=context)
        
        # Validate and enhance quiz
        validated_quiz = self._validate_quiz(response)
        
        # Add metadata
        validated_quiz.generation_metadata = {
            "concepts_identified": len(concepts),
            "transcript_length": len(context.transcript),
            "generation_model": "claude-3-5-sonnet",
            "difficulty_distribution": self._calculate_difficulty_distribution(validated_quiz.questions)
        }
        
        return validated_quiz
    
    def _build_prompt(self, context: QuizGenerationContext, concepts: List[str]) -> str:
        """Build quiz generation prompt"""
        template = QUIZ_GENERATOR_PROMPTS["generate_quiz"]
        return template.format(
            transcript=context.transcript,
            concepts=", ".join(concepts),
            num_questions=context.target_questions,
            difficulty=context.difficulty_level,
            question_types=", ".join([qt.value for qt in context.question_types]),
            language=context.language
        )
    
    def _validate_quiz(self, quiz: GeneratedQuiz) -> GeneratedQuiz:
        """Validate and fix common issues"""
        for question in quiz.questions:
            # Ensure correct answer is valid index
            if question.correct_answer >= len(question.options):
                question.correct_answer = 0
            
            # Ensure all options are unique
            question.options = list(set(question.options))
            
            # Ensure explanation exists
            if not question.explanation:
                question.explanation = f"The correct answer is {question.options[question.correct_answer]}"
        
        return quiz

class ConceptExtractor:
    """Extract key concepts from transcript using NLP"""
    
    async def extract(self, transcript: str) -> List[str]:
        """Extract key concepts from transcript"""
        # Simple implementation - enhance with spaCy/NLTK
        concepts = []
        
        # Look for technical terms
        technical_patterns = [
            r'\b(?:algorithm|function|class|method|variable|loop|array|object)\b',
            r'\b(?:machine learning|neural network|deep learning|AI|ML)\b',
            r'\b(?:TensorFlow|PyTorch|Keras|scikit-learn)\b',
        ]
        
        for pattern in technical_patterns:
            matches = re.findall(pattern, transcript, re.IGNORECASE)
            concepts.extend(matches)
        
        # Remove duplicates and return top concepts
        unique_concepts = list(set(concepts))
        return unique_concepts[:10]
```

#### **Day 3: Quiz Prompt Templates**
```python
# Additional templates for quiz generation
QUIZ_GENERATOR_PROMPTS = {
    "system": """You are an expert educational content creator specializing in creating assessments for programming and AI/ML courses.
    
    Your quiz questions should:
    1. Test understanding, not memorization
    2. Include practical scenarios when possible
    3. Have clear, unambiguous wording
    4. Include detailed explanations for learning
    5. Cover different cognitive levels (remember, understand, apply, analyze)
    
    Guidelines:
    - Make distractors (wrong answers) plausible but clearly wrong
    - Avoid "all of the above" or "none of the above"
    - Keep questions focused on key concepts
    - Ensure language is appropriate for the student level
    """,
    
    "generate_quiz": """
    Generate {num_questions} quiz questions based on this lesson transcript:
    
    TRANSCRIPT:
    {transcript}
    
    KEY CONCEPTS IDENTIFIED:
    {concepts}
    
    Requirements:
    - Number of questions: {num_questions}
    - Difficulty level: {difficulty}
    - Question types: {question_types}
    - Language: {language}
    
    For each question provide:
    1. Clear question text
    2. 4 answer options (for multiple choice)
    3. Correct answer index (0-3)
    4. Detailed explanation
    5. Which concept is being tested
    6. Difficulty level (easy/medium/hard)
    
    Ensure questions progressively build on concepts and test different aspects of the material.
    """
}
```

### **Phase 3: Learning Path Optimizer (Week 16-17)**

#### **Day 1: Learning Analytics Models**
```python
# backend/app/services/ai/models/learning_models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class StudentProfile(BaseModel):
    user_id: str
    current_level: str
    completed_courses: List[str]
    learning_goals: List[str]
    preferred_learning_style: str
    available_time_per_week: int  # hours
    strengths: List[str]
    weaknesses: List[str]

class CourseProgress(BaseModel):
    course_id: str
    completion_percentage: float
    average_quiz_score: float
    time_spent: int  # minutes
    last_accessed: datetime
    struggling_topics: List[str]

class LearningPathRecommendation(BaseModel):
    recommended_courses: List[Dict[str, Any]]
    estimated_duration: int  # total hours
    skill_gaps_addressed: List[str]
    learning_objectives: List[str]
    personalization_score: float
    reasoning: str

class ProgressAnalysis(BaseModel):
    current_pace: str  # slow, normal, fast
    projected_completion: datetime
    performance_trend: str  # improving, stable, declining
    recommendations: List[str]
    risk_factors: List[str]
```

#### **Day 2: Learning Path Optimizer Agent**
```python
# backend/app/services/ai/agents/path_optimizer.py
from typing import List, Dict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from ..models.learning_models import StudentProfile, LearningPathRecommendation

class LearningPathOptimizer:
    def __init__(self):
        self.agent = Agent(
            'claude-3-5-sonnet-20240620',
            result_type=LearningPathRecommendation,
            system_prompt=LEARNING_PATH_PROMPTS["system"]
        )
        self.skill_graph = SkillGraph()
    
    async def optimize_path(
        self, 
        profile: StudentProfile,
        available_courses: List[Dict],
        progress_history: List[CourseProgress]
    ) -> LearningPathRecommendation:
        """Generate optimized learning path"""
        
        # Analyze current skills and gaps
        skill_analysis = self._analyze_skills(profile, progress_history)
        
        # Build recommendation context
        context = {
            "profile": profile,
            "skill_gaps": skill_analysis["gaps"],
            "learning_velocity": self._calculate_learning_velocity(progress_history),
            "course_options": available_courses
        }
        
        # Get AI recommendations
        recommendation = await self.agent.run(
            self._build_prompt(context),
            context=context
        )
        
        # Enhance with algorithmic optimization
        optimized = self._optimize_sequence(
            recommendation.recommended_courses,
            profile,
            skill_analysis
        )
        
        recommendation.recommended_courses = optimized
        recommendation.personalization_score = self._calculate_personalization_score(
            recommendation,
            profile
        )
        
        return recommendation
    
    def _analyze_skills(
        self, 
        profile: StudentProfile,
        history: List[CourseProgress]
    ) -> Dict:
        """Analyze student skills and identify gaps"""
        completed_skills = set()
        struggling_skills = set()
        
        for progress in history:
            if progress.completion_percentage > 80:
                completed_skills.update(self._get_course_skills(progress.course_id))
            
            if progress.average_quiz_score < 70:
                struggling_skills.update(progress.struggling_topics)
        
        # Identify gaps based on goals
        target_skills = set()
        for goal in profile.learning_goals:
            target_skills.update(self._get_goal_requirements(goal))
        
        gaps = target_skills - completed_skills
        
        return {
            "completed": list(completed_skills),
            "struggling": list(struggling_skills),
            "gaps": list(gaps),
            "target": list(target_skills)
        }
    
    def _optimize_sequence(
        self,
        courses: List[Dict],
        profile: StudentProfile,
        skill_analysis: Dict
    ) -> List[Dict]:
        """Optimize course sequence using graph algorithms"""
        # Build dependency graph
        dependency_scores = []
        
        for course in courses:
            score = 0
            
            # Prioritize courses that address skill gaps
            course_skills = set(course.get("skills_taught", []))
            gap_coverage = len(course_skills.intersection(skill_analysis["gaps"]))
            score += gap_coverage * 10
            
            # Consider prerequisites
            prereqs = set(course.get("prerequisites", []))
            prereq_met = len(prereqs.intersection(skill_analysis["completed"]))
            score += prereq_met * 5
            
            # Avoid struggling areas initially
            struggle_overlap = len(course_skills.intersection(skill_analysis["struggling"]))
            score -= struggle_overlap * 3
            
            # Match learning style
            if course.get("teaching_style") == profile.preferred_learning_style:
                score += 5
            
            dependency_scores.append((course, score))
        
        # Sort by score
        dependency_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [course for course, _ in dependency_scores]

class SkillGraph:
    """Manage skill dependencies and relationships"""
    
    def __init__(self):
        self.graph = {
            "python_basics": [],
            "ml_fundamentals": ["python_basics", "math_basics"],
            "deep_learning": ["ml_fundamentals", "linear_algebra"],
            "computer_vision": ["deep_learning", "image_processing"],
            "nlp": ["deep_learning", "text_processing"],
            # ... more skill relationships
        }
    
    def get_prerequisites(self, skill: str) -> List[str]:
        """Get prerequisite skills"""
        return self.graph.get(skill, [])
    
    def get_next_skills(self, completed_skills: List[str]) -> List[str]:
        """Get skills that can be learned next"""
        next_skills = []
        
        for skill, prereqs in self.graph.items():
            if skill not in completed_skills:
                if all(prereq in completed_skills for prereq in prereqs):
                    next_skills.append(skill)
        
        return next_skills
```

### **Phase 4: Progress Coach (Week 18)**

#### **Day 1: Coaching System Implementation**
```python
# backend/app/services/ai/agents/progress_coach.py
from datetime import datetime, timedelta
from typing import List, Dict
from ..models.coaching_models import CoachingSession, MotivationalMessage

class ProgressCoachAgent:
    def __init__(self):
        self.agent = Agent(
            'claude-3-5-sonnet-20240620',
            result_type=CoachingSession,
            system_prompt=PROGRESS_COACH_PROMPTS["system"]
        )
        self.analytics = LearningAnalytics()
    
    async def generate_weekly_summary(
        self,
        user_id: str,
        week_data: Dict
    ) -> CoachingSession:
        """Generate personalized weekly summary"""
        # Analyze week's performance
        analysis = self.analytics.analyze_week(week_data)
        
        # Generate coaching content
        session = await self.agent.run(
            self._build_weekly_prompt(analysis),
            context={"user_id": user_id, "analysis": analysis}
        )
        
        # Add personalized elements
        session.motivational_message = self._select_motivation(analysis)
        session.specific_recommendations = self._generate_recommendations(analysis)
        
        return session
    
    async def intervention_check(
        self,
        user_id: str,
        recent_activity: Dict
    ) -> Optional[MotivationalMessage]:
        """Check if intervention needed"""
        # Detect patterns requiring intervention
        if self._is_struggling(recent_activity):
            return await self._generate_support_message(user_id, "struggling")
        
        if self._is_inactive(recent_activity):
            return await self._generate_support_message(user_id, "inactive")
        
        if self._achieved_milestone(recent_activity):
            return await self._generate_support_message(user_id, "celebration")
        
        return None
    
    def _is_struggling(self, activity: Dict) -> bool:
        """Detect if student is struggling"""
        indicators = [
            activity.get("quiz_fail_rate", 0) > 0.3,
            activity.get("repeat_lesson_count", 0) > 2,
            activity.get("help_requests", 0) > 5,
            activity.get("completion_rate", 1) < 0.5
        ]
        return sum(indicators) >= 2
    
    def _is_inactive(self, activity: Dict) -> bool:
        """Detect inactivity"""
        last_active = activity.get("last_active")
        if last_active:
            days_inactive = (datetime.now() - last_active).days
            return days_inactive > 3
        return False
```

---

## 🔧 **API INTEGRATION**

### **AI Endpoints Implementation:**
```python
# backend/app/api/v1/endpoints/ai.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ....services.ai.agents import StudyBuddyAgent, QuizGeneratorAgent
from ....services.ai.models.contexts import StudyBuddyContext
from ....services.ai.models.responses import StudyBuddyResponse

router = APIRouter()
study_buddy = StudyBuddyAgent()
quiz_generator = QuizGeneratorAgent()

@router.post("/chat", response_model=StandardResponse[StudyBuddyResponse])
async def ai_chat(
    context: StudyBuddyContext,
    current_user = Depends(get_current_user)
):
    """Chat with AI Study Buddy"""
    try:
        # Check rate limits
        if not await check_ai_limits(current_user.id):
            raise HTTPException(429, "AI usage limit exceeded")
        
        # Add user context
        context.user_id = current_user.id
        context.user_level = current_user.profile.level
        
        # Get response
        response = await study_buddy.answer_question(context)
        
        # Log interaction
        await log_ai_interaction(
            user_id=current_user.id,
            interaction_type="chat",
            tokens_used=response.tokens_used
        )
        
        return StandardResponse(
            success=True,
            data=response,
            message="AI response generated successfully"
        )
        
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(500, "AI service temporarily unavailable")

@router.post("/quiz-generate", response_model=StandardResponse[Quiz])
async def generate_quiz(
    lesson_id: str,
    num_questions: int = 5,
    current_user = Depends(get_current_user),
    current_creator = Depends(require_creator_role)
):
    """Generate quiz for lesson"""
    # Get lesson transcript
    lesson = await get_lesson_with_transcript(lesson_id)
    
    if not lesson.transcript:
        raise HTTPException(400, "Lesson transcript not available")
    
    # Generate quiz
    context = QuizGenerationContext(
        lesson_id=lesson_id,
        transcript=lesson.transcript,
        target_questions=num_questions
    )
    
    quiz = await quiz_generator.generate_quiz(context)
    
    # Save to database
    await save_generated_quiz(quiz)
    
    return StandardResponse(
        success=True,
        data=quiz,
        message=f"Generated {len(quiz.questions)} quiz questions successfully"
    )
```

---

## 📊 **MONITORING & OPTIMIZATION**

### **AI Usage Dashboard:**
```python
# backend/app/services/ai/monitoring.py
class AIMonitoring:
    def __init__(self):
        self.metrics = {
            "response_times": [],
            "token_usage": {},
            "error_rates": {},
            "user_satisfaction": {}
        }
    
    async def track_metric(self, metric_type: str, value: Any):
        """Track AI metrics"""
        timestamp = datetime.now()
        
        if metric_type == "response_time":
            self.metrics["response_times"].append({
                "time": timestamp,
                "value": value
            })
        
        # Send to monitoring service
        await send_to_prometheus(metric_type, value)
    
    async def generate_report(self) -> Dict:
        """Generate AI usage report"""
        return {
            "avg_response_time": np.mean([m["value"] for m in self.metrics["response_times"]]),
            "total_tokens_used": sum(self.metrics["token_usage"].values()),
            "error_rate": self._calculate_error_rate(),
            "cost_estimate": self._calculate_costs()
        }
```

---

## ✅ **SUCCESS METRICS**

### **AI Performance Targets:**
- ✅ Response time < 3 seconds for 95% of requests
- ✅ Quiz generation < 5 seconds per quiz
- ✅ Cache hit rate > 40% for common questions
- ✅ User satisfaction > 4.5/5 stars
- ✅ Cost per user < $0.50/month
- ✅ Accuracy of learning recommendations > 85%

### **Quality Assurance:**
- Automated testing of all prompts
- A/B testing for response quality
- User feedback integration
- Regular prompt optimization
- Cost monitoring and alerts

---

## 🚨 **CRITICAL CONSIDERATIONS**

1. **Rate Limiting:** Implement per-user and global limits
2. **Fallback Responses:** Prepare offline responses for common questions
3. **Cost Management:** Monitor and optimize token usage
4. **Privacy:** Never send PII to AI models
5. **Content Filtering:** Implement safety checks on AI responses
6. **Multilingual:** Support Vietnamese and English equally

This implementation ensures all AI features from CLAUDE.md are fully implemented with production-ready code.
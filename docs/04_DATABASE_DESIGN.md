# 🗂️ Database Design - MongoDB Schemas

## 📊 User Schema (users collection)

```javascript
{
  _id: ObjectId,
  email: { unique: true, required: true, index: true },
  password: { required: true }, // bcrypt hashed
  name: { required: true },
  role: { 
    enum: ['student', 'creator', 'admin'], 
    default: 'student',
    index: true 
  },
  premium_status: { default: false, index: true },
  is_verified: { default: false },
  verification_token: String,
  reset_password_token: String,
  reset_password_expires: Date,
  
  // Subscription
  subscription: {
    type: { enum: ['free', 'pro'], default: 'free' },
    status: { 
      enum: ['active', 'inactive', 'cancelled', 'past_due'], 
      default: 'inactive' 
    },
    stripe_customer_id: String,
    stripe_subscription_id: String,
    current_period_start: Date,
    current_period_end: Date,
    cancel_at_period_end: { default: false }
  },
  
  // Profile
  profile: {
    avatar: String,
    bio: String,
    location: String,
    linkedin: String,
    github: String,
    website: String,
    title: String,
    skills: [String],
    learning_goals: [String]
  },
  
  // Statistics
  stats: {
    courses_enrolled: { default: 0 },
    courses_completed: { default: 0 },
    total_hours_learned: { default: 0 },
    certificates_earned: { default: 0 },
    current_streak: { default: 0 },
    longest_streak: { default: 0 },
    last_active: Date
  },
  
  // Preferences
  preferences: {
    language: { default: 'vi' },
    timezone: { default: 'Asia/Ho_Chi_Minh' },
    email_notifications: { default: true },
    push_notifications: { default: true },
    marketing_emails: { default: false }
  },
  
  created_at: Date,
  updated_at: Date,
  last_login: Date
}

// Indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "premium_status": 1 });
db.users.createIndex({ "subscription.status": 1 });
db.users.createIndex({ "created_at": -1 });
```

## 📚 Course Schema (courses collection)

```javascript
{
  _id: ObjectId,
  title: { required: true },
  description: { required: true },
  short_description: String,
  slug: { unique: true, index: true },
  
  // Metadata
  category: { 
    enum: ['programming', 'ai-fundamentals', 'machine-learning', 'ai-tools', 'production-ai'],
    required: true,
    index: true 
  },
  level: { 
    enum: ['beginner', 'intermediate', 'advanced'], 
    required: true,
    index: true 
  },
  language: { default: 'vi' },
  
  // Creator
  creator_id: { ref: 'User', required: true, index: true },
  creator_name: String, // Denormalized
  
  // Content
  thumbnail: String,
  preview_video: String,
  syllabus: [String],
  prerequisites: [String],
  target_audience: [String],
  
  // Pricing
  pricing: {
    is_free: { default: false, index: true },
    price: { default: 0 },
    currency: { default: 'USD' },
    discount_price: Number,
    discount_expires: Date
  },
  
  // Structure
  total_chapters: { default: 0 },
  total_lessons: { default: 0 },
  total_duration: { default: 0 }, // minutes
  
  // Status
  status: { 
    enum: ['draft', 'review', 'published', 'archived'], 
    default: 'draft',
    index: true 
  },
  published_at: Date,
  
  // Statistics
  stats: {
    total_enrollments: { default: 0 },
    active_students: { default: 0 },
    completion_rate: { default: 0 },
    average_rating: { default: 0 },
    total_reviews: { default: 0 },
    total_revenue: { default: 0 }
  },
  
  // SEO
  seo: {
    meta_title: String,
    meta_description: String,
    keywords: [String]
  },
  
  created_at: Date,
  updated_at: Date
}

// Indexes
db.courses.createIndex({ "creator_id": 1 });
db.courses.createIndex({ "category": 1, "level": 1 });
db.courses.createIndex({ "status": 1 });
db.courses.createIndex({ "pricing.is_free": 1 });
db.courses.createIndex({ "stats.total_enrollments": -1 });
db.courses.createIndex({ "created_at": -1 });
```

## 📖 Chapter Schema (chapters collection)

```javascript
{
  _id: ObjectId,
  course_id: { ref: 'Course', required: true, index: true },
  title: { required: true },
  description: String,
  order: { required: true },
  total_lessons: { default: 0 },
  total_duration: { default: 0 }, // minutes
  status: { 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  created_at: Date,
  updated_at: Date
}

// Indexes
db.chapters.createIndex({ "course_id": 1, "order": 1 });
```

## 🎬 Lesson Schema (lessons collection)

```javascript
{
  _id: ObjectId,
  course_id: { ref: 'Course', required: true, index: true },
  chapter_id: { ref: 'Chapter', required: true, index: true },
  title: { required: true },
  description: String,
  order: { required: true },
  
  // Video
  video: {
    url: String,
    youtube_id: String,
    duration: Number, // seconds
    transcript: String,
    captions: String,
    thumbnail: String
  },
  
  // Content
  content: String,
  resources: [{
    title: String,
    type: { enum: ['pdf', 'code', 'link', 'exercise'] },
    url: String,
    description: String
  }],
  
  // Quiz
  has_quiz: { default: false },
  quiz_required: { default: false },
  
  // Sequential learning
  unlock_conditions: {
    previous_lesson_required: { default: true },
    quiz_pass_required: { default: false },
    minimum_watch_percentage: { default: 80 }
  },
  
  status: { 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  created_at: Date,
  updated_at: Date
}

// Indexes
db.lessons.createIndex({ "course_id": 1 });
db.lessons.createIndex({ "chapter_id": 1, "order": 1 });
```

## ❓ Quiz Schema (quizzes collection)

```javascript
{
  _id: ObjectId,
  lesson_id: { ref: 'Lesson', required: true, index: true },
  course_id: { ref: 'Course', required: true, index: true },
  title: { required: true },
  description: String,
  
  // Configuration
  config: {
    time_limit: Number, // minutes
    pass_percentage: { default: 70 },
    max_attempts: { default: 3 },
    shuffle_questions: { default: true },
    shuffle_answers: { default: true },
    show_correct_answers: { default: true },
    immediate_feedback: { default: true }
  },
  
  // Questions
  questions: [{
    question: { required: true },
    type: { 
      enum: ['multiple_choice', 'true_false', 'fill_blank'], 
      default: 'multiple_choice' 
    },
    options: [String],
    correct_answer: Number, // Index
    explanation: String,
    points: { default: 1 }
  }],
  
  total_points: { default: 0 },
  created_at: Date,
  updated_at: Date
}

// Indexes
db.quizzes.createIndex({ "lesson_id": 1 });
db.quizzes.createIndex({ "course_id": 1 });
```

## 📈 Progress Schema (progress collection)

```javascript
{
  _id: ObjectId,
  user_id: { ref: 'User', required: true, index: true },
  course_id: { ref: 'Course', required: true, index: true },
  lesson_id: { ref: 'Lesson', required: true, index: true },
  
  // Video progress
  video_progress: {
    watch_percentage: { default: 0 }, // 0-100
    current_position: { default: 0 }, // seconds
    total_watch_time: { default: 0 }, // seconds
    is_completed: { default: false },
    completed_at: Date
  },
  
  // Quiz progress
  quiz_progress: {
    attempts: [{
      attempt_number: Number,
      score: Number, // 0-100
      total_questions: Number,
      correct_answers: Number,
      time_taken: Number, // seconds
      passed: Boolean,
      answers: [Number],
      attempted_at: Date
    }],
    best_score: { default: 0 },
    total_attempts: { default: 0 },
    is_passed: { default: false },
    passed_at: Date
  },
  
  // Status
  is_unlocked: { default: false },
  is_completed: { default: false },
  
  // Timestamps
  started_at: Date,
  completed_at: Date,
  last_accessed: Date,
  created_at: Date,
  updated_at: Date
}

// Indexes
db.progress.createIndex({ "user_id": 1, "course_id": 1 });
db.progress.createIndex({ "user_id": 1, "lesson_id": 1 });
db.progress.createIndex({ "course_id": 1, "lesson_id": 1 });
```

## 💳 Payment Schema (payments collection)

```javascript
{
  _id: ObjectId,
  user_id: { ref: 'User', required: true, index: true },
  
  // Details
  type: { 
    enum: ['course_purchase', 'subscription', 'refund'], 
    required: true,
    index: true 
  },
  amount: { required: true },
  currency: { default: 'USD' },
  
  // Related
  course_id: { ref: 'Course' },
  subscription_id: String,
  
  // Provider
  provider: { 
    enum: ['stripe', 'momo', 'zalopay'], 
    required: true 
  },
  provider_payment_id: String,
  provider_customer_id: String,
  
  // Status
  status: { 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'], 
    default: 'pending',
    index: true 
  },
  
  // Metadata
  metadata: {
    payment_method: String,
    last_4_digits: String,
    brand: String,
    country: String
  },
  
  // Timestamps
  paid_at: Date,
  refunded_at: Date,
  created_at: Date,
  updated_at: Date
}

// Indexes
db.payments.createIndex({ "user_id": 1, "status": 1 });
db.payments.createIndex({ "type": 1, "status": 1 });
db.payments.createIndex({ "created_at": -1 });
```

## 🎓 Enrollment Schema (enrollments collection)

```javascript
{
  _id: ObjectId,
  user_id: { ref: 'User', required: true, index: true },
  course_id: { ref: 'Course', required: true, index: true },
  
  // Details
  enrollment_type: { 
    enum: ['free', 'purchased', 'subscription', 'admin_granted'], 
    required: true 
  },
  payment_id: { ref: 'Payment' },
  
  // Progress
  progress: {
    lessons_completed: { default: 0 },
    total_lessons: { default: 0 },
    completion_percentage: { default: 0 },
    total_watch_time: { default: 0 }, // minutes
    current_lesson_id: { ref: 'Lesson' },
    is_completed: { default: false },
    completed_at: Date
  },
  
  // Certificate
  certificate: {
    is_issued: { default: false },
    issued_at: Date,
    certificate_id: String,
    final_score: Number,
    verification_url: String
  },
  
  // Access
  is_active: { default: true },
  expires_at: Date,
  
  enrolled_at: Date,
  last_accessed: Date,
  updated_at: Date
}

// Indexes
db.enrollments.createIndex({ "user_id": 1, "course_id": 1 }, { unique: true });
db.enrollments.createIndex({ "course_id": 1 });
db.enrollments.createIndex({ "enrolled_at": -1 });
```

## ❓ FAQ Schema (faqs collection)

```javascript
{
  _id: ObjectId,
  question: { required: true },
  answer: { required: true },
  
  category: { 
    enum: ['general', 'pricing', 'learning', 'technical', 'creator', 'admin'],
    required: true,
    index: true 
  },
  priority: { default: 0 },
  
  tags: [String],
  related_faqs: [{ ref: 'FAQ' }],
  
  // Analytics
  view_count: { default: 0 },
  helpful_votes: { default: 0 },
  unhelpful_votes: { default: 0 },
  
  is_published: { default: true, index: true },
  slug: { unique: true },
  
  created_at: Date,
  updated_at: Date
}

// Indexes
db.faqs.createIndex({ "category": 1, "priority": -1 });
db.faqs.createIndex({ "is_published": 1 });
```
'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Brain, Target, TrendingUp, MessageSquare, Award, Clock } from 'lucide-react';

interface LearningAnalyticsData {
  totalQuestions: number;
  questionsToday: number;
  averageResponseTime: number;
  topicsDiscussed: { topic: string; count: number; }[];
  learningGoals: {
    goal: string;
    progress: number;
    questionsAsked: number;
  }[];
  difficultyDistribution: {
    simple: number;
    detailed: number;
    technical: number;
  };
  weeklyActivity: {
    day: string;
    questions: number;
    goals: number;
  }[];
}

interface AILearningAnalyticsProps {
  userId: string;
  courseId?: string;
  className?: string;
}

export const AILearningAnalytics: React.FC<AILearningAnalyticsProps> = ({
  userId,
  courseId,
  className = ''
}) => {
  const [analyticsData, setAnalyticsData] = useState<LearningAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchAnalyticsData();
  }, [userId, courseId, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - would fetch from API
      const mockData: LearningAnalyticsData = {
        totalQuestions: 47,
        questionsToday: 8,
        averageResponseTime: 2.3,
        topicsDiscussed: [
          { topic: 'Machine Learning', count: 15 },
          { topic: 'Python Programming', count: 12 },
          { topic: 'Data Structures', count: 8 },
          { topic: 'Neural Networks', count: 7 },
          { topic: 'API Development', count: 5 }
        ],
        learningGoals: [
          {
            goal: 'Master Python fundamentals',
            progress: 75,
            questionsAsked: 12
          },
          {
            goal: 'Understand machine learning',
            progress: 45,
            questionsAsked: 8
          },
          {
            goal: 'Build web applications',
            progress: 30,
            questionsAsked: 5
          }
        ],
        difficultyDistribution: {
          simple: 20,
          detailed: 65,
          technical: 15
        },
        weeklyActivity: [
          { day: 'Mon', questions: 5, goals: 1 },
          { day: 'Tue', questions: 8, goals: 2 },
          { day: 'Wed', questions: 12, goals: 0 },
          { day: 'Thu', questions: 6, goals: 1 },
          { day: 'Fri', questions: 10, goals: 3 },
          { day: 'Sat', questions: 4, goals: 0 },
          { day: 'Sun', questions: 2, goals: 1 }
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (index: number) => {
    const colorMap = [
      'bg-primary',
      'bg-success', 
      'bg-warning',
      'bg-warning/80',
      'bg-primary/60'
    ];
    return colorMap[index % colorMap.length];
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available yet.</p>
        <p className="text-sm text-muted-foreground">Start chatting with your AI Study Buddy to see insights!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          AI Learning Analytics
        </h2>
        
        <div className="flex space-x-2">
          {(['week', 'month', 'all'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="capitalize"
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold text-foreground">{analyticsData.totalQuestions}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Questions Today</p>
              <p className="text-2xl font-bold text-success">{analyticsData.questionsToday}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Learning Goals</p>
              <p className="text-2xl font-bold text-primary">{analyticsData.learningGoals.length}</p>
            </div>
            <Target className="w-8 h-8 text-primary" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold text-warning">{analyticsData.averageResponseTime}s</p>
            </div>
            <Clock className="w-8 h-8 text-warning" />
          </div>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Learning Activity</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analyticsData.weeklyActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="questions" fill="hsl(var(--primary))" name="Questions Asked" />
            <Bar dataKey="goals" fill="hsl(var(--success))" name="Goals Added" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Goals Progress */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Learning Goals Progress
          </h3>
          <div className="space-y-4">
            {analyticsData.learningGoals.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{goal.goal}</span>
                  <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">{goal.questionsAsked} questions asked</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Topics Discussed */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Discussed Topics</h3>
          <div className="space-y-3">
            {analyticsData.topicsDiscussed.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${getColorClasses(index)}`}
                  ></div>
                  <span className="text-sm font-medium text-foreground">{topic.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{topic.count}</span>
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getColorClasses(index)}`}
                      style={{ 
                        width: `${(topic.count / Math.max(...analyticsData.topicsDiscussed.map(t => t.count))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Response Style Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Response Style Preferences</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{analyticsData.difficultyDistribution.simple}%</div>
            <div className="text-sm text-muted-foreground">Simple</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{analyticsData.difficultyDistribution.detailed}%</div>
            <div className="text-sm text-muted-foreground">Detailed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{analyticsData.difficultyDistribution.technical}%</div>
            <div className="text-sm text-muted-foreground">Technical</div>
          </div>
        </div>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          AI Learning Insights
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <p className="text-foreground">
              You're most active on <strong>Tuesday and Friday</strong> - consider scheduling important study sessions on these days.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
            <p className="text-foreground">
              Your <strong>Machine Learning</strong> questions show great depth - you're ready for advanced topics in this area.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <p className="text-foreground">
              Consider adding more specific learning goals to track your progress in <strong>API Development</strong>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
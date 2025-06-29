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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available yet.</p>
        <p className="text-sm text-gray-500">Start chatting with your AI Study Buddy to see insights!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
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
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalQuestions}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Questions Today</p>
              <p className="text-2xl font-bold text-green-600">{analyticsData.questionsToday}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Learning Goals</p>
              <p className="text-2xl font-bold text-purple-600">{analyticsData.learningGoals.length}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-orange-600">{analyticsData.averageResponseTime}s</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
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
            <Bar dataKey="questions" fill="#3B82F6" name="Questions Asked" />
            <Bar dataKey="goals" fill="#10B981" name="Goals Added" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Goals Progress */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Learning Goals Progress
          </h3>
          <div className="space-y-4">
            {analyticsData.learningGoals.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{goal.goal}</span>
                  <span className="text-sm text-gray-500">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{goal.questionsAsked} questions asked</p>
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
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{topic.count}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(topic.count / Math.max(...analyticsData.topicsDiscussed.map(t => t.count))) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
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
            <div className="text-2xl font-bold text-green-600">{analyticsData.difficultyDistribution.simple}%</div>
            <div className="text-sm text-gray-600">Simple</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analyticsData.difficultyDistribution.detailed}%</div>
            <div className="text-sm text-gray-600">Detailed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analyticsData.difficultyDistribution.technical}%</div>
            <div className="text-sm text-gray-600">Technical</div>
          </div>
        </div>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          AI Learning Insights
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              You're most active on <strong>Tuesday and Friday</strong> - consider scheduling important study sessions on these days.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              Your <strong>Machine Learning</strong> questions show great depth - you're ready for advanced topics in this area.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
            <p className="text-gray-700">
              Consider adding more specific learning goals to track your progress in <strong>API Development</strong>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
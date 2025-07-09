// Modern Component Patterns for AI E-Learning
// File: frontend/components/ui/modern/ModernComponents.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Users, Star, ArrowRight, BookOpen, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== MODERN COURSE CARD ====================
interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  progress?: number;
  isEnrolled?: boolean;
  isPremium?: boolean;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
  onClick?: () => void;
}

export const ModernCourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  description,
  thumbnail,
  instructor,
  duration,
  students,
  rating,
  price,
  level,
  category,
  progress,
  isEnrolled = false,
  isPremium = false,
  variant = 'default',
  className,
  onClick
}) => {
  const cardVariants = {
    default: "group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
    featured: "group relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2",
    compact: "group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
  };

  const levelColors = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-yellow-100 text-yellow-800", 
    Advanced: "bg-red-100 text-red-800"
  };

  return (
    <motion.div
      className={cn(cardVariants[variant], className)}
      onClick={onClick}
      whileHover={{ scale: variant === 'compact' ? 1.02 : 1.03 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          ⭐ PREMIUM
        </div>
      )}

      {/* Thumbnail Section */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.div
            className="bg-white/90 rounded-full p-4 shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Play className="w-8 h-8 text-blue-600 fill-current" />
          </motion.div>
        </div>

        {/* Progress Bar (for enrolled courses) */}
        {isEnrolled && progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        )}

        {/* Category Tag */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
          {category}
        </div>
      </div>

      {/* Content Section */}
      <div className={cn("p-6", variant === 'compact' && "p-4")}>
        {/* Level Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", levelColors[level])}>
            {level}
          </span>
          {isEnrolled && (
            <span className="text-blue-600 text-xs font-medium">Continue Learning</span>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          "font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors",
          variant === 'compact' ? "text-lg" : "text-xl"
        )}>
          {title}
        </h3>

        {/* Description */}
        {variant !== 'compact' && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Instructor */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
            {instructor.charAt(0)}
          </div>
          <span className="text-gray-700 text-sm font-medium">{instructor}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{students.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
            </div>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {price === 0 ? (
              <span className="text-xl font-bold text-green-600">Free</span>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">${price}</span>
                {isPremium && (
                  <span className="text-sm text-gray-500 line-through">${price * 1.5}</span>
                )}
              </div>
            )}
          </div>
          
          <motion.button
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
              isEnrolled 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 group-hover:bg-blue-600 group-hover:text-white"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm">
              {isEnrolled ? 'Continue' : 'Enroll Now'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== GLASSMORPHISM CARD ====================
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'colored';
  blur?: 'sm' | 'md' | 'lg';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'light',
  blur = 'md'
}) => {
  const variants = {
    light: 'bg-white/10 border-white/20',
    dark: 'bg-black/10 border-black/20',
    colored: 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20'
  };

  const blurs = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };

  return (
    <motion.div
      className={cn(
        "rounded-2xl border shadow-xl transition-all duration-300",
        variants[variant],
        blurs[blur],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

// ==================== PROGRESS RING ====================
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div 
      className={cn("relative inline-flex items-center justify-center", className)}
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Percentage text */}
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-2xl font-bold text-gray-700">
            {Math.round(progress)}%
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

// ==================== ANIMATED BUTTON ====================
interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className,
  onClick
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={cn(
        "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        </motion.div>
      )}
      
      {/* Icon */}
      {icon && !loading && (
        <motion.div 
          className="mr-2"
          whileHover={{ rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      )}
      
      {/* Button text */}
      <span>{children}</span>
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-lg overflow-hidden"
        whileTap={!disabled ? { 
          background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" 
        } : {}}
      />
    </motion.button>
  );
};

// ==================== STATS CARD ====================
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  variant = 'default',
  className
}) => {
  const variants = {
    default: 'from-blue-500 to-blue-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-orange-500',
    error: 'from-red-500 to-red-600'
  };

  return (
    <motion.div
      className={cn("bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <motion.p 
              className="text-3xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {value}
            </motion.p>
            {change !== undefined && (
              <motion.div 
                className={cn(
                  "flex items-center mt-2 text-sm",
                  change >= 0 ? "text-green-600" : "text-red-600"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <TrendingUp className={cn("w-4 h-4 mr-1", change < 0 && "rotate-180")} />
                <span>{Math.abs(change)}% {change >= 0 ? 'increase' : 'decrease'}</span>
              </motion.div>
            )}
          </div>
          
          <div className={cn("p-3 rounded-xl bg-gradient-to-br", variants[variant])}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== EXPORT ALIASES ====================
// Export AnimatedButton as ModernButton for consistency
export const ModernButton = AnimatedButton;
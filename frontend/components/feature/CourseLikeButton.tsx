'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCourseReactionStatus, useToggleCourseReaction } from '@/hooks/queries/useCourseLikes';
import { ToastService } from '@/lib/toast/ToastService';
import type { ReactionType } from '@/lib/types/course-like';

// CSS for micro-interactions - injected once
const reactionStyles = `
  @keyframes reaction-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  @keyframes reaction-burst {
    0% {
      transform: scale(0.5);
      opacity: 0.6;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  .reaction-icon {
    transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
                fill 200ms ease-out,
                color 200ms ease-out;
  }

  .reaction-icon.pop {
    animation: reaction-pop 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .reaction-burst-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
  }

  .reaction-burst-ring.burst {
    animation: reaction-burst 400ms ease-out forwards;
  }

  .reaction-burst-ring.like {
    border: 2px solid rgb(96, 165, 250);
  }

  .reaction-burst-ring.dislike {
    border: 2px solid rgb(248, 113, 113);
  }
`;

interface CourseReactionButtonsProps {
  courseId: string;
  className?: string;
}

/**
 * YouTube-style Like/Dislike buttons for courses
 */
export function CourseReactionButtons({
  courseId,
  className = ''
}: CourseReactionButtonsProps) {
  const { data: reactionData, loading: isLoading } = useCourseReactionStatus(courseId);
  const { mutate: toggleReaction, loading: isPending } = useToggleCourseReaction();

  // Animation trigger states
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dislikeAnimating, setDislikeAnimating] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [dislikeBurst, setDislikeBurst] = useState(false);

  // Optimistic UI state
  const [optimisticState, setOptimisticState] = useState<{
    userReaction: ReactionType | null;
    likeCount: number;
    dislikeCount: number;
  } | null>(null);

  // Inject styles once on mount
  useEffect(() => {
    const styleId = 'reaction-button-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = reactionStyles;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Reset optimistic state when server data changes
  useEffect(() => {
    if (reactionData?.data) {
      setOptimisticState(null);
    }
  }, [reactionData]);

  // Get current state (optimistic or server)
  const userReaction = optimisticState?.userReaction ?? reactionData?.data?.user_reaction ?? null;
  const likeCount = optimisticState?.likeCount ?? reactionData?.data?.like_count ?? 0;
  const dislikeCount = optimisticState?.dislikeCount ?? reactionData?.data?.dislike_count ?? 0;

  const handleReaction = (reactionType: ReactionType) => {
    // Trigger animation - pop effect on the clicked button
    const isActivating = userReaction !== reactionType;
    if (reactionType === 'like') {
      setLikeAnimating(true);
      if (isActivating) setLikeBurst(true);
      setTimeout(() => {
        setLikeAnimating(false);
        setLikeBurst(false);
      }, 400);
    } else {
      setDislikeAnimating(true);
      if (isActivating) setDislikeBurst(true);
      setTimeout(() => {
        setDislikeAnimating(false);
        setDislikeBurst(false);
      }, 400);
    }

    // Calculate optimistic state
    let newUserReaction: ReactionType | null;
    let newLikeCount = likeCount;
    let newDislikeCount = dislikeCount;

    if (userReaction === reactionType) {
      // Toggle off - remove reaction
      newUserReaction = null;
      if (reactionType === 'like') newLikeCount = Math.max(0, likeCount - 1);
      else newDislikeCount = Math.max(0, dislikeCount - 1);
    } else if (userReaction === null) {
      // New reaction
      newUserReaction = reactionType;
      if (reactionType === 'like') newLikeCount = likeCount + 1;
      else newDislikeCount = dislikeCount + 1;
    } else {
      // Switch reaction
      newUserReaction = reactionType;
      if (reactionType === 'like') {
        newLikeCount = likeCount + 1;
        newDislikeCount = Math.max(0, dislikeCount - 1);
      } else {
        newDislikeCount = dislikeCount + 1;
        newLikeCount = Math.max(0, likeCount - 1);
      }
    }

    // Optimistic update
    setOptimisticState({
      userReaction: newUserReaction,
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount
    });

    // Make API call
    toggleReaction(
      { courseId, reactionType },
      {
        onError: () => {
          setOptimisticState(null);
          ToastService.error('Unable to update. Please try again.');
        }
      }
    );
  };

  // Format count for display (e.g., 1.2K, 5.3M)
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Loading state - Dark theme compatible
  if (isLoading && !reactionData) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center bg-slate-700/40 rounded-full animate-pulse">
          <div className="h-9 w-20 rounded-l-full bg-slate-600/30" />
          <div className="w-px h-6 bg-slate-600/50" />
          <div className="h-9 w-12 rounded-r-full bg-slate-600/30" />
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* YouTube-style pill buttons - Dark theme compatible */}
      <div className="flex items-center bg-slate-700/60 backdrop-blur-sm rounded-full">
        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction('like')}
          disabled={isPending}
          className={`h-9 px-4 gap-2 rounded-l-full rounded-r-none hover:bg-slate-600/60 transition-colors duration-200 ${
            userReaction === 'like' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-200'
          }`}
          title="Like"
        >
          <span className="relative inline-flex items-center justify-center">
            <ThumbsUp
              className={`h-5 w-5 reaction-icon ${
                userReaction === 'like'
                  ? 'fill-blue-400 text-blue-400'
                  : 'text-slate-300'
              } ${likeAnimating ? 'pop' : ''}`}
            />
            {/* Burst ring effect */}
            <span className={`reaction-burst-ring like ${likeBurst ? 'burst' : ''}`} />
          </span>
          <span className="font-medium text-sm tabular-nums">
            {formatCount(likeCount)}
          </span>
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-600/50" />

        {/* Dislike Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction('dislike')}
          disabled={isPending}
          className={`h-9 px-4 rounded-r-full rounded-l-none hover:bg-slate-600/60 transition-colors duration-200 ${
            userReaction === 'dislike' ? 'bg-red-500/20 text-red-400' : 'text-slate-200'
          }`}
          title="Dislike"
        >
          <span className="relative inline-flex items-center justify-center">
            <ThumbsDown
              className={`h-5 w-5 reaction-icon ${
                userReaction === 'dislike'
                  ? 'fill-red-400 text-red-400'
                  : 'text-slate-300'
              } ${dislikeAnimating ? 'pop' : ''}`}
            />
            {/* Burst ring effect */}
            <span className={`reaction-burst-ring dislike ${dislikeBurst ? 'burst' : ''}`} />
          </span>
          {/* YouTube hides dislike count, but we can show it */}
          {dislikeCount > 0 && (
            <span className="font-medium text-sm ml-1 tabular-nums">
              {formatCount(dislikeCount)}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// Keep old component name for backward compatibility
export const CourseLikeButton = CourseReactionButtons;

// Compact version for tight spaces
export function CourseReactionButtonsCompact({
  courseId,
  className = ''
}: {
  courseId: string;
  className?: string;
}) {
  return (
    <CourseReactionButtons
      courseId={courseId}
      className={className}
    />
  );
}

export const CourseLikeButtonCompact = CourseReactionButtonsCompact;

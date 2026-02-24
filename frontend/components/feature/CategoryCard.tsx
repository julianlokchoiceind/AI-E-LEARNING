import React from 'react';
import Image from 'next/image';
import { LocaleLink } from '@/components/ui/LocaleLink';
import { Card } from '@/components/ui/Card';

interface CategoryCardProps {
  value: string;
  label: string;
  image: string;
  count: number;
  featured?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  value,
  label,
  image,
  count,
  featured = false
}) => {
  return (
    <LocaleLink href={`/courses?category=${value}`} className="block h-full">
      <Card className="group cursor-pointer card-hover card-glow h-full">
        <div className="p-2 pb-2 h-full">
          <div className={`relative rounded-lg overflow-hidden bg-muted ${featured ? 'h-full min-h-[280px]' : 'h-56 sm:h-64'}`}>
          <Image
            src={image}
            alt={label}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={featured
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            }
          />

          {/* Dark gradient overlay for text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Category info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className={`font-semibold mb-1 line-clamp-2 ${featured ? 'text-xl md:text-2xl' : 'text-lg'}`}>
              {label}
            </h3>
            <p className={`opacity-90 ${featured ? 'text-base' : 'text-sm'}`}>
              {count} course{count !== 1 ? 's' : ''}
            </p>
          </div>
          </div>
        </div>
      </Card>
    </LocaleLink>
  );
};

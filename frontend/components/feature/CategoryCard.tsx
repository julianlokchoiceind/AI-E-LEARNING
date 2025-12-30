import React from 'react';
import Image from 'next/image';
import { LocaleLink } from '@/components/ui/LocaleLink';
import { Card } from '@/components/ui/Card';

interface CategoryCardProps {
  value: string;
  label: string;
  image: string;
  count: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  value,
  label,
  image,
  count
}) => {
  return (
    <LocaleLink href={`/courses?category=${value}`}>
      <Card className="group cursor-pointer card-hover card-glow">
        <div className="p-2 pb-2">
          <div className="relative h-56 sm:h-64 rounded-lg overflow-hidden bg-muted">
          <Image
            src={image}
            alt={label}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Dark gradient overlay for text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Category info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-semibold mb-1 line-clamp-2">
              {label}
            </h3>
            <p className="text-sm opacity-90">
              {count} course{count !== 1 ? 's' : ''}
            </p>
          </div>
          </div>
        </div>
      </Card>
    </LocaleLink>
  );
};
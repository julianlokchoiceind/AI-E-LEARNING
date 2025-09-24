import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    <Link href={`/courses?category=${value}`}>
      <div className="group cursor-pointer">
        <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
          <Image
            src={image}
            alt={label}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
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
    </Link>
  );
};
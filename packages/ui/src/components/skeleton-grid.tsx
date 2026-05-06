/* oxlint-disable func-style */
import { SkeletonCard } from "./skeleton-card";

interface SkeletonGridProps {
  count?: number;
  horizontal?: boolean;
  className?: string;
}

export function SkeletonGrid({
  count = 4,
  horizontal = false,
  className = "",
}: SkeletonGridProps) {
  return (
    <div
      className={
        horizontal
          ? `-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4 ${className}`
          : `grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} horizontal={horizontal} />
      ))}
    </div>
  );
}

/* oxlint-disable func-style */
import { Skeleton } from "./skeleton";

export function SkeletonEventCard() {
  return (
    <div className="group block min-w-[20rem] snap-start md:min-w-0">
      <div className="overflow-hidden rounded-xl border border-gold/10 bg-card">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="p-5 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

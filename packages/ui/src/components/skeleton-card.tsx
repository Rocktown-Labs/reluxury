/* oxlint-disable func-style */
import { Skeleton } from "./skeleton";

export function SkeletonCard({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <div
      className={`group block ${horizontal ? "min-w-[19rem] snap-start md:min-w-0" : ""}`}
    >
      <div
        className={`rounded-xl border border-gold/10 bg-card p-2 ${horizontal ? "flex gap-3 md:block md:rounded-none md:border-0 md:bg-transparent md:p-0" : ""}`}
      >
        <div
          className={`relative overflow-hidden rounded-lg border border-gold/5 bg-card ${horizontal ? "aspect-square w-32 shrink-0 md:mb-3 md:w-auto md:aspect-[3/4]" : "mb-3 aspect-[3/4]"}`}
        >
          <Skeleton className="h-full w-full" />
        </div>
        <div className={`space-y-2 ${horizontal ? "flex-1 md:flex-none" : ""}`}>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

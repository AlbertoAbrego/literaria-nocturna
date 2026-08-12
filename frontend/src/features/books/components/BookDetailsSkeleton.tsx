import Skeleton from "@/shared/components/ui/Skeleton";

function BookDetailsSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-6 h-4 w-28" />
      <div className="rounded-card border border-graphite bg-charcoal p-6 sm:p-8">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="mt-6 h-10 w-3/4" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-8 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-2/3" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export default BookDetailsSkeleton;
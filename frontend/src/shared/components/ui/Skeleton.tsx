type SkeletonVariant = "text" | "circular" | "rectangular";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

const VARIANTS: Record<SkeletonVariant, string> = {
  text: "h-4 rounded",
  circular: "rounded-full",
  rectangular: "rounded-[6px]",
};

function Skeleton({ variant = "text", className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-graphite ${VARIANTS[variant]} ${className}`}
    />
  );
}

export default Skeleton;

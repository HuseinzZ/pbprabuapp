/**
 * SkeletonCard — Reusable skeleton pulse loader
 * Uses .skeleton class from globals.css (DESIGN.md system)
 */

interface SkeletonCardProps {
  lines?: number;
  height?: string;
  className?: string;
  showAvatar?: boolean;
}

export default function SkeletonCard({
  lines = 3,
  height = "h-4",
  className = "",
  showAvatar = false,
}: SkeletonCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-900 border border-[var(--hairline-soft)] rounded-2xl p-6 ${className}`}>
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${height} rounded`}
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    </div>
  );
}

/** Inline skeleton block (single element) */
export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`skeleton ${className}`} />;
}

/** Grid of skeleton cards */
export function SkeletonGrid({
  count = 3,
  cols = 3,
  showAvatar = false,
}: {
  count?: number;
  cols?: number;
  showAvatar?: boolean;
}) {
  const colClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${colClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showAvatar={showAvatar} />
      ))}
    </div>
  );
}

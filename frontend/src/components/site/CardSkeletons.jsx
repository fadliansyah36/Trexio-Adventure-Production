import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TripCardSkeleton() {
  return (
    <div className="flex flex-col justify-between bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs animate-pulse">
      <div>
        {/* Cover Image Skeleton */}
        <div className="relative aspect-[16/10] bg-muted w-full">
          <Skeleton className="h-full w-full rounded-none" />
        </div>

        <div className="p-5">
          {/* Vendor & Rating Skeleton */}
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>

          {/* Title Skeleton */}
          <Skeleton className="h-5 w-4/5 rounded-md mb-2" />
          <Skeleton className="h-5 w-3/5 rounded-md mb-4" />

          {/* Tag Badges Skeleton */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>
      </div>

      {/* Footer / Price Skeleton */}
      <div className="p-5 pt-4 border-t border-border/60 flex items-center justify-between">
        <div>
          <Skeleton className="h-3 w-16 mb-1 rounded-sm" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function MarketplaceCardSkeleton() {
  return (
    <div className="flex flex-col justify-between bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs animate-pulse">
      <div>
        {/* Gear Image Skeleton */}
        <div className="relative aspect-square bg-muted w-full p-4 flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>

        <div className="p-4">
          {/* Category & Badge */}
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>

          {/* Title */}
          <Skeleton className="h-4 w-11/12 rounded-md mb-2" />
          <Skeleton className="h-4 w-3/4 rounded-md mb-3" />

          {/* Spec Badges */}
          <div className="flex gap-2 mb-2">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Price & CTA */}
      <div className="p-4 pt-3 border-t border-border/60 flex items-center justify-between">
        <div>
          <Skeleton className="h-3 w-12 mb-1 rounded-sm" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function TripCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <TripCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function MarketplaceCardSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <MarketplaceCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/** Marketplace Home Specific Skeleton Suite */
export function StandardProductCardSkeleton() {
  return (
    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden flex flex-col justify-between w-full shrink-0 animate-pulse select-none">
      <div>
        <div className="aspect-[16/10] bg-muted w-full relative">
          <Skeleton className="h-full w-full rounded-none" />
          <Skeleton className="absolute top-2.5 left-2.5 h-4 w-16 rounded-md" />
          <Skeleton className="absolute bottom-2 left-2 h-4 w-20 rounded-md" />
        </div>
        <div className="p-3.5 space-y-2">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-28 rounded-sm" />
        </div>
      </div>
      <div className="p-3.5 pt-2 border-t border-border/60 flex items-center justify-between bg-muted/10">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-12 rounded-xs" />
          <Skeleton className="h-4 w-20 rounded-sm" />
        </div>
        <Skeleton className="h-7 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 flex items-center gap-3.5 animate-pulse">
      <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-20 rounded-xs" />
        <Skeleton className="h-4 w-32 rounded-sm" />
        <Skeleton className="h-3 w-24 rounded-xs" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16 rounded-xs" />
          <Skeleton className="h-3 w-10 rounded-xs" />
        </div>
      </div>
    </div>
  );
}

export function BasecampCardSkeleton() {
  return (
    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden flex flex-col justify-between animate-pulse">
      <div className="aspect-[16/10] bg-muted w-full relative">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="p-3.5 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-full rounded-sm" />
        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
          <Skeleton className="h-4 w-20 rounded-sm" />
          <Skeleton className="h-3 w-10 rounded-xs" />
        </div>
      </div>
    </div>
  );
}

export function RentalCardSkeleton() {
  return (
    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden flex flex-col justify-between animate-pulse">
      <div className="aspect-square bg-muted w-full relative">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="p-3 space-y-1.5">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-20 rounded-sm" />
      </div>
    </div>
  );
}

export function HorizontalProductSkeletonList({ count = 4 }) {
  return (
    <div className="flex md:grid md:grid-cols-4 gap-3.5 overflow-x-auto no-scrollbar pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <StandardProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductSkeletonGrid({ count = 4, cols = "grid-cols-2 md:grid-cols-2 lg:grid-cols-4" }) {
  return (
    <div className={`grid ${cols} gap-3 md:gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <StandardProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProviderSkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <ProviderCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default TripCardSkeleton;

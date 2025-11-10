import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface QAReviewSkeletonProps {
  count?: number;
}

export const QAReviewSkeleton = ({ count = 3 }: QAReviewSkeletonProps) => {
  return (
    <div className="space-y-8">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-muted/5 rounded-lg p-8 border border-border/20 shadow-sm">
          <Card className="overflow-hidden border-l-[4px] border-l-primary/30 shadow-sm">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/20 border-b-2">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>

              <div className="p-3 space-y-3">
                {/* Description */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />

                {/* Grid columns */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((col) => (
                    <div key={col} className="space-y-1.5">
                      <Skeleton className="h-4 w-8 mx-auto" />
                      <div className="space-y-1">
                        <div className="bg-muted/20 rounded px-2 py-1.5 border border-border/30">
                          <Skeleton className="h-3 w-12 mb-1" />
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </div>
                        <div className="bg-background rounded border border-border/50">
                          <Skeleton className="h-3 w-8 m-2 mb-1" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                        <Skeleton className="h-5 w-5 rounded-full mx-auto" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                <div className="pt-2 border-t border-border/20">
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

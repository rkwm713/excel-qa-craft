import { useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { QAReviewRow as QAReviewRowType } from "@/types/qa-tool";
import { QAReviewRow } from "./QAReviewRow";
import { QAReviewCard } from "./QAReviewCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QAReviewTableProps {
  data: QAReviewRowType[];
  onUpdateRow: (id: string, field: keyof QAReviewRowType, value: any) => void;
  cuOptions: string[];
  viewMode: "table" | "cards";
  setViewMode: (mode: "table" | "cards") => void;
  selectedStation: string | null;
}

export const QAReviewTable = ({ 
  data, 
  onUpdateRow, 
  cuOptions, 
  viewMode, 
  setViewMode, 
  selectedStation 
}: QAReviewTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize the update handler to prevent recreating it on every render
  const handleUpdateRow = useCallback(
    (id: string, field: keyof QAReviewRowType, value: any) => {
      onUpdateRow(id, field, value);
    },
    [onUpdateRow]
  );

  // Memoize cu options to prevent unnecessary re-renders
  const memoizedCuOptions = useMemo(() => cuOptions, [cuOptions]);

  // Filter data by selected station
  const filteredData = useMemo(() => {
    if (!selectedStation) return data;
    return data.filter(row => row.station === selectedStation);
  }, [data, selectedStation]);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => viewMode === "cards" ? 380 : 65,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end || 0)
      : 0;

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-saira">
              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            </Badge>
            {selectedStation && (
              <Badge variant="secondary" className="font-saira">
                Station {selectedStation}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Card View
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-2"
            >
              <Table className="w-4 h-4" />
              Table View
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {viewMode === "cards" ? (
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 400px)", minHeight: "500px" }}
        >
          <div
            style={{
              height: `${totalSize}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const row = filteredData[virtualRow.index];
              return (
                <div
                  key={row.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="mb-8">
                    <div className="bg-muted/5 rounded-lg p-8 border border-border/20 shadow-sm transition-all duration-200">
                      <QAReviewCard
                        row={row}
                        onUpdateRow={handleUpdateRow}
                        cuOptions={memoizedCuOptions}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{ maxHeight: "600px" }}
          >
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[180px] font-saira uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[100px] font-saira uppercase tracking-wide">Station</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide">Work Set</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[140px] font-saira uppercase tracking-wide">Designer CU</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[180px] font-saira uppercase tracking-wide">QA CU</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[250px] font-saira uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide">Designer WF</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[100px] font-saira uppercase tracking-wide">QA WF</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide">Designer Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[120px] font-saira uppercase tracking-wide">QA Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50 min-w-[220px] font-saira uppercase tracking-wide">Comments</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold border-b bg-muted/50 min-w-[100px] font-saira uppercase tracking-wide">Checks</th>
                </tr>
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const row = filteredData[virtualRow.index];
                  return (
                    <QAReviewRow
                      key={row.id}
                      row={row}
                      onUpdateRow={handleUpdateRow}
                      cuOptions={memoizedCuOptions}
                    />
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

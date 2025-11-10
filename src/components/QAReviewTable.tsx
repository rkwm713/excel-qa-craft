import { useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { QAReviewRow as QAReviewRowType } from "@/types/qa-tool";
import { QAReviewRow } from "./QAReviewRow";
import { Card } from "@/components/ui/card";

interface QAReviewTableProps {
  data: QAReviewRowType[];
  onUpdateRow: (id: string, field: keyof QAReviewRowType, value: any) => void;
  cuOptions: string[];
}

export const QAReviewTable = ({ data, onUpdateRow, cuOptions }: QAReviewTableProps) => {
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

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end || 0)
      : 0;

  return (
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
              const row = data[virtualRow.index];
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
  );
};

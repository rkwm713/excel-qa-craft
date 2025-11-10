import { useRef, useCallback } from "react";
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

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Station</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Work Set</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Designer CU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">QA CU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Description</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Designer WF</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">QA WF</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Designer Qty</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">QA Qty</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b bg-muted/50">Comments</th>
              <th className="px-4 py-3 text-center text-sm font-semibold border-b bg-muted/50">Checks</th>
            </tr>
          </thead>
        </table>
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{
            height: `600px`,
          }}
        >
          <table className="w-full border-collapse">
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = data[virtualRow.index];
                return (
                  <QAReviewRow
                    key={row.id}
                    row={row}
                    onUpdateRow={handleUpdateRow}
                    cuOptions={cuOptions}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

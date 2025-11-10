import { memo } from "react";
import { QAReviewRow as QAReviewRowType } from "@/types/qa-tool";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QAReviewCardProps {
  row: QAReviewRowType;
  onUpdateRow: (id: string, field: keyof QAReviewRowType, value: any) => void;
  cuOptions: string[];
}

export const QAReviewCard = memo(({ row, onUpdateRow, cuOptions }: QAReviewCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-sm transition-shadow border-l-2" 
          style={{ borderLeftColor: row.issueType === "OK" ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
      <CardContent className="p-0">
        {/* Ultra Compact Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/30 border-b">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-bold font-saira text-primary shrink-0">{row.station}</span>
            {row.workSet && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs font-medium text-muted-foreground truncate">{row.workSet}</span>
              </>
            )}
          </div>
          
          <Select
            value={row.issueType}
            onValueChange={(value) => onUpdateRow(row.id, "issueType", value)}
          >
            <SelectTrigger className="w-[120px] h-6 text-[10px] border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OK" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="font-semibold text-success">OK</span>
                </div>
              </SelectItem>
              <SelectItem value="NEEDS REVISIONS" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="font-semibold text-destructive">NEEDS REVISIONS</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 space-y-2">
          {/* Inline CU Section */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold font-saira uppercase text-muted-foreground shrink-0">CU:</span>
            <span className="font-mono font-semibold">{row.designerCU}</span>
            <span className="text-muted-foreground">→</span>
            <Select
              value={row.qaCU}
              onValueChange={(value) => onUpdateRow(row.id, "qaCU", value)}
            >
              <SelectTrigger className="h-6 text-xs font-mono font-semibold flex-1 max-w-[120px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cuOptions.map((cu) => (
                  <SelectItem key={cu} value={cu} className="font-mono text-xs">
                    {cu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {row.cuCheck ? (
              <Check className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-destructive shrink-0" />
            )}
          </div>

          {/* Description */}
          {row.description && (
            <div className="pl-2 border-l-2 border-accent/30 py-1">
              <p className="text-[11px] text-muted-foreground leading-snug">
                {row.description}
              </p>
            </div>
          )}

          {/* Inline WF & Qty */}
          <div className="flex items-center gap-3 text-xs">
            {/* WF */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] font-bold font-saira uppercase text-muted-foreground shrink-0">WF:</span>
              <span className="font-mono font-semibold">{row.designerWF}</span>
              <span className="text-muted-foreground">→</span>
              <Select
                value={row.qaWF}
                onValueChange={(value) => onUpdateRow(row.id, "qaWF", value)}
              >
                <SelectTrigger className="h-6 text-xs font-mono font-semibold w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I" className="font-mono text-xs">I</SelectItem>
                  <SelectItem value="R" className="font-mono text-xs">R</SelectItem>
                </SelectContent>
              </Select>
              {row.wfCheck ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-destructive shrink-0" />
              )}
            </div>

            <div className="h-4 w-px bg-border" />

            {/* Qty */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] font-bold font-saira uppercase text-muted-foreground shrink-0">Qty:</span>
              <span className="font-mono font-semibold">{row.designerQty}</span>
              <span className="text-muted-foreground">→</span>
              <Input
                type="number"
                value={row.qaQty}
                onChange={(e) => onUpdateRow(row.id, "qaQty", parseFloat(e.target.value) || 0)}
                className="h-6 text-xs text-center font-mono font-semibold w-16"
              />
              {row.qtyCheck ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-destructive shrink-0" />
              )}
            </div>
          </div>

          {/* Comments */}
          <Textarea
            value={row.qaComments}
            onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
            placeholder="QA comments..."
            className="min-h-[40px] text-[11px] resize-none focus-visible:ring-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.row.id === nextProps.row.id &&
    prevProps.row.issueType === nextProps.row.issueType &&
    prevProps.row.qaCU === nextProps.row.qaCU &&
    prevProps.row.qaWF === nextProps.row.qaWF &&
    prevProps.row.qaQty === nextProps.row.qaQty &&
    prevProps.row.qaComments === nextProps.row.qaComments &&
    prevProps.row.cuCheck === nextProps.row.cuCheck &&
    prevProps.row.wfCheck === nextProps.row.wfCheck &&
    prevProps.row.qtyCheck === nextProps.row.qtyCheck
  );
});

QAReviewCard.displayName = "QAReviewCard";

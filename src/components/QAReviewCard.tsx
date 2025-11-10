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
    <Card className="overflow-hidden hover:shadow-sm transition-shadow border-l-[3px]" 
          style={{ borderLeftColor: row.issueType === "OK" ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
      <CardContent className="p-0">
        {/* Ultra Compact Header */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-muted/10 border-b">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase text-muted-foreground/50 tracking-wide">Station</span>
            <span className="text-sm font-bold font-saira text-foreground">{row.station}</span>
            {row.workSet && (
              <>
                <div className="w-0.5 h-0.5 rounded-full bg-border mx-0.5" />
                <span className="text-[10px] text-muted-foreground truncate">{row.workSet}</span>
              </>
            )}
          </div>
          
          <Select
            value={row.issueType}
            onValueChange={(value) => onUpdateRow(row.id, "issueType", value)}
          >
            <SelectTrigger className="w-[100px] h-6 text-[10px] border-0 bg-background shadow-sm">
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

        <div className="p-2.5 space-y-2">
          {/* CU Row - Single Line */}
          <div className="flex items-center gap-2 py-1 px-2 rounded bg-muted/5 hover:bg-muted/10 transition-colors">
            <span className="text-[8px] font-bold uppercase text-muted-foreground/50 w-5 shrink-0">CU</span>
            <span className="font-mono text-[11px] font-semibold text-foreground min-w-[55px]">{row.designerCU}</span>
            <div className="flex-1 flex items-center">
              <Select
                value={row.qaCU}
                onValueChange={(value) => onUpdateRow(row.id, "qaCU", value)}
              >
                <SelectTrigger className="h-6 text-[11px] font-mono font-semibold border-0 bg-background shadow-sm w-full">
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
            </div>
            <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
              row.cuCheck ? 'bg-success/10' : 'bg-destructive/10'
            }`}>
              {row.cuCheck ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <X className="w-3 h-3 text-destructive" />
              )}
            </div>
          </div>

          {/* Description - More Subtle */}
          {row.description && (
            <div className="text-[10px] text-muted-foreground/70 leading-snug px-2 py-0.5">
              {row.description}
            </div>
          )}

          {/* WF & Qty - Tighter Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* WF */}
            <div className="flex items-center gap-1 py-1 px-2 rounded bg-muted/5 hover:bg-muted/10 transition-colors">
              <span className="text-[8px] font-bold uppercase text-muted-foreground/50 w-5 shrink-0">WF</span>
              <span className="font-mono text-[11px] font-semibold text-foreground w-3">{row.designerWF}</span>
              <Select
                value={row.qaWF}
                onValueChange={(value) => onUpdateRow(row.id, "qaWF", value)}
              >
                <SelectTrigger className="h-6 text-[11px] font-mono font-semibold border-0 bg-background shadow-sm flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I" className="font-mono text-xs">I</SelectItem>
                  <SelectItem value="R" className="font-mono text-xs">R</SelectItem>
                </SelectContent>
              </Select>
              <div className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${
                row.wfCheck ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                {row.wfCheck ? (
                  <Check className="w-2.5 h-2.5 text-success" />
                ) : (
                  <X className="w-2.5 h-2.5 text-destructive" />
                )}
              </div>
            </div>

            {/* Qty */}
            <div className="flex items-center gap-1 py-1 px-2 rounded bg-muted/5 hover:bg-muted/10 transition-colors">
              <span className="text-[8px] font-bold uppercase text-muted-foreground/50 w-6 shrink-0">QTY</span>
              <span className="font-mono text-[11px] font-semibold text-foreground w-3">{row.designerQty}</span>
              <Input
                type="number"
                value={row.qaQty}
                onChange={(e) => onUpdateRow(row.id, "qaQty", parseFloat(e.target.value) || 0)}
                className="h-6 text-[11px] text-center font-mono font-semibold border-0 bg-background shadow-sm flex-1 min-w-0"
              />
              <div className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${
                row.qtyCheck ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                {row.qtyCheck ? (
                  <Check className="w-2.5 h-2.5 text-success" />
                ) : (
                  <X className="w-2.5 h-2.5 text-destructive" />
                )}
              </div>
            </div>
          </div>

          {/* Comments - More Compact */}
          <Textarea
            value={row.qaComments}
            onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
            placeholder="QA comments..."
            className="min-h-[45px] text-[10px] resize-none focus-visible:ring-1 bg-muted/5 border-0 shadow-sm placeholder:text-muted-foreground/30 py-1.5"
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

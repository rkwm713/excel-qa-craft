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
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-l-[4px] shadow-sm" 
          style={{ 
            borderLeftColor: row.issueType === "OK" ? "hsl(var(--success))" : "hsl(var(--destructive))",
            boxShadow: row.issueType === "NEEDS REVISIONS" ? "0 0 0 1px hsl(var(--destructive) / 0.1)" : undefined
          }}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/20 border-b-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase text-muted-foreground/50 tracking-wide">Station</span>
            <span className="text-base font-bold font-saira text-foreground">{row.station}</span>
            {row.workSet && (
              <>
                <div className="w-0.5 h-0.5 rounded-full bg-border mx-1" />
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

        <div className="p-3 space-y-3">
          {/* Description */}
          {row.description && (
            <div className="text-[11px] text-muted-foreground/70 leading-relaxed">
              {row.description}
            </div>
          )}

          {/* Vertical Grid: CU, WF, QTY */}
          <div className="grid grid-cols-3 gap-2">
            {/* CU Column */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold uppercase text-muted-foreground/50 text-center pb-1 tracking-wider">CU</div>
              <div className="space-y-1">
                <div className="bg-primary/10 rounded px-2 py-1.5 border border-primary/20">
                  <div className="text-[9px] text-primary/70 uppercase mb-0.5 font-medium">Designer</div>
                  <div className="font-mono text-[11px] font-semibold text-foreground text-center">
                    {row.designerCU}
                  </div>
                </div>
                <div className="bg-background rounded border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="text-[9px] text-muted-foreground/60 uppercase px-2 pt-1 font-medium">QA</div>
                  <Select
                    value={row.qaCU}
                    onValueChange={(value) => onUpdateRow(row.id, "qaCU", value)}
                  >
                    <SelectTrigger className="h-8 text-[11px] font-mono font-semibold border-0">
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
                <div className="flex justify-center pt-0.5">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                    row.cuCheck ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    {row.cuCheck ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* WF Column */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold uppercase text-muted-foreground/50 text-center pb-1 tracking-wider">WF</div>
              <div className="space-y-1">
                <div className="bg-primary/10 rounded px-2 py-1.5 border border-primary/20">
                  <div className="text-[9px] text-primary/70 uppercase mb-0.5 font-medium">Designer</div>
                  <div className="font-mono text-[11px] font-semibold text-foreground text-center">
                    {row.designerWF}
                  </div>
                </div>
                <div className="bg-background rounded border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="text-[9px] text-muted-foreground/60 uppercase px-2 pt-1 font-medium">QA</div>
                  <Select
                    value={row.qaWF}
                    onValueChange={(value) => onUpdateRow(row.id, "qaWF", value)}
                  >
                    <SelectTrigger className="h-8 text-[11px] font-mono font-semibold border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I" className="font-mono text-xs">I</SelectItem>
                      <SelectItem value="R" className="font-mono text-xs">R</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center pt-0.5">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                    row.wfCheck ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    {row.wfCheck ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QTY Column */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold uppercase text-muted-foreground/50 text-center pb-1 tracking-wider">QTY</div>
              <div className="space-y-1">
                <div className="bg-primary/10 rounded px-2 py-1.5 border border-primary/20">
                  <div className="text-[9px] text-primary/70 uppercase mb-0.5 font-medium">Designer</div>
                  <div className="font-mono text-[11px] font-semibold text-foreground text-center">
                    {row.designerQty}
                  </div>
                </div>
                <div className="bg-background rounded border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="text-[9px] text-muted-foreground/60 uppercase px-2 pt-1 font-medium">QA</div>
                  <Input
                    type="number"
                    value={row.qaQty}
                    onChange={(e) => onUpdateRow(row.id, "qaQty", parseFloat(e.target.value) || 0)}
                    className="h-8 text-[11px] text-center font-mono font-semibold border-0"
                  />
                </div>
                <div className="flex justify-center pt-0.5">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                    row.qtyCheck ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    {row.qtyCheck ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="pt-2 border-t border-border/20">
            <Textarea
              value={row.qaComments}
              onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
              placeholder="Add QA comments..."
              className="min-h-[60px] text-[11px] resize-none focus-visible:ring-2 focus-visible:ring-primary bg-muted/5 border-border/50 placeholder:text-muted-foreground/40 transition-all"
            />
          </div>
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

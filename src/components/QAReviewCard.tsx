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
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-l-4" 
          style={{ borderLeftColor: row.issueType === "OK" ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
      <CardContent className="p-0">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-muted/30 to-muted/10 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold font-saira text-primary">{row.station}</span>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold font-saira uppercase text-muted-foreground">Station</div>
                <div className="text-base font-bold font-saira text-primary">{row.station}</div>
              </div>
            </div>
            {row.workSet && (
              <>
                <div className="h-6 w-px bg-border" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold font-saira uppercase text-muted-foreground">Work Set</div>
                  <div className="text-sm font-medium font-neuton text-foreground truncate">{row.workSet}</div>
                </div>
              </>
            )}
          </div>
          
          <Select
            value={row.issueType}
            onValueChange={(value) => onUpdateRow(row.id, "issueType", value)}
          >
            <SelectTrigger className="w-[140px] h-8 border-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OK">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-semibold text-success text-xs">OK</span>
                </div>
              </SelectItem>
              <SelectItem value="NEEDS REVISIONS">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="font-semibold text-destructive text-xs">NEEDS REVISIONS</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 space-y-3">
          {/* Compact CU Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 p-3 bg-muted/20 rounded border">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold font-saira uppercase text-muted-foreground">
                  Designer CU
                </Label>
                <Badge variant="secondary" className="text-[9px] font-mono h-4 px-1.5">Original</Badge>
              </div>
              <div className="text-sm font-bold font-mono bg-background px-2 py-1.5 rounded border text-center">
                {row.designerCU}
              </div>
            </div>
            <div className="space-y-1.5 p-3 bg-muted/20 rounded border">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold font-saira uppercase text-muted-foreground">
                  QA CU
                </Label>
                <Badge 
                  variant={row.cuCheck ? "default" : "destructive"} 
                  className="text-[9px] gap-0.5 h-4 px-1.5"
                >
                  {row.cuCheck ? (
                    <>
                      <Check className="w-2.5 h-2.5" />
                      Match
                    </>
                  ) : (
                    <>
                      <X className="w-2.5 h-2.5" />
                      Miss
                    </>
                  )}
                </Badge>
              </div>
              <Select
                value={row.qaCU}
                onValueChange={(value) => onUpdateRow(row.id, "qaCU", value)}
              >
                <SelectTrigger className="w-full font-mono font-semibold h-8 text-sm">
                  <SelectValue placeholder="Select CU" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cuOptions.map((cu) => (
                    <SelectItem key={cu} value={cu} className="font-mono text-sm">
                      {cu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Compact Description */}
          {row.description && (
            <div className="p-2.5 bg-accent/5 rounded border border-accent/20">
              <Label className="text-[10px] font-bold font-saira uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                <div className="w-0.5 h-3 bg-accent rounded-full" />
                Description
              </Label>
              <p className="text-xs font-neuton text-foreground leading-relaxed pl-2">
                {row.description}
              </p>
            </div>
          )}

          {/* Compact Work Function & Quantity in one row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Work Function */}
            <div className="space-y-2 p-3 bg-muted/20 rounded border">
              <h4 className="text-[10px] font-bold font-saira uppercase text-primary pb-1.5 border-b border-primary/20">
                Work Function
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px] font-neuton text-muted-foreground uppercase">Designer</Label>
                  <div className="text-base font-bold font-mono bg-background px-2 py-1 rounded border text-center">
                    {row.designerWF}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[9px] font-neuton text-muted-foreground uppercase">QA</Label>
                    {row.wfCheck ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <X className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                  <Select
                    value={row.qaWF}
                    onValueChange={(value) => onUpdateRow(row.id, "qaWF", value)}
                  >
                    <SelectTrigger className="w-full font-mono font-bold text-sm h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I" className="font-mono text-sm">I</SelectItem>
                      <SelectItem value="R" className="font-mono text-sm">R</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2 p-3 bg-muted/20 rounded border">
              <h4 className="text-[10px] font-bold font-saira uppercase text-primary pb-1.5 border-b border-primary/20">
                Quantity
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px] font-neuton text-muted-foreground uppercase">Designer</Label>
                  <div className="text-base font-bold font-mono bg-background px-2 py-1 rounded border text-center">
                    {row.designerQty}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[9px] font-neuton text-muted-foreground uppercase">QA</Label>
                    {row.qtyCheck ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <X className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                  <Input
                    type="number"
                    value={row.qaQty}
                    onChange={(e) => onUpdateRow(row.id, "qaQty", parseFloat(e.target.value) || 0)}
                    className="w-full text-center font-mono font-bold text-sm h-7 border"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Comments */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold font-saira uppercase text-muted-foreground">
              QA Comments
            </Label>
            <Textarea
              value={row.qaComments}
              onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
              placeholder="Add review comments..."
              className="min-h-[60px] font-neuton resize-none text-xs border focus:border-primary"
            />
          </div>
        </div>

        {/* Compact Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-saira uppercase text-muted-foreground">
              Validation
            </span>
            <Badge 
              variant={row.cuCheck && row.wfCheck && row.qtyCheck ? "default" : "secondary"}
              className="font-semibold text-[9px] h-5"
            >
              {row.cuCheck && row.wfCheck && row.qtyCheck ? "All Pass" : "Review"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border">
              <span className="text-[9px] font-saira uppercase text-muted-foreground">CU</span>
              {row.cuCheck ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <X className="w-3 h-3 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border">
              <span className="text-[9px] font-saira uppercase text-muted-foreground">WF</span>
              {row.wfCheck ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <X className="w-3 h-3 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border">
              <span className="text-[9px] font-saira uppercase text-muted-foreground">Qty</span>
              {row.qtyCheck ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <X className="w-3 h-3 text-destructive" />
              )}
            </div>
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

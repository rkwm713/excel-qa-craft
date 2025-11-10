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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 hover:border-l-primary" 
          style={{ borderLeftColor: row.issueType === "OK" ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold font-saira text-primary">{row.station}</span>
              </div>
              <div>
                <div className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
                  Station
                </div>
                <div className="text-lg font-bold font-saira text-primary">
                  {row.station}
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
                Work Set
              </div>
              <div className="text-sm font-medium font-neuton text-foreground">{row.workSet}</div>
            </div>
          </div>
          
          <Select
            value={row.issueType}
            onValueChange={(value) => onUpdateRow(row.id, "issueType", value)}
          >
            <SelectTrigger className="w-[180px] border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OK">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-semibold text-success">OK</span>
                </div>
              </SelectItem>
              <SelectItem value="NEEDS REVISIONS">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="font-semibold text-destructive">NEEDS REVISIONS</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-6 space-y-5">
          {/* CU Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 p-4 bg-muted/20 rounded-lg border border-muted">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold font-saira uppercase tracking-wide text-muted-foreground">
                  Designer CU
                </Label>
                <Badge variant="secondary" className="text-xs font-mono">Original</Badge>
              </div>
              <div className="text-base font-bold font-mono bg-background p-3 rounded border-2 border-muted text-center">
                {row.designerCU}
              </div>
            </div>
            <div className="space-y-2 p-4 bg-muted/20 rounded-lg border border-muted">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold font-saira uppercase tracking-wide text-muted-foreground">
                  QA CU
                </Label>
                <Badge 
                  variant={row.cuCheck ? "default" : "destructive"} 
                  className="text-xs gap-1"
                >
                  {row.cuCheck ? (
                    <>
                      <Check className="w-3 h-3" />
                      Match
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      Mismatch
                    </>
                  )}
                </Badge>
              </div>
              <Select
                value={row.qaCU}
                onValueChange={(value) => onUpdateRow(row.id, "qaCU", value)}
              >
                <SelectTrigger className="w-full font-mono font-semibold">
                  <SelectValue placeholder="Select CU" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {cuOptions.map((cu) => (
                    <SelectItem key={cu} value={cu} className="font-mono">
                      {cu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          {row.description && (
            <div className="space-y-2 p-4 bg-accent/5 rounded-lg border border-accent/20">
              <Label className="text-xs font-bold font-saira uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-accent rounded-full" />
                Description
              </Label>
              <p className="text-sm font-neuton text-foreground leading-relaxed pl-3">
                {row.description}
              </p>
            </div>
          )}

          {/* Work Function & Quantity Section */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Work Function */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-muted">
              <h4 className="text-xs font-bold font-saira uppercase tracking-wide text-primary border-b border-primary/20 pb-2">
                Work Function
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-neuton text-muted-foreground uppercase">Designer</Label>
                  <div className="text-lg font-bold font-mono bg-background p-2.5 rounded border-2 text-center">
                    {row.designerWF}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-neuton text-muted-foreground uppercase">QA</Label>
                    {row.wfCheck ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                  <Select
                    value={row.qaWF}
                    onValueChange={(value) => onUpdateRow(row.id, "qaWF", value)}
                  >
                    <SelectTrigger className="w-full font-mono font-bold text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I" className="font-mono text-base">I</SelectItem>
                      <SelectItem value="R" className="font-mono text-base">R</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-muted">
              <h4 className="text-xs font-bold font-saira uppercase tracking-wide text-primary border-b border-primary/20 pb-2">
                Quantity
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-neuton text-muted-foreground uppercase">Designer</Label>
                  <div className="text-lg font-bold font-mono bg-background p-2.5 rounded border-2 text-center">
                    {row.designerQty}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-neuton text-muted-foreground uppercase">QA</Label>
                    {row.qtyCheck ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                  <Input
                    type="number"
                    value={row.qaQty}
                    onChange={(e) => onUpdateRow(row.id, "qaQty", parseFloat(e.target.value) || 0)}
                    className="w-full text-center font-mono font-bold text-base border-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-2">
            <Label className="text-xs font-bold font-saira uppercase tracking-wide text-muted-foreground">
              QA Comments
            </Label>
            <Textarea
              value={row.qaComments}
              onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
              placeholder="Add your review comments here..."
              className="min-h-[90px] font-neuton resize-none border-2 focus:border-primary"
            />
          </div>
        </div>

        {/* Footer - Validation Summary */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-saira uppercase tracking-wide text-muted-foreground">
              Validation Status
            </span>
            <Badge 
              variant={row.cuCheck && row.wfCheck && row.qtyCheck ? "default" : "secondary"}
              className="font-semibold"
            >
              {row.cuCheck && row.wfCheck && row.qtyCheck ? "All Checks Passed" : "Review Required"}
            </Badge>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-md bg-background border">
              <span className="text-[10px] font-saira uppercase text-muted-foreground">CU</span>
              {row.cuCheck ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-md bg-background border">
              <span className="text-[10px] font-saira uppercase text-muted-foreground">WF</span>
              {row.wfCheck ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-md bg-background border">
              <span className="text-[10px] font-saira uppercase text-muted-foreground">Qty</span>
              {row.qtyCheck ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
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

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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-4">
        {/* Header Section */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
                Station
              </Label>
              <span className="text-lg font-bold font-saira text-primary">
                {row.station}
              </span>
            </div>
            <div className="text-sm text-muted-foreground font-neuton">
              Work Set: <span className="font-medium text-foreground">{row.workSet}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
              Status
            </Label>
            <Select
              value={row.issueType}
              onValueChange={(value) => onUpdateRow(row.id, "issueType", value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OK">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    OK
                  </Badge>
                </SelectItem>
                <SelectItem value="NEEDS REVISIONS">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    NEEDS REVISIONS
                  </Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CU Section */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
              Designer CU
            </Label>
            <div className="text-sm font-medium font-mono bg-background p-2 rounded border">
              {row.designerCU}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
                QA CU
              </Label>
              {row.cuCheck ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
            <Select
              value={row.qaCU}
              onValueChange={(value) => onUpdateRow(row.id, "qaCU", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select CU" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cuOptions.map((cu) => (
                  <SelectItem key={cu} value={cu}>
                    {cu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        {row.description && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
              Description
            </Label>
            <p className="text-sm font-neuton text-muted-foreground bg-muted/20 p-3 rounded">
              {row.description}
            </p>
          </div>
        )}

        {/* Work Function & Quantity Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Work Function */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
            <h4 className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground border-b pb-2">
              Work Function
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-neuton text-muted-foreground">Designer</Label>
                <div className="text-sm font-medium font-mono bg-background p-2 rounded border text-center">
                  {row.designerWF}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-neuton text-muted-foreground">QA</Label>
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
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I</SelectItem>
                    <SelectItem value="R">R</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
            <h4 className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground border-b pb-2">
              Quantity
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-neuton text-muted-foreground">Designer</Label>
                <div className="text-sm font-medium font-mono bg-background p-2 rounded border text-center">
                  {row.designerQty}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-neuton text-muted-foreground">QA</Label>
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
                  className="w-full text-center font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
            QA Comments
          </Label>
          <Textarea
            value={row.qaComments}
            onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
            placeholder="Add your comments here..."
            className="min-h-[80px] font-neuton"
          />
        </div>

        {/* Validation Summary */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-xs font-semibold font-saira uppercase tracking-wide text-muted-foreground">
            Validation Checks
          </span>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">CU:</span>
              {row.cuCheck ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">WF:</span>
              {row.wfCheck ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Qty:</span>
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

import { QAReviewRow } from "@/types/qa-tool";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkPointEditorProps {
  row: QAReviewRow;
  onUpdateRow: (id: string, field: keyof QAReviewRow, value: any) => void;
  cuOptions: string[];
}

export function WorkPointEditor({ row, onUpdateRow, cuOptions }: WorkPointEditorProps) {
  const handleChange = (field: keyof QAReviewRow, value: any) => {
    onUpdateRow(row.id, field, value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-2 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">WP {row.station}</h3>
          <Badge
            variant={row.issueType === "OK" ? "default" : "destructive"}
          >
            {row.issueType}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className={cn(
            "flex items-center gap-1",
            row.cuCheck ? "text-green-600" : "text-red-600"
          )}>
            {row.cuCheck ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>CU Match</span>
          </div>
          <div className={cn(
            "flex items-center gap-1",
            row.wfCheck ? "text-green-600" : "text-red-600"
          )}>
            {row.wfCheck ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>WF Match</span>
          </div>
          <div className={cn(
            "flex items-center gap-1",
            row.qtyCheck ? "text-green-600" : "text-red-600"
          )}>
            {row.qtyCheck ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>QTY Match</span>
          </div>
        </div>
      </div>

      {/* Work Set */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Work Set</Label>
        <div className="text-sm font-medium">{row.workSet}</div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <div className="text-sm">{row.description}</div>
      </div>

      {/* CU Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Designer CU</Label>
          <Input
            value={row.designerCU}
            disabled
            className="h-8 text-sm bg-muted/30"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            QA CU
            {!row.cuCheck && <AlertCircle className="w-3 h-3 text-destructive" />}
          </Label>
          <Select
            value={row.qaCU === "" ? undefined : row.qaCU}
            onValueChange={(value) => handleChange("qaCU", value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cuOptions.map((cu) => (
                <SelectItem key={cu} value={cu}>
                  {cu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* WF Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Designer WF</Label>
          <Input
            value={row.designerWF}
            disabled
            className="h-8 text-sm bg-muted/30"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            QA WF
            {!row.wfCheck && <AlertCircle className="w-3 h-3 text-destructive" />}
          </Label>
          <Input
            value={row.qaWF ?? ""}
            onChange={(e) => handleChange("qaWF", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Quantity Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Designer Qty</Label>
          <Input
            type="number"
            value={row.designerQty}
            disabled
            className="h-8 text-sm bg-muted/30"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            QA Qty
            {!row.qtyCheck && <AlertCircle className="w-3 h-3 text-destructive" />}
          </Label>
          <Input
            type="number"
            value={row.qaQty ?? ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              const parsed =
                inputValue.trim() === "" ? null : Number(inputValue);
              handleChange(
                "qaQty",
                parsed !== null && Number.isFinite(parsed) ? parsed : null
              );
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-1">
        <Label className="text-xs">QA Comments</Label>
        <Textarea
          value={row.qaComments}
          onChange={(e) => handleChange("qaComments", e.target.value)}
          placeholder="Add your review comments..."
          className="min-h-[80px] text-sm resize-none"
        />
      </div>
    </div>
  );
}

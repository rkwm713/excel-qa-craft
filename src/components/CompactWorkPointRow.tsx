import { QAReviewRow } from "@/types/qa-tool";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactWorkPointRowProps {
  row: QAReviewRow;
  rowNumber: number;
  onUpdateRow: (id: string, field: keyof QAReviewRow, value: any) => void;
  cuOptions: string[];
}

export function CompactWorkPointRow({ row, rowNumber, onUpdateRow, cuOptions }: CompactWorkPointRowProps) {
  const handleChange = (field: keyof QAReviewRow, value: any) => {
    onUpdateRow(row.id, field, value);
  };

  return (
    <div className="border-b last:border-b-0 py-2 hover:bg-muted/30 transition-colors">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">#{rowNumber}</span>
          <Badge
            variant={row.issueType === "OK" ? "default" : "destructive"}
            className="text-xs h-5"
          >
            {row.issueType}
          </Badge>
          <span className="text-xs text-muted-foreground">{row.workSet}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 text-xs",
            row.cuCheck ? "text-green-600" : "text-red-600"
          )}>
            {row.cuCheck ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            <span>CU</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs",
            row.wfCheck ? "text-green-600" : "text-red-600"
          )}>
            {row.wfCheck ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            <span>WF</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs",
            row.qtyCheck ? "text-green-600" : "text-red-600"
          )}>
            {row.qtyCheck ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            <span>QTY</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-2 mb-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{row.description}</p>
      </div>

      {/* CU Row */}
      <div className="grid grid-cols-2 gap-2 px-2 mb-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase">Designer CU</label>
          <div className="text-xs font-mono bg-muted/30 px-2 py-1 rounded">{row.designerCU}</div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase">QA CU</label>
          <Select
            value={row.qaCU}
            onValueChange={(value) => handleChange("qaCU", value)}
          >
            <SelectTrigger className={cn(
              "h-7 text-xs",
              !row.cuCheck && "border-red-500"
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {cuOptions.map((cu) => (
                <SelectItem key={cu} value={cu} className="text-xs">
                  {cu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* WF Row */}
      <div className="grid grid-cols-2 gap-2 px-2 mb-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase">Designer WF</label>
          <div className="text-xs font-mono bg-muted/30 px-2 py-1 rounded">{row.designerWF}</div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase">QA WF</label>
          <Input
            value={row.qaWF}
            onChange={(e) => handleChange("qaWF", e.target.value)}
            className={cn(
              "h-7 text-xs",
              !row.wfCheck && "border-red-500"
            )}
          />
        </div>
      </div>

      {/* QTY Row */}
      <div className="grid grid-cols-2 gap-2 px-2 mb-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase">Designer Qty</label>
          <div className="text-xs font-mono bg-muted/30 px-2 py-1 rounded">{row.designerQty}</div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase">QA Qty</label>
          <Input
            type="number"
            value={row.qaQty}
            onChange={(e) => handleChange("qaQty", parseFloat(e.target.value) || 0)}
            className={cn(
              "h-7 text-xs",
              !row.qtyCheck && "border-red-500"
            )}
          />
        </div>
      </div>

      {/* Comments */}
      <div className="px-2">
        <label className="text-[10px] text-muted-foreground uppercase">QA Comments</label>
        <Textarea
          value={row.qaComments}
          onChange={(e) => handleChange("qaComments", e.target.value)}
          placeholder="Add comments..."
          className="min-h-[50px] text-xs resize-none"
        />
      </div>
    </div>
  );
}

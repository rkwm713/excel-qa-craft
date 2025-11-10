import { memo } from "react";
import { QAReviewRow as QAReviewRowType } from "@/types/qa-tool";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface QAReviewRowProps {
  row: QAReviewRowType;
  onUpdateRow: (id: string, field: keyof QAReviewRowType, value: any) => void;
  cuOptions: string[];
}

export const QAReviewRow = memo(({ row, onUpdateRow, cuOptions }: QAReviewRowProps) => {
  return (
    <tr className="hover:bg-muted/30 transition-colors border-b">
      <td className="px-4 py-3 min-w-[180px]">
        <Select
          value={row.issueType}
          onValueChange={(value) => onUpdateRow(row.id, "issueType", value)}
        >
          <SelectTrigger className="w-full">
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
      </td>
      <td className="px-4 py-3 text-sm min-w-[100px] font-neuton">{row.station}</td>
      <td className="px-4 py-3 text-sm min-w-[120px] font-neuton">{row.workSet}</td>
      <td className="px-4 py-3 text-sm font-medium min-w-[140px] font-neuton">{row.designerCU}</td>
      <td className="px-4 py-3 min-w-[180px]">
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
      </td>
      <td className="px-4 py-3 text-sm max-w-xs truncate min-w-[250px] font-neuton" title={row.description}>
        {row.description}
      </td>
      <td className="px-4 py-3 text-sm min-w-[120px] font-neuton">{row.designerWF}</td>
      <td className="px-4 py-3 min-w-[100px]">
        <Select
          value={row.qaWF}
          onValueChange={(value) => onUpdateRow(row.id, "qaWF", value)}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I">I</SelectItem>
            <SelectItem value="R">R</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 text-sm text-right min-w-[120px] font-neuton">{row.designerQty}</td>
      <td className="px-4 py-3 min-w-[120px]">
        <Input
          type="number"
          value={row.qaQty}
          onChange={(e) => onUpdateRow(row.id, "qaQty", parseFloat(e.target.value) || 0)}
          className="w-24 text-right"
        />
      </td>
      <td className="px-4 py-3 min-w-[220px]">
        <Textarea
          value={row.qaComments}
          onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
          className="min-w-[200px]"
          rows={1}
        />
      </td>
      <td className="px-4 py-3 min-w-[100px]">
        <div className="flex gap-2 justify-center">
          {row.cuCheck ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <X className="w-4 h-4 text-destructive" />
          )}
          {row.wfCheck ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <X className="w-4 h-4 text-destructive" />
          )}
          {row.qtyCheck ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <X className="w-4 h-4 text-destructive" />
          )}
        </div>
      </td>
    </tr>
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

QAReviewRow.displayName = "QAReviewRow";

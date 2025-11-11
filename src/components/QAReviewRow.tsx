import { memo } from "react";
import { QAReviewRow as QAReviewRowType } from "@/types/qa-tool";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface QAReviewRowProps {
  row: QAReviewRowType;
  onUpdateRow: (id: string, field: keyof QAReviewRowType, value: any) => void;
  cuOptions: string[];
  isActive?: boolean;
  onRowClick?: (row: QAReviewRowType) => void;
}

export const QAReviewRow = memo(({ row, onUpdateRow, cuOptions, isActive = false, onRowClick }: QAReviewRowProps) => {
  const handleRowClick = () => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  // Check if row needs correction
  const needsCorrection = !row.cuCheck || !row.wfCheck || !row.qtyCheck;
  
  return (
    <tr 
      className={`hover:bg-muted/30 transition-colors border-b cursor-pointer ${
        isActive ? 'bg-primary/10 border-primary/30' : ''
      } ${
        needsCorrection ? 'bg-destructive/5 border-l-4 border-l-destructive/50' : ''
      }`}
      onClick={handleRowClick}
    >
      <td className="px-4 py-3 text-center text-sm font-medium min-w-[140px] font-neuton bg-primary/5 border-r border-primary/10 relative">
        {!row.cuCheck && (
          <AlertCircle className="absolute top-1 right-1 w-3 h-3 text-destructive" />
        )}
        {row.designerCU}
      </td>
      <td className="px-4 py-3 text-center min-w-[180px] relative">
        {!row.cuCheck && (
          <AlertCircle className="absolute top-1 right-1 w-3 h-3 text-destructive z-10" />
        )}
        <div className="flex justify-center">
          <Select
            value={row.qaCU === "" ? undefined : row.qaCU}
            onValueChange={(value) => onUpdateRow(row.id, "qaCU", value)}
          >
            <SelectTrigger 
              className={`w-full relative !flex !justify-center [&>span]:!flex [&>span]:!justify-center [&>span]:!w-full [&>span]:!text-center [&>span]:!pr-6 [&>svg]:!absolute [&>svg]:!right-2 [&>svg]:!ml-0 [&>svg]:!flex-shrink-0 ${
                !row.cuCheck ? 'border-destructive/50 focus:ring-destructive/50' : ''
              }`}
              onClick={(e) => e.stopPropagation()} // Prevent row click when opening dropdown
            >
              <SelectValue placeholder="Select CU" className="!text-center !w-full !flex !justify-center" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {cuOptions.map((cu) => (
                <SelectItem key={cu} value={cu} className="text-center">
                  {cu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm min-w-[120px] font-neuton bg-primary/5 border-r border-primary/10 relative">
        {!row.wfCheck && (
          <AlertCircle className="absolute top-1 right-1 w-3 h-3 text-destructive" />
        )}
        {row.designerWF}
      </td>
      <td className="px-4 py-3 text-center min-w-[100px] relative">
        {!row.wfCheck && (
          <AlertCircle className="absolute top-1 right-1 w-3 h-3 text-destructive z-10" />
        )}
        <div className="flex justify-center">
          <Select
            value={row.qaWF === "" ? undefined : row.qaWF}
            onValueChange={(value) => onUpdateRow(row.id, "qaWF", value)}
          >
            <SelectTrigger 
              className={`w-20 relative !flex !justify-center [&>span]:!flex [&>span]:!justify-center [&>span]:!w-full [&>span]:!text-center [&>span]:!pr-4 [&>svg]:!absolute [&>svg]:!right-1 [&>svg]:!ml-0 [&>svg]:!flex-shrink-0 ${
                !row.wfCheck ? 'border-destructive/50 focus:ring-destructive/50' : ''
              }`}
              onClick={(e) => e.stopPropagation()} // Prevent row click when opening dropdown
            >
              <SelectValue className="!text-center !w-full !flex !justify-center" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I" className="text-center">I</SelectItem>
              <SelectItem value="R" className="text-center">R</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm min-w-[120px] font-neuton bg-primary/5 border-r border-primary/10 relative">
        {!row.qtyCheck && (
          <AlertCircle className="absolute top-1 right-1 w-3 h-3 text-destructive" />
        )}
        {row.designerQty}
      </td>
      <td className="px-4 py-3 text-center min-w-[120px] relative">
        {!row.qtyCheck && (
          <AlertCircle className="absolute top-1 right-1 w-3 h-3 text-destructive z-10" />
        )}
        <div className="flex justify-center">
          <Input
            type="number"
            value={row.qaQty ?? ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              const parsedValue =
                inputValue.trim() === "" ? null : Number(inputValue);
              onUpdateRow(
                row.id,
                "qaQty",
                parsedValue !== null && Number.isFinite(parsedValue)
                  ? parsedValue
                  : null
              );
              e.stopPropagation(); // Prevent row click when editing
            }}
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking input
            className={`w-24 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              !row.qtyCheck ? 'border-destructive/50 focus:ring-destructive/50' : ''
            }`}
            style={{ textAlign: 'center' }}
          />
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

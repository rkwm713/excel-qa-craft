import { QAReviewRow } from "@/types/qa-tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactWorkPointCardProps {
  row: QAReviewRow;
  onJumpToPdf: (station: string) => void;
  isActive?: boolean;
}

export function CompactWorkPointCard({ row, onJumpToPdf, isActive }: CompactWorkPointCardProps) {
  return (
    <div
      className={cn(
        "border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer group",
        isActive && "bg-primary/10 border-primary"
      )}
      onClick={() => onJumpToPdf(row.station)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">WP {row.station}</span>
          <Badge
            variant={row.issueType === "OK" ? "default" : "destructive"}
            className="text-xs"
          >
            {row.issueType}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onJumpToPdf(row.station);
          }}
        >
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {row.cuCheck ? (
            <CheckCircle2 className="w-3 h-3 text-green-600" />
          ) : (
            <XCircle className="w-3 h-3 text-red-600" />
          )}
          <span>CU</span>
        </div>
        <div className="flex items-center gap-1">
          {row.wfCheck ? (
            <CheckCircle2 className="w-3 h-3 text-green-600" />
          ) : (
            <XCircle className="w-3 h-3 text-red-600" />
          )}
          <span>WF</span>
        </div>
        <div className="flex items-center gap-1">
          {row.qtyCheck ? (
            <CheckCircle2 className="w-3 h-3 text-green-600" />
          ) : (
            <XCircle className="w-3 h-3 text-red-600" />
          )}
          <span>QTY</span>
        </div>
      </div>
      
      {!row.cuCheck && (
        <div className="mt-2 text-xs">
          <span className="text-muted-foreground">Designer: </span>
          <span className="font-mono">{row.designerCU}</span>
          <span className="mx-1 text-muted-foreground">→</span>
          <span className="font-mono">{row.qaCU}</span>
        </div>
      )}
    </div>
  );
}

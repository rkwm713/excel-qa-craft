import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, FileText, TrendingUp } from "lucide-react";
import { DashboardMetrics } from "@/types/qa-tool";
import { Progress } from "@/components/ui/progress";

interface DashboardProps {
  metrics: DashboardMetrics;
}

export const Dashboard = ({ metrics }: DashboardProps) => {
  const completionRate = metrics.totalRows > 0 
    ? Math.round((metrics.okCount / metrics.totalRows) * 100) 
    : 0;

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-semibold font-saira uppercase tracking-wide">Total Records</CardTitle>
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-bold font-saira">{metrics.totalRows}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-neuton">
            QA review entries
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-semibold font-saira uppercase tracking-wide">OK Status</CardTitle>
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-bold text-success font-saira">{metrics.okCount}</div>
          <Progress value={completionRate} className="mt-1.5 h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-0.5 font-neuton">
            {completionRate}% completion
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-semibold font-saira uppercase tracking-wide">Needs Revision</CardTitle>
          <XCircle className="h-3.5 w-3.5 text-destructive" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-bold text-destructive font-saira">
            {metrics.needsRevisionCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-neuton">
            Require attention
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-semibold font-saira uppercase tracking-wide">Match Rate</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xl font-bold font-saira">
            {Math.round((metrics.cuMatchRate + metrics.wfMatchRate + metrics.qtyMatchRate) / 3)}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5 font-neuton">
            <div>CU: {Math.round(metrics.cuMatchRate)}%</div>
            <div>WF: {Math.round(metrics.wfMatchRate)}%</div>
            <div>Qty: {Math.round(metrics.qtyMatchRate)}%</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

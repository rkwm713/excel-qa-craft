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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalRows}</div>
          <p className="text-xs text-muted-foreground mt-1">
            QA review entries
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OK Status</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{metrics.okCount}</div>
          <Progress value={completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completionRate}% completion
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {metrics.needsRevisionCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Require attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round((metrics.cuMatchRate + metrics.wfMatchRate + metrics.qtyMatchRate) / 3)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <div>CU: {Math.round(metrics.cuMatchRate)}%</div>
            <div>WF: {Math.round(metrics.wfMatchRate)}%</div>
            <div>Qty: {Math.round(metrics.qtyMatchRate)}%</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

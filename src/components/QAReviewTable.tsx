import { useState } from "react";
import { QAReviewRow } from "@/types/qa-tool";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface QAReviewTableProps {
  data: QAReviewRow[];
  onUpdateRow: (id: string, field: keyof QAReviewRow, value: any) => void;
  cuOptions: string[];
}

export const QAReviewTable = ({ data, onUpdateRow, cuOptions }: QAReviewTableProps) => {
  const [editingCell, setEditingCell] = useState<string | null>(null);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Station</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Work Set</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Designer CU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">QA CU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Description</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Designer WF</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">QA WF</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Designer Qty</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">QA Qty</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border-b">Comments</th>
              <th className="px-4 py-3 text-center text-sm font-semibold border-b">Checks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors border-b">
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-sm">{row.station}</td>
                <td className="px-4 py-3 text-sm">{row.workSet}</td>
                <td className="px-4 py-3 text-sm font-medium">{row.designerCU}</td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-sm max-w-xs truncate" title={row.description}>
                  {row.description}
                </td>
                <td className="px-4 py-3 text-sm">{row.designerWF}</td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-sm text-right">{row.designerQty}</td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    value={row.qaQty}
                    onChange={(e) => onUpdateRow(row.id, "qaQty", parseFloat(e.target.value))}
                    className="w-24 text-right"
                  />
                </td>
                <td className="px-4 py-3">
                  <Textarea
                    value={row.qaComments}
                    onChange={(e) => onUpdateRow(row.id, "qaComments", e.target.value)}
                    className="min-w-[200px]"
                    rows={1}
                  />
                </td>
                <td className="px-4 py-3">
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
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

import { useState, useMemo } from "react";
import { QAReviewRow } from "@/types/qa-tool";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CompactWorkPointCard } from "./CompactWorkPointCard";
import { WorkPointEditor } from "./WorkPointEditor";
import { ChevronLeft, ChevronRight, Search, Flag } from "lucide-react";

interface PDFReviewContextPanelProps {
  data: QAReviewRow[];
  currentWorkPoint: QAReviewRow | null;
  onUpdateRow: (id: string, field: keyof QAReviewRow, value: any) => void;
  cuOptions: string[];
  onJumpToWorkPoint: (station: string) => void;
  onPreviousWorkPoint: () => void;
  onNextWorkPoint: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function PDFReviewContextPanel({
  data,
  currentWorkPoint,
  onUpdateRow,
  cuOptions,
  onJumpToWorkPoint,
  onPreviousWorkPoint,
  onNextWorkPoint,
  canGoPrevious,
  canGoNext,
}: PDFReviewContextPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("current");

  // Filter flagged items
  const flaggedItems = useMemo(() => {
    return data.filter(row => row.issueType === "NEEDS REVISIONS");
  }, [data]);

  // Filter by search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(row => 
      row.station.toLowerCase().includes(query) ||
      row.designerCU.toLowerCase().includes(query) ||
      row.qaCU.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const filteredFlagged = useMemo(() => {
    if (!searchQuery) return flaggedItems;
    const query = searchQuery.toLowerCase();
    return flaggedItems.filter(row => 
      row.station.toLowerCase().includes(query) ||
      row.designerCU.toLowerCase().includes(query) ||
      row.qaCU.toLowerCase().includes(query)
    );
  }, [flaggedItems, searchQuery]);

  const currentIndex = useMemo(() => {
    if (!currentWorkPoint) return -1;
    return data.findIndex(row => row.id === currentWorkPoint.id);
  }, [data, currentWorkPoint]);

  const reviewedCount = useMemo(() => {
    return data.filter(row => row.issueType === "OK").length;
  }, [data]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 space-y-0">
        <CardTitle className="text-base flex items-center justify-between">
          <span>QA Review Panel</span>
          <Badge variant="secondary" className="text-xs">
            {reviewedCount}/{data.length} OK
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current" className="text-xs">Current</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                All ({data.length})
              </TabsTrigger>
              <TabsTrigger value="flagged" className="text-xs flex items-center gap-1">
                <Flag className="w-3 h-3" />
                {flaggedItems.length > 0 && (
                  <span>({flaggedItems.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Current Tab */}
          <TabsContent value="current" className="flex-1 flex flex-col min-h-0 mt-0">
            <ScrollArea className="flex-1 px-4">
              {currentWorkPoint ? (
                <div className="py-4 space-y-4">
                  <WorkPointEditor
                    row={currentWorkPoint}
                    onUpdateRow={onUpdateRow}
                    cuOptions={cuOptions}
                  />
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPreviousWorkPoint}
                      disabled={!canGoPrevious}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentIndex + 1} of {data.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onNextWorkPoint}
                      disabled={!canGoNext}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No work point selected
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* All Stations Tab */}
          <TabsContent value="all" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search stations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-2 pb-4">
                {filteredData.map((row) => (
                  <CompactWorkPointCard
                    key={row.id}
                    row={row}
                    onJumpToPdf={onJumpToWorkPoint}
                    isActive={currentWorkPoint?.id === row.id}
                  />
                ))}
                {filteredData.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No stations found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Flagged Tab */}
          <TabsContent value="flagged" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search flagged..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-2 pb-4">
                {filteredFlagged.map((row) => (
                  <CompactWorkPointCard
                    key={row.id}
                    row={row}
                    onJumpToPdf={onJumpToWorkPoint}
                    isActive={currentWorkPoint?.id === row.id}
                  />
                ))}
                {filteredFlagged.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {flaggedItems.length === 0 ? "No issues found! 🎉" : "No flagged stations found"}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

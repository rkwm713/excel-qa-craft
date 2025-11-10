import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface StationNavigatorProps {
  stations: string[];
  currentStation: string | null;
  onStationChange: (station: string | null) => void;
  stationCounts: Record<string, number>;
}

export const StationNavigator = ({
  stations,
  currentStation,
  onStationChange,
  stationCounts,
}: StationNavigatorProps) => {
  const currentIndex = currentStation ? stations.indexOf(currentStation) : -1;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < stations.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onStationChange(stations[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onStationChange(stations[currentIndex + 1]);
    }
  };

  const handleViewAll = () => {
    onStationChange(null);
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-sm">
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={!canGoPrevious || !currentStation}
              className="h-10 w-10 border-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-[250px]">
              <Select
                value={currentStation || "all"}
                onValueChange={(value) => onStationChange(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full h-10 border-2 font-semibold">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2 py-1">
                      <List className="w-4 h-4" />
                      <span className="font-semibold">View All Stations</span>
                    </div>
                  </SelectItem>
                  {stations.map((station) => (
                    <SelectItem key={station} value={station}>
                      <div className="flex items-center justify-between gap-3 w-full py-1">
                        <span className="font-semibold font-saira">Station {station}</span>
                        <Badge variant="secondary" className="ml-2 font-bold">
                          {stationCounts[station] || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={!canGoNext || !currentStation}
              className="h-10 w-10 border-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {currentStation && (
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2 text-sm font-neuton bg-background px-4 py-2 rounded-lg border-2">
                <span className="text-muted-foreground">Viewing:</span>
                <span className="font-bold text-primary font-saira text-base">
                  Station {currentStation}
                </span>
                <Badge variant="default" className="font-bold">
                  {stationCounts[currentStation] || 0} records
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAll}
                className="gap-2 border-2 font-semibold hover:bg-primary hover:text-primary-foreground"
              >
                <List className="w-4 h-4" />
                View All
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

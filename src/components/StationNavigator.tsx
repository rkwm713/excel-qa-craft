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
    <Card className="p-4 bg-muted/30 border-primary/20">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={!canGoPrevious || !currentStation}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[200px]">
            <Select
              value={currentStation || "all"}
              onValueChange={(value) => onStationChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    <span>View All Stations</span>
                  </div>
                </SelectItem>
                {stations.map((station) => (
                  <SelectItem key={station} value={station}>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>Station {station}</span>
                      <Badge variant="secondary" className="ml-2">
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
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {currentStation && (
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm font-neuton">
              <span className="text-muted-foreground">Viewing:</span>{" "}
              <span className="font-semibold text-primary font-saira">
                Station {currentStation}
              </span>{" "}
              <span className="text-muted-foreground">
                ({stationCounts[currentStation] || 0} records)
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAll}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              View All
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

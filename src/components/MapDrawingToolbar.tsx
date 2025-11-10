import { useState } from "react";
import { Pen, Square, Circle, Trash2, X, ChevronRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MapDrawingToolbarProps {
  onDrawModeChange: (mode: string | null, options?: any) => void;
  onClearAll: () => void;
  activeMode: string | null;
}

export function MapDrawingToolbar({ onDrawModeChange, onClearAll, activeMode }: MapDrawingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedColor, setSelectedColor] = useState("#ef4444");
  const [selectedWidth, setSelectedWidth] = useState(3);

  const colors = [
    { value: "#ef4444", label: "Red" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#eab308", label: "Yellow" },
    { value: "#22c55e", label: "Green" },
    { value: "#000000", label: "Black" },
  ];

  const widths = [
    { value: 2, label: "Thin" },
    { value: 3, label: "Medium" },
    { value: 5, label: "Thick" },
  ];

  const handleDrawMode = (mode: string) => {
    if (activeMode === mode) {
      onDrawModeChange(null);
    } else {
      onDrawModeChange(mode, { color: selectedColor, weight: selectedWidth });
    }
  };

  if (!isExpanded) {
    return (
      <Card className="absolute top-20 right-4 z-[1000] shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(true)}
          className="h-10 w-10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="absolute top-20 right-4 z-[1000] p-4 shadow-lg min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Drawing Tools</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(false)}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Drawing Tools */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Draw</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeMode === "polyline" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDrawMode("polyline")}
              className="flex-1"
            >
              <Minus className="h-4 w-4 mr-1" />
              Line
            </Button>
            <Button
              variant={activeMode === "polygon" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDrawMode("polygon")}
              className="flex-1"
            >
              <Pen className="h-4 w-4 mr-1" />
              Shape
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeMode === "rectangle" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDrawMode("rectangle")}
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-1" />
              Box
            </Button>
            <Button
              variant={activeMode === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => handleDrawMode("circle")}
              className="flex-1"
            >
              <Circle className="h-4 w-4 mr-1" />
              Circle
            </Button>
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Color</p>
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  selectedColor === color.value ? "border-foreground scale-110" : "border-border"
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Width Selector */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Width</p>
          <div className="flex gap-2">
            {widths.map((width) => (
              <Button
                key={width.value}
                variant={selectedWidth === width.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedWidth(width.value)}
                className="flex-1 text-xs"
              >
                {width.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearAll}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
    </Card>
  );
}

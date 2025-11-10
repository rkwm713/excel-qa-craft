import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Pen, 
  Square, 
  Circle, 
  Type, 
  Undo, 
  Trash2, 
  Eye, 
  EyeOff,
  Hand,
  Move
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PDFAnnotationToolbarProps {
  activeTool: 'pan' | 'select' | 'freehand' | 'rectangle' | 'circle' | 'text';
  onToolChange: (tool: 'pan' | 'select' | 'freehand' | 'rectangle' | 'circle' | 'text') => void;
  color: string;
  onColorChange: (color: string) => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  canUndo: boolean;
}

const COLORS = [
  { value: '#FF0000', label: 'Red' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#00FF00', label: 'Green' },
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
];

const LINE_WIDTHS = [
  { value: 2, label: 'Thin' },
  { value: 4, label: 'Medium' },
  { value: 6, label: 'Thick' },
];

export function PDFAnnotationToolbar({
  activeTool,
  onToolChange,
  color,
  onColorChange,
  lineWidth,
  onLineWidthChange,
  onUndo,
  onClear,
  showAnnotations,
  onToggleAnnotations,
  canUndo,
}: PDFAnnotationToolbarProps) {
  const tools = [
    { id: 'pan' as const, icon: Hand, label: 'Pan' },
    { id: 'select' as const, icon: Move, label: 'Select' },
    { id: 'freehand' as const, icon: Pen, label: 'Redline' },
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'text' as const, icon: Type, label: 'Text' },
  ];

  return (
    <Card className="p-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          {tools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant={activeTool === id ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange(id)}
              title={label}
              className="h-9 w-9 p-0"
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
        <Select value={color} onValueChange={onColorChange}>
          <SelectTrigger className="w-[110px] h-9">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-border"
                style={{ backgroundColor: color }}
              />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {COLORS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: value }}
                  />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Line Width */}
        <Select value={lineWidth.toString()} onValueChange={(v) => onLineWidthChange(Number(v))}>
          <SelectTrigger className="w-[110px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LINE_WIDTHS.map(({ value, label }) => (
              <SelectItem key={value} value={value.toString()}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-8" />

        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="h-9 w-9 p-0"
        >
          <Undo className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          title="Clear All"
          className="h-9 w-9 p-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAnnotations}
          title={showAnnotations ? "Hide Annotations" : "Show Annotations"}
          className="h-9 w-9 p-0"
        >
          {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}

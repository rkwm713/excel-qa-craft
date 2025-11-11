import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Pen,
  Square,
  Type,
  Undo,
  Trash2,
  Eye,
  EyeOff,
  Hand,
  MousePointer2,
  Copy,
  Clipboard,
  MessageCircle
} from "lucide-react";

interface PDFAnnotationToolbarProps {
  activeTool: 'pan' | 'select' | 'freehand' | 'rectangle' | 'text' | 'callout';
  onToolChange: (tool: 'pan' | 'select' | 'freehand' | 'rectangle' | 'text' | 'callout') => void;
  onUndo: () => void;
  onClear: () => void;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  canUndo: boolean;
  onCopy?: () => void;
  onPaste?: () => void;
  canCopy?: boolean;
  canPaste?: boolean;
}

export function PDFAnnotationToolbar({
  activeTool,
  onToolChange,
  onUndo,
  onClear,
  showAnnotations,
  onToggleAnnotations,
  canUndo,
  onCopy,
  onPaste,
  canCopy = false,
  canPaste = false,
}: PDFAnnotationToolbarProps) {
  const tools = [
    { id: 'pan' as const, icon: Hand, label: 'Pan' },
    { id: 'select' as const, icon: MousePointer2, label: 'Select' },
    { id: 'freehand' as const, icon: Pen, label: 'Redline' },
    { id: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'callout' as const, icon: MessageCircle, label: 'Callout' },
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

        {/* Actions */}
        {onCopy && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            disabled={!canCopy}
            title="Copy"
            className="h-9 w-9 p-0"
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
        {onPaste && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPaste}
            disabled={!canPaste}
            title="Paste"
            className="h-9 w-9 p-0"
          >
            <Clipboard className="w-4 h-4" />
          </Button>
        )}
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

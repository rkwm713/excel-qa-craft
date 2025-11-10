import { useEffect, useRef, useState } from "react";
import { PDFAnnotation } from "@/types/pdf";

interface PDFCanvasProps {
  width: number;
  height: number;
  annotations: PDFAnnotation[];
  activeTool: 'select' | 'freehand' | 'rectangle' | 'circle' | 'text';
  color: string;
  lineWidth: number;
  showAnnotations: boolean;
  onAnnotationAdd: (annotation: PDFAnnotation) => void;
  scale: number;
}

export function PDFCanvas({
  width,
  height,
  annotations,
  activeTool,
  color,
  lineWidth,
  showAnnotations,
  onAnnotationAdd,
  scale,
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Render all annotations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showAnnotations) return;

    // Draw all annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (annotation.type === 'freehand' && annotation.points) {
        ctx.beginPath();
        annotation.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      } else if (annotation.type === 'rectangle' && annotation.x !== undefined && annotation.y !== undefined) {
        ctx.strokeRect(annotation.x, annotation.y, annotation.width || 0, annotation.height || 0);
      } else if (annotation.type === 'circle' && annotation.x !== undefined && annotation.y !== undefined) {
        const radius = Math.sqrt(
          Math.pow(annotation.width || 0, 2) + Math.pow(annotation.height || 0, 2)
        ) / 2;
        ctx.beginPath();
        ctx.arc(annotation.x + (annotation.width || 0) / 2, annotation.y + (annotation.height || 0) / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (annotation.type === 'text' && annotation.text && annotation.x !== undefined && annotation.y !== undefined) {
        ctx.font = `${annotation.fontSize || 16}px sans-serif`;
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.text, annotation.x, annotation.y);
      }
    });

    // Draw current drawing in progress
    if (isDrawing && activeTool === 'freehand' && currentPoints.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      currentPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    } else if (isDrawing && startPoint && (activeTool === 'rectangle' || activeTool === 'circle')) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = (lastMouseX - rect.left) * (canvas.width / rect.width);
      const currentY = (lastMouseY - rect.top) * (canvas.height / rect.height);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (activeTool === 'rectangle') {
        const width = currentX - startPoint.x;
        const height = currentY - startPoint.y;
        ctx.strokeRect(startPoint.x, startPoint.y, width, height);
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(currentX - startPoint.x, 2) + Math.pow(currentY - startPoint.y, 2)
        ) / 2;
        ctx.beginPath();
        ctx.arc(
          startPoint.x + (currentX - startPoint.x) / 2,
          startPoint.y + (currentY - startPoint.y) / 2,
          radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    }
  }, [annotations, showAnnotations, isDrawing, currentPoints, startPoint, activeTool, color, lineWidth]);

  let lastMouseX = 0;
  let lastMouseY = 0;

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;

    const point = getCanvasPoint(e.clientX, e.clientY);
    setIsDrawing(true);

    if (activeTool === 'freehand') {
      setCurrentPoints([point]);
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      setStartPoint(point);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const annotation: PDFAnnotation = {
          id: `text-${Date.now()}`,
          type: 'text',
          color,
          lineWidth,
          x: point.x,
          y: point.y,
          text,
          fontSize: 16,
        };
        onAnnotationAdd(annotation);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (activeTool === 'freehand') {
      const point = getCanvasPoint(e.clientX, e.clientY);
      setCurrentPoints((prev) => [...prev, point]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    if (activeTool === 'freehand' && currentPoints.length > 0) {
      const annotation: PDFAnnotation = {
        id: `freehand-${Date.now()}`,
        type: 'freehand',
        color,
        lineWidth,
        points: currentPoints,
      };
      onAnnotationAdd(annotation);
      setCurrentPoints([]);
    } else if ((activeTool === 'rectangle' || activeTool === 'circle') && startPoint) {
      const point = getCanvasPoint(e.clientX, e.clientY);
      const width = point.x - startPoint.x;
      const height = point.y - startPoint.y;

      const annotation: PDFAnnotation = {
        id: `${activeTool}-${Date.now()}`,
        type: activeTool,
        color,
        lineWidth,
        x: startPoint.x,
        y: startPoint.y,
        width,
        height,
      };
      onAnnotationAdd(annotation);
      setStartPoint(null);
    }

    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentPoints([]);
      setStartPoint(null);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width * scale}
      height={height * scale}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width * scale,
        height: height * scale,
        cursor: activeTool === 'select' ? 'default' : 'crosshair',
        pointerEvents: activeTool === 'select' ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}

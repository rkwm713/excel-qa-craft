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
  onAnnotationUpdate: (annotationId: string, updates: Partial<PDFAnnotation>) => void;
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
  onAnnotationUpdate,
  scale,
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  const hitTestAnnotation = (point: { x: number; y: number }, annotation: PDFAnnotation): boolean => {
    if (annotation.type === 'freehand' && annotation.points) {
      // Check if point is near any segment of the freehand path
      for (let i = 0; i < annotation.points.length - 1; i++) {
        const p1 = annotation.points[i];
        const p2 = annotation.points[i + 1];
        const dist = distanceToSegment(point, p1, p2);
        if (dist < annotation.lineWidth + 5) return true;
      }
      return false;
    } else if (annotation.type === 'rectangle' && annotation.x !== undefined && annotation.y !== undefined) {
      return (
        point.x >= annotation.x &&
        point.x <= annotation.x + (annotation.width || 0) &&
        point.y >= annotation.y &&
        point.y <= annotation.y + (annotation.height || 0)
      );
    } else if (annotation.type === 'circle' && annotation.x !== undefined && annotation.y !== undefined) {
      const centerX = annotation.x + (annotation.width || 0) / 2;
      const centerY = annotation.y + (annotation.height || 0) / 2;
      const radius = Math.sqrt(
        Math.pow(annotation.width || 0, 2) + Math.pow(annotation.height || 0, 2)
      ) / 2;
      const dist = Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
      return dist <= radius;
    } else if (annotation.type === 'text' && annotation.x !== undefined && annotation.y !== undefined) {
      const textWidth = (annotation.text?.length || 0) * (annotation.fontSize || 16) * 0.6;
      const textHeight = annotation.fontSize || 16;
      return (
        point.x >= annotation.x &&
        point.x <= annotation.x + textWidth &&
        point.y >= annotation.y - textHeight &&
        point.y <= annotation.y
      );
    }
    return false;
  };

  const distanceToSegment = (
    point: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return Math.sqrt(Math.pow(point.x - p1.x, 2) + Math.pow(point.y - p1.y, 2));
    
    let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    
    return Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e.clientX, e.clientY);

    if (activeTool === 'select') {
      // Check if clicking on an annotation (reverse order to select top-most)
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (hitTestAnnotation(point, annotations[i])) {
          setSelectedAnnotation(annotations[i].id);
          setIsDragging(true);
          
          // Calculate offset for smooth dragging
          if (annotations[i].type === 'freehand' && annotations[i].points) {
            const firstPoint = annotations[i].points[0];
            setDragOffset({ x: point.x - firstPoint.x, y: point.y - firstPoint.y });
          } else if (annotations[i].x !== undefined && annotations[i].y !== undefined) {
            setDragOffset({ x: point.x - annotations[i].x!, y: point.y - annotations[i].y! });
          }
          return;
        }
      }
      setSelectedAnnotation(null);
      return;
    }

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
    const point = getCanvasPoint(e.clientX, e.clientY);

    if (isDragging && selectedAnnotation) {
      const annotation = annotations.find(a => a.id === selectedAnnotation);
      if (!annotation) return;

      const newX = point.x - dragOffset.x;
      const newY = point.y - dragOffset.y;

      if (annotation.type === 'freehand' && annotation.points) {
        const firstPoint = annotation.points[0];
        const dx = newX - firstPoint.x;
        const dy = newY - firstPoint.y;
        const newPoints = annotation.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        onAnnotationUpdate(selectedAnnotation, { points: newPoints });
      } else if (annotation.x !== undefined && annotation.y !== undefined) {
        onAnnotationUpdate(selectedAnnotation, { x: newX, y: newY });
      }
      return;
    }

    if (!isDrawing) return;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (activeTool === 'freehand') {
      setCurrentPoints((prev) => [...prev, point]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }

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
    if (isDragging) {
      setIsDragging(false);
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
        cursor: activeTool === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}

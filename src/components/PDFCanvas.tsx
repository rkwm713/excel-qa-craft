import { useEffect, useRef, useState } from "react";
import { PDFAnnotation } from "@/types/pdf";

interface PDFCanvasProps {
  width: number;
  height: number;
  annotations: PDFAnnotation[];
  activeTool: 'pan' | 'select' | 'freehand' | 'rectangle' | 'circle' | 'text';
  color: string;
  lineWidth: number;
  showAnnotations: boolean;
  onAnnotationAdd: (annotation: PDFAnnotation) => void;
  onAnnotationUpdate: (annotationId: string, updates: Partial<PDFAnnotation>) => void;
  scale: number;
  baseWidth: number; // Base PDF page width (without scale)
  baseHeight: number; // Base PDF page height (without scale)
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
  baseWidth,
  baseHeight,
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [panScrollStart, setPanScrollStart] = useState<{ x: number; y: number } | null>(null);

  // Convert normalized coordinates (0-1) to canvas coordinates
  const normalizedToCanvas = (normX: number, normY: number) => {
    return {
      x: normX * baseWidth * scale,
      y: normY * baseHeight * scale,
    };
  };

  // Convert canvas coordinates to normalized coordinates (0-1)
  const canvasToNormalized = (canvasX: number, canvasY: number) => {
    return {
      x: canvasX / (baseWidth * scale),
      y: canvasY / (baseHeight * scale),
    };
  };

  // Render all annotations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showAnnotations) return;

      // Draw all annotations - convert from normalized to canvas coordinates
      annotations.forEach((annotation) => {
        ctx.strokeStyle = annotation.color;
        // Convert normalized line width back to canvas pixels
        ctx.lineWidth = (annotation.lineWidth * baseWidth) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

      if (annotation.type === 'freehand' && annotation.points) {
        ctx.beginPath();
        annotation.points.forEach((point, index) => {
          const canvasPoint = normalizedToCanvas(point.x, point.y);
          if (index === 0) {
            ctx.moveTo(canvasPoint.x, canvasPoint.y);
          } else {
            ctx.lineTo(canvasPoint.x, canvasPoint.y);
          }
        });
        ctx.stroke();
      } else if (annotation.type === 'rectangle' && annotation.x !== undefined && annotation.y !== undefined) {
        const canvasPos = normalizedToCanvas(annotation.x, annotation.y);
        const canvasSize = {
          width: (annotation.width || 0) * baseWidth * scale,
          height: (annotation.height || 0) * baseHeight * scale,
        };
        ctx.strokeRect(canvasPos.x, canvasPos.y, canvasSize.width, canvasSize.height);
      } else if (annotation.type === 'circle' && annotation.x !== undefined && annotation.y !== undefined) {
        const canvasPos = normalizedToCanvas(annotation.x, annotation.y);
        const canvasSize = {
          width: (annotation.width || 0) * baseWidth * scale,
          height: (annotation.height || 0) * baseHeight * scale,
        };
        const radius = Math.sqrt(Math.pow(canvasSize.width, 2) + Math.pow(canvasSize.height, 2)) / 2;
        ctx.beginPath();
        ctx.arc(canvasPos.x + canvasSize.width / 2, canvasPos.y + canvasSize.height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (annotation.type === 'text' && annotation.text && annotation.x !== undefined && annotation.y !== undefined) {
        const canvasPos = normalizedToCanvas(annotation.x, annotation.y);
        // Convert normalized font size back to canvas pixels
        const fontSize = (annotation.fontSize || 16 / baseHeight) * baseHeight * scale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.text, canvasPos.x, canvasPos.y);
      }
    });

    // Draw current drawing in progress
    if (isDrawing && activeTool === 'freehand' && currentPoints.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * scale;
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
      ctx.lineWidth = lineWidth * scale;

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
  }, [annotations, showAnnotations, isDrawing, currentPoints, startPoint, activeTool, color, lineWidth, scale, baseWidth, baseHeight]);

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

  const getNormalizedPoint = (clientX: number, clientY: number) => {
    const canvasPoint = getCanvasPoint(clientX, clientY);
    return canvasToNormalized(canvasPoint.x, canvasPoint.y);
  };

  const hitTestAnnotation = (normalizedPoint: { x: number; y: number }, annotation: PDFAnnotation): boolean => {
    if (annotation.type === 'freehand' && annotation.points) {
      // Check if point is near any segment of the freehand path
      for (let i = 0; i < annotation.points.length - 1; i++) {
        const p1 = annotation.points[i];
        const p2 = annotation.points[i + 1];
        const dist = distanceToSegment(normalizedPoint, p1, p2);
        const threshold = annotation.lineWidth + 0.01; // Normalized threshold (lineWidth is already normalized)
        if (dist < threshold) return true;
      }
      return false;
    } else if (annotation.type === 'rectangle' && annotation.x !== undefined && annotation.y !== undefined) {
      return (
        normalizedPoint.x >= annotation.x &&
        normalizedPoint.x <= annotation.x + (annotation.width || 0) &&
        normalizedPoint.y >= annotation.y &&
        normalizedPoint.y <= annotation.y + (annotation.height || 0)
      );
    } else if (annotation.type === 'circle' && annotation.x !== undefined && annotation.y !== undefined) {
      const centerX = annotation.x + (annotation.width || 0) / 2;
      const centerY = annotation.y + (annotation.height || 0) / 2;
      const radius = Math.sqrt(
        Math.pow(annotation.width || 0, 2) + Math.pow(annotation.height || 0, 2)
      ) / 2;
      const dist = Math.sqrt(Math.pow(normalizedPoint.x - centerX, 2) + Math.pow(normalizedPoint.y - centerY, 2));
      return dist <= radius;
    } else if (annotation.type === 'text' && annotation.x !== undefined && annotation.y !== undefined) {
      // Font size is stored normalized, convert to get text dimensions
      const fontSize = (annotation.fontSize || 16 / baseHeight) * baseHeight;
      const textWidth = (annotation.text?.length || 0) * fontSize * 0.6 / baseWidth;
      const textHeight = fontSize / baseHeight;
      return (
        normalizedPoint.x >= annotation.x &&
        normalizedPoint.x <= annotation.x + textWidth &&
        normalizedPoint.y >= annotation.y - textHeight &&
        normalizedPoint.y <= annotation.y
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
    const canvasPoint = getCanvasPoint(e.clientX, e.clientY);
    const normalizedPoint = canvasToNormalized(canvasPoint.x, canvasPoint.y);

    if (activeTool === 'pan') {
      // Pan tool: start panning by capturing scroll position
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      const container = document.getElementById('pdf-container');
      if (container) {
        setPanScrollStart({ x: container.scrollLeft, y: container.scrollTop });
      }
      return;
    }

    if (activeTool === 'select') {
      // Check if clicking on an annotation (reverse order to select top-most)
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (hitTestAnnotation(normalizedPoint, annotations[i])) {
          setSelectedAnnotation(annotations[i].id);
          setIsDragging(true);
          
          // Calculate offset for smooth dragging (in normalized coordinates)
          if (annotations[i].type === 'freehand' && annotations[i].points) {
            const firstPoint = annotations[i].points[0];
            setDragOffset({ x: normalizedPoint.x - firstPoint.x, y: normalizedPoint.y - firstPoint.y });
          } else if (annotations[i].x !== undefined && annotations[i].y !== undefined) {
            setDragOffset({ x: normalizedPoint.x - annotations[i].x!, y: normalizedPoint.y - annotations[i].y! });
          }
          return;
        }
      }
      setSelectedAnnotation(null);
      return;
    }

    setIsDrawing(true);

    if (activeTool === 'freehand') {
      setCurrentPoints([canvasPoint]); // Store canvas points for drawing, convert to normalized on save
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      setStartPoint(canvasPoint); // Store canvas points for drawing, convert to normalized on save
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const annotation: PDFAnnotation = {
          id: `text-${Date.now()}`,
          type: 'text',
          color,
          lineWidth: lineWidth / baseWidth, // Store line width as normalized
          x: normalizedPoint.x, // Store in normalized coordinates
          y: normalizedPoint.y,
          text,
          fontSize: 16 / baseHeight, // Store font size as normalized (relative to page height)
        };
        onAnnotationAdd(annotation);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && panStart && panScrollStart) {
      // Pan tool: update scroll position based on mouse movement
      e.preventDefault();
      const container = document.getElementById('pdf-container');
      if (container) {
        const deltaX = panStart.x - e.clientX;
        const deltaY = panStart.y - e.clientY;
        container.scrollLeft = panScrollStart.x + deltaX;
        container.scrollTop = panScrollStart.y + deltaY;
      }
      return;
    }

    const canvasPoint = getCanvasPoint(e.clientX, e.clientY);
    const normalizedPoint = canvasToNormalized(canvasPoint.x, canvasPoint.y);

    if (isDragging && selectedAnnotation) {
      const annotation = annotations.find(a => a.id === selectedAnnotation);
      if (!annotation) return;

      const newX = normalizedPoint.x - dragOffset.x;
      const newY = normalizedPoint.y - dragOffset.y;

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
      setCurrentPoints((prev) => [...prev, canvasPoint]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      setPanScrollStart(null);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'freehand' && currentPoints.length > 0) {
      // Convert canvas points to normalized coordinates
      const normalizedPoints = currentPoints.map(p => canvasToNormalized(p.x, p.y));
      const annotation: PDFAnnotation = {
        id: `freehand-${Date.now()}`,
        type: 'freehand',
        color,
        lineWidth: lineWidth / baseWidth, // Store line width as normalized
        points: normalizedPoints,
      };
      onAnnotationAdd(annotation);
      setCurrentPoints([]);
    } else if ((activeTool === 'rectangle' || activeTool === 'circle') && startPoint) {
      const canvasPoint = getCanvasPoint(e.clientX, e.clientY);
      const startNormalized = canvasToNormalized(startPoint.x, startPoint.y);
      const endNormalized = canvasToNormalized(canvasPoint.x, canvasPoint.y);
      
      const width = endNormalized.x - startNormalized.x;
      const height = endNormalized.y - startNormalized.y;

      const annotation: PDFAnnotation = {
        id: `${activeTool}-${Date.now()}`,
        type: activeTool,
        color,
        lineWidth: lineWidth / baseWidth, // Store line width as normalized
        x: startNormalized.x,
        y: startNormalized.y,
        width,
        height,
      };
      onAnnotationAdd(annotation);
      setStartPoint(null);
    }

    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      setPanScrollStart(null);
    }
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentPoints([]);
      setStartPoint(null);
    }
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const canvasWidth = Math.min(baseWidth * scale, 1000);
  const canvasHeight = Math.min(baseHeight * scale, 1414);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth,
        height: canvasHeight,
        maxWidth: '100%',
        maxHeight: '100%',
        cursor: activeTool === 'pan' 
          ? (isPanning ? 'grabbing' : 'grab') 
          : activeTool === 'select' 
            ? (isDragging ? 'grabbing' : 'grab') 
            : 'crosshair',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}

import { useEffect, useRef, useState } from "react";
import { PDFAnnotation } from "@/types/pdf";

interface PDFCanvasProps {
  width: number;
  height: number;
  annotations: PDFAnnotation[];
  activeTool: 'pan' | 'select' | 'freehand' | 'rectangle' | 'text' | 'callout';
  showAnnotations: boolean;
  onAnnotationAdd: (annotation: PDFAnnotation) => void;
  onAnnotationUpdate: (annotationId: string, updates: Partial<PDFAnnotation>) => void;
  scale: number;
  baseWidth: number; // Fixed reference width for storing annotations (always 700)
  baseHeight: number; // Fixed reference height for storing annotations (always 990)
  displayWidth: number; // Actual display width (varies by view mode)
  displayHeight: number; // Actual display height (varies by view mode)
  onZoom?: (delta: number, centerX: number, centerY: number) => void;
  pdfPageRef?: React.RefObject<HTMLDivElement>;
}

export function PDFCanvas({
  width,
  height,
  annotations,
  activeTool,
  showAnnotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  scale,
  baseWidth,
  baseHeight,
  displayWidth,
  displayHeight,
  onZoom,
  pdfPageRef,
}: PDFCanvasProps) {
  // Hardcoded to red color and medium line width
  const color = '#FF0000';
  const lineWidth = 4;
  const calloutDiameter = 32;
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
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Attach wheel event listener directly to canvas to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onZoom) return;

    const handleWheel = (e: WheelEvent) => {
      if (activeTool === 'pan') {
        e.preventDefault();
        const container = document.getElementById('pdf-container');
        if (!container) return;
        
        // Get mouse position relative to the container
        const containerRect = container.getBoundingClientRect();
        const centerX = e.clientX - containerRect.left;
        const centerY = e.clientY - containerRect.top;
        
        // Zoom in/out based on wheel direction
        // Negative deltaY means scrolling up (zoom in), positive means scrolling down (zoom out)
        // Use a smaller multiplier for smoother, more controlled zooming
        const zoomDelta = -e.deltaY * 0.0005;
        onZoom(zoomDelta, centerX, centerY);
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [activeTool, onZoom]);

  // Convert normalized coordinates (0-1) to canvas coordinates
  // Normalized coordinates are ALWAYS relative to baseWidth/baseHeight (fixed 700x990 reference)
  // Canvas internal resolution is always baseWidth/baseHeight, so conversion is direct
  const normalizedToCanvas = (normX: number, normY: number) => {
    // Canvas internal resolution is always baseWidth/baseHeight
    // So normalized (0-1) maps directly to canvas coordinates
    return {
      x: normX * baseWidth,
      y: normY * baseHeight,
    };
  };

  // Convert canvas coordinates to normalized coordinates (0-1)
  // Normalized coordinates should ALWAYS be relative to baseWidth/baseHeight (fixed 700x990)
  // Canvas internal resolution is always baseWidth/baseHeight, so conversion is direct
  const canvasToNormalized = (canvasX: number, canvasY: number) => {
    // Canvas internal resolution is always baseWidth/baseHeight
    // So canvas coordinates map directly to normalized (0-1)
    return {
      x: canvasX / baseWidth,
      y: canvasY / baseHeight,
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
      // Canvas internal resolution is always baseWidth/baseHeight, so scaling is direct
      annotations.forEach((annotation) => {
        ctx.strokeStyle = annotation.color;
        // Convert normalized line width back to canvas pixels
        // Line width is normalized relative to baseWidth, canvas is at baseWidth resolution
        ctx.lineWidth = annotation.lineWidth * baseWidth;
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
        // Convert normalized dimensions to canvas coordinates
        // Dimensions are normalized relative to base size, canvas is at base size resolution
        const canvasSize = {
          width: (annotation.width || 0) * baseWidth,
          height: (annotation.height || 0) * baseHeight,
        };
        ctx.strokeRect(canvasPos.x, canvasPos.y, canvasSize.width, canvasSize.height);
      } else if (annotation.type === 'text' && annotation.text && annotation.x !== undefined && annotation.y !== undefined) {
        const canvasPos = normalizedToCanvas(annotation.x, annotation.y);
        // Convert normalized font size back to canvas pixels
        // Font size is normalized relative to baseHeight, canvas is at baseHeight resolution
        const fontSize = (annotation.fontSize || 16 / baseHeight) * baseHeight;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.text, canvasPos.x, canvasPos.y);
      } else if (annotation.type === 'callout' && annotation.x !== undefined && annotation.y !== undefined) {
        const center = normalizedToCanvas(annotation.x, annotation.y);
        const diameterX = (annotation.width || calloutDiameter / baseWidth) * baseWidth;
        const radius = diameterX / 2;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = annotation.color;
        ctx.fill();
        ctx.lineWidth = Math.max(2, radius * 0.2);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${Math.max(radius, 12)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = annotation.calloutLabel ?? '?';
        ctx.fillText(String(label), center.x, center.y);
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
    } else if (isDrawing && startPoint && activeTool === 'rectangle') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = (lastMouseXRef.current - rect.left) * (canvas.width / rect.width);
      const currentY = (lastMouseYRef.current - rect.top) * (canvas.height / rect.height);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * scale;

      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;
      ctx.strokeRect(startPoint.x, startPoint.y, width, height);
    }
  }, [annotations, showAnnotations, isDrawing, currentPoints, startPoint, activeTool, color, lineWidth, baseWidth, baseHeight, calloutDiameter]);

  const lastMouseXRef = useRef<number>(0);
  const lastMouseYRef = useRef<number>(0);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    // Canvas internal resolution is baseWidth/baseHeight, CSS size may be different due to zoom
    // Convert from CSS coordinates to canvas internal coordinates
    // Use the actual canvas dimensions to ensure accurate conversion
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
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
    } else if (annotation.type === 'callout' && annotation.x !== undefined && annotation.y !== undefined) {
      const canvasPoint = normalizedToCanvas(normalizedPoint.x, normalizedPoint.y);
      const calloutCenter = normalizedToCanvas(annotation.x, annotation.y);
      const diameter = (annotation.width || calloutDiameter / baseWidth) * baseWidth;
      const radius = diameter / 2;
      const dx = canvasPoint.x - calloutCenter.x;
      const dy = canvasPoint.y - calloutCenter.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
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

    if (activeTool === 'callout') {
      const calloutAnnotation: PDFAnnotation = {
        id: `callout-${Date.now()}`,
        type: 'callout',
        color,
        lineWidth: lineWidth / baseWidth,
        x: normalizedPoint.x,
        y: normalizedPoint.y,
        width: calloutDiameter / baseWidth,
        height: calloutDiameter / baseHeight,
      };
      onAnnotationAdd(calloutAnnotation);
      return;
    }

    setIsDrawing(true);

    if (activeTool === 'freehand') {
      setCurrentPoints([canvasPoint]); // Store canvas points for drawing, convert to normalized on save
    } else if (activeTool === 'rectangle') {
      setStartPoint(canvasPoint); // Store canvas points for drawing, convert to normalized on save
      lastMouseXRef.current = e.clientX;
      lastMouseYRef.current = e.clientY;
    } else if (activeTool === 'text') {
      // Show inline text input at click position
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Store the click position and the canvas position at the time of click
      // This will be used to calculate the annotation position later
      setTextInput({
        x: e.clientX,
        y: e.clientY,
        visible: true
      });
      setTextInputValue('');
      // Focus input after state update
      setTimeout(() => textInputRef.current?.focus(), 0);
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

    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;

    if (activeTool === 'freehand') {
      setCurrentPoints((prev) => [...prev, canvasPoint]);
    } else if (activeTool === 'rectangle' && startPoint) {
      // Use requestAnimationFrame for smooth rectangle drawing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastMouseXRef.current = e.clientX;
      lastMouseYRef.current = e.clientY;
      animationFrameRef.current = requestAnimationFrame(() => {
        // Trigger re-render to update rectangle preview
        // Force a re-render by updating a state if needed
      });
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
    } else if (activeTool === 'rectangle' && startPoint) {
      const canvasPoint = getCanvasPoint(e.clientX, e.clientY);
      const startNormalized = canvasToNormalized(startPoint.x, startPoint.y);
      const endNormalized = canvasToNormalized(canvasPoint.x, canvasPoint.y);
      
      const width = endNormalized.x - startNormalized.x;
      const height = endNormalized.y - startNormalized.y;

      const annotation: PDFAnnotation = {
        id: `rectangle-${Date.now()}`,
        type: 'rectangle',
        color,
        lineWidth: lineWidth / baseWidth, // Store line width as normalized
        x: startNormalized.x,
        y: startNormalized.y,
        width,
        height,
      };
      onAnnotationAdd(annotation);
      setStartPoint(null);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
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

  // Canvas internal resolution is always fixed at baseWidth/baseHeight
  // CSS width/height scale the display, but coordinates stay consistent
  const canvasWidth = baseWidth;
  const canvasHeight = baseHeight;
  const canvasDisplayWidth = width;
  const canvasDisplayHeight = height;

  return (
    <>
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasDisplayWidth,
        height: canvasDisplayHeight,
        maxWidth: '100%',
        maxHeight: '100%',
        cursor: activeTool === 'pan'
          ? (isPanning ? 'grabbing' : 'grab')
          : activeTool === 'select'
            ? (isDragging ? 'grabbing' : 'pointer')
            : 'crosshair',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
    {textInput && textInput.visible && (
      <input
        ref={textInputRef}
        type="text"
        value={textInputValue}
        onChange={(e) => setTextInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (textInputValue.trim() && textInput) {
              const canvas = canvasRef.current;
              if (canvas) {
                // Get the current canvas position
                const canvasRect = canvas.getBoundingClientRect();
                // Calculate the canvas coordinates from the stored click position
                const canvasX = (textInput.x - canvasRect.left) / canvasRect.width * canvas.width;
                const canvasY = (textInput.y - canvasRect.top) / canvasRect.height * canvas.height;
                
                const normalizedPoint = canvasToNormalized(canvasX, canvasY);
                const annotation: PDFAnnotation = {
                  id: `text-${Date.now()}`,
                  type: 'text',
                  color,
                  lineWidth: lineWidth / baseWidth,
                  x: normalizedPoint.x,
                  y: normalizedPoint.y,
                  text: textInputValue,
                  fontSize: 16 / baseHeight,
                };
                onAnnotationAdd(annotation);
              }
            }
            setTextInput(null);
            setTextInputValue('');
          } else if (e.key === 'Escape') {
            setTextInput(null);
            setTextInputValue('');
          }
        }}
        onBlur={() => {
          if (textInputValue.trim() && textInput) {
            const canvas = canvasRef.current;
            if (canvas) {
              // Same calculation as Enter key handler
              const canvasRect = canvas.getBoundingClientRect();
              const canvasX = (textInput.x - canvasRect.left) / canvasRect.width * canvas.width;
              const canvasY = (textInput.y - canvasRect.top) / canvasRect.height * canvas.height;
              
              const normalizedPoint = canvasToNormalized(canvasX, canvasY);
              const annotation: PDFAnnotation = {
                id: `text-${Date.now()}`,
                type: 'text',
                color,
                lineWidth: lineWidth / baseWidth,
                x: normalizedPoint.x,
                y: normalizedPoint.y,
                text: textInputValue,
                fontSize: 16 / baseHeight,
              };
              onAnnotationAdd(annotation);
            }
          }
          setTextInput(null);
          setTextInputValue('');
        }}
        style={{
          position: 'fixed',
          left: `${textInput.x}px`,
          top: `${textInput.y - 10}px`,
          border: '2px solid #FF0000',
          padding: '4px 8px',
          fontSize: '16px',
          fontFamily: 'sans-serif',
          outline: 'none',
          backgroundColor: 'white',
          zIndex: 1000,
          minWidth: '100px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transform: 'translateX(-50%)',
        }}
        autoFocus
      />
    )}
    </>
  );
}

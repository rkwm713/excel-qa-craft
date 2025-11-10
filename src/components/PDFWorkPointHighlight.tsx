import { useEffect, useState, useRef } from "react";
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import { normalizeStation } from "@/utils/stationNormalizer";

// Configure PDF.js worker
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

interface PDFWorkPointHighlightProps {
  file: File | null;
  currentPage: number;
  currentStation: string | null;
  scale: number;
  width: number;
}

interface HighlightPosition {
  x: number;
  y: number;
}

export function PDFWorkPointHighlight({
  file,
  currentPage,
  currentStation,
  scale,
  width,
}: PDFWorkPointHighlightProps) {
  const [highlightPosition, setHighlightPosition] = useState<HighlightPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file || !currentStation) {
      setHighlightPosition(null);
      return;
    }

    const findWorkPointPosition = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(currentPage);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale });

        // Normalize the station to match different formats (0001 vs 1)
        const normalizedStation = normalizeStation(currentStation);

        // Search for various WP text patterns
        const wpPatterns = [
          new RegExp(`WP\\s*${normalizedStation}(?!\\d)`, 'i'),
          new RegExp(`WP\\s*${currentStation}(?!\\d)`, 'i'),
          new RegExp(`WP\\s*#?\\s*${normalizedStation}(?!\\d)`, 'i'),
        ];

        for (const item of textContent.items as any[]) {
          const text = item.str;
          
          // Check if any pattern matches
          const matchesPattern = wpPatterns.some(pattern => pattern.test(text));
          
          if (matchesPattern) {
            // Get the position from the text item's transform
            const transform = item.transform;
            const x = transform[4];
            const y = transform[5];

            // Convert PDF coordinates to canvas coordinates
            const canvasX = (x / viewport.width) * width;
            const canvasY = ((viewport.height - y) / viewport.height) * (width * 1.414);

            setHighlightPosition({ x: canvasX, y: canvasY });
            console.log(`Found WP ${currentStation} at position:`, { x: canvasX, y: canvasY });
            return;
          }
        }

        // If not found, clear highlight
        setHighlightPosition(null);
        console.log(`WP ${currentStation} not found on page ${currentPage}`);
      } catch (error) {
        console.error("Error finding work point position:", error);
        setHighlightPosition(null);
      }
    };

    findWorkPointPosition();
  }, [file, currentPage, currentStation, scale, width]);

  if (!highlightPosition) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${width * 1.414}px`,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Pulsing highlight bubble */}
      <div
        className="absolute animate-pulse"
        style={{
          left: `${highlightPosition.x}px`,
          top: `${highlightPosition.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Outer glow ring */}
        <div
          className="absolute rounded-full bg-primary/20 animate-ping"
          style={{
            width: "80px",
            height: "80px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        
        {/* Main highlight circle */}
        <div
          className="relative rounded-full bg-primary/30 border-4 border-primary shadow-lg"
          style={{
            width: "60px",
            height: "60px",
          }}
        >
          {/* Center dot */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{
              width: "12px",
              height: "12px",
            }}
          />
        </div>
      </div>

      {/* Label below the highlight */}
      <div
        className="absolute px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg"
        style={{
          left: `${highlightPosition.x}px`,
          top: `${highlightPosition.y + 45}px`,
          transform: "translateX(-50%)",
        }}
      >
        WP {normalizeStation(currentStation)}
      </div>
    </div>
  );
}

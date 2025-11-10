import { useCallback } from "react";
import { MapPin, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KMZUploadProps {
  onFileSelect: (file: File) => void;
}

export const KMZUpload = ({ onFileSelect }: KMZUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".kmz")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <label className="flex flex-col items-center justify-center py-8 px-6 cursor-pointer">
        <MapPin className="w-10 h-10 text-primary mb-3" />
        <h3 className="text-base font-semibold mb-2 font-saira uppercase tracking-wide">Upload KMZ File</h3>
        <p className="text-sm text-muted-foreground text-center mb-3 font-neuton">
          Drag and drop your KMZ file with work points
        </p>
        <input
          type="file"
          accept=".kmz"
          onChange={handleFileInput}
          className="hidden"
        />
        <span className="text-xs text-muted-foreground font-neuton">Supports .kmz files</span>
      </label>
    </Card>
  );
};

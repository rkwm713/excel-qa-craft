import { useCallback } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".xlsx")) {
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
      <label className="flex flex-col items-center justify-center py-12 px-6 cursor-pointer">
        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload Designer Upload File</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Drag and drop your Excel file here, or click to browse
        </p>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileInput}
          className="hidden"
        />
        <span className="text-xs text-muted-foreground">Supports .xlsx files</span>
      </label>
    </Card>
  );
};

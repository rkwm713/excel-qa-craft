import { useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  fileName?: string;
  onClear?: () => void;
}

export const FileUpload = ({ onFileSelect, fileName, onClear }: FileUploadProps) => {
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
      {!fileName ? (
        <label className="flex flex-col items-center justify-center py-12 px-6 cursor-pointer">
          <Upload className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2 font-saira uppercase tracking-wide">Upload Designer Upload File</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 font-neuton">
            Drag and drop your Excel file here, or click to browse
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileInput}
            className="hidden"
          />
          <span className="text-xs text-muted-foreground font-neuton">Supports .xlsx files</span>
        </label>
      ) : (
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground">Excel loaded</p>
            </div>
          </div>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

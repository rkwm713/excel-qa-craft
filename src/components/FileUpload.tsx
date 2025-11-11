import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fileValidationSchema } from "@/lib/validation";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  fileName?: string;
  onClear?: () => void;
}

export const FileUpload = ({ onFileSelect, fileName, onClear }: FileUploadProps) => {
  const [error, setError] = useState<string | null>(null);

  const validateAndSelectFile = useCallback(
    (file: File) => {
      setError(null);
      try {
        fileValidationSchema.parse({ file });
        onFileSelect(file);
      } catch (err: any) {
        if (err.errors && err.errors[0]) {
          setError(err.errors[0].message);
        } else {
          setError("Invalid file. Please select a valid Excel file (.xlsx or .xls)");
        }
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndSelectFile(file);
      }
    },
    [validateAndSelectFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSelectFile(file);
      }
    },
    [validateAndSelectFile]
  );

  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {!fileName ? (
        <div className="py-12 px-6">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-saira uppercase tracking-wide">Upload Designer Upload File</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 font-neuton">
              Drag and drop your Excel file here, or click to browse
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
            <span className="text-xs text-muted-foreground font-neuton">Supports .xlsx and .xls files (max 50MB)</span>
          </label>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
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

import { Upload, FileText, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
  fileName?: string;
  onClear?: () => void;
}

export function PDFUpload({ onFileSelect, fileName, onClear }: PDFUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is PDF by MIME type or extension
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      
      if (!isPdf) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }

      onFileSelect(file);
      toast({
        title: "PDF Uploaded",
        description: `${file.name} has been loaded successfully.`,
      });
    }
  };

  return (
    <Card className="p-6 border-2 border-dashed hover:border-primary/50 transition-colors">
      <div className="flex flex-col items-center justify-center space-y-4">
        {!fileName ? (
          <>
            <div className="p-4 bg-primary/10 rounded-full">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1">Upload Work Order Map PDF</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload the PDF containing station diagrams and work points
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Select PDF File
            </Button>
            <input
              ref={inputRef}
              id="pdf-upload"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{fileName}</p>
                <p className="text-xs text-muted-foreground">PDF loaded</p>
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
      </div>
    </Card>
  );
}

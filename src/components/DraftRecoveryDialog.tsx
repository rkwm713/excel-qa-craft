import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Map as MapIcon, FileText, Clock } from "lucide-react";

interface DraftMetadata {
  timestamp: number;
  fileName: string;
  kmzFileName: string;
  pdfFileName: string;
  qaDataCount: number;
}

interface DraftRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: 'resume' | 'discard') => void;
  draftMetadata?: DraftMetadata;
}

export function DraftRecoveryDialog({
  open,
  onOpenChange,
  onAction,
  draftMetadata
}: DraftRecoveryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'resume' | 'discard') => {
    setIsLoading(true);
    try {
      onAction(action);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Unsaved Work Found
          </AlertDialogTitle>
          <AlertDialogDescription>
            We found unsaved work from your previous session. Would you like to resume where you left off?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {draftMetadata && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <strong>Last saved:</strong> {formatTimestamp(draftMetadata.timestamp)}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Files in draft:</div>
              <div className="space-y-1">
                {draftMetadata.fileName && (
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{draftMetadata.fileName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {draftMetadata.qaDataCount} records
                    </Badge>
                  </div>
                )}
                {draftMetadata.kmzFileName && (
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{draftMetadata.kmzFileName}</span>
                  </div>
                )}
                {draftMetadata.pdfFileName && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{draftMetadata.pdfFileName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
              <strong>Warning:</strong> If you choose to discard, your unsaved work will be permanently lost.
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isLoading}
            onClick={() => handleAction('discard')}
          >
            Discard Draft
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={() => handleAction('resume')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Resuming..." : "Resume Work"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

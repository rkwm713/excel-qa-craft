import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reviewSaveSchema } from "@/lib/validation";
import { AlertCircle } from "lucide-react";

interface SaveReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, description: string) => void;
  defaultTitle?: string;
  isLoading?: boolean;
}

export function SaveReviewDialog({
  open,
  onOpenChange,
  onSave,
  defaultTitle = "",
  isLoading = false,
}: SaveReviewDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription("");
      setErrors({});
    }
  }, [open, defaultTitle]);

  const handleSave = () => {
    const result = reviewSaveSchema.safeParse({
      title: title.trim(),
      description: description.trim() || undefined,
    });

    if (!result.success) {
      const fieldErrors: { title?: string; description?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "title") {
          fieldErrors.title = err.message;
        } else if (err.path[0] === "description") {
          fieldErrors.description = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSave(result.data.title, result.data.description || "");
    setTitle("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Review</DialogTitle>
          <DialogDescription>
            Save this QA review session to the database so it can be shared with other users.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="Enter review title"
              disabled={isLoading}
              className={errors.title ? "border-destructive" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim() && !errors.title) {
                  handleSave();
                }
              }}
            />
            {errors.title && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{errors.title}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              placeholder="Optional description"
              disabled={isLoading}
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{errors.description}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isLoading || !!errors.title || !!errors.description}>
            {isLoading ? "Saving..." : "Save Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


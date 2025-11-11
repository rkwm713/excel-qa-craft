import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SaveReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    description: string;
    woNumber: string;
    designer: string;
    project: string;
    status: typeof STATUS_OPTIONS[number];
  }) => void;
  defaultTitle?: string;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  "Needs QA Review",
  "In Review",
  "Needs Corrections",
  "Corrections Completed",
  "Approved",
] as const;

export function SaveReviewDialog({
  open,
  onOpenChange,
  onSave,
  defaultTitle = "",
  isLoading = false,
}: SaveReviewDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [woNumber, setWoNumber] = useState("");
  const [designer, setDesigner] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] =
    useState<typeof STATUS_OPTIONS[number]>("Needs QA Review");

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
    }
  }, [defaultTitle, open]);

  const handleSave = () => {
    if (!title.trim() || !woNumber.trim() || !designer.trim() || !project.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      woNumber: woNumber.trim(),
      designer: designer.trim(),
      project: project.trim(),
      status,
    });

    setTitle("");
    setDescription("");
    setWoNumber("");
    setDesigner("");
    setProject("");
    setStatus("Needs QA Review");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save Review</DialogTitle>
          <DialogDescription>
            Save this QA review session to the database so it can be shared with other users.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wo-number">WO# (Work Order Number) *</Label>
              <Input
                id="wo-number"
                value={woNumber}
                onChange={(e) => setWoNumber(e.target.value)}
                placeholder="Enter WO#"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Input
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Enter project name"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designer">Designer *</Label>
              <Input
                id="designer"
                value={designer}
                onChange={(e) => setDesigner(e.target.value)}
                placeholder="Enter designer name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as typeof STATUS_OPTIONS[number])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter review title"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  title.trim() &&
                  woNumber.trim() &&
                  designer.trim() &&
                  project.trim()
                ) {
                  handleSave();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !title.trim() ||
              !woNumber.trim() ||
              !designer.trim() ||
              !project.trim() ||
              isLoading
            }
          >
            {isLoading ? "Saving..." : "Save Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleApiKeyInputProps {
  onApiKeySubmit: (key: string) => void;
  onSkip: () => void;
}

export const GoogleApiKeyInput = ({ onApiKeySubmit, onSkip }: GoogleApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <Card className="p-6 mb-4">
      <div className="flex items-start gap-4 mb-4">
        <Key className="w-6 h-6 text-primary mt-1" />
        <div>
          <h3 className="font-semibold font-saira uppercase tracking-wide text-primary mb-2">
            Google Maps API Key (Optional)
          </h3>
          <p className="text-sm text-muted-foreground font-neuton mb-2">
            Enter your Google Maps API key to enable embedded Street View. Or skip to use basic map only.
          </p>
        </div>
      </div>

      <Alert className="mb-4 bg-secondary/50 border-primary/20">
        <AlertDescription className="text-sm font-neuton">
          <strong className="font-saira">What you get with an API key:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Embedded Street View viewer in the app</li>
            <li>360° panoramic views at work points</li>
            <li>No need to leave the application</li>
          </ul>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Enter your Google Maps API key (or skip)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            Enable Street View
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="font-semibold"
          >
            Skip (Map Only)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              window.open("https://console.cloud.google.com/apis/credentials", "_blank")
            }
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Get API Key
          </Button>
        </div>
      </form>
    </Card>
  );
};

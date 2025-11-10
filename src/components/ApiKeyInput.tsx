import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKeyInputProps {
  onApiKeySubmit: (key: string) => void;
}

export const ApiKeyInput = ({ onApiKeySubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <Key className="w-6 h-6 text-primary mt-1" />
        <div>
          <h3 className="font-semibold font-saira uppercase tracking-wide text-primary mb-2">
            Google Maps API Key Required
          </h3>
          <p className="text-sm text-muted-foreground font-neuton mb-4">
            To view work points on the map with Street View, you need a Google Maps API key.
          </p>
        </div>
      </div>

      <Alert className="mb-4 bg-secondary/50 border-primary/20">
        <AlertDescription className="text-sm font-neuton">
          <strong className="font-saira">How to get your API key:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
            <li>Visit the Google Cloud Console</li>
            <li>Create a project or select an existing one</li>
            <li>Enable the Maps JavaScript API and Street View API</li>
            <li>Create credentials and copy your API key</li>
          </ol>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Enter your Google Maps API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            Load Map
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

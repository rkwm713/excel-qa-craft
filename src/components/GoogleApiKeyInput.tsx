import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface GoogleApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
  onSkip: () => void;
}

export const GoogleApiKeyInput = ({ onSubmit, onSkip }: GoogleApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem("googleMapsApiKey", apiKey.trim());
      onSubmit(apiKey.trim());
    }
  };

  return (
    <Card className="p-6 border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-primary/10">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold font-saira text-primary mb-2">
            Enable Google Street View
          </h3>
          <p className="text-sm text-muted-foreground font-neuton mb-4">
            Enter your Google Maps API key to view locations in Street View. Or skip to use basic map features.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="apiKey" className="font-neuton">Google Maps API Key</Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!apiKey.trim()} className="flex-1">
                Enable Street View
              </Button>
              <Button type="button" variant="outline" onClick={onSkip}>
                Skip
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};

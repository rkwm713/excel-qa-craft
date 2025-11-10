import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { googleMapsLoader } from "@/utils/googleMapsLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
  onSkip: () => void;
}

export const GoogleApiKeyInput = ({ onSubmit, onSkip }: GoogleApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      const result = await googleMapsLoader.validateApiKey(apiKey.trim());
      
      if (result.valid) {
        setValidationSuccess(true);
        localStorage.setItem("googleMapsApiKey", apiKey.trim());
        setTimeout(() => {
          onSubmit(apiKey.trim());
        }, 500);
      } else {
        setValidationError(result.error || "Invalid API key");
      }
    } catch (error) {
      setValidationError("Failed to validate API key. Please check your key and try again.");
    } finally {
      setIsValidating(false);
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
          
          {validationError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-neuton">
                {validationError}
                <div className="mt-2 text-xs">
                  Make sure the Street View Static API is enabled in your{" "}
                  <a 
                    href="https://console.cloud.google.com/apis/library/street-view-image-backend.googleapis.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    Google Cloud Console
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validationSuccess && (
            <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="font-neuton text-green-600 dark:text-green-400">
                API key validated successfully! Street View is now enabled.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="apiKey" className="font-neuton">Google Maps API Key</Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setValidationError(null);
                  setValidationSuccess(false);
                }}
                className="font-mono text-sm"
                disabled={isValidating}
              />
              <p className="text-xs text-muted-foreground mt-1 font-neuton">
                Get your API key from the{" "}
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={!apiKey.trim() || isValidating || validationSuccess} 
                className="flex-1 gap-2"
              >
                {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
                {validationSuccess ? "Validated!" : isValidating ? "Validating..." : "Enable Street View"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSkip}
                disabled={isValidating}
              >
                Skip
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};

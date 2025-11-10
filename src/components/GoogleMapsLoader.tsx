import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface GoogleMapsLoaderProps {
  apiKey: string;
  children: (loaded: boolean) => React.ReactNode;
}

export const GoogleMapsLoader = ({ apiKey, children }: GoogleMapsLoaderProps) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    // Check if already loaded
    if (window.google?.maps) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setLoaded(true);
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-neuton">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return <>{children(loaded)}</>;
};

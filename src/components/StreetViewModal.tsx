import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Loader2, AlertCircle, MapPin } from "lucide-react";
import { googleMapsLoader } from "@/utils/googleMapsLoader";

interface StreetViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lng: number; name?: string } | null;
  apiKey: string;
}

export const StreetViewModal = ({
  isOpen,
  onClose,
  location,
  apiKey,
}: StreetViewModalProps) => {
  const panoramaRef = useRef<HTMLDivElement>(null);
  const panoramaInstance = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStreetView, setHasStreetView] = useState(true);
  const [useStaticImage, setUseStaticImage] = useState(false);

  useEffect(() => {
    if (!isOpen || !location || !apiKey || !panoramaRef.current) return;

    setIsLoading(true);
    setError(null);
    setHasStreetView(true);

    const initializePanorama = async () => {
      try {
        // Try to use interactive panorama first
        googleMapsLoader.setApiKey(apiKey);
        await googleMapsLoader.load();

        if (!panoramaRef.current || !location || !window.google?.maps) {
          // Fall back to static image
          setUseStaticImage(true);
          setIsLoading(false);
          return;
        }

        // Check if Street View is available at this location
        const streetViewService = new google.maps.StreetViewService();
        const STREET_VIEW_MAX_DISTANCE = 50; // meters

        streetViewService.getPanorama(
          {
            location: { lat: location.lat, lng: location.lng },
            radius: STREET_VIEW_MAX_DISTANCE,
          },
          (data, status) => {
            if (status === google.maps.StreetViewStatus.OK && data) {
              // Street View is available - create interactive panorama
              if (panoramaRef.current) {
                panoramaInstance.current = new google.maps.StreetViewPanorama(
                  panoramaRef.current,
                  {
                    position: data.location?.latLng,
                    pov: { 
                      heading: 0, 
                      pitch: 0 
                    },
                    zoom: 1,
                    addressControl: true,
                    linksControl: true,
                    panControl: true,
                    enableCloseButton: false,
                    motionTracking: false,
                    motionTrackingControl: false,
                  }
                );
              }
              setIsLoading(false);
            } else {
              // Street View not available at this location
              setHasStreetView(false);
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        console.error("Street View initialization error:", err);
        // Fall back to static image on error
        setUseStaticImage(true);
        setIsLoading(false);
      }
    };

    initializePanorama();

    return () => {
      if (panoramaInstance.current) {
        panoramaInstance.current.setVisible(false);
        panoramaInstance.current = null;
      }
    };
  }, [isOpen, location, apiKey]);

  if (!location) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-saira text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {location.name || "Street View"}
          </DialogTitle>
          <DialogDescription className="font-neuton">
            Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 px-6 py-4 overflow-hidden">
          {isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 rounded-md">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground font-neuton">Loading Street View...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-neuton">
                <p className="font-semibold mb-2">{error}</p>
                <p className="text-sm">
                  Make sure your Google Maps API key is valid and the Street View API is enabled.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {!hasStreetView && !isLoading && !error && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Alert className="max-w-2xl mx-auto border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="font-neuton text-amber-600 dark:text-amber-400">
                  <p className="font-semibold mb-2">Street View not available</p>
                  <p className="text-sm">
                    Street View imagery is not available at this exact location. 
                    Try opening in Google Maps to find nearby Street View coverage.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {useStaticImage && hasStreetView && !isLoading && !error && (
            <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-md overflow-hidden">
              <img
                src={`https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${location.lat},${location.lng}&fov=90&heading=0&pitch=0&key=${apiKey}`}
                alt="Street View"
                className="w-full h-full object-contain"
                onError={() => {
                  setHasStreetView(false);
                }}
              />
            </div>
          )}

          <div 
            ref={panoramaRef} 
            className="w-full h-full rounded-md overflow-hidden bg-muted/10"
            style={{ display: isLoading || error || !hasStreetView || useStaticImage ? 'none' : 'block' }}
          />
        </div>
        
        <div className="flex justify-end gap-2 px-6 pb-6 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              window.open(
                `https://www.google.com/maps/@${location.lat},${location.lng},3a,75y,0h,90t/data=!3m4!1e1!3m2!1s0!2e0`,
                "_blank"
              );
            }}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Maps
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface StreetViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lng: number; name: string } | null;
  apiKey: string;
}

export const StreetViewModal = ({ isOpen, onClose, location, apiKey }: StreetViewModalProps) => {
  const panoramaRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!isOpen || !location || !panoramaRef.current || !window.google) return;

    // Initialize Street View
    const panorama = new google.maps.StreetViewPanorama(panoramaRef.current, {
      position: { lat: location.lat, lng: location.lng },
      pov: {
        heading: 0,
        pitch: 0,
      },
      zoom: 1,
      addressControl: true,
      linksControl: true,
      panControl: true,
      enableCloseButton: false,
      fullscreenControl: true,
    });

    streetViewRef.current = panorama;

    return () => {
      // Cleanup
      if (streetViewRef.current) {
        streetViewRef.current = null;
      }
    };
  }, [isOpen, location]);

  useEffect(() => {
    if (!window.google && apiKey) {
      // Load Google Maps script
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [apiKey]);

  if (!location) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-saira uppercase tracking-wide text-primary">
            Street View: {location.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 relative">
          <div ref={panoramaRef} className="w-full h-[calc(80vh-120px)] rounded-lg" />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `https://maps.google.com/maps?q=&layer=c&cbll=${location.lat},${location.lng}`,
                "_blank"
              )
            }
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

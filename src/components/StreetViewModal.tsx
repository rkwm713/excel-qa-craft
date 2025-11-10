import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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

  useEffect(() => {
    if (!isOpen || !location || !apiKey || !panoramaRef.current) return;

    // Load Google Maps API if not already loaded
    if (!window.google?.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = initializePanorama;
      document.head.appendChild(script);
    } else {
      initializePanorama();
    }

    function initializePanorama() {
      if (!panoramaRef.current || !location) return;

      panoramaInstance.current = new google.maps.StreetViewPanorama(
        panoramaRef.current,
        {
          position: { lat: location.lat, lng: location.lng },
          pov: { heading: 0, pitch: 0 },
          zoom: 1,
          addressControl: true,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
        }
      );
    }

    return () => {
      panoramaInstance.current = null;
    };
  }, [isOpen, location, apiKey]);

  if (!location) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-saira text-primary">
            {location.name || "Street View"}
          </DialogTitle>
          <DialogDescription className="font-neuton">
            Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6">
          <div ref={panoramaRef} className="w-full h-[calc(80vh-140px)] rounded-md overflow-hidden" />
        </div>
        <div className="flex justify-end gap-2 px-6 pb-6">
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

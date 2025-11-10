import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MapViewerProps {
  placemarks: any[];
  apiKey: string;
  onStationClick?: (station: string) => void;
}

export const MapViewer = ({ placemarks, apiKey, onStationClick }: MapViewerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [streetView, setStreetView] = useState<google.maps.StreetViewPanorama | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const initialCenter = placemarks.length > 0
      ? { lat: placemarks[0].coordinates.lat, lng: placemarks[0].coordinates.lng }
      : { lat: 32.3512, lng: -95.3011 }; // Tyler, Texas

    const newMap = new google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 15,
      mapTypeId: "hybrid",
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    setMap(newMap);

    // Initialize Street View
    const panorama = newMap.getStreetView();
    setStreetView(panorama);
  }, [apiKey]);

  // Add markers for placemarks
  useEffect(() => {
    if (!map || placemarks.length === 0) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    const bounds = new google.maps.LatLngBounds();
    const newMarkers: google.maps.Marker[] = [];

    placemarks.forEach((placemark, index) => {
      const position = {
        lat: placemark.coordinates.lat,
        lng: placemark.coordinates.lng,
      };

      const marker = new google.maps.Marker({
        position,
        map,
        title: placemark.name,
        label: {
          text: placemark.station || `${index + 1}`,
          color: "white",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#04458D",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: 'Neuton', serif; padding: 8px;">
            <h3 style="font-family: 'Saira', sans-serif; font-weight: bold; margin: 0 0 8px 0; color: #04458D;">
              ${placemark.name}
            </h3>
            ${placemark.station ? `<p style="margin: 4px 0;"><strong>Station:</strong> ${placemark.station}</p>` : ""}
            ${placemark.description ? `<p style="margin: 4px 0;">${placemark.description}</p>` : ""}
            <button
              id="street-view-btn-${index}"
              style="
                margin-top: 8px;
                padding: 6px 12px;
                background: #FFFF00;
                color: #282A30;
                border: none;
                border-radius: 4px;
                font-weight: 600;
                cursor: pointer;
                font-size: 12px;
              "
            >
              Open Street View
            </button>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        setSelectedStation(placemark.station || null);
        if (placemark.station && onStationClick) {
          onStationClick(placemark.station);
        }

        // Add event listener for Street View button after info window opens
        setTimeout(() => {
          const btn = document.getElementById(`street-view-btn-${index}`);
          if (btn) {
            btn.addEventListener("click", () => {
              openStreetView(position);
            });
          }
        }, 100);
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (placemarks.length > 0) {
      map.fitBounds(bounds);
    }
  }, [map, placemarks]);

  const openStreetView = (position: google.maps.LatLngLiteral) => {
    if (!streetView) return;

    streetView.setPosition(position);
    streetView.setPov({
      heading: 0,
      pitch: 0,
    });
    streetView.setVisible(true);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-saira uppercase tracking-wide text-primary">
              Work Points Map
            </h3>
            <p className="text-sm text-muted-foreground font-neuton">
              {placemarks.length} locations • Click markers for details and Street View
            </p>
          </div>
          {selectedStation && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Station {selectedStation}
            </Badge>
          )}
        </div>
      </div>
      <div
        ref={mapRef}
        style={{ height: "600px", width: "100%" }}
        className="relative"
      />
    </Card>
  );
};

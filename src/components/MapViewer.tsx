import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Navigation } from "lucide-react";

// Fix for default marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapViewerProps {
  placemarks: any[];
  onStationClick?: (station: string) => void;
}

export const MapViewer = ({ placemarks, onStationClick }: MapViewerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center (Tyler, Texas)
    const defaultCenter: [number, number] = [32.3512, -95.3011];
    const center: [number, number] =
      placemarks.length > 0
        ? [placemarks[0].coordinates.lat, placemarks[0].coordinates.lng]
        : defaultCenter;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(center, 13);

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add markers
    if (placemarks.length > 0) {
      const bounds = L.latLngBounds([]);

      placemarks.forEach((placemark, index) => {
        const position: [number, number] = [
          placemark.coordinates.lat,
          placemark.coordinates.lng,
        ];
        const stationLabel = placemark.station || `${index + 1}`;

        // Create custom icon
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              background-color: #04458D;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 11px;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              font-family: 'Saira', sans-serif;
            ">
              ${stationLabel}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        // Create popup content
        const popupContent = `
          <div style="font-family: 'Neuton', serif; padding: 8px; min-width: 200px;">
            <h3 style="font-family: 'Saira', sans-serif; font-weight: bold; font-size: 16px; margin: 0 0 8px 0; color: #04458D;">
              ${placemark.name}
            </h3>
            ${placemark.station ? `<p style="margin: 4px 0;"><strong>Station:</strong> ${placemark.station}</p>` : ""}
            ${placemark.description ? `<p style="margin: 4px 0; font-size: 13px; color: #666;">${placemark.description}</p>` : ""}
            <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
              <a
                href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${placemark.coordinates.lat},${placemark.coordinates.lng}"
                target="_blank"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  padding: 8px 12px;
                  background: #FFFF00;
                  color: #282A30;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: 600;
                  font-size: 13px;
                  border: none;
                "
              >
                Open Street View
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=${placemark.coordinates.lat},${placemark.coordinates.lng}"
                target="_blank"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  padding: 8px 12px;
                  background: white;
                  color: #04458D;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: 600;
                  font-size: 13px;
                  border: 1px solid #04458D;
                "
              >
                Get Directions
              </a>
            </div>
            <p style="font-size: 11px; color: #999; margin-top: 8px;">
              Lat: ${placemark.coordinates.lat.toFixed(6)}, Lng: ${placemark.coordinates.lng.toFixed(6)}
            </p>
          </div>
        `;

        // Create marker with popup
        const marker = L.marker(position, { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent);

        // Handle marker click
        marker.on("click", () => {
          if (placemark.station && onStationClick) {
            onStationClick(placemark.station);
          }
        });

        bounds.extend(position);
      });

      // Fit map to markers
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [placemarks, onStationClick]);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-saira uppercase tracking-wide text-primary">
              Work Points Map
            </h3>
            <p className="text-sm text-muted-foreground font-neuton">
              {placemarks.length} locations • Click markers for details
            </p>
          </div>
        </div>
      </div>
      <div ref={mapContainerRef} style={{ height: "600px", width: "100%" }} />
    </Card>
  );
};

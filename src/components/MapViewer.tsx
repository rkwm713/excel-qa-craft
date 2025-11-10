import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Navigation, Eye } from "lucide-react";

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
  onStreetViewClick?: (location: { lat: number; lng: number; name: string }) => void;
  hasGoogleApiKey?: boolean;
}

export const MapViewer = ({ placemarks, onStationClick, onStreetViewClick, hasGoogleApiKey }: MapViewerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

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

        // Create popup with buttons
        const popup = L.popup({
          maxWidth: 250,
          className: 'custom-popup'
        });

        // Create marker
        const marker = L.marker(position, { icon: customIcon }).addTo(map);

        // Build popup content dynamically
        marker.on('click', () => {
          const popupDiv = document.createElement('div');
          popupDiv.style.fontFamily = "'Neuton', serif";
          popupDiv.style.padding = "8px";
          popupDiv.style.minWidth = "200px";

          // Title
          const title = document.createElement('h3');
          title.style.fontFamily = "'Saira', sans-serif";
          title.style.fontWeight = "bold";
          title.style.fontSize = "16px";
          title.style.margin = "0 0 8px 0";
          title.style.color = "#04458D";
          title.textContent = placemark.name;
          popupDiv.appendChild(title);

          // Station info
          if (placemark.station) {
            const stationInfo = document.createElement('p');
            stationInfo.style.margin = "4px 0";
            stationInfo.innerHTML = `<strong>Station:</strong> ${placemark.station}`;
            popupDiv.appendChild(stationInfo);
          }

          // Description
          if (placemark.description) {
            const desc = document.createElement('p');
            desc.style.margin = "4px 0";
            desc.style.fontSize = "13px";
            desc.style.color = "#666";
            desc.textContent = placemark.description;
            popupDiv.appendChild(desc);
          }

          // Buttons container
          const buttonsDiv = document.createElement('div');
          buttonsDiv.style.marginTop = "12px";
          buttonsDiv.style.display = "flex";
          buttonsDiv.style.flexDirection = "column";
          buttonsDiv.style.gap = "8px";

          // Street View button (embedded if API key, external if not)
          const streetViewBtn = document.createElement('button');
          streetViewBtn.textContent = hasGoogleApiKey ? "👁️ Open Street View" : "🗺️ Open in Google Maps";
          streetViewBtn.style.padding = "8px 12px";
          streetViewBtn.style.background = "#FFFF00";
          streetViewBtn.style.color = "#282A30";
          streetViewBtn.style.border = "none";
          streetViewBtn.style.borderRadius = "4px";
          streetViewBtn.style.fontWeight = "600";
          streetViewBtn.style.fontSize = "13px";
          streetViewBtn.style.cursor = "pointer";
          streetViewBtn.style.fontFamily = "'Saira', sans-serif";
          streetViewBtn.onclick = () => {
            if (hasGoogleApiKey && onStreetViewClick) {
              // Use embedded Street View
              onStreetViewClick({
                lat: placemark.coordinates.lat,
                lng: placemark.coordinates.lng,
                name: placemark.name,
              });
            } else {
              // Fallback to external Google Maps
              const lat = placemark.coordinates.lat;
              const lng = placemark.coordinates.lng;
              window.open(
                `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0`,
                '_blank'
              );
            }
          };
          buttonsDiv.appendChild(streetViewBtn);

          // Directions button
          const directionsBtn = document.createElement('button');
          directionsBtn.textContent = "🧭 Get Directions";
          directionsBtn.style.padding = "8px 12px";
          directionsBtn.style.background = "white";
          directionsBtn.style.color = "#04458D";
          directionsBtn.style.border = "1px solid #04458D";
          directionsBtn.style.borderRadius = "4px";
          directionsBtn.style.fontWeight = "600";
          directionsBtn.style.fontSize = "13px";
          directionsBtn.style.cursor = "pointer";
          directionsBtn.style.fontFamily = "'Saira', sans-serif";
          directionsBtn.onclick = () => {
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${placemark.coordinates.lat},${placemark.coordinates.lng}`,
              '_blank'
            );
          };
          buttonsDiv.appendChild(directionsBtn);

          popupDiv.appendChild(buttonsDiv);

          // Coordinates
          const coords = document.createElement('p');
          coords.style.fontSize = "11px";
          coords.style.color = "#999";
          coords.style.marginTop = "8px";
          coords.textContent = `Lat: ${placemark.coordinates.lat.toFixed(6)}, Lng: ${placemark.coordinates.lng.toFixed(6)}`;
          popupDiv.appendChild(coords);

          popup.setContent(popupDiv);
          marker.bindPopup(popup).openPopup();

          // Trigger station click callback
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
              {hasGoogleApiKey && " • Street View enabled"}
            </p>
          </div>
          {selectedStation && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Station {selectedStation}
            </Badge>
          )}
        </div>
      </div>
      <div ref={mapContainerRef} style={{ height: "600px", width: "100%" }} />
    </Card>
  );
};

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Navigation } from "lucide-react";

// Fix for default marker icons in react-leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewerProps {
  placemarks: any[];
  onStationClick?: (station: string) => void;
}

// Component to fit bounds when placemarks change
const MapController = ({ placemarks }: { placemarks: any[] }) => {
  const map = useMap();

  useEffect(() => {
    if (placemarks.length > 0) {
      const bounds = L.latLngBounds(
        placemarks.map((p) => [p.coordinates.lat, p.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [placemarks, map]);

  return null;
};

// Custom marker icon with station number
const createCustomIcon = (station: string) => {
  return L.divIcon({
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
        ${station}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export const MapViewer = ({ placemarks, onStationClick }: MapViewerProps) => {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // Default center (Tyler, Texas)
  const defaultCenter: [number, number] = [32.3512, -95.3011];
  const center: [number, number] =
    placemarks.length > 0
      ? [placemarks[0].coordinates.lat, placemarks[0].coordinates.lng]
      : defaultCenter;

  const openGoogleStreetView = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`,
      "_blank"
    );
  };

  const openGoogleMaps = (lat: number, lng: number, name: string) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank"
    );
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
              {placemarks.length} locations • Click markers for details
            </p>
          </div>
          {selectedStation && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Station {selectedStation}
            </Badge>
          )}
        </div>
      </div>
      <div style={{ height: "600px", width: "100%" }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController placemarks={placemarks} />
          
          {placemarks.map((placemark, index) => {
            const position: [number, number] = [
              placemark.coordinates.lat,
              placemark.coordinates.lng,
            ];
            const stationLabel = placemark.station || `${index + 1}`;

            return (
              <Marker
                key={index}
                position={position}
                icon={createCustomIcon(stationLabel)}
                eventHandlers={{
                  click: () => {
                    setSelectedStation(placemark.station || null);
                    if (placemark.station && onStationClick) {
                      onStationClick(placemark.station);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="font-neuton p-2 min-w-[200px]">
                    <h3 className="font-saira font-bold text-lg mb-2 text-primary">
                      {placemark.name}
                    </h3>
                    {placemark.station && (
                      <p className="mb-2">
                        <strong>Station:</strong> {placemark.station}
                      </p>
                    )}
                    {placemark.description && (
                      <p className="mb-3 text-sm text-muted-foreground">
                        {placemark.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          openGoogleStreetView(
                            placemark.coordinates.lat,
                            placemark.coordinates.lng
                          )
                        }
                        className="bg-accent text-accent-foreground hover:bg-accent/90 w-full gap-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Street View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openGoogleMaps(
                            placemark.coordinates.lat,
                            placemark.coordinates.lng,
                            placemark.name
                          )
                        }
                        className="w-full gap-2"
                      >
                        <Navigation className="w-3 h-3" />
                        Directions
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Lat: {placemark.coordinates.lat.toFixed(6)}, Lng:{" "}
                      {placemark.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </Card>
  );
};

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Card } from "@/components/ui/card";
import { MapDrawingToolbar } from "./MapDrawingToolbar";

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
  onNotesChange?: (placemarkId: string, notes: string) => void;
  initialNotes?: Record<string, string>;
  onDrawingsChange?: (drawings: any[]) => void;
  initialDrawings?: any[];
}

export const MapViewer = ({ 
  placemarks, 
  onStationClick, 
  onStreetViewClick, 
  hasGoogleApiKey,
  onNotesChange,
  initialNotes = {},
  onDrawingsChange,
  initialDrawings = [],
}: MapViewerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawLayerRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const markerLayersRef = useRef<Map<string, L.Marker>>(new Map());

  const [placemarkNotes, setPlacemarkNotes] = useState<Record<string, string>>(initialNotes);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState("");
  const [activeDrawMode, setActiveDrawMode] = useState<string | null>(null);

  // Create custom icon with optional notes badge
  const createMarkerIcon = (stationLabel: string, hasNotes: boolean) => {
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="position: relative;">
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
          ${hasNotes ? '<div style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: #FFFF00; border: 2px solid white; border-radius: 50%;"></div>' : ''}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const updateMarkerIcon = (placemarkId: string, stationLabel: string, hasNotes: boolean) => {
    const marker = markerLayersRef.current.get(placemarkId);
    if (marker) {
      marker.setIcon(createMarkerIcon(stationLabel, hasNotes));
    }
  };

  const handleSaveNote = (placemarkId: string, stationLabel: string) => {
    const trimmedNote = currentNote.trim();
    setPlacemarkNotes(prev => ({
      ...prev,
      [placemarkId]: trimmedNote
    }));
    onNotesChange?.(placemarkId, trimmedNote);
    updateMarkerIcon(placemarkId, stationLabel, trimmedNote.length > 0);
    setEditingNoteId(null);
    setCurrentNote("");
  };

  const handleEditNote = (placemarkId: string, existingNote: string) => {
    setEditingNoteId(placemarkId);
    setCurrentNote(existingNote);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setCurrentNote("");
  };

  const handleDrawModeChange = (mode: string | null, options?: any) => {
    if (!mapRef.current || !drawLayerRef.current) return;

    // Remove existing draw control
    if (drawControlRef.current) {
      mapRef.current.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }

    setActiveDrawMode(mode);

    if (mode) {
      const drawOptions: any = {
        draw: {
          polyline: mode === 'polyline' ? {
            shapeOptions: {
              color: options?.color || '#ef4444',
              weight: options?.weight || 3
            }
          } : false,
          polygon: mode === 'polygon' ? {
            shapeOptions: {
              color: options?.color || '#ef4444',
              weight: options?.weight || 3,
              fillOpacity: 0.2
            }
          } : false,
          rectangle: mode === 'rectangle' ? {
            shapeOptions: {
              color: options?.color || '#ef4444',
              weight: options?.weight || 3,
              fillOpacity: 0.2
            }
          } : false,
          circle: mode === 'circle' ? {
            shapeOptions: {
              color: options?.color || '#ef4444',
              weight: options?.weight || 3,
              fillOpacity: 0.2
            }
          } : false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawLayerRef.current,
          remove: true,
        }
      };

      const drawControl = new L.Control.Draw(drawOptions);
      mapRef.current.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Auto-start the selected tool
      setTimeout(() => {
        const toolbar = (drawControl as any)._toolbars;
        if (toolbar && toolbar.draw) {
          const handler = toolbar.draw._modes[mode];
          if (handler && handler.handler) {
            handler.handler.enable();
          }
        }
      }, 100);
    }
  };

  const handleClearAllDrawings = () => {
    if (drawLayerRef.current) {
      drawLayerRef.current.clearLayers();
      onDrawingsChange?.([]);
    }
  };

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

    // Initialize drawing layer
    const drawLayer = new L.FeatureGroup();
    map.addLayer(drawLayer);
    drawLayerRef.current = drawLayer;

    // Load initial drawings
    if (initialDrawings.length > 0) {
      initialDrawings.forEach((drawing) => {
        try {
          const layer = L.geoJSON(drawing).getLayers()[0];
          if (layer) {
            drawLayer.addLayer(layer);
          }
        } catch (e) {
          console.error("Error loading drawing:", e);
        }
      });
    }

    // Drawing event handlers
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawLayer.addLayer(layer);
      
      // Save drawings
      const drawings: any[] = [];
      drawLayer.eachLayer((l) => {
        const geoJson = (l as any).toGeoJSON();
        drawings.push(geoJson);
      });
      onDrawingsChange?.(drawings);

      // Reset draw mode after creating a shape
      setActiveDrawMode(null);
      if (drawControlRef.current && mapRef.current) {
        mapRef.current.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    });

    map.on(L.Draw.Event.EDITED, () => {
      const drawings: any[] = [];
      drawLayer.eachLayer((l) => {
        const geoJson = (l as any).toGeoJSON();
        drawings.push(geoJson);
      });
      onDrawingsChange?.(drawings);
    });

    map.on(L.Draw.Event.DELETED, () => {
      const drawings: any[] = [];
      drawLayer.eachLayer((l) => {
        const geoJson = (l as any).toGeoJSON();
        drawings.push(geoJson);
      });
      onDrawingsChange?.(drawings);
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || placemarks.length === 0) return;

    // Clear existing markers
    markerLayersRef.current.forEach(marker => marker.remove());
    markerLayersRef.current.clear();

    const bounds = L.latLngBounds([]);

    placemarks.forEach((placemark, index) => {
      const position: [number, number] = [
        placemark.coordinates.lat,
        placemark.coordinates.lng,
      ];
      const stationLabel = placemark.station || `${index + 1}`;
      const placemarkId = `${placemark.station || 'wp'}-${index}`;
      const hasNotes = !!(placemarkNotes[placemarkId]?.trim());

      // Create popup container
      const createPopupContent = () => {
        const popupContainer = document.createElement("div");
        popupContainer.style.fontFamily = "'Neuton', serif";
        popupContainer.style.padding = "8px";
        popupContainer.style.minWidth = "260px";

        // Title
        const title = document.createElement("h3");
        title.style.fontFamily = "'Saira', sans-serif";
        title.style.fontWeight = "bold";
        title.style.fontSize = "16px";
        title.style.margin = "0 0 8px 0";
        title.style.color = "#04458D";
        title.textContent = placemark.name;
        popupContainer.appendChild(title);

        // Station info
        if (placemark.station) {
          const stationP = document.createElement("p");
          stationP.style.margin = "4px 0";
          stationP.innerHTML = `<strong>Station:</strong> ${placemark.station}`;
          popupContainer.appendChild(stationP);
        }

        // Description
        if (placemark.description) {
          const descP = document.createElement("p");
          descP.style.margin = "4px 0";
          descP.style.fontSize = "13px";
          descP.style.color = "#666";
          descP.textContent = placemark.description;
          popupContainer.appendChild(descP);
        }

        // QA Notes Section
        const notesSection = document.createElement("div");
        notesSection.style.borderTop = "1px solid #ddd";
        notesSection.style.paddingTop = "8px";
        notesSection.style.marginTop = "8px";

        const notesHeader = document.createElement("div");
        notesHeader.style.fontSize = "12px";
        notesHeader.style.fontWeight = "600";
        notesHeader.style.marginBottom = "6px";
        notesHeader.textContent = "📝 QA Notes";
        notesSection.appendChild(notesHeader);

        const notesContainer = document.createElement("div");
        notesContainer.id = `notes-container-${placemarkId}`;
        notesContainer.style.marginBottom = "8px";

        const isEditing = editingNoteId === placemarkId;
        const currentNotes = placemarkNotes[placemarkId] || '';

        if (isEditing) {
          const textarea = document.createElement("textarea");
          textarea.id = `notes-textarea-${placemarkId}`;
          textarea.style.width = "100%";
          textarea.style.minHeight = "80px";
          textarea.style.padding = "6px";
          textarea.style.border = "1px solid #ccc";
          textarea.style.borderRadius = "4px";
          textarea.style.fontSize = "12px";
          textarea.style.resize = "vertical";
          textarea.maxLength = 200;
          textarea.placeholder = "Enter notes for this work point...";
          textarea.value = currentNote;
          textarea.addEventListener('input', (e) => {
            setCurrentNote((e.target as HTMLTextAreaElement).value);
            const charCount = document.getElementById(`char-count-${placemarkId}`);
            if (charCount) {
              charCount.textContent = (e.target as HTMLTextAreaElement).value.length.toString();
            }
          });
          notesContainer.appendChild(textarea);

          const charCountDiv = document.createElement("div");
          charCountDiv.style.fontSize = "11px";
          charCountDiv.style.color = "#666";
          charCountDiv.style.marginTop = "4px";
          charCountDiv.innerHTML = `<span id="char-count-${placemarkId}">${currentNote.length}</span>/200 characters`;
          notesContainer.appendChild(charCountDiv);

          const btnDiv = document.createElement("div");
          btnDiv.style.display = "flex";
          btnDiv.style.gap = "6px";
          btnDiv.style.marginTop = "8px";

          const saveBtn = document.createElement("button");
          saveBtn.textContent = "Save";
          saveBtn.style.flex = "1";
          saveBtn.style.padding = "6px 12px";
          saveBtn.style.background = "#04458D";
          saveBtn.style.color = "white";
          saveBtn.style.border = "none";
          saveBtn.style.borderRadius = "4px";
          saveBtn.style.cursor = "pointer";
          saveBtn.style.fontSize = "12px";
          saveBtn.onclick = () => {
            handleSaveNote(placemarkId, stationLabel);
            const marker = markerLayersRef.current.get(placemarkId);
            if (marker) {
              marker.closePopup();
              setTimeout(() => marker.openPopup(), 100);
            }
          };
          btnDiv.appendChild(saveBtn);

          const cancelBtn = document.createElement("button");
          cancelBtn.textContent = "Cancel";
          cancelBtn.style.flex = "1";
          cancelBtn.style.padding = "6px 12px";
          cancelBtn.style.background = "#666";
          cancelBtn.style.color = "white";
          cancelBtn.style.border = "none";
          cancelBtn.style.borderRadius = "4px";
          cancelBtn.style.cursor = "pointer";
          cancelBtn.style.fontSize = "12px";
          cancelBtn.onclick = () => {
            handleCancelEdit();
            const marker = markerLayersRef.current.get(placemarkId);
            if (marker) {
              marker.closePopup();
              setTimeout(() => marker.openPopup(), 100);
            }
          };
          btnDiv.appendChild(cancelBtn);

          notesContainer.appendChild(btnDiv);
        } else if (currentNotes) {
          const notesDisplay = document.createElement("div");
          notesDisplay.style.background = "#f5f5f5";
          notesDisplay.style.padding = "8px";
          notesDisplay.style.borderRadius = "4px";
          notesDisplay.style.fontSize = "12px";
          notesDisplay.style.whiteSpace = "pre-wrap";
          notesDisplay.style.wordBreak = "break-word";
          notesDisplay.style.marginBottom = "6px";
          notesDisplay.textContent = currentNotes;
          notesContainer.appendChild(notesDisplay);

          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit Notes";
          editBtn.style.padding = "4px 12px";
          editBtn.style.background = "white";
          editBtn.style.color = "#04458D";
          editBtn.style.border = "1px solid #04458D";
          editBtn.style.borderRadius = "4px";
          editBtn.style.cursor = "pointer";
          editBtn.style.fontSize = "12px";
          editBtn.onclick = () => {
            handleEditNote(placemarkId, currentNotes);
            const marker = markerLayersRef.current.get(placemarkId);
            if (marker) {
              marker.closePopup();
              setTimeout(() => marker.openPopup(), 100);
            }
          };
          notesContainer.appendChild(editBtn);
        } else {
          const addBtn = document.createElement("button");
          addBtn.textContent = "+ Add Notes";
          addBtn.style.padding = "6px 12px";
          addBtn.style.background = "white";
          addBtn.style.color = "#04458D";
          addBtn.style.border = "1px solid #04458D";
          addBtn.style.borderRadius = "4px";
          addBtn.style.cursor = "pointer";
          addBtn.style.fontSize = "12px";
          addBtn.style.width = "100%";
          addBtn.onclick = () => {
            handleEditNote(placemarkId, '');
            const marker = markerLayersRef.current.get(placemarkId);
            if (marker) {
              marker.closePopup();
              setTimeout(() => marker.openPopup(), 100);
            }
          };
          notesContainer.appendChild(addBtn);
        }

        notesSection.appendChild(notesContainer);
        popupContainer.appendChild(notesSection);

        // Button container
        const btnContainer = document.createElement("div");
        btnContainer.style.marginTop = "12px";
        btnContainer.style.borderTop = "1px solid #ddd";
        btnContainer.style.paddingTop = "8px";
        btnContainer.style.display = "flex";
        btnContainer.style.flexDirection = "column";
        btnContainer.style.gap = "8px";

        // Street View button
        const streetViewBtn = document.createElement("button");
        streetViewBtn.textContent = hasGoogleApiKey ? "🗺️ Open Street View" : "🗺️ Open in Google Maps";
        streetViewBtn.style.padding = "8px 12px";
        streetViewBtn.style.background = "#FFFF00";
        streetViewBtn.style.color = "#282A30";
        streetViewBtn.style.border = "none";
        streetViewBtn.style.borderRadius = "4px";
        streetViewBtn.style.fontWeight = "600";
        streetViewBtn.style.fontSize = "13px";
        streetViewBtn.style.cursor = "pointer";
        streetViewBtn.style.width = "100%";
        streetViewBtn.onclick = () => {
          if (hasGoogleApiKey && onStreetViewClick) {
            onStreetViewClick({
              lat: placemark.coordinates.lat,
              lng: placemark.coordinates.lng,
              name: placemark.name,
            });
          } else {
            window.open(
              `https://www.google.com/maps/@${placemark.coordinates.lat},${placemark.coordinates.lng},3a,75y,0h,90t/data=!3m4!1e1!3m2!1s0!2e0`,
              "_blank"
            );
          }
        };
        btnContainer.appendChild(streetViewBtn);

        // Directions button
        const directionsBtn = document.createElement("button");
        directionsBtn.textContent = "🧭 Get Directions";
        directionsBtn.style.padding = "8px 12px";
        directionsBtn.style.background = "white";
        directionsBtn.style.color = "#04458D";
        directionsBtn.style.border = "1px solid #04458D";
        directionsBtn.style.borderRadius = "4px";
        directionsBtn.style.fontWeight = "600";
        directionsBtn.style.fontSize = "13px";
        directionsBtn.style.cursor = "pointer";
        directionsBtn.style.width = "100%";
        directionsBtn.onclick = () => {
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${placemark.coordinates.lat},${placemark.coordinates.lng}`,
            "_blank"
          );
        };
        btnContainer.appendChild(directionsBtn);
        popupContainer.appendChild(btnContainer);

        // Coordinates
        const coords = document.createElement("p");
        coords.style.fontSize = "11px";
        coords.style.color = "#999";
        coords.style.marginTop = "8px";
        coords.textContent = `Lat: ${placemark.coordinates.lat.toFixed(6)}, Lng: ${placemark.coordinates.lng.toFixed(6)}`;
        popupContainer.appendChild(coords);

        return popupContainer;
      };

      // Create marker with popup
      const marker = L.marker(position, { icon: createMarkerIcon(stationLabel, hasNotes) })
        .addTo(mapRef.current)
        .bindPopup(createPopupContent);

      // Update popup content when opened
      marker.on('popupopen', () => {
        const newContent = createPopupContent();
        marker.setPopupContent(newContent);
      });

      // Handle marker click
      marker.on("click", () => {
        if (placemark.station && onStationClick) {
          onStationClick(placemark.station);
        }
      });

      markerLayersRef.current.set(placemarkId, marker);
      bounds.extend(position);
    });

    // Fit map to markers
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [placemarks, onStationClick, onStreetViewClick, hasGoogleApiKey, placemarkNotes, editingNoteId, currentNote]);

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
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <div ref={mapContainerRef} style={{ height: "600px", width: "100%" }} />
        <MapDrawingToolbar
          onDrawModeChange={handleDrawModeChange}
          onClearAll={handleClearAllDrawings}
          activeMode={activeDrawMode}
        />
      </div>
    </Card>
  );
};

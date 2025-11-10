import JSZip from "jszip";

export const parseKMZ = async (file: File): Promise<any> => {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  
  // Find the KML file inside the KMZ
  let kmlContent = "";
  for (const filename in contents.files) {
    if (filename.endsWith(".kml")) {
      kmlContent = await contents.files[filename].async("string");
      break;
    }
  }

  if (!kmlContent) {
    throw new Error("No KML file found in KMZ");
  }

  return parseKML(kmlContent);
};

const parseKML = (kmlString: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlString, "text/xml");
  
  const placemarks = [];
  const placemarkElements = xmlDoc.getElementsByTagName("Placemark");

  for (let i = 0; i < placemarkElements.length; i++) {
    const placemark = placemarkElements[i];
    const name = placemark.getElementsByTagName("name")[0]?.textContent || "";
    const description = placemark.getElementsByTagName("description")[0]?.textContent || "";
    
    // Get coordinates
    const coordinatesElement = placemark.getElementsByTagName("coordinates")[0];
    if (coordinatesElement) {
      const coordText = coordinatesElement.textContent?.trim() || "";
      const coords = coordText.split(",");
      
      if (coords.length >= 2) {
        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        const alt = coords.length > 2 ? parseFloat(coords[2]) : undefined;

        // Extract station number from name (e.g., "WP 1" -> "0001")
        const wpMatch = name.match(/WP\s*(\d+)/i);
        const station = wpMatch ? wpMatch[1].padStart(4, "0") : undefined;

        placemarks.push({
          name,
          description,
          coordinates: { lat, lng, alt },
          station,
        });
      }
    }
  }

  return { placemarks };
};

export const createStationMapping = (placemarks: any[]) => {
  const mapping: { [key: string]: { lat: number; lng: number } } = {};
  
  placemarks.forEach((placemark) => {
    if (placemark.station) {
      mapping[placemark.station] = {
        lat: placemark.coordinates.lat,
        lng: placemark.coordinates.lng,
      };
    }
  });

  return mapping;
};

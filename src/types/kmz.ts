export interface KMZPlacemark {
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
    alt?: number;
  };
  station?: string;
}

export interface KMZData {
  placemarks: KMZPlacemark[];
  bounds?: google.maps.LatLngBounds;
}

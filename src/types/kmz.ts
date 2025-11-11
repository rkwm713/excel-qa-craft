export interface KMZPlacemark {
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
    alt?: number;
  };
  station?: string;
  notes?: string;
  qaComments?: string;
}

export interface KMZData {
  placemarks: KMZPlacemark[];
  bounds?: any;
}

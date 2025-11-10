/**
 * Station Number Normalization Utilities
 * Handles format differences between Excel stations (e.g., "0001") and PDF work points (e.g., "1")
 */

/**
 * Remove leading zeros and normalize station/WP numbers
 * @param station - Station or work point number to normalize
 * @returns Normalized station number without leading zeros
 */
export function normalizeStation(station: string): string {
  if (!station) return '';
  
  // Extract numeric part and remove leading zeros
  const match = station.match(/\d+/);
  if (!match) return station;
  
  const number = match[0];
  const normalized = String(parseInt(number, 10));
  
  return normalized;
}

/**
 * Try to match stations with flexible formatting
 * Supports both exact matching and normalized matching
 * @param targetStation - The station to find in the mapping
 * @param stationMapping - Record mapping stations to page numbers
 * @returns Page number if found, undefined otherwise
 */
export function findMatchingStation(
  targetStation: string,
  stationMapping: Record<string, number>
): number | undefined {
  // Try exact match first
  if (stationMapping[targetStation]) {
    return stationMapping[targetStation];
  }
  
  // Try normalized match
  const normalized = normalizeStation(targetStation);
  if (stationMapping[normalized]) {
    return stationMapping[normalized];
  }
  
  // Try all keys with normalized comparison
  for (const [key, value] of Object.entries(stationMapping)) {
    if (normalizeStation(key) === normalized) {
      return value;
    }
  }
  
  return undefined;
}

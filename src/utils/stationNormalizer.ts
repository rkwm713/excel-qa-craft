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
  if (!targetStation || !stationMapping || Object.keys(stationMapping).length === 0) {
    return undefined;
  }

  // Normalize the target station to get the core numeric value
  const normalized = normalizeStation(targetStation);
  if (!normalized) {
    return undefined;
  }

  // Try exact match first (highest priority)
  if (stationMapping[targetStation]) {
    return stationMapping[targetStation];
  }
  
  // Try normalized match (e.g., "0001" -> "1")
  if (stationMapping[normalized]) {
    return stationMapping[normalized];
  }
  
  // Try padded versions (with leading zeros) - only if target is short
  // This handles cases like "1" matching "0001" or "26" matching "0026"
  if (normalized.length <= 4) {
    const padded4 = normalized.padStart(4, '0');
    if (stationMapping[padded4]) {
      return stationMapping[padded4];
    }
    
    const padded3 = normalized.padStart(3, '0');
    if (stationMapping[padded3]) {
      return stationMapping[padded3];
    }
  }
  
  // Try all keys with normalized comparison (bidirectional)
  // This handles cases where the mapping has different formats
  for (const [key, value] of Object.entries(stationMapping)) {
    const normalizedKey = normalizeStation(key);
    if (normalizedKey === normalized) {
      return value;
    }
  }
  
  // Only try partial matching if the normalized values are the same length
  // This prevents "2" from matching "26" or "0026"
  for (const [key, value] of Object.entries(stationMapping)) {
    const normalizedKey = normalizeStation(key);
    
    // Extract just the leading numeric part if there are separators (e.g., "26/108-206" -> "26")
    const targetNumeric = normalized.match(/^\d+/)?.[0] || normalized;
    const keyNumeric = normalizedKey.match(/^\d+/)?.[0] || normalizedKey;
    
    // Only match if the numeric parts are exactly the same
    // This handles "WP 2 / 108-705" matching "2" or "0002"
    if (targetNumeric && keyNumeric && targetNumeric === keyNumeric) {
      // Additional check: if both are short numbers, they must be the same length
      // This prevents "2" from matching "26" when we have "WP 2 / 108-705" and station "0026"
      if (targetNumeric.length <= 4 && keyNumeric.length <= 4) {
        // Only match if they're the same when normalized (already checked above)
        // or if one is a properly padded version of the other
        const targetPadded = targetNumeric.padStart(4, '0');
        const keyPadded = keyNumeric.padStart(4, '0');
        if (targetPadded === keyPadded) {
          return value;
        }
      } else {
        // For longer numbers, exact match is required
        return value;
      }
    }
  }
  
  return undefined;
}

/**
 * Try to find spec number for a station with flexible formatting
 * Supports both exact matching and normalized matching
 * @param targetStation - The station to find in the mapping
 * @param specMapping - Record mapping stations to spec numbers
 * @returns Spec number if found, undefined otherwise
 */
export function findMatchingSpec(
  targetStation: string,
  specMapping: Record<string, string>
): string | undefined {
  if (!targetStation || !specMapping || Object.keys(specMapping).length === 0) {
    return undefined;
  }

  // Normalize the target station to get the core numeric value
  const normalized = normalizeStation(targetStation);
  if (!normalized) {
    return undefined;
  }

  // Try exact match first (highest priority)
  if (specMapping[targetStation]) {
    return specMapping[targetStation];
  }
  
  // Try normalized match (e.g., "0001" -> "1")
  if (specMapping[normalized]) {
    return specMapping[normalized];
  }
  
  // Try padded versions (with leading zeros) - only if target is short
  if (normalized.length <= 4) {
    const padded4 = normalized.padStart(4, '0');
    if (specMapping[padded4]) {
      return specMapping[padded4];
    }
    
    const padded3 = normalized.padStart(3, '0');
    if (specMapping[padded3]) {
      return specMapping[padded3];
    }
  }
  
  // Try all keys with normalized comparison (bidirectional)
  for (const [key, value] of Object.entries(specMapping)) {
    const normalizedKey = normalizeStation(key);
    if (normalizedKey === normalized) {
      return value;
    }
  }
  
  // Try partial matching for numeric parts
  for (const [key, value] of Object.entries(specMapping)) {
    const normalizedKey = normalizeStation(key);
    
    const targetNumeric = normalized.match(/^\d+/)?.[0] || normalized;
    const keyNumeric = normalizedKey.match(/^\d+/)?.[0] || normalizedKey;
    
    if (targetNumeric && keyNumeric && targetNumeric === keyNumeric) {
      if (targetNumeric.length <= 4 && keyNumeric.length <= 4) {
        const targetPadded = targetNumeric.padStart(4, '0');
        const keyPadded = keyNumeric.padStart(4, '0');
        if (targetPadded === keyPadded) {
          return value;
        }
      } else {
        return value;
      }
    }
  }
  
  return undefined;
}

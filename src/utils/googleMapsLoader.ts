// Singleton Google Maps API loader with proper error handling
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private apiKey: string = "";

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async load(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && window.google?.maps) {
      return Promise.resolve();
    }

    // If currently loading, return existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start new load
    this.loadPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript && window.google?.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      if (!this.apiKey) {
        reject(new Error("Google Maps API key not set"));
        return;
      }

      // Create script element
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
      script.async = true;
      script.defer = true;

      // Set timeout for loading
      const timeout = setTimeout(() => {
        reject(new Error("Google Maps API loading timeout"));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        // Wait a bit for google.maps to be fully available
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval);
            this.isLoaded = true;
            resolve();
          }
        }, 50);

        // Safety timeout
        setTimeout(() => {
          clearInterval(checkInterval);
          if (window.google?.maps) {
            this.isLoaded = true;
            resolve();
          } else {
            reject(new Error("Google Maps API failed to initialize"));
          }
        }, 2000);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load Google Maps API. Check your API key and network connection."));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Try to load the API with the key
      this.setApiKey(apiKey);
      await this.load();
      
      // Test the API by creating a simple service
      if (window.google?.maps?.StreetViewService) {
        return { valid: true };
      }
      
      return { valid: false, error: "Google Maps API loaded but Street View service is not available" };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : "Failed to validate API key" 
      };
    }
  }

  isApiLoaded(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }

  reset() {
    this.loadPromise = null;
    this.isLoaded = false;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();

// Type declarations
declare global {
  interface Window {
    google: any;
  }
}

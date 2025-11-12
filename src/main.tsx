import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry as early as possible in your application's lifecycle
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Environment configuration
  environment: import.meta.env.MODE || (isProduction ? "production" : "development"),
  
  // Release tracking - uses package version or git commit if available
  release: import.meta.env.VITE_APP_VERSION || undefined,
  
  // Performance monitoring
  // 100% in development, 10% in production to reduce quota usage
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  
  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
  
  // Session Replay configuration
  // Lower in production to reduce costs
  replaysSessionSampleRate: isProduction ? 0.05 : 0.1,
  replaysOnErrorSampleRate: 1.0, // Always capture replays for errors
  
  // Enable debug mode in development to see console logs
  debug: isDevelopment,
  
  // Filter out known non-critical errors
  beforeSend(event, hint) {
    // Filter out browser extension errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);
        // Ignore common browser extension errors
        if (
          message.includes("chrome-extension://") ||
          message.includes("moz-extension://") ||
          message.includes("safari-extension://")
        ) {
          return null;
        }
      }
    }
    return event;
  },
});

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);

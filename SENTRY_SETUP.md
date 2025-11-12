# Sentry Error Tracking Setup

This project uses Sentry for error tracking, performance monitoring, and session replay.

## Configuration

### Environment Variables

Set the following environment variable:

- **`VITE_SENTRY_DSN`**: Your Sentry project DSN (required)

For local development, add it to your `.env` file:
```env
VITE_SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/123456
```

For production (Netlify), add it to your environment variables in the Netlify dashboard.

### Features Enabled

✅ **Error Tracking** - Automatic error capture and reporting  
✅ **Performance Monitoring** - Track page load times and API calls  
✅ **Session Replay** - Record user sessions for debugging  
✅ **Error Boundaries** - Graceful error handling with user-friendly UI  
✅ **Source Maps** - Proper stack traces in production builds  

## Usage

### Automatic Error Tracking

Errors are automatically captured by Sentry. The app is wrapped with an `ErrorBoundary` that catches React component errors.

### Manual Error Reporting

Use the Sentry utilities in `src/lib/sentry.ts`:

```typescript
import { captureException, captureMessage, addBreadcrumb } from "@/lib/sentry";

// Capture an exception
try {
  // your code
} catch (error) {
  captureException(error as Error, { context: "additional info" });
}

// Capture a message
captureMessage("Something important happened", "info");

// Add breadcrumb for debugging
addBreadcrumb("User clicked button", "user-action", "info", { buttonId: "submit" });
```

### Setting User Context

```typescript
import { setUser, clearUser } from "@/lib/sentry";

// Set user when they log in
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Clear user when they log out
clearUser();
```

## Production Settings

The Sentry configuration automatically adjusts for production:

- **Trace Sample Rate**: 10% (reduced from 100% to save quota)
- **Session Replay**: 5% of sessions (reduced from 10%)
- **Error Replay**: 100% (always capture replays for errors)
- **Debug Mode**: Disabled in production

## Viewing Errors

Access your Sentry dashboard at: https://techserv-yu.sentry.io

- **Issues**: View all captured errors
- **Performance**: Monitor page load times and API calls
- **Replays**: Watch user sessions when errors occur

## Release Tracking

To enable release tracking, set the `VITE_APP_VERSION` environment variable:

```env
VITE_APP_VERSION=1.0.0
```

Or use a git commit hash:
```env
VITE_APP_VERSION=$(git rev-parse --short HEAD)
```

## Error Filtering

The configuration automatically filters out:
- Browser extension errors (chrome-extension://, moz-extension://, etc.)

To add custom filters, modify the `beforeSend` function in `src/main.tsx`.


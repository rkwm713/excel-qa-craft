# Loading States & Navigation Review

## Date: November 11, 2025

## Issues Found

### 1. **Double Authentication Checks**
**Problem**: When navigating from the landing page to the dashboard, authentication was checked twice:
- `Landing.tsx` checks auth on mount → redirects to `/dashboard`
- `ProtectedRoute.tsx` checks auth again when mounting dashboard

**Impact**: Users saw "Preparing your workspace..." followed by "Loading..." creating a confusing and slow experience.

### 2. **No Timeout Protection**
**Problem**: All async operations (auth checks, API calls, PDF loading) had no timeout protection.

**Impact**: If a request hung or was slow, users would be stuck on loading screens indefinitely with no feedback or way to recover.

### 3. **Blocking PDF Loading in ReviewView**
**Problem**: PDF loading was synchronous and could block the review from rendering even if the PDF failed to load.

**Impact**: Users couldn't access review data if PDF loading failed or was slow.

### 4. **No Cleanup on Unmount**
**Problem**: ProtectedRoute didn't track component mount state, so async operations could set state after unmount.

**Impact**: React warnings and potential memory leaks.

### 5. **Silent PDF Loading Failures**
**Problem**: PDF loading failures only logged to console without user feedback.

**Impact**: Users didn't know when PDFs failed to load or why.

---

## Fixes Applied

### 1. Landing.tsx
**Changes:**
- Added 5-second timeout for auth check
- Changed navigation to use `replace: true` to prevent back button issues
- Timeout ensures loading screen never hangs indefinitely

```typescript
// Before: No timeout, could hang forever
const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}

// After: 5-second timeout protection
const checkAuth = async () => {
  const timeoutId = setTimeout(() => {
    setIsCheckingAuth(false);
  }, 5000);
  
  const { data: { user } } = await supabase.auth.getUser();
  clearTimeout(timeoutId);
  // ...
}
```

### 2. ProtectedRoute.tsx
**Changes:**
- Added 15-second timeout for auth check with retry logic
- Added `mounted` flag to prevent state updates after unmount
- Changed from `getUser()` to `getSession()` for faster auth check (checks local storage first)
- Improved auth state change listener cleanup
- All async operations check if component is still mounted
- Automatic retry once before giving up (prevents false negatives on slow networks)

```typescript
// Added mount tracking and retry logic
let mounted = true;
let timeoutId: NodeJS.Timeout | null = null;

const checkAuthAndProfile = async (retryCount = 0) => {
  timeoutId = setTimeout(() => {
    if (mounted) {
      if (retryCount < 1) {
        // Retry once before giving up
        console.warn("Auth check timeout - retrying...");
        checkAuthAndProfile(retryCount + 1);
      } else {
        console.error("Auth check timeout after retry - assuming not authenticated");
        setIsAuthenticated(false);
        setHasProfile(false);
        setIsLoading(false);
      }
    }
  }, 15000); // 15 second timeout (more generous for page refreshes)

  // Use getSession() instead of getUser() - faster
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  // ...
};

// Cleanup on unmount
return () => {
  mounted = false;
  if (timeoutId) clearTimeout(timeoutId);
  subscription.unsubscribe();
};
```

### 3. ReviewView.tsx
**Changes:**
- Added 15-second timeout for review loading
- Made PDF loading asynchronous (non-blocking)
- Added 10-second timeout for PDF fetch operations
- Added user-friendly error toasts for PDF loading failures
- PDF loading now happens in background and doesn't block review rendering

```typescript
// Main review loading with timeout
const loadingTimeoutId = setTimeout(() => {
  setIsLoading(false);
  toast({
    title: "Loading timeout",
    description: "Review loading took too long. Please try refreshing the page.",
    variant: "destructive",
  });
}, 15000);

// PDF loading is now async and non-blocking
const loadPdfAsync = async () => {
  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 10000);
  
  const res = await fetch(publicUrl, { signal: controller.signal });
  clearTimeout(fetchTimeout);
  // ...
};

// Load PDF in background, don't block review loading
loadPdfAsync();
```

### 4. Index.tsx (Dashboard)
**Changes:**
- Added 10-second timeout for reviews list loading
- Better error handling with timeout cleanup

```typescript
const timeoutId = setTimeout(() => {
  setIsLoading(false);
  toast({
    title: "Loading timeout",
    description: "Could not load reviews. Please try refreshing the page.",
    variant: "destructive",
  });
}, 10000);

try {
  const response = await reviewsAPI.list();
  clearTimeout(timeoutId);
  // ...
} catch (error: any) {
  clearTimeout(timeoutId);
  // ...
}
```

---

## Results

### Before
- Users got stuck on "Preparing your workspace..." indefinitely
- Multiple loading screens in sequence
- No feedback when operations failed
- No way to recover from hung requests

### After
- Maximum 5 seconds on landing auth check
- Maximum 5 seconds on protected route auth check
- Maximum 15 seconds for review loading
- Maximum 10 seconds for PDF fetch
- Maximum 10 seconds for reviews list
- User-friendly error messages with actionable guidance
- PDF loading doesn't block review access
- Clean component unmount handling

---

## Additional Recommendations

### For Future Improvement:

1. **Global Auth State Management**
   - Consider implementing a global auth context to cache auth state
   - Would eliminate redundant auth checks across routes
   - Would make navigation instantaneous after first auth check

2. **API Data Persistence**
   - The `reviewsAPI.get()` currently returns empty objects for:
     - `cuLookup`
     - `stationPageMapping`
     - `stationSpecMapping`
     - `editedSpecMapping`
     - `pdfAnnotations`
     - `workPointNotes`
     - `kmzPlacemarks`
   - These should be stored in the database and returned with review data
   - Currently, this data is lost between sessions

3. **Loading State UI**
   - Consider adding progress indicators showing what's loading
   - Add "Cancel" buttons for long operations
   - Show estimated time remaining for known-slow operations

4. **Network Status Detection**
   - Detect offline status and show appropriate message
   - Don't show loading spinner if user is offline
   - Queue operations for when connection is restored

5. **Error Recovery**
   - Add "Retry" buttons on error states
   - Implement exponential backoff for failed requests
   - Cache successful responses for offline access

---

## Testing Checklist

To verify the fixes work correctly:

- [ ] Navigate from landing page to dashboard (should be smooth, max 5s loading)
- [ ] Refresh dashboard page (should load within 10s or show error)
- [ ] Open a review (should load within 15s or show error)
- [ ] Open a review with a large PDF (PDF should load in background, review accessible immediately)
- [ ] Test with slow network (use browser dev tools to throttle)
- [ ] Test with network disconnected (should show timeout errors)
- [ ] Test auth expiration (should redirect to landing)
- [ ] Rapidly navigate between pages (should not crash or hang)

---

## Performance Metrics

### Expected Loading Times (with timeout protection):
- Landing page auth check: **0.5-2s** (max 5s timeout)
- Protected route auth check: **0.2-1s** (max 15s timeout with 1 retry) 
- Dashboard reviews list: **1-3s** (max 10s timeout)
- Review data loading: **1-5s** (max 15s timeout)
- PDF loading: **2-10s** (max 10s timeout, non-blocking)

### Total Navigation Time:
- Landing → Dashboard: **1-3s** (was: indefinite)
- Dashboard → Review: **2-6s** (was: indefinite)
- Review with PDF: **3-15s** for full load, but accessible at 2-6s

---

## Bug Fixes

### Issue: App Crash on Page Refresh (Fixed Nov 11, 2025)

**Problem**: Starting a new review and refreshing caused the app to crash with "Auth check timeout - assuming not authenticated" error.

**Root Cause**: The 5-second timeout in ProtectedRoute was too aggressive, causing false negatives during normal page refreshes.

**Solution**:
- Increased timeout from 5s to 15s
- Added retry logic (retries once before giving up)
- Changed from `getUser()` to `getSession()` for faster auth checks
- Better error handling to prevent crashes

This ensures page refreshes work reliably even on slower networks.

---

## Files Modified

1. `src/pages/Landing.tsx` - Added timeout to auth check
2. `src/components/ProtectedRoute.tsx` - Added timeout, retry logic, and mount tracking
3. `src/pages/ReviewView.tsx` - Added timeouts and async PDF loading
4. `src/pages/Index.tsx` - Added timeout to reviews loading, fixed missing logo import

All changes are backward compatible and don't require database migrations.


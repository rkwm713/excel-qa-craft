import { useEffect, useCallback, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  onConfirmLeave?: () => void;
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
  onConfirmLeave
}: UseUnsavedChangesOptions) {
  const isLeavingRef = useRef(false);

  // Handle browser beforeunload event
  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasUnsavedChanges && !isLeavingRef.current) {
          event.preventDefault();
          event.returnValue = message;
          return message;
        }
      },
      [hasUnsavedChanges, message]
    )
  );

  // Handle React Router navigation blocking
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        if (hasUnsavedChanges && !isLeavingRef.current) {
          return !window.confirm(message);
        }
        return false;
      },
      [hasUnsavedChanges, message]
    )
  );

  // Function to allow navigation programmatically
  const allowNavigation = useCallback(() => {
    isLeavingRef.current = true;
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
    if (onConfirmLeave) {
      onConfirmLeave();
    }
  }, [blocker, onConfirmLeave]);

  // Reset the leaving flag when component unmounts or hasUnsavedChanges becomes false
  useEffect(() => {
    if (!hasUnsavedChanges) {
      isLeavingRef.current = false;
    }
  }, [hasUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isLeavingRef.current = false;
    };
  }, []);

  return {
    allowNavigation,
    isBlocked: blocker.state === "blocked"
  };
}

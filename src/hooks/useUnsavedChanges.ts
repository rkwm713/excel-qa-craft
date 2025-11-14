import { useEffect, useCallback, useRef, useContext } from "react";
import { useBeforeUnload, UNSAFE_NavigationContext } from "react-router-dom";

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
  const navigator = useContext(UNSAFE_NavigationContext).navigator as any;
  const isLeavingRef = useRef(false);
  const unblockRef = useRef<null | (() => void)>(null);
  const pendingTransitionRef = useRef<any | null>(null);

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
  useEffect(() => {
    if (!hasUnsavedChanges) {
      isLeavingRef.current = false;
      if (unblockRef.current) {
        unblockRef.current();
        unblockRef.current = null;
      }
      return;
    }

    const unblock = navigator.block((tx) => {
      if (isLeavingRef.current || !hasUnsavedChanges) {
        unblock();
        unblockRef.current = null;
        tx.retry();
        return;
      }

      const confirmLeave = window.confirm(message);
      if (confirmLeave) {
        unblock();
        unblockRef.current = null;
        isLeavingRef.current = true;
        pendingTransitionRef.current = tx;
        tx.retry();
        if (onConfirmLeave) {
          onConfirmLeave();
        }
      } else {
        pendingTransitionRef.current = null;
      }
    });

    unblockRef.current = unblock;

    return unblock;
  }, [navigator, hasUnsavedChanges, message, onConfirmLeave]);

  // Function to allow navigation programmatically
  const allowNavigation = useCallback(() => {
    isLeavingRef.current = true;
    if (unblockRef.current) {
      const unblock = unblockRef.current;
      unblockRef.current = null;
      unblock();
    }
    if (pendingTransitionRef.current) {
      pendingTransitionRef.current.retry();
      pendingTransitionRef.current = null;
    }
    if (onConfirmLeave) {
      onConfirmLeave();
    }
  }, [onConfirmLeave]);

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
    allowNavigation
  };
}

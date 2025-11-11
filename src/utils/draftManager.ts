import { QAReviewRow, CULookupItem } from "@/types/qa-tool";
import { WorkPointNote } from "@/types/pdf";
import { normalizeWorkPointNotes } from "@/utils/workPointNotes";

interface DraftReviewState {
  version: string;
  timestamp: number;
  qaData: QAReviewRow[];
  cuLookup: CULookupItem[];
  fileName: string;
  kmzPlacemarks: any[];
  kmzFileName: string;
  pdfFileName: string;
  stationPageMapping: Record<string, number>;
  stationSpecMapping: Record<string, string>;
  editedSpecMapping: Record<string, string>;
  placemarkNotes: Record<string, string>;
  mapDrawings: any[];
  pdfAnnotations: Record<number, any[]>;
  pdfWorkPointNotes: Record<string, WorkPointNote[] | string>;
  selectedStation: string;
  currentPdfPage: number;
  activeTab: string;
  googleApiKey: string;
}

const DRAFT_KEY = 'qa-review-draft';
const DRAFT_VERSION = '1.0.0';
const SAVE_DEBOUNCE_MS = 1000; // 1 second debounce
const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds

class DraftManager {
  private saveTimeout: NodeJS.Timeout | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private isDirty = false;

  // Save draft to localStorage with debouncing
  saveDraft(state: Partial<DraftReviewState>): void {
    this.isDirty = true;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this._saveDraftSync(state);
      this.isDirty = false;
    }, SAVE_DEBOUNCE_MS);
  }

  // Immediate save (for critical moments like beforeunload)
  saveDraftImmediately(state: Partial<DraftReviewState>): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this._saveDraftSync(state);
    this.isDirty = false;
  }

  private _saveDraftSync(state: Partial<DraftReviewState>): void {
    try {
      const draftState: DraftReviewState = {
        version: DRAFT_VERSION,
        timestamp: Date.now(),
        qaData: [],
        cuLookup: [],
        fileName: '',
        kmzPlacemarks: [],
        kmzFileName: '',
        pdfFileName: '',
        stationPageMapping: {},
        stationSpecMapping: {},
        editedSpecMapping: {},
        placemarkNotes: {},
        mapDrawings: [],
        pdfAnnotations: {},
        pdfWorkPointNotes: {},
        selectedStation: '',
        currentPdfPage: 1,
        activeTab: 'dashboard',
        googleApiKey: '',
        ...state,
      };

      // Convert Map to object for serialization
      if (state.pdfAnnotations instanceof Map) {
        draftState.pdfAnnotations = {};
        state.pdfAnnotations.forEach((annotations, page) => {
          draftState.pdfAnnotations[page] = annotations;
        });
      }

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftState));
      console.log('Draft saved at', new Date(draftState.timestamp).toLocaleString());
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  // Load draft from localStorage
  loadDraft(): DraftReviewState | null {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return null;

      const draftState: DraftReviewState = JSON.parse(stored);

      // Version check
      if (!draftState.version || draftState.version !== DRAFT_VERSION) {
        console.warn('Draft version mismatch, discarding old draft');
        this.clearDraft();
        return null;
      }

      // Convert annotations object back to Map
      const pdfAnnotations = new Map<number, any[]>();
      Object.entries(draftState.pdfAnnotations || {}).forEach(([page, annotations]) => {
        pdfAnnotations.set(Number(page), annotations);
      });
      draftState.pdfAnnotations = pdfAnnotations;

      const normalizedWorkPointNotes: Record<string, WorkPointNote[]> = {};
      Object.entries(draftState.pdfWorkPointNotes || {}).forEach(([station, notes]) => {
        normalizedWorkPointNotes[station] = normalizeWorkPointNotes(notes as WorkPointNote[] | string, station);
      });
      draftState.pdfWorkPointNotes = normalizedWorkPointNotes;

      console.log('Draft loaded from', new Date(draftState.timestamp).toLocaleString());
      return draftState;
    } catch (error) {
      console.error('Failed to load draft:', error);
      this.clearDraft();
      return null;
    }
  }

  // Clear draft from localStorage
  clearDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
      console.log('Draft cleared');
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }

  // Check if draft exists
  hasDraft(): boolean {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return false;

      const draftState = JSON.parse(stored);
      return draftState.version === DRAFT_VERSION;
    } catch (error) {
      return false;
    }
  }

  // Get draft metadata without loading full state
  getDraftMetadata(): { timestamp: number; hasData: boolean } | null {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return null;

      const draftState = JSON.parse(stored);
      if (draftState.version !== DRAFT_VERSION) return null;

      return {
        timestamp: draftState.timestamp,
        hasData: draftState.qaData?.length > 0 ||
                 draftState.fileName ||
                 draftState.kmzFileName ||
                 draftState.pdfFileName
      };
    } catch (error) {
      return null;
    }
  }

  // Start auto-save interval
  startAutoSave(callback: () => Partial<DraftReviewState>): void {
    this.stopAutoSave(); // Clear any existing interval

    this.autoSaveInterval = setInterval(() => {
      if (this.isDirty) {
        const state = callback();
        this.saveDraftImmediately(state);
      }
    }, AUTO_SAVE_INTERVAL_MS);
  }

  // Stop auto-save interval
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Cleanup all timers
  cleanup(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.stopAutoSave();
  }

  // Get formatted timestamp
  getFormattedTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  // Check if draft has meaningful content
  draftHasContent(state: DraftReviewState | null): boolean {
    if (!state) return false;

    return state.qaData?.length > 0 ||
           state.fileName ||
           state.kmzFileName ||
           state.pdfFileName ||
           Object.keys(state.stationPageMapping || {}).length > 0;
  }
}

// Singleton instance
export const draftManager = new DraftManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    draftManager.cleanup();
  });
}

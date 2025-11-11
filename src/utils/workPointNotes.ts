import { WorkPointNote } from "@/types/pdf";

const generateRandomId = (prefix: string) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const stripHtml = (html: string): string => {
  if (!html) return "";
  if (typeof window === "undefined" || typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, "");
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export const relabelCalloutNotes = (notes: WorkPointNote[]): WorkPointNote[] => {
  const calloutNotes = notes
    .filter((note) => note.calloutAnnotationId)
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || "").getTime() || 0;
      const bTime = new Date(b.createdAt || "").getTime() || 0;
      return aTime - bTime;
    });

  const labelMap = new Map<string, number>();
  calloutNotes.forEach((note, index) => {
    labelMap.set(note.id, index + 1);
  });

  return notes.map((note) => {
    if (!note.calloutAnnotationId) return note;
    const newLabel = labelMap.get(note.id);
    if (newLabel === undefined || newLabel === note.calloutNumber) {
      return note;
    }
    return {
      ...note,
      calloutNumber: newLabel,
    };
  });
};

export const normalizeWorkPointNotes = (
  raw: WorkPointNote[] | string | undefined,
  station: string | null | undefined
): WorkPointNote[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return relabelCalloutNotes(
      raw.map((note) => ({
        ...note,
        id: note.id ?? generateRandomId("note"),
        text: note.text ?? "",
        createdAt: note.createdAt ?? new Date().toISOString(),
      }))
    );
  }

  const plain = stripHtml(raw).trim();
  if (!plain) return [];

  return [
    {
      id: station ? `legacy-${station}` : generateRandomId("legacy"),
      text: plain,
      createdAt: new Date().toISOString(),
    },
  ];
};


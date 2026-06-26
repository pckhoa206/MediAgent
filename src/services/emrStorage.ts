export interface EMRDraft {
  symptoms: string;
  diagnosis: string;
  prescription: string;
  updatedAt: number;
}

const EMR_STORAGE_KEY = 'emr_draft';

export function loadEMRDraft(): EMRDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(EMR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EMRDraft>;
    return {
      symptoms: parsed.symptoms ?? '',
      diagnosis: parsed.diagnosis ?? '',
      prescription: parsed.prescription ?? '',
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch {
    return null;
  }
}

export function saveEMRDraft(draft: EMRDraft): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EMR_STORAGE_KEY, JSON.stringify(draft));
}

export function clearEMRDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(EMR_STORAGE_KEY);
}

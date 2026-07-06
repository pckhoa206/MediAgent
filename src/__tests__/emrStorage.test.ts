import { beforeEach, describe, expect, it } from 'vitest';
import { clearEMRDraft, loadEMRDraft, saveEMRDraft } from '../services/emrStorage';

describe('EMR draft storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and restores a draft correctly', () => {
    saveEMRDraft({
      symptoms: 'Đau đầu',
      diagnosis: 'Căng thẳng',
      prescription: 'Paracetamol',
      updatedAt: 123,
    });

    const draft = loadEMRDraft();
    expect(draft?.symptoms).toBe('Đau đầu');
    expect(draft?.diagnosis).toBe('Căng thẳng');
    expect(draft?.prescription).toBe('Paracetamol');
  });

  it('clears the persisted draft', () => {
    saveEMRDraft({ symptoms: 'A', diagnosis: 'B', prescription: 'C', updatedAt: 1 });
    clearEMRDraft();
    expect(loadEMRDraft()).toBeNull();
  });
});

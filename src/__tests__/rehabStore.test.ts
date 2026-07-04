import { beforeEach, describe, expect, it } from 'vitest';
import { useRehabStore } from '../store/useRehabStore';
import CryptoJS from 'crypto-js';

describe('useRehabStore secure persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useRehabStore.getState().resetExercises();
  });

  it('initializes with default exercises and encrypts them in local storage', () => {
    const state = useRehabStore.getState();
    expect(state.exercises.length).toBeGreaterThan(0);

    const persisted = localStorage.getItem('rehab-storage');
    expect(persisted).not.toBeNull();

    // Verify it is encrypted and does not leak cleartext PII/exercise names
    expect(persisted).not.toContain('Tập căng cơ vai');

    // Verify it can be decrypted successfully using the storage key
    const STORAGE_SECRET = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'mediagent-default-secret-key-32-chars';
    const bytes = CryptoJS.AES.decrypt(persisted!, STORAGE_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    expect(decrypted).toContain('Tập căng cơ vai');
  });

  it('allows completing and deleting exercises and saves the state securely', () => {
    const store = useRehabStore.getState();
    const targetId = store.exercises[0].id;

    // Complete exercise
    useRehabStore.getState().completeExercise(targetId);
    expect(useRehabStore.getState().exercises[0].status).toBe('COMPLETED');

    // Delete exercise
    useRehabStore.getState().deleteExercise(targetId);
    expect(useRehabStore.getState().exercises.some(ex => ex.id === targetId)).toBe(false);

    // Verify local storage is updated and still encrypted
    const persisted = localStorage.getItem('rehab-storage');
    const STORAGE_SECRET = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'mediagent-default-secret-key-32-chars';
    const bytes = CryptoJS.AES.decrypt(persisted!, STORAGE_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    expect(decrypted).not.toContain(targetId);
  });
});

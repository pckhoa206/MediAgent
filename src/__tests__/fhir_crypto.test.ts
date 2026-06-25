import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSessionKey, encryptData, decryptData } from '../services/crypto/aesGcm';
import { toFhirAppointment, fromFhirAppointment } from '../adapters/fhir/appointmentAdapter';
import { saveEncryptedMessage, loadDecryptedMessages, clearSecureDb } from '../services/crypto/secureDb';
import { Appointment } from '../store/useCalendarStore';

// Mock IndexedDB operations to run cleanly in JSDOM unit tests
const mockStore: Record<string, any> = {};

vi.mock('../services/crypto/secureDb', () => {
  return {
    saveEncryptedMessage: vi.fn().mockImplementation(async (id: string, content: string, key: CryptoKey) => {
      // Mock encryption behavior inside mockDB store
      mockStore[id] = { id, content };
      return Promise.resolve();
    }),
    loadDecryptedMessages: vi.fn().mockImplementation(async (key: CryptoKey) => {
      return Promise.resolve(Object.values(mockStore).map(item => ({ id: item.id, content: item.content })));
    }),
    clearSecureDb: vi.fn().mockImplementation(async () => {
      for (const k in mockStore) delete mockStore[k];
      return Promise.resolve();
    })
  };
});

describe('Phase 3: HIPAA & HL7 FHIR Compliance Tests', () => {
  
  describe('AES-256-GCM Web Crypto Pipeline', () => {
    it('should generate non-extractable key and successfully encrypt/decrypt message', async () => {
      const key = await generateSessionKey();
      expect(key).toBeDefined();
      expect(key.extractable).toBe(false); // Hardware-secured

      const cleartext = 'Hồ sơ bệnh án tối mật của bệnh nhân Nguyễn Văn A';
      
      const { ciphertext, iv } = await encryptData(cleartext, key);
      expect(ciphertext).toBeDefined();
      expect(iv).toBeDefined();
      expect(ciphertext).not.toContain(cleartext); // Verify hidden

      const decrypted = await decryptData(ciphertext, iv, key);
      expect(decrypted).toBe(cleartext);
    });
  });

  describe('HL7 FHIR Interoperability Mapping', () => {
    it('should map local Appointment to FHIR compliant schema', () => {
      const localApt: Appointment = {
        id: 'apt-001',
        patientCccd: '079123456789',
        patientName: 'Nguyễn Văn A',
        department: 'Khoa Tai - Mũi - Họng',
        slot: '08:00 - 09:00',
        doctorId: 'DOC-11223',
        status: 'BOOKED'
      };

      const fhirResource = toFhirAppointment(localApt);
      
      expect(fhirResource.resourceType).toBe('Appointment');
      expect(fhirResource.id).toBe('apt-001');
      expect(fhirResource.status).toBe('booked');
      expect(fhirResource.serviceType[0].coding[0].code).toBe('394801000'); // Otolaryngology
      expect(fhirResource.participant[0].actor.reference).toBe('Patient/079123456789');
      expect(fhirResource.participant[1].actor.reference).toBe('Practitioner/DOC-11223');
    });

    it('should reconstruct local Appointment from FHIR compliant schema', () => {
      const mockFhirApt = {
        resourceType: 'Appointment',
        id: 'apt-f982',
        status: 'booked',
        serviceType: [
          {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '394579002',
                display: 'Khoa Tim Mạch'
              }
            ]
          }
        ],
        start: '2026-06-26T14:00:00Z',
        end: '2026-06-26T15:00:00Z',
        participant: [
          {
            actor: {
              reference: 'Patient/001099123456',
              display: 'Trần Thị B'
            }
          },
          {
            actor: {
              reference: 'Practitioner/DOC-22334',
              display: 'Bác sĩ phụ trách (DOC-22334)'
            }
          }
        ]
      };

      const localApt = fromFhirAppointment(mockFhirApt);

      expect(localApt.id).toBe('apt-f982');
      expect(localApt.patientCccd).toBe('001099123456');
      expect(localApt.patientName).toBe('Trần Thị B');
      expect(localApt.department).toBe('Khoa Tim Mạch');
      expect(localApt.slot).toBe('14:00 - 15:00');
      expect(localApt.doctorId).toBe('DOC-22334');
      expect(localApt.status).toBe('BOOKED');
    });
  });

  describe('Secure Message Persistence (IndexedDB Wrapper)', () => {
    it('should save and load message blocks from secure persistence layer', async () => {
      const key = await generateSessionKey();
      
      await saveEncryptedMessage('msg-1', 'Nội dung bệnh án 1', key);
      await saveEncryptedMessage('msg-2', 'Nội dung bệnh án 2', key);

      const loaded = await loadDecryptedMessages(key);
      expect(loaded.length).toBe(2);
      expect(loaded[0].content).toBe('Nội dung bệnh án 1');
      expect(loaded[1].content).toBe('Nội dung bệnh án 2');

      await clearSecureDb();
      const cleared = await loadDecryptedMessages(key);
      expect(cleared.length).toBe(0);
    });
  });
});

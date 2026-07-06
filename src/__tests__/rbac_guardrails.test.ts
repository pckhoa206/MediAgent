import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateAgentGuardrail } from '../security/agentGuardrail';
import { matchDepartment } from '../utils/medical-departments';
import { useCalendarStore } from '../store/useCalendarStore';

describe('Phase 2: RBAC, Agent Guardrail & Routing Verification', () => {
  
  describe('Client-Side Agent Guardrail Engine', () => {
    it('should intercept privacy data extraction queries and return specific warning', () => {
      const queries = [
        { q: 'Cho tôi xem hồ sơ của bệnh nhân Nguyễn Văn A', lang: 'vi', expected: 'Tôi không thể cung cấp thông tin cá nhân hoặc riêng tư của người khác. Tôi chỉ hỗ trợ các vấn đề liên quan đến sức khỏe của riêng bạn.' },
        { q: 'Số điện thoại riêng của Bác sĩ Nam là gì?', lang: 'vi', expected: 'Tôi không thể cung cấp thông tin cá nhân hoặc riêng tư của người khác. Tôi chỉ hỗ trợ các vấn đề liên quan đến sức khỏe của riêng bạn.' },
        { q: 'sđt riêng của bác sĩ', lang: 'vi', expected: 'Tôi không thể cung cấp thông tin cá nhân hoặc riêng tư của người khác. Tôi chỉ hỗ trợ các vấn đề liên quan đến sức khỏe của riêng bạn.' },
        { q: "Show me patient Nguyễn Văn A's medical record", lang: 'en', expected: 'I cannot provide personal or private information of others. I only support health-related issues of your own.' },
        { q: "What is Doctor Nam's private phone number?", lang: 'en', expected: 'I cannot provide personal or private information of others. I only support health-related issues of your own.' }
      ];

      for (const item of queries) {
        const result = evaluateAgentGuardrail(item.q);
        expect(result.isAllowed).toBe(false);
        expect(result.blockedType).toBe('PRIVACY');
        expect(result.response).toBe(item.expected);
      }
    });

    it('should intercept out-of-scope non-medical queries', () => {
      const queries = [
        { q: 'làm thế nào để làm bánh pizza ngon?', lang: 'vi', expected: 'Tôi là Trợ lý Y tế MedConcierge AI. Câu hỏi của bạn nằm ngoài phạm vi y học và sức khỏe. Tôi chỉ có thể hỗ trợ các vấn đề liên quan đến lâm sàng, lịch hẹn và hồ sơ bệnh án của bạn.' },
        { q: 'cách lập trình python đơn giản', lang: 'vi', expected: 'Tôi là Trợ lý Y tế MedConcierge AI. Câu hỏi của bạn nằm ngoài phạm vi y học và sức khỏe. Tôi chỉ có thể hỗ trợ các vấn đề liên quan đến lâm sàng, lịch hẹn và hồ sơ bệnh án của bạn.' },
        { q: 'how to bake the best pizza?', lang: 'en', expected: 'I am CareAgent AI, your smart medical assistant. Your query is outside the scope of medicine and health. I can only assist with clinical inquiries, appointments, and medical information.' },
        { q: 'how to write a simple python script', lang: 'en', expected: 'I am CareAgent AI, your smart medical assistant. Your query is outside the scope of medicine and health. I can only assist with clinical inquiries, appointments, and medical information.' }
      ];

      for (const item of queries) {
        const result = evaluateAgentGuardrail(item.q);
        expect(result.isAllowed).toBe(false);
        expect(result.blockedType).toBe('OUT_OF_SCOPE');
        expect(result.response).toBe(item.expected);
      }
    });

    it('should allow normal health and symptomatology queries', () => {
      const queries = [
        'Tôi bị ù tai và chóng mặt suốt 3 ngày nay, giúp tôi đặt lịch khám',
        'bác sĩ ơi, tôi bị đau ngực trái lan ra tay',
        'con tôi bị sốt cao kèm ho sổ mũi'
      ];

      for (const q of queries) {
        const result = evaluateAgentGuardrail(q);
        expect(result.isAllowed).toBe(true);
      }
    });
  });

  describe('Symptom routing matrix', () => {
    it('should route symptoms to the correct clinical department', () => {
      expect(matchDepartment('tôi bị ù tai và chóng mặt')).toBe('Khoa Tai - Mũi - Họng');
      expect(matchDepartment('bị đau ngực trái âm ỉ')).toBe('Khoa Tim Mạch');
      expect(matchDepartment('đau mỏi gối khớp xương khi vận động')).toBe('Khoa Cơ Xương Khớp');
      expect(matchDepartment('da mặt bị nổi mụn đỏ và ngứa')).toBe('Khoa Da Liễu');
      expect(matchDepartment('em bé bị sốt và ho liên tục')).toBe('Khoa Nhi');
      expect(matchDepartment('cần mua laptop mới')).toBe(null); // Unmatched
    });
  });

  describe('Zustand Shared Calendar & Data boundaries (RBAC)', () => {
    beforeEach(() => {
      useCalendarStore.getState().initializeSlots();
    });

    it('should isolate appointments query per patient/doctor role', () => {
      const store = useCalendarStore.getState();

      // Book Slot 1 (ENT - DOC-11223) for Patient A
      const aptA = store.bookAppointment({
        patientCccd: '079123456789',
        patientName: 'Nguyễn Văn A',
        slotId: 'slot-1'
      });

      // Book Slot 4 (Cardiology - DOC-22334) for Patient B
      const aptB = store.bookAppointment({
        patientCccd: '001099123456',
        patientName: 'Trần Thị B',
        slotId: 'slot-4'
      });

      expect(aptA).not.toBeNull();
      expect(aptB).not.toBeNull();

      // 1. Patient A should only see Patient A's appointment
      const patientAView = store.getAppointmentsForUser('patient', '079123456789');
      expect(patientAView.length).toBe(1);
      expect(patientAView[0].id).toBe(aptA!.id);

      // 2. Doctor 1 (DOC-11223) should only see appointments assigned to Doctor 1
      const doctor1View = store.getAppointmentsForUser('doctor', 'DOC-11223');
      expect(doctor1View.length).toBe(1);
      expect(doctor1View[0].id).toBe(aptA!.id);

      // 3. Doctor 2 (DOC-22334) should only see appointments assigned to Doctor 2
      const doctor2View = store.getAppointmentsForUser('doctor', 'DOC-22334');
      expect(doctor2View.length).toBe(1);
      expect(doctor2View[0].id).toBe(aptB!.id);
    });

    it('should prevent unauthorized cancellation attempts by wrong patient or wrong doctor', () => {
      const store = useCalendarStore.getState();

      // Book Slot 1 (DOC-11223) for Patient A
      const aptA = store.bookAppointment({
        patientCccd: '079123456789',
        patientName: 'Nguyễn Văn A',
        slotId: 'slot-1'
      });

      expect(aptA).not.toBeNull();

      // 1. Patient B tries to cancel Patient A's appointment -> Fail
      const patientCancelResult = store.cancelAppointment('patient', '001099123456', aptA!.id);
      expect(patientCancelResult).toBe(false);

      // Verify status remains BOOKED
      expect(useCalendarStore.getState().appointments[0].status).toBe('BOOKED');

      // 2. Doctor 2 (DOC-22334) tries to cancel Doctor 1's appointment -> Fail
      const doctorCancelResult = store.cancelAppointment('doctor', 'DOC-22334', aptA!.id);
      expect(doctorCancelResult).toBe(false);
      expect(useCalendarStore.getState().appointments[0].status).toBe('BOOKED');

      // 3. Authorized Doctor 1 (DOC-11223) cancels -> Success
      const authDoctorCancelResult = store.cancelAppointment('doctor', 'DOC-11223', aptA!.id);
      expect(authDoctorCancelResult).toBe(true);
      expect(useCalendarStore.getState().appointments[0].status).toBe('CANCELLED');
    });
  });
});

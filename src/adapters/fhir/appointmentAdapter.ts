import { Appointment } from '../../store/useCalendarStore';

/**
 * Maps SNOMED / FHIR Service Types for Departments
 */
const DEPARTMENT_SNOMED_CODES: Record<string, string> = {
  'Khoa Tai - Mũi - Họng': '394801000',
  'Khoa Tim Mạch': '394579002',
  'Khoa Cơ Xương Khớp': '394802007',
  'Khoa Da Liễu': '394582007',
  'Khoa Nhi': '394590003'
};

/**
 * Transforms a local Appointment into a standard HL7 FHIR Appointment Resource.
 */
export function toFhirAppointment(apt: Appointment): any {
  const snomedCode = DEPARTMENT_SNOMED_CODES[apt.department] || '394602003'; // Default General Practice
  
  // Format dates: We parse mock slots like "08:00 - 09:00" and append a standard mock date
  // e.g. "2026-06-26T08:00:00Z"
  const [startTime, endTime] = apt.slot.split(' - ');
  const mockDate = '2026-06-26';
  
  const startISO = `${mockDate}T${startTime}:00Z`;
  const endISO = `${mockDate}T${endTime}:00Z`;

  return {
    resourceType: 'Appointment',
    id: apt.id,
    status: apt.status === 'BOOKED' ? 'booked' : 'cancelled',
    serviceCategory: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/service-category',
            code: 'gp',
            display: 'General Practice'
          }
        ]
      }
    ],
    serviceType: [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: snomedCode,
            display: apt.department
          }
        ]
      }
    ],
    description: 'Tư vấn khám bệnh từ trợ lý ảo y khoa',
    start: startISO,
    end: endISO,
    participant: [
      {
        actor: {
          reference: `Patient/${apt.patientCccd}`,
          display: apt.patientName
        },
        required: 'required',
        status: 'accepted'
      },
      {
        actor: {
          reference: `Practitioner/${apt.doctorId}`,
          display: `Bác sĩ phụ trách (${apt.doctorId})`
        },
        required: 'required',
        status: 'accepted'
      }
    ]
  };
}

/**
 * Reconstructs a local Appointment from a standard HL7 FHIR Appointment Resource.
 */
export function fromFhirAppointment(fhirApt: any): Appointment {
  const patientPart = fhirApt.participant.find((p: any) => p.actor.reference.startsWith('Patient/'));
  const doctorPart = fhirApt.participant.find((p: any) => p.actor.reference.startsWith('Practitioner/'));

  const patientCccd = patientPart?.actor.reference.split('/')[1] || '';
  const patientName = patientPart?.actor.display || '';
  const doctorId = doctorPart?.actor.reference.split('/')[1] || '';

  // Extract slot time from start/end
  // e.g. "2026-06-26T08:00:00Z" -> "08:00"
  const startHour = fhirApt.start.substring(11, 16);
  const endHour = fhirApt.end.substring(11, 16);

  return {
    id: fhirApt.id,
    patientCccd,
    patientName,
    department: fhirApt.serviceType[0]?.coding[0]?.display || 'Chung',
    slot: `${startHour} - ${endHour}`,
    doctorId,
    status: fhirApt.status === 'booked' ? 'BOOKED' : 'CANCELLED'
  };
}

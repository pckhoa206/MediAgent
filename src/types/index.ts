export type UserRole = 'patient' | 'doctor' | 'admin';

export interface PIIMapping {
  token: string;
  original: string;
}

export interface MaskResult {
  maskedText: string;
  mappings: PIIMapping[];
}

export type GuardrailBlockType = 'PRIVACY' | 'OUT_OF_SCOPE';
export type GuardrailDecision = 'TruePositive' | 'FalsePositive' | 'TrueNegative';

export interface GuardrailResult {
  isAllowed: boolean;
  blockedType?: GuardrailBlockType;
  response?: string;
  reason?: string;
}

export interface GuardrailLogEntry {
  id: string;
  timestamp: number;
  query: string;
  blockedType: GuardrailBlockType | 'ALLOWED';
  decision: GuardrailDecision;
  reason: string;
}

export type QueryIntent = 'clinical' | 'scheduling' | 'procedure' | 'social' | 'unknown';

export interface ChatMessageRecord {
  id: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawMaskedContent?: string;
  triageStatus?: 'NORMAL' | 'WARNING' | 'EMERGENCY';
  departmentToSchedule?: string;
  timestamp: number;
}

export interface AppointmentRecord {
  id: string;
  patientCccd: string;
  patientName: string;
  doctorId: string;
  department: string;
  slot: string;
  slotId: string;
  status: 'BOOKED' | 'CANCELLED' | 'COMPLETED';
  createdAt: number;
}

export interface EMRRecord {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientCccd: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  createdAt: number;
}

export interface AuthUser {
  cccd: string;
  userName: string;
  role: UserRole;
  doctorId?: string;
}

export interface JwtPayload extends AuthUser {
  iat: number;
  exp: number;
}

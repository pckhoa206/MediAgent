'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Activity, 
  Shield, 
  Lock, 
  Unlock, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Trash2, 
  Calendar, 
  LogOut, 
  Users, 
  CheckCircle2, 
  Clock, 
  Database, 
  Eye, 
  EyeOff, 
  Key, 
  Sparkles, 
  Check, 
  Sliders, 
  FileText,
  Bookmark,
  Award,
  Globe,
  Plus
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useCalendarStore, Appointment } from '@/store/useCalendarStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore, ChatMessage } from '@/store/useChatStore';
import { encryptData, decryptData } from '@/lib/aesGcm';
import { saveMessageToDB, getMessagesFromDB, clearMessagesFromDB } from '@/lib/secureDb';
import { maskPII } from '@/security/piiFilter';
import { restorePII } from '@/security/tokenMapper';
import { matchDepartment, MEDICAL_DEPARTMENTS } from '@/utils/medical-departments';
import { evaluateAgentGuardrail } from '@/security/agentGuardrail';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

// -------------------------------------------------------------
// BILINGUAL DICTIONARY (EN/VI)
// -------------------------------------------------------------
const TRANSLATIONS = {
  vi: {
    systemName: "CareAgent - Hệ thống Y tế Bảo mật AI",
    e2eActive: "Mã hóa đầu cuối: HOẠT ĐỘNG",
    switchToPatient: "Giao diện Người bệnh",
    switchToDoctor: "Giao diện Bác sĩ",
    logout: "Đăng xuất",
    login: "Đăng Nhập",
    register: "Đăng Ký",
    loginSystem: "Đăng Nhập Hệ Thống",
    registerSystem: "Đăng Ký Tài Khoản",
    name: "Họ và Tên Bệnh Nhân",
    cccd: "Số CCCD (12 chữ số)",
    docId: "Mã Số Bác Sĩ (Doctor ID)",
    docName: "Tên Bác Sĩ / Tài Khoản EMR",
    specialty: "Chuyên khoa công tác",
    submitLoginPatient: "Vào Cổng Bệnh Nhân",
    submitLoginDoctor: "Vào Dashboard Bác Sĩ",
    submitRegisterPatient: "Đăng Ký Người Bệnh",
    submitRegisterDoctor: "Đăng Ký Bác Sĩ",
    registerSuccess: "Đăng ký tài khoản thành công! Vui lòng chuyển sang tab Đăng Nhập.",
    userNotFound: "Không tìm thấy thông tin đăng ký. Hãy đăng ký tài khoản trước.",
    welcome: "Chào mừng bạn đến với CareAgent",
    onboardingTitle: "Thiết lập Hồ sơ Sức khỏe thông minh",
    onboardingSubtitle: "Khảo sát y tế ban đầu của CareAgent",
    onboardingIntro: "Để phục vụ cho việc tính toán lâm sàng và gợi ý chuyên khoa, vui lòng cho biết",
    heightLabel: "Chiều cao (cm)",
    weightLabel: "Cân nặng (kg)",
    conditionsLabel: "Tiền sử bệnh lý nền",
    allergiesLabel: "Tiền sử dị ứng",
    heightPlaceholder: "Nhập chiều cao (cm), Ví dụ: 172",
    weightPlaceholder: "Nhập cân nặng (kg), Ví dụ: 65",
    conditionsPlaceholder: "Ví dụ: Cao huyết áp nhẹ (hoặc 'Không')",
    allergiesPlaceholder: "Ví dụ: Dị ứng Penicillin (hoặc 'Không')",
    next: "Tiếp theo",
    done: "Hoàn thành và vào Trang chủ",
    menuTitle: "Menu chức năng",
    chatTab: "Tư vấn Triệu chứng AI",
    bookingTab: "Đặt Lịch Hẹn Secure",
    profileTab: "Hồ Sơ Sức Khỏe AI",
    heightText: "Chiều cao",
    weightText: "Cân nặng",
    bmiText: "Chỉ số BMI",
    biometricsTitle: "Chỉ số sinh trắc học",
    assistantTitle: "Trợ Lý Phân Tích Lâm Sàng",
    chatbotIntro: "Hãy mô tả các triệu chứng hiện tại của bạn. Thông tin cá nhân (PII) sẽ được tự động lọc và thay thế bằng các khóa bảo mật cục bộ trước khi gửi lên AI.",
    emergencyPresets: "Triệu chứng khẩn cấp / Mẫu thử",
    emergencyPreset1: "1. Đau ngực trái lan ra tay (Preset Cấp Cứu)",
    emergencyPreset2: "2. Ngứa da nổi mụn nước (Preset Da Liễu)",
    clientMaskedBadge: "Client Masked",
    suggestedBooking: "Đặt lịch trực tuyến gợi ý:",
    suggestedBookingSub: "Hệ thống AI gợi ý đặt khám tại khoa:",
    bookNowBtn: "Đặt khám ngay",
    emergencyWarningTitle: "Cảnh Báo Lâm Sàng Khẩn Cấp",
    emergencyWarningText: "Các triệu chứng mô tả có liên quan đến nguy cơ đau thắt ngực hoặc nhồi máu cơ tim nguy hiểm. Vui lòng giữ bình tĩnh, tránh vận động nặng và gọi ngay cho Trung tâm Cấp cứu 115 hoặc di chuyển đến Bệnh viện có chuyên khoa tim mạch gần nhất.",
    call115: "Gọi 115 Cấp Cứu",
    closeWarning: "Đóng cảnh báo",
    bookingFormTitle: "Đăng Ký Đặt Lịch Khám",
    deptLabel: "Khoa Lâm Sàng Đăng Ký",
    slotLabel: "Chọn Lịch / Khung Giờ",
    submitBookingBtn: "Xác nhận & Mã hóa Đăng Ký",
    activeBookingsTitle: "Lịch Đã Đặt Của Tôi",
    noBookings: "Chưa có lịch hẹn nào.",
    profileHeader: "Hồ Sơ Y Tế Người Bệnh",
    biometricAssessment: "Đánh Giá Thể Trạng Học",
    medicalHistory: "Tiền sử bệnh án",
    noConditions: "Không phát hiện",
    bmiStatusNormal: "Bình thường",
    evidenceTitle: "Đối Chiếu Tài Liệu Y Khoa",
    confidenceTitle: "Độ tin cậy của chẩn đoán",
    evidenceLabel: "Nguồn tham khảo",
    queueTitle: "Danh Sách Khám Bệnh",
    decryptBtn: "Giải mã thông tin",
    encryptBtn: "Mã hóa thông tin",
    emrFormTitle: "Bệnh án điện tử EMR",
    autoDraftText: "Auto-draft active",
    emrSymptoms: "Triệu chứng lâm sàng (Symptoms)",
    emrDiagnosis: "Chẩn đoán y khoa (Diagnosis)",
    emrPrescription: "Đơn thuốc & Phác đồ (Prescription)",
    voiceInputBtn: "Ghi âm giọng nói",
    stopVoiceBtn: "Stop Recording",
    saveEmrBtn: "Complete & Save EMR",
    syncStatusText: "Đồng bộ hóa với Local IndexedDB",
    noActivePatient: "Không có bệnh nhân chọn lọc",
    noActivePatientSub: "Chọn một bệnh nhân từ danh sách hàng đợi bên trái để bắt đầu lập hồ sơ bệnh án EMR và tiến hành hội chẩn.",
    validationErrorEMR: "Vui lòng nhập đầy đủ Symptoms và Diagnosis trước khi hoàn tất.",
    bookingToastTitle: "[aesGcm.ts] AES-GCM Encryption Event",
    bookingToastDesc: "Mã hóa thành công:",
    bookingToastFooter: "Dữ liệu được chuyển đổi ngay lập tức trước khi đẩy vào State lưu trữ.",
    langText: "Language",
    symptomPlaceholderText: "Mô tả triệu chứng của bạn (Ví dụ: Tôi đau tai đột ngột và hơi khó thở...)"
  },
  en: {
    systemName: "CareAgent - Secure AI Healthcare",
    e2eActive: "End-to-End Encryption: ACTIVE",
    switchToPatient: "Patient Portal",
    switchToDoctor: "Doctor Workspace",
    logout: "Log Out",
    login: "Sign In",
    register: "Sign Up",
    loginSystem: "System Sign In",
    registerSystem: "Account Registration",
    name: "Full Name",
    cccd: "National ID (CCCD - 12 digits)",
    docId: "Doctor ID",
    docName: "Doctor Name / EMR Username",
    specialty: "Active Department / Specialty",
    submitLoginPatient: "Access Patient Portal",
    submitLoginDoctor: "Access Doctor Dashboard",
    submitRegisterPatient: "Register Patient Profile",
    submitRegisterDoctor: "Register Doctor Account",
    registerSuccess: "Registration successful! Please switch to the Sign In tab.",
    userNotFound: "Registration info not found. Please register an account first.",
    welcome: "Welcome to CareAgent",
    onboardingTitle: "AI Health Profile Setup",
    onboardingSubtitle: "Initial medical onboarding for CareAgent",
    onboardingIntro: "To assist with clinical assessment and routing, please specify your",
    heightLabel: "Height (cm)",
    weightLabel: "Weight (kg)",
    conditionsLabel: "Pre-existing Medical Conditions",
    allergiesLabel: "Known Allergies",
    heightPlaceholder: "Enter height in cm, e.g. 172",
    weightPlaceholder: "Enter weight in kg, e.g. 65",
    conditionsPlaceholder: "E.g., Mild hypertension (or 'None')",
    allergiesPlaceholder: "E.g., Penicillin allergy (or 'None')",
    next: "Next",
    done: "Finish & Enter Dashboard",
    menuTitle: "Function Menu",
    chatTab: "AI Symptom Consult",
    bookingTab: "Secure Appointment",
    profileTab: "AI Health Record",
    heightText: "Height",
    weightText: "Weight",
    bmiText: "BMI Index",
    biometricsTitle: "Biometric Data",
    assistantTitle: "Clinical Analysis Assistant",
    chatbotIntro: "Describe your current symptoms. All PII (Name, ID, Phone) will be automatically filtered and replaced with local tokens prior to sending to the AI.",
    emergencyPresets: "Emergency Presets / Quick Test",
    emergencyPreset1: "1. Left chest pain spreading to arm (Emergency)",
    emergencyPreset2: "2. Itching with blisters on leg (Dermatology)",
    clientMaskedBadge: "Client Masked",
    suggestedBooking: "Suggested Online Booking:",
    suggestedBookingSub: "AI recommends appointment at:",
    bookNowBtn: "Book Appointment Now",
    emergencyWarningTitle: "Clinical Emergency Alert",
    emergencyWarningText: "The symptoms described match high cardiovascular risks (angina or myocardial infarction). Please stay calm, avoid exertion, call emergency services (115) immediately or go to the nearest hospital with cardiac services.",
    call115: "Call 115 Emergency",
    closeWarning: "Close Alert",
    bookingFormTitle: "Register Secure Appointment",
    deptLabel: "Medical Department",
    slotLabel: "Select Appointment Slot",
    submitBookingBtn: "Confirm & Encrypt Registration",
    activeBookingsTitle: "My Registered Bookings",
    noBookings: "No registered appointments.",
    profileHeader: "Patient Medical Dossier",
    biometricAssessment: "Biometric Assessment",
    medicalHistory: "Medical History",
    noConditions: "No detected issues",
    bmiStatusNormal: "Normal",
    evidenceTitle: "Medical Evidence Reference",
    confidenceTitle: "Clinical Diagnostic Confidence",
    evidenceLabel: "Cited Sources",
    queueTitle: "Patient Consultation Queue",
    decryptBtn: "Decrypt Info",
    encryptBtn: "Encrypt Info",
    emrFormTitle: "Electronic Medical Record (EMR) Editor",
    autoDraftText: "Auto-draft active",
    emrSymptoms: "Clinical Symptoms",
    emrDiagnosis: "Clinical Diagnosis",
    emrPrescription: "Prescription & Plan",
    voiceInputBtn: "Voice Input",
    stopVoiceBtn: "Stop Recording",
    saveEmrBtn: "Complete & Save EMR",
    syncStatusText: "Synchronized with Local IndexedDB",
    noActivePatient: "No Patient Selected",
    noActivePatientSub: "Select a patient from the consultation queue on the left to start EMR writing and diagnostic sync.",
    validationErrorEMR: "Please fill in both Symptoms and Diagnosis fields before completion.",
    bookingToastTitle: "[aesGcm.ts] AES-GCM Encryption Event",
    bookingToastDesc: "Encryption Success:",
    bookingToastFooter: "Data is immediately ciphered before storage insertion.",
    langText: "Language",
    symptomPlaceholderText: "Describe your symptoms (E.g., Sudden ear pain and minor breathing difficulty...)"
  }
};

// -------------------------------------------------------------
// System valid doctor IDs (Check registry validation)
// -------------------------------------------------------------
const VALID_DOCTOR_IDS = ['DOC-11223', 'DOC-22334', 'DOC-33445', 'DOC-44556', 'DOC-55667'];

const MEDICAL_SOURCES: Record<string, { sources: string[]; confidence: string }> = {
  'Khoa Tim Mạch': {
    sources: [
      'American Heart Association (AHA) Guidelines 2023',
      'Hội Tim Mạch Học Quốc Gia Việt Nam - Hướng dẫn chẩn đoán hẹp động mạch vành',
      'Mayo Clinic Cardiovascular Reference Manual'
    ],
    confidence: '98%'
  },
  'Khoa Tai - Mũi - Họng': {
    sources: [
      'Hướng dẫn chẩn đoán & điều trị lâm sàng Tai Mũi Họng - Bộ Y tế Việt Nam',
      'British Association of Otorhinolaryngology (ENT UK) guidelines',
      'Mayo Clinic Otolaryngology Guidelines'
    ],
    confidence: '95%'
  },
  'Khoa Cơ Xương Khớp': {
    sources: [
      'Hướng dẫn điều trị bệnh lý cơ xương khớp nội khoa - Bộ Y tế Việt Nam',
      'American College of Rheumatology (ACR) diagnostic criteria',
      'Johns Hopkins Medicine Rheumatology library'
    ],
    confidence: '96%'
  },
  'Khoa Da Liễu': {
    sources: [
      'Phác đồ điều trị da liễu lâm sàng - Bệnh viện Da liễu Trung ương',
      'American Academy of Dermatology (AAD) guidelines',
      'Fitzpatrick Clinical Dermatology handbook'
    ],
    confidence: '94%'
  },
  'Khoa Nhi': {
    sources: [
      'Phác đồ điều trị Nhi khoa - Bệnh viện Nhi Đồng 1',
      'American Academy of Pediatrics (AAP) Clinical guidelines',
      'Nelson Textbook of Pediatrics'
    ],
    confidence: '96%'
  },
  'default': {
    sources: [
      'Hướng dẫn thực hành lâm sàng đa khoa - Bộ Y tế Việt Nam',
      'Mayo Clinic Medical Library Database',
      'World Health Organization (WHO) Primary Care Guidelines'
    ],
    confidence: '92%'
  }
};

export default function MEDIagentApp() {
  // Global Language state
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  // Translation helper
  const t = (key: keyof typeof TRANSLATIONS['vi']) => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS['vi'][key] || String(key);
  };

  // Global UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mediagentApiKey, setMediagentApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [developerLogs, setDeveloperLogs] = useState<string[]>([
    '[System] Initialized CareAgent Shell...',
    '[Security] Zero-Trust PII filter active.',
    '[Theme] Color scheme matched to CareAgent Sage/Dark-Forest green branding.'
  ]);

  // Auth Store
  const { isAuthenticated, userName, userCccd, role, login, logout } = useAuthStore();
  
  // Login/Register forms
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor'>('patient');
  const [inputName, setInputName] = useState('');
  const [inputCccd, setInputCccd] = useState('');
  const [inputDocId, setInputDocId] = useState('DOC-11223');
  const [inputDocSpecialty, setInputDocSpecialty] = useState('Khoa Tim Mạch');

  // Encryption Key
  const secretKey = mediagentApiKey || 'mediagent-default-secret-key-32-chars';

  // Live Event Log Helper
  const addDevLog = (log: string) => {
    setDeveloperLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${log}`
    ]);
  };

  // Onboarding & Questionnaire States
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [patientHeight, setPatientHeight] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [patientAllergies, setPatientAllergies] = useState('');
  const [patientConditions, setPatientConditions] = useState('');
  const [patientBmi, setPatientBmi] = useState<number | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Tab control
  const [patientTab, setPatientTab] = useState<'chatbot' | 'booking' | 'profile'>('chatbot');

  // Chat States (Patient view)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Secure Booking Form States
  const [bookingName, setBookingName] = useState('');
  const [bookingCccd, setBookingCccd] = useState('');
  const [bookingDept, setBookingDept] = useState('Khoa Tim Mạch');
  const [bookingSlot, setBookingSlot] = useState('');
  const [showBookingToast, setShowBookingToast] = useState(false);
  const [bookingToastMessage, setBookingToastMessage] = useState('');

  // Doctor Dashboard States
  const [decryptInfoActive, setDecryptInfoActive] = useState(false);
  const [selectedQueuePatient, setSelectedQueuePatient] = useState<Appointment | null>(null);
  const [decryptedPatientData, setDecryptedPatientData] = useState<{ name: string; cccd: string } | null>(null);
  const [doctorChatMessages, setDoctorChatMessages] = useState<ChatMessage[]>([]);
  const [doctorChatInput, setDoctorChatInput] = useState('');
  const [emrSymptoms, setEmrSymptoms] = useState('');
  const [emrDiagnosis, setEmrDiagnosis] = useState('');
  const [emrPrescription, setEmrPrescription] = useState('');
  const [emrIsSaving, setEmrIsSaving] = useState(false);
  const [emrLastSaved, setEmrLastSaved] = useState<Date | null>(null);

  // Speech to Text States (Doctor view)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voiceTargetField, setVoiceTargetField] = useState<'symptoms' | 'diagnosis' | 'prescription'>('symptoms');
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Realtime Sync Hook
  const { status: syncStatus, lastMessage } = useRealtimeSync();

  // Calendar Store
  const { slots, appointments, bookAppointment, cancelAppointment } = useCalendarStore();
  const activeQueue = appointments.filter(apt => apt.status === 'BOOKED');

  // Type Casting Department Evaluator
  const castDepartment = (deptVal: unknown): string => {
    if (typeof deptVal === 'string') {
      return deptVal;
    }
    return 'Chưa phân loại';
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatMessages]);
  // Load IndexedDB messages for Patient and Doctor on mount/session changes
  useEffect(() => {
    const loadCachedMessages = async () => {
      try {
        const cached = await getMessagesFromDB(userCccd || 'guest');
        if (cached && cached.length > 0) {
          setChatMessages(cached);
          addDevLog(`[secureDb.ts] Loaded ${cached.length} cached chat messages from IndexedDB.`);
        } else {
          setChatMessages([]);
        }
      } catch (err) {
        console.error('Failed to load from IndexedDB', err);
      }
    };
    if (isAuthenticated) {
      loadCachedMessages();
    } else {
      setChatMessages([]);
    }
  }, [isAuthenticated, userCccd]);
  // Pre-fill health stats if in localstorage
  useEffect(() => {
    if (isAuthenticated && role === 'patient') {
      const savedHeight = localStorage.getItem(`medi_height_${userCccd}`);
      const savedWeight = localStorage.getItem(`medi_weight_${userCccd}`);
      const savedAllergies = localStorage.getItem(`medi_allergies_${userCccd}`);
      const savedConditions = localStorage.getItem(`medi_conditions_${userCccd}`);
      const savedBmi = localStorage.getItem(`medi_bmi_${userCccd}`);

      if (savedHeight && savedWeight) {
        setPatientHeight(savedHeight);
        setPatientWeight(savedWeight);
        setPatientAllergies(savedAllergies || '');
        setPatientConditions(savedConditions || '');
        setPatientBmi(savedBmi ? parseFloat(savedBmi) : null);
        setOnboardingCompleted(true);
      } else {
        setOnboardingCompleted(false);
        setOnboardingStep(0);
      }
    }
  }, [isAuthenticated, role, userCccd]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInputText(e.target.value);
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${chatInputRef.current.scrollHeight}px`;
    }
  };

  // -------------------------------------------------------------
  // SIGN UP / ACCOUNT REGISTRATION LOGIC WITH STRICT DOCTOR ID CHECK
  // -------------------------------------------------------------
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRole === 'doctor') {
      if (!inputName.trim() || !inputDocId.trim()) {
        alert(lang === 'vi' ? 'Vui lòng điền đủ tên và mã bác sĩ.' : 'Please enter full name and doctor ID.');
        return;
      }
      
      // STRICT CHECK: Reject if Doctor ID does not exist in valid system database
      if (!VALID_DOCTOR_IDS.includes(inputDocId.trim())) {
        const errorMsg = lang === 'vi' 
          ? `Mã bác sĩ '${inputDocId}' không tồn tại hoặc không khớp trên Cơ sở dữ liệu Y khoa Quốc gia!` 
          : `Doctor ID '${inputDocId}' does not exist or matches in the National Medical Database!`;
        alert(errorMsg);
        addDevLog(`[Auth Error] Registration failed: Doctor ID '${inputDocId}' is invalid.`);
        return;
      }

      const doctorsRaw = localStorage.getItem('registered_doctors') || '{}';
      const doctors = JSON.parse(doctorsRaw);
      doctors[inputDocId] = {
        name: inputName,
        specialty: inputDocSpecialty
      };
      localStorage.setItem('registered_doctors', JSON.stringify(doctors));
      addDevLog(`[Auth] Registered doctor: ${inputName} (ID: ${inputDocId}) in Specialty: ${inputDocSpecialty}`);
      alert(t('registerSuccess'));
      setIsSignUp(false);
    } else {
      if (!inputName.trim() || !inputCccd.trim()) {
        alert(lang === 'vi' ? 'Vui lòng điền đầy đủ họ tên và số CCCD.' : 'Please enter name and CCCD ID.');
        return;
      }

      // CCCD Validation: Must be exactly 12 digits
      const cccdRegex = /^[0-9]{12}$/;
      if (!cccdRegex.test(inputCccd.trim())) {
        alert(lang === 'vi' 
          ? 'Số CCCD không hợp lệ! CCCD phải gồm đúng 12 chữ số.' 
          : 'Invalid National ID! CCCD must be exactly 12 digits.'
        );
        return;
      }

      const patientsRaw = localStorage.getItem('registered_patients') || '{}';
      const patients = JSON.parse(patientsRaw);
      patients[inputCccd] = {
        name: inputName
      };
      localStorage.setItem('registered_patients', JSON.stringify(patients));
      addDevLog(`[Auth] Registered patient: ${inputName} with CCCD: ${inputCccd.substring(0, 4)}****`);
      alert(t('registerSuccess'));
      setIsSignUp(false);
    }
  };

  // -------------------------------------------------------------
  // SIGN IN LOGIC (VERIFY REGISTERED ACCOUNTS)
  // -------------------------------------------------------------
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRole === 'doctor') {
      if (!inputName.trim() || !inputDocId.trim()) {
        alert(lang === 'vi' ? 'Vui lòng điền đủ tên và mã bác sĩ.' : 'Please enter name and doctor ID.');
        return;
      }
      
      const doctorsRaw = localStorage.getItem('registered_doctors') || '{}';
      const doctors = JSON.parse(doctorsRaw);
      
      // STRICT CHECK: Verify Doctor exists and credentials match
      if (!doctors[inputDocId] || doctors[inputDocId].name.toLowerCase() !== inputName.toLowerCase()) {
        alert(lang === 'vi' 
          ? 'Tài khoản Bác sĩ không tồn tại hoặc thông tin đăng nhập không chính xác! Vui lòng đăng ký trước.' 
          : 'Doctor account does not exist or invalid credentials! Please register first.'
        );
        addDevLog(`[Auth] Login failed: Doctor ID ${inputDocId} is not registered.`);
        return;
      }
      
      setChatMessages([]); // Clear previous chat state synchronously
      login({
        cccd: 'DOC-' + inputDocId,
        role: 'doctor',
        doctorId: inputDocId,
        userName: inputName,
        token: 'doctor-session-token-' + Math.random().toString(36).substr(2, 9)
      });
      addDevLog(`[Auth] Doctor ${inputName} logged in with ID: ${inputDocId}`);
    } else {
      if (!inputName.trim() || !inputCccd.trim()) {
        alert(lang === 'vi' ? 'Vui lòng điền đầy đủ họ tên và số CCCD.' : 'Please enter name and CCCD.');
        return;
      }

      // CCCD Validation: Must be exactly 12 digits
      const cccdRegex = /^[0-9]{12}$/;
      if (!cccdRegex.test(inputCccd.trim())) {
        alert(lang === 'vi' 
          ? 'Số CCCD không hợp lệ! CCCD phải gồm đúng 12 chữ số.' 
          : 'Invalid National ID! CCCD must be exactly 12 digits.'
        );
        return;
      }

      const patientsRaw = localStorage.getItem('registered_patients') || '{}';
      const patients = JSON.parse(patientsRaw);
      
      // STRICT CHECK: Verify Patient exists and credentials match
      if (!patients[inputCccd] || patients[inputCccd].name.toLowerCase() !== inputName.toLowerCase()) {
        alert(lang === 'vi' 
          ? 'Tài khoản người bệnh không tồn tại hoặc thông tin đăng nhập không chính xác! Vui lòng đăng ký trước.' 
          : 'Patient account does not exist or invalid credentials! Please register first.'
        );
        addDevLog(`[Auth] Login failed: Patient CCCD ${inputCccd} is not registered.`);
        return;
      }

      setChatMessages([]); // Clear previous chat state synchronously
      login({
        cccd: inputCccd,
        role: 'patient',
        userName: inputName,
        token: 'patient-session-token-' + Math.random().toString(36).substr(2, 9)
      });
      addDevLog(`[Auth] Patient ${inputName} logged in with CCCD: ${inputCccd}`);
    }
  };

  // Onboarding stats check
  const handleOnboardingNext = () => {
    if (onboardingStep === 0) {
      if (!patientHeight || isNaN(Number(patientHeight)) || Number(patientHeight) < 50 || Number(patientHeight) > 250) {
        alert(lang === 'vi' ? 'Vui lòng nhập chiều cao hợp lệ (cm).' : 'Please enter a valid height.');
        return;
      }
      setOnboardingStep(1);
    } else if (onboardingStep === 1) {
      if (!patientWeight || isNaN(Number(patientWeight)) || Number(patientWeight) < 10 || Number(patientWeight) > 300) {
        alert(lang === 'vi' ? 'Vui lòng nhập cân nặng hợp lệ (kg).' : 'Please enter a valid weight.');
        return;
      }
      const hMeters = Number(patientHeight) / 100;
      const wKgs = Number(patientWeight);
      const bmi = parseFloat((wKgs / (hMeters * hMeters)).toFixed(1));
      setPatientBmi(bmi);
      setOnboardingStep(2);
    } else if (onboardingStep === 2) {
      setOnboardingStep(3);
    } else if (onboardingStep === 3) {
      localStorage.setItem(`medi_height_${userCccd}`, patientHeight);
      localStorage.setItem(`medi_weight_${userCccd}`, patientWeight);
      localStorage.setItem(`medi_allergies_${userCccd}`, patientAllergies);
      localStorage.setItem(`medi_conditions_${userCccd}`, patientConditions);
      if (patientBmi) localStorage.setItem(`medi_bmi_${userCccd}`, patientBmi.toString());

      setOnboardingCompleted(true);
      addDevLog(`[Onboarding] Completed. Height: ${patientHeight}cm, Weight: ${patientWeight}kg, BMI: ${patientBmi}`);
    }
  };

  // Chat Symptom Consultation Stream logic
  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || chatLoading) return;

    const userText = chatInputText;
    setChatInputText('');
    if (chatInputRef.current) chatInputRef.current.style.height = 'auto';

    const guardrail = evaluateAgentGuardrail(userText);
    const activeUserKey = userCccd || 'guest';

    if (!guardrail.isAllowed) {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userText,
        rawMaskedContent: userText,
        timestamp: Date.now()
      };
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: guardrail.response || '',
        rawMaskedContent: guardrail.response || '',
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, userMsg, assistantMsg]);
      await saveMessageToDB(userMsg, activeUserKey);
      await saveMessageToDB(assistantMsg, activeUserKey);
      return;
    }

    setChatLoading(true);

    const { maskedText, mappings } = maskPII(userText);
    addDevLog(`[PII Filter] Masked PII. Tokens: ${mappings.map(m => m.token).join(', ') || 'None'}`);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
      rawMaskedContent: maskedText,
      timestamp: Date.now()
    };

    // Construct full conversation history payload for the LLM context
    const historyPayload = [
      ...chatMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.rawMaskedContent || msg.content
      })),
      {
        role: 'user',
        content: maskedText
      }
    ];
    
    setChatMessages(prev => [...prev, userMsg]);
    await saveMessageToDB(userMsg, activeUserKey);

    const matchedDept = matchDepartment(userText);
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      rawMaskedContent: '',
      departmentToSchedule: matchedDept || undefined,
      timestamp: Date.now(),
      isStreaming: true
    };

    setChatMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch('/api/mediagent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: maskedText,
          history: historyPayload,
          sessionId: activeUserKey,
          customApiKey: mediagentApiKey || undefined
        }),
      });
      
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      const emergencyKeywords = ['đau ngực', 'khó thở', 'tức ngực', 'cấp cứu', 'chest pain', 'breathing difficulty', 'emergency'];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'token') {
                accumulatedText += parsed.content;
                const restoredText = restorePII(accumulatedText, mappings);
                
                setChatMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId ? { ...msg, content: restoredText } : msg
                ));

                const lowercaseText = restoredText.toLowerCase();
                if (emergencyKeywords.some(kw => lowercaseText.includes(kw))) {
                  setIsEmergency(true);
                }
              } else if (parsed.type === 'triage') {
                if (parsed.status === 'EMERGENCY') {
                  setIsEmergency(true);
                }
              }
            } catch (err) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }

      setChatMessages(prev => {
        const finalMsgs = prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        );
        const savedAssistant = finalMsgs.find(m => m.id === assistantMsgId);
        if (savedAssistant) {
          saveMessageToDB(savedAssistant, activeUserKey);
          addDevLog(`[secureDb.ts] Caching chat thread payload to encrypted IndexedDB...`);
        }
        return finalMsgs;
      });

    } catch (error) {
      console.error(error);
      setChatMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: 'Đã xảy ra lỗi kết nối y khoa. Vui lòng kiểm tra lại cấu hình API key.', isStreaming: false } 
          : msg
      ));
    } finally {
      setChatLoading(false);
    }
  };

  // Trigger quick sympton preset
  const handleTriggerPreset = (symptom: string) => {
    setChatInputText(symptom);
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, 100);
  };

  // Secure Booking submission with AES-GCM simulation visualizer
  const handleBookAppointmentSecure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName.trim() || !bookingCccd.trim() || !bookingSlot) {
      alert(lang === 'vi' ? 'Vui lòng điền tên, CCCD và chọn giờ khám.' : 'Please enter name, CCCD and slot.');
      return;
    }

    addDevLog(`[aesGcm.ts] Initializing AES-256-GCM cipher pipeline for Patient data...`);

    const encryptedName = await encryptData(bookingName, secretKey);
    const encryptedCccd = await encryptData(bookingCccd, secretKey);

    setBookingToastMessage(`Mã hóa thành công:\nName: ${bookingName} -> ${encryptedName.substring(0, 15)}...\nCCCD: ${bookingCccd} -> ${encryptedCccd.substring(0, 15)}...`);
    setShowBookingToast(true);

    addDevLog(`[aesGcm.ts] Encrypting Patient CCCD: 12-digit ID transformed using AES-256-GCM.`);
    addDevLog(`[aesGcm.ts] Encrypting Patient Name: '${bookingName}' transformed to: ${encryptedName.substring(0, 20)}...`);

    const newApt = bookAppointment({
      patientCccd: encryptedCccd,
      patientName: encryptedName,
      slotId: bookingSlot
    });

    if (newApt) {
      addDevLog(`[Store] Appointment successfully registered in state. Encrypted details stored.`);
      setBookingName('');
      setBookingCccd('');
      setBookingSlot('');
      
      setTimeout(() => {
        setShowBookingToast(false);
      }, 6000);
    }
  };

  // Doctor: Decrypt patient info in the queue table
  const handleDecryptPatientDetails = async (patient: Appointment) => {
    try {
      addDevLog(`[aesGcm.ts] Decrypting CCCD & Name for active patient: ${patient.id}...`);
      const decryptedName = await decryptData(patient.patientName, secretKey);
      const decryptedCccd = await decryptData(patient.patientCccd, secretKey);
      
      setDecryptedPatientData({
        name: decryptedName,
        cccd: decryptedCccd
      });
      addDevLog(`[aesGcm.ts] Decrypted Name: ${decryptedName}, CCCD: ${decryptedCccd}`);
    } catch (err) {
      addDevLog(`[aesGcm.ts] Decryption failed! Invalid API Key or Password mismatch.`);
      alert(lang === 'vi' ? 'Không thể giải mã dữ liệu. Vui lòng kiểm tra lại MEDIAGENT_API_KEY.' : 'Decryption failed! Please check MEDIAGENT_API_KEY.');
    }
  };

  // Sync Doctor selection
  const handleSelectActivePatient = (apt: Appointment) => {
    setSelectedQueuePatient(apt);
    setDecryptedPatientData(null);
    setEmrSymptoms(lang === 'vi' ? `Bệnh nhân khám chuyên khoa ${apt.department}. Giờ khám: ${apt.slot}` : `Patient consulted in department: ${apt.department}. Slot: ${apt.slot}`);
    setEmrDiagnosis('');
    setEmrPrescription('');
    
    setDoctorChatMessages([
      {
        id: '1',
        role: 'user',
        content: lang === 'vi' ? `Tôi cần tư vấn khám tại khoa ${apt.department}` : `I need medical advice for department ${apt.department}`,
        timestamp: Date.now() - 3600000
      },
      {
        id: '2',
        role: 'assistant',
        content: lang === 'vi' ? `Chào bạn, chuyên gia đã sẵn sàng tiếp nhận bạn tại ${apt.department}.` : `Hello, the medical expert is ready for you in ${apt.department}.`,
        timestamp: Date.now() - 3500000
      }
    ]);
  };

  // Handle EMR complete check-out (Fixed checkout bug)
  const handleEMRComplete = () => {
    if (!emrSymptoms.trim() || !emrDiagnosis.trim()) {
      alert(t('validationErrorEMR'));
      return;
    }
    setEmrIsSaving(true);
    setTimeout(() => {
      if (selectedQueuePatient) {
        cancelAppointment('doctor', selectedQueuePatient.doctorId, selectedQueuePatient.id);
        addDevLog(`[EMR] Completed patient diagnosis checkout. EMR Saved.`);
        
        setSelectedQueuePatient(null);
        setDecryptedPatientData(null);
        setEmrSymptoms('');
        setEmrDiagnosis('');
        setEmrPrescription('');
        setEmrIsSaving(false);
        setEmrLastSaved(new Date());
      }
    }, 1000);
  };

  // Doctor Chat submit
  const handleDoctorChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorChatInput.trim() || !selectedQueuePatient) return;

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: doctorChatInput,
      timestamp: Date.now()
    };

    setDoctorChatMessages(prev => [...prev, newMsg]);
    setDoctorChatInput('');
    addDevLog(`[secureDb.ts] Cached doctor response to IndexedDB.`);
  };

  // Doctor Speech to Text simulation
  const handleToggleVoiceRecord = (field: 'symptoms' | 'diagnosis' | 'prescription') => {
    if (isVoiceRecording) {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setIsVoiceRecording(false);
      
      const sampleText = field === 'symptoms' 
        ? (lang === 'vi' ? 'Bệnh nhân ho nhiều, sốt cao 39 độ, mệt mỏi toàn thân.' : 'Patient coughs frequently, 39C high fever, fatigue.')
        : field === 'diagnosis'
        ? (lang === 'vi' ? 'Viêm đường hô hấp cấp do virus.' : 'Acute viral respiratory tract infection.')
        : (lang === 'vi' ? 'Paracetamol 500mg uống 3 lần/ngày, uống sau ăn.' : 'Paracetamol 500mg, oral 3 times daily, post meal.');
        
      if (field === 'symptoms') setEmrSymptoms(prev => prev + ' ' + sampleText);
      if (field === 'diagnosis') setEmrDiagnosis(prev => prev + ' ' + sampleText);
      if (field === 'prescription') setEmrPrescription(prev => prev + ' ' + sampleText);
      
      addDevLog(`[Speech-to-Text] Appended transcription results to ${field}.`);
    } else {
      setVoiceTargetField(field);
      setIsVoiceRecording(true);
      voiceTimerRef.current = setInterval(() => {
        setVoiceVolume(Math.floor(Math.random() * 80) + 20);
      }, 100);
    }
  };

  // Helper to determine active appointment status color
  const getStatusColor = (status: string) => {
    return status === 'BOOKED' 
      ? 'bg-[#14231b]/60 text-[#7FB08E] border border-[#4d7c5d]/20' 
      : 'bg-red-950/40 text-red-400 border border-red-500/20';
  };

  return (
    // Updated color scheme to sage green/forest dark theme matching CareAgent branding
    <div className="flex h-screen w-screen flex-col bg-[#070b09] text-slate-200 font-sans antialiased overflow-hidden">
      {/* Persistent global header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#111a14] bg-[#070b09]/85 px-6 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          {/* CareAgent Logo Asset Integration */}
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              className="h-10 w-auto object-contain animate-fadeIn" 
              alt="CareAgent Logo" 
            />
            <div className="h-6 w-[1px] bg-[#1c2e24] hidden sm:block" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-slate-200 uppercase flex items-center gap-1.5 font-sans">
              CareAgent
              <span className="text-[9px] bg-[#14231b] text-[#7FB08E] px-1.5 py-0.5 rounded font-normal font-mono tracking-normal capitalize border border-[#4d7c5d]/20">
                AI Secure
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7FB08E] animate-ping"></span>
              {t('systemName')}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3.5">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-[#0f1712] border border-[#1c2e24] p-1">
            <button
              onClick={() => {
                setLang('vi');
                addDevLog(`[Language] Switched local UI localization to Vietnamese.`);
              }}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                lang === 'vi' ? 'bg-[#4d7c5d] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇻🇳 VI
            </button>
            <button
              onClick={() => {
                setLang('en');
                addDevLog(`[Language] Switched local UI localization to English.`);
              }}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                lang === 'en' ? 'bg-[#4d7c5d] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {isAuthenticated && (
            <>
              {/* FIXED: No dynamic switcher toggle. Role indicator is strictly read-only badge. */}
              <div className="flex items-center gap-2 rounded-2xl bg-[#0f1712] border border-[#1c2e24] px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                <span className="h-2 w-2 rounded-full bg-[#7FB08E] animate-pulse" />
                <span>{role === 'doctor' ? t('switchToDoctor') : t('switchToPatient')}</span>
              </div>

              {/* Encryption Health Badge */}
              <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-[#14231b]/40 border border-[#4d7c5d]/20 px-3 py-1.5 text-xs text-[#7FB08E] font-semibold shadow-inner">
                <Shield className="h-4 w-4 animate-pulse text-[#7FB08E]" />
                <span>{t('e2eActive')}</span>
              </div>

              <button
                onClick={() => {
                  logout();
                  setOnboardingCompleted(false);
                  setChatMessages([]);
                  setDecryptedPatientData(null);
                  setSelectedQueuePatient(null);
                  addDevLog(`[Auth] User logged out, session terminated.`);
                }}
                aria-label="Log Out"
                className="flex items-center gap-2 rounded-xl bg-[#0f1712] border border-[#1c2e24] px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-[#1c2e24] hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </>
          )}

          {/* Toggle log console */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`rounded-xl border p-2 transition-all ${
              isSidebarOpen ? 'bg-[#14231b]/40 border-[#4d7c5d]/30 text-[#7FB08E]' : 'bg-[#0f1712] border-[#1c2e24] text-slate-400 hover:text-slate-200'
            }`}
            title="Nhật ký bảo mật"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container: Split into Workspace and Developer Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Side: Workspaces */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* A. If not Authenticated -> Portal Entrance (Login / Register System) */}
          {!isAuthenticated ? (
            <div className="flex-1 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d1611] via-[#070b09] to-black px-4 relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1611_1px,transparent_1px),linear-gradient(to_bottom,#0c1611_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
              
              <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative z-10">
                {/* Visual Intro Panel */}
                <div className="flex flex-col justify-between p-8 rounded-3xl bg-[#0f1712]/40 border border-[#1c2e24]/40 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#4d7c5d]/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14231b]/40 border border-[#4d7c5d]/30 text-[#7FB08E] text-xs font-semibold">
                      <Shield className="w-3.5 h-3.5" />
                      Mã hóa bảo vệ PII tuyệt đối
                    </div>
                    {/* Visual Logo in Entrance */}
                    <div className="flex items-center gap-3 py-2">
                      <img src="/logo.png" className="h-16 w-auto object-contain animate-pulse" alt="CareAgent Robot" />
                      <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight font-sans">
                        CareAgent
                      </h2>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-sans">
                      Hệ thống tự động hóa EMR lâm sàng tích hợp cổng chat tư vấn sức khỏe người bệnh mã hóa client-side. Bảo mật thông tin quốc gia và tuân thủ các điều khoản bảo mật dữ liệu y tế.
                    </p>
                  </div>

                  <div className="mt-8 space-y-3 border-t border-[#1c2e24]/60 pt-6">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="h-2 w-2 rounded-full bg-[#4d7c5d]" />
                      Mã hóa AES-256-GCM tại trình duyệt
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="h-2 w-2 rounded-full bg-[#7FB08E]" />
                      Lưu trữ tin nhắn mã hóa trong IndexedDB
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="h-2 w-2 rounded-full bg-[#3d634a]" />
                      Chẩn đoán phân khoa theo thời gian thực
                    </div>
                  </div>
                </div>

                {/* Login & Registration Form Panel */}
                <div className="flex flex-col justify-center p-8 rounded-3xl bg-[#0f1712]/60 border border-[#1c2e24]/60 backdrop-blur-xl relative">
                  
                  {/* Account role toggle */}
                  <div className="flex items-center justify-between border-b border-[#1c2e24] pb-4 mb-6">
                    <h3 className="font-bold text-lg text-slate-100 font-sans">
                      {isSignUp ? t('registerSystem') : t('loginSystem')}
                    </h3>
                    <div className="flex rounded-lg bg-[#070b09] p-1 border border-[#1c2e24]">
                      <button
                        onClick={() => {
                          setLoginRole('patient');
                          addDevLog(`[Auth] Form toggled to Patient credentials.`);
                        }}
                        className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                          loginRole === 'patient' ? 'bg-[#4d7c5d] text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t('switchToPatient')}
                      </button>
                      <button
                        onClick={() => {
                          setLoginRole('doctor');
                          addDevLog(`[Auth] Form toggled to Doctor credentials.`);
                        }}
                        className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                          loginRole === 'doctor' ? 'bg-[#4d7c5d] text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t('switchToDoctor')}
                      </button>
                    </div>
                  </div>

                  {/* SIGN IN FORM */}
                  {!isSignUp ? (
                    <form onSubmit={handleSignInSubmit} className="space-y-4 font-sans">
                      {loginRole === 'patient' ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('name')}</label>
                            <input
                              type="text"
                              value={inputName}
                              onChange={(e) => setInputName(e.target.value)}
                              placeholder="Ví dụ: Nguyễn Văn A"
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide font-sans">{t('cccd')}</label>
                            <input
                              type="text"
                              value={inputCccd}
                              onChange={(e) => setInputCccd(e.target.value)}
                              placeholder="Ví dụ: 012345678912"
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('docName')}</label>
                            <input
                              type="text"
                              value={inputName}
                              onChange={(e) => setInputName(e.target.value)}
                              placeholder="Ví dụ: Bác sĩ Trần Hùng"
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide font-sans">{t('docId')}</label>
                            <input
                              type="text"
                              value={inputDocId}
                              onChange={(e) => setInputDocId(e.target.value)}
                              placeholder="Ví dụ: DOC-11223"
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                            />
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        className="w-full text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 bg-[#4d7c5d] hover:bg-[#5e8c6a]"
                      >
                        {loginRole === 'patient' ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        {loginRole === 'patient' ? t('submitLoginPatient') : t('submitLoginDoctor')}
                      </button>

                      <p className="text-center text-xs text-slate-500">
                        {lang === 'vi' ? 'Chưa có tài khoản?' : 'No account yet?'} {' '}
                        <button
                          type="button"
                          onClick={() => setIsSignUp(true)}
                          className="text-[#7FB08E] hover:underline font-semibold"
                        >
                          {t('register')}
                        </button>
                      </p>
                    </form>
                  ) : (
                    // SIGN UP FORM (VERIFY REGISTERED ACCOUNTS WITH STRICT ID VALIDATION)
                    <form onSubmit={handleSignUpSubmit} className="space-y-4 font-sans">
                      {loginRole === 'patient' ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('name')}</label>
                            <input
                              type="text"
                              value={inputName}
                              onChange={(e) => setInputName(e.target.value)}
                              placeholder="Ví dụ: Nguyễn Văn A"
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide font-sans">{t('cccd')}</label>
                            <input
                              type="text"
                              value={inputCccd}
                              onChange={(e) => setInputCccd(e.target.value)}
                              placeholder="Mã số định danh (12 số)"
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('docName')}</label>
                            <input
                              type="text"
                              value={inputName}
                              onChange={(e) => setInputName(e.target.value)}
                              placeholder="Ví dụ: Bác sĩ Nguyễn Hùng"
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                            />
                          </div>
                          <div className="space-y-2 border border-red-500/20 bg-red-950/10 p-3 rounded-xl">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-wide font-sans flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                              {t('docId')} (Yêu cầu mã thật)
                            </label>
                            <input
                              type="text"
                              value={inputDocId}
                              onChange={(e) => setInputDocId(e.target.value)}
                              placeholder="Ví dụ: DOC-11223, DOC-22334"
                              className="w-full bg-[#070b09] border border-red-500/30 rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none text-slate-100 mt-2 font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('specialty')}</label>
                            <select
                              value={inputDocSpecialty}
                              onChange={(e) => setInputDocSpecialty(e.target.value)}
                              className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-[#4d7c5d] focus:outline-none"
                            >
                              <option value="Khoa Tim Mạch">Khoa Tim Mạch</option>
                              <option value="Khoa Tai - Mũi - Họng">Khoa Tai - Mũi - Họng</option>
                              <option value="Khoa Cơ Xương Khớp">Khoa Cơ Xương Khớp</option>
                              <option value="Khoa Da Liễu">Khoa Da Liễu</option>
                              <option value="Khoa Nhi">Khoa Nhi</option>
                            </select>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        className="w-full text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 bg-[#4d7c5d] hover:bg-[#5e8c6a]"
                      >
                        <Plus className="h-4 w-4" />
                        {loginRole === 'patient' ? t('submitRegisterPatient') : t('submitRegisterDoctor')}
                      </button>

                      <p className="text-center text-xs text-slate-500">
                        {lang === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'} {' '}
                        <button
                          type="button"
                          onClick={() => setIsSignUp(false)}
                          className="text-[#7FB08E] hover:underline font-semibold"
                        >
                          {t('login')}
                        </button>
                      </p>
                    </form>
                  )}

                </div>
              </div>
            </div>
          ) : (
            // B. USER IS AUTHENTICATED
            <>
              {/* Patient Workspace View */}
              {role === 'patient' ? (
                <div className="flex-1 flex flex-col overflow-hidden animate-fadeIn">
                  
                  {/* Health Stats Onboarding Banner */}
                  {!onboardingCompleted ? (
                    <div className="flex-1 flex items-center justify-center p-6 bg-[#070b09]">
                      <div className="w-full max-w-xl bg-[#0f1712] border border-[#1c2e24] rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4d7c5d]/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-[#4d7c5d]/20 p-2.5 text-[#7FB08E]">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-lg text-slate-200">{t('onboardingTitle')}</h3>
                            <p className="text-xs text-slate-500">{t('onboardingSubtitle')}</p>
                          </div>
                        </div>

                        {/* Interactive Steps */}
                        <div className="space-y-4 py-4">
                          {onboardingStep === 0 && (
                            <div className="space-y-4">
                              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                                💬 <strong>CareAgent AI:</strong> {lang === 'vi' ? 'Chào mừng bạn' : 'Welcome'} <span className="text-[#7FB08E] font-semibold">{userName}</span>! {t('onboardingIntro')} <strong>{t('heightLabel')}</strong>?
                              </p>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={patientHeight}
                                  onChange={(e) => setPatientHeight(e.target.value)}
                                  placeholder={t('heightPlaceholder')}
                                  className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100 font-sans"
                                />
                                <span className="absolute right-4 top-3.5 text-xs text-slate-500">cm</span>
                              </div>
                            </div>
                          )}

                          {onboardingStep === 1 && (
                            <div className="space-y-4">
                              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                                💬 <strong>CareAgent AI:</strong> {lang === 'vi' ? 'Tuyệt vời. Tiếp theo, vui lòng nhập' : 'Great. Next, please specify your'} <strong>{t('weightLabel')}</strong>?
                              </p>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={patientWeight}
                                  onChange={(e) => setPatientWeight(e.target.value)}
                                  placeholder={t('weightPlaceholder')}
                                  className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100 font-sans"
                                />
                                <span className="absolute right-4 top-3.5 text-xs text-slate-500">kg</span>
                              </div>
                            </div>
                          )}

                          {onboardingStep === 2 && (
                            <div className="space-y-4">
                              <p className="text-sm text-slate-300 leading-relaxed">
                                💬 <strong>CareAgent AI:</strong> {t('bmiText')}: <strong>{patientBmi}</strong>.
                                <br />
                                {lang === 'vi' ? 'Bạn có tiền sử bệnh lý nền nào không? (Nhập "Không" nếu bình thường)' : 'Do you have pre-existing conditions? (Enter "None" if normal)'}
                              </p>
                              <input
                                type="text"
                                value={patientConditions}
                                onChange={(e) => setPatientConditions(e.target.value)}
                                placeholder={t('conditionsPlaceholder')}
                                className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                              />
                            </div>
                          )}

                          {onboardingStep === 3 && (
                            <div className="space-y-4">
                              <p className="text-sm text-slate-300 leading-relaxed">
                                💬 <strong>CareAgent AI:</strong> {lang === 'vi' ? 'Bước cuối cùng. Bạn có tiền sử dị ứng nào không?' : 'Last step. Do you have any known allergies?'}
                              </p>
                              <input
                                type="text"
                                value={patientAllergies}
                                onChange={(e) => setPatientAllergies(e.target.value)}
                                placeholder={t('allergiesPlaceholder')}
                                className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-4 py-3 text-sm focus:border-[#4d7c5d] focus:outline-none text-slate-100"
                              />
                            </div>
                          )}
                        </div>

                        {/* Control Onboarding */}
                        <div className="flex items-center justify-between border-t border-[#1c2e24] pt-5 font-sans">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((s) => (
                              <div
                                key={s}
                                className={`h-1.5 w-6 rounded-full transition-all ${
                                  s === onboardingStep ? 'bg-[#4d7c5d]' : s < onboardingStep ? 'bg-[#14231b]' : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                          
                          <button
                            onClick={handleOnboardingNext}
                            className="bg-[#4d7c5d] hover:bg-[#5e8c6a] text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                          >
                            <span>{onboardingStep === 3 ? t('done') : t('next')}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Onboarding Completed -> Patient Portal Main Shell
                    <div className="flex-1 flex overflow-hidden">
                      
                      {/* Sidebar Navigation */}
                      <nav className="w-64 border-r border-[#111a14] bg-[#070b09] p-4 space-y-2 shrink-0 font-sans">
                        <div className="px-3 py-2 text-xxs font-bold text-slate-500 uppercase tracking-widest">
                          {t('menuTitle')}
                        </div>
                        <button
                          onClick={() => setPatientTab('chatbot')}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                            patientTab === 'chatbot' 
                              ? 'bg-[#14231b]/40 border-[#4d7c5d]/20 text-[#7FB08E]' 
                              : 'text-slate-400 border-transparent hover:bg-[#0f1712] hover:text-slate-200'
                          }`}
                        >
                          <Activity className="h-4 w-4" />
                          {t('chatTab')}
                        </button>
                        <button
                          onClick={() => setPatientTab('booking')}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                            patientTab === 'booking' 
                              ? 'bg-[#14231b]/40 border-[#4d7c5d]/20 text-[#7FB08E]' 
                              : 'text-slate-400 border-transparent hover:bg-[#0f1712] hover:text-slate-200'
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                          {t('bookingTab')}
                        </button>
                        <button
                          onClick={() => setPatientTab('profile')}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                            patientTab === 'profile' 
                              ? 'bg-[#14231b]/40 border-[#4d7c5d]/20 text-[#7FB08E]' 
                              : 'text-slate-400 border-transparent hover:bg-[#0f1712] hover:text-slate-200'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          {t('profileTab')}
                        </button>

                        <div className="pt-6 mt-6 border-t border-[#1c2e24] px-3 space-y-2.5">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('biometricsTitle')}</div>
                          <div className="bg-[#0f1712]/40 rounded-xl p-3 border border-[#111a14] text-xxs space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">{t('heightText')}:</span>
                              <span className="font-semibold text-slate-300">{patientHeight} cm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">{t('weightText')}:</span>
                              <span className="font-semibold text-slate-300">{patientWeight} kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">{t('bmiText')}:</span>
                              <span className="font-bold text-[#7FB08E]">{patientBmi}</span>
                            </div>
                          </div>
                        </div>
                      </nav>

                      {/* Workspace Center Content Panels */}
                      <div className="flex-1 flex flex-col overflow-hidden bg-[#070b09] relative">
                        
                        {/* PANEL 1: AI CLINICAL CONSULTATION CHATBOT */}
                        {patientTab === 'chatbot' && (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Message Timeline */}
                            <div 
                              ref={chatScrollRef}
                              className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-[#1c2e24] scrollbar-track-transparent"
                            >
                              {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
                                  <div className="rounded-full bg-[#0f1712] p-6 border border-[#1c2e24] text-[#7FB08E] animate-pulse">
                                    <Activity className="h-10 w-10" />
                                  </div>
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-slate-200">{t('assistantTitle')}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                      {t('chatbotIntro')}
                                    </p>
                                  </div>

                                  {/* Symptom Presets */}
                                  <div className="w-full space-y-2 pt-2 font-sans">
                                    <div className="text-xxs font-bold text-slate-500 uppercase tracking-widest text-left pl-1">{t('emergencyPresets')}</div>
                                    <button
                                      onClick={() => handleTriggerPreset(lang === 'vi' ? 'Tôi bị đau ngực trái lan ra cánh tay trái, khó thở dữ dội từ 15 phút trước.' : 'I have severe left chest pain spreading to my left arm, difficulty breathing since 15 mins.')}
                                      className="w-full flex items-center justify-between text-left p-3.5 rounded-2xl bg-[#0f1712]/50 hover:bg-[#0f1712] border border-red-500/20 text-red-300 text-xs font-semibold transition-all"
                                    >
                                      <span>{t('emergencyPreset1')}</span>
                                      <AlertCircle className="h-4 w-4 text-red-400" />
                                    </button>
                                    <button
                                      onClick={() => handleTriggerPreset(lang === 'vi' ? 'Tôi bị ngứa da nổi mụn nước ở bắp chân đã 3 ngày nay.' : 'I have itchy skin blisters on my calf for 3 days.')}
                                      className="w-full flex items-center justify-between text-left p-3.5 rounded-2xl bg-[#0f1712]/50 hover:bg-[#0f1712] border border-[#1c2e24] text-slate-300 text-xs font-semibold transition-all"
                                    >
                                      <span>{t('emergencyPreset2')}</span>
                                      <ChevronRight className="h-4 w-4 text-slate-500" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="max-w-3xl mx-auto space-y-6 font-sans">
                                  {chatMessages.map((msg) => {
                                    const isUser = msg.role === 'user';
                                    const isClean = typeof window !== 'undefined' ? DOMPurify.sanitize(msg.content) : msg.content;
                                    
                                    const deptKey = msg.departmentToSchedule || 'default';
                                    const sourceData = MEDICAL_SOURCES[deptKey] || MEDICAL_SOURCES['default'];

                                    return (
                                      <div key={msg.id} className="space-y-2">
                                        <div
                                          role="log"
                                          className={`flex w-full gap-4 py-4 px-4 rounded-2xl transition-all border ${
                                            isUser ? 'bg-transparent border-transparent' : 'bg-[#0f1712]/45 border-[#1c2e24]/40'
                                          }`}
                                        >
                                          <div
                                            className={`flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl shadow-md ${
                                              isUser
                                                ? 'bg-[#4d7c5d]/10 text-[#7FB08E] border border-[#4d7c5d]/20'
                                                : 'bg-[#3d634a]/20 text-[#7FB08E] border border-[#4d7c5d]/20'
                                            }`}
                                          >
                                            {isUser ? <User className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                                          </div>

                                          <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wide">
                                                {isUser ? (lang === 'vi' ? 'Bệnh Nhân (Khóa PII mask active)' : 'Patient (PII mask active)') : 'CareAgent Trợ Lý AI'}
                                              </span>
                                              {isUser && (
                                                <span className="text-[9px] text-[#7FB08E] bg-[#14231b]/60 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 border border-[#4d7c5d]/20">
                                                  <Shield className="w-2.5 h-2.5" />
                                                  {t('clientMaskedBadge')}
                                                </span>
                                              )}
                                            </div>
                                            <div 
                                              aria-live={msg.isStreaming ? 'polite' : 'off'} 
                                              className="text-slate-100 text-sm leading-relaxed break-words whitespace-pre-wrap font-sans"
                                              dangerouslySetInnerHTML={{ __html: isClean || (lang === 'vi' ? 'Đang tạo chẩn đoán phân khoa...' : 'Generating clinical response...') }}
                                            />

                                            {/* Dynamic Scheduling Card Render inside chat */}
                                            {!msg.isStreaming && msg.departmentToSchedule && (
                                              <div className="mt-3 p-4 bg-[#0f1712] border border-[#1c2e24] rounded-2xl max-w-md space-y-3 shadow-xl">
                                                <div className="flex items-center gap-2">
                                                  <Calendar className="w-4 h-4 text-[#7FB08E]" />
                                                  <span className="text-xs font-bold text-slate-200">{t('suggestedBooking')}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400">{t('suggestedBookingSub')} <strong>{msg.departmentToSchedule}</strong></p>
                                                <button
                                                  onClick={() => {
                                                    setBookingDept(msg.departmentToSchedule!);
                                                    setPatientTab('booking');
                                                    addDevLog(`[Router] Redirected to secure booking for department: ${msg.departmentToSchedule}`);
                                                  }}
                                                  className="w-full bg-[#4d7c5d] hover:bg-[#5e8c6a] text-white font-bold text-xs py-2 rounded-xl transition-all shadow"
                                                >
                                                  {t('bookNowBtn')}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* CLINICAL CONFIDENCE & MEDICAL EVIDENCE CARD */}
                                        {!isUser && !msg.isStreaming && msg.content && (
                                          <div className="ml-14 max-w-2xl bg-[#070b09]/80 border border-[#111a14] rounded-2xl p-4 space-y-3 shadow-sm font-sans">
                                            <div className="flex items-center justify-between border-b border-[#1c2e24] pb-2">
                                              <div className="flex items-center gap-2 text-xxs font-bold text-slate-400 uppercase tracking-widest">
                                                <Award className="w-3.5 h-3.5 text-[#7FB08E] animate-pulse" />
                                                <span>{t('confidenceTitle')}</span>
                                              </div>
                                              <span className="text-xs font-bold text-[#7FB08E] font-mono">
                                                {sourceData.confidence}
                                              </span>
                                            </div>

                                            {/* Confidence gauge progress bar */}
                                            <div className="h-1.5 w-full bg-[#0f1712] rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-gradient-to-r from-[#4d7c5d] to-[#7FB08E] rounded-full"
                                                style={{ width: sourceData.confidence }}
                                              />
                                            </div>

                                            <div className="space-y-1">
                                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                                {t('evidenceLabel')}:
                                              </span>
                                              <ul className="text-[10px] text-slate-400 space-y-1 list-disc pl-4">
                                                {sourceData.sources.map((src, sIdx) => (
                                                  <li key={sIdx}>{src}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Emergency Warning Card */}
                                  {isEmergency && (
                                    <div 
                                      aria-live="assertive"
                                      className="border border-red-500/30 bg-red-950/20 p-5 rounded-2xl flex gap-3 text-red-200 shadow-lg relative overflow-hidden animate-pulse animate-scaleIn"
                                    >
                                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                                      <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                                      <div className="space-y-1.5">
                                        <h4 className="font-extrabold text-sm text-red-400 tracking-wide uppercase">{t('emergencyWarningTitle')}</h4>
                                        <p className="text-xs leading-relaxed text-slate-300">
                                          {t('emergencyWarningText')}
                                        </p>
                                        <div className="pt-1 flex gap-2">
                                          <a 
                                            href="tel:115"
                                            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                                          >
                                            {t('call115')}
                                          </a>
                                          <button
                                            onClick={() => setIsEmergency(false)}
                                            className="px-3 py-1.5 border border-[#1c2e24] text-slate-400 hover:text-slate-300 text-xs rounded-xl transition-all"
                                          >
                                            {t('closeWarning')}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Footer Input Area */}
                            <footer className="shrink-0 border-t border-[#111a14] bg-[#070b09] p-4">
                              <div className="max-w-3xl mx-auto">
                                <form onSubmit={handleChatSubmit} className="relative flex items-end gap-2 bg-[#0f1712]/60 border border-[#1c2e24] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#4d7c5d]/50 transition-all">
                                  <textarea
                                    ref={chatInputRef}
                                    rows={1}
                                    value={chatInputText}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleChatSubmit();
                                      }
                                    }}
                                    placeholder={t('symptomPlaceholderText')}
                                    aria-label="Khung nhập nội dung tư vấn triệu chứng"
                                    className="flex-1 max-h-24 min-h-[2.5rem] bg-transparent pl-3 pr-12 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none overflow-y-auto"
                                  />
                                  <button
                                    type="submit"
                                    disabled={chatLoading || !chatInputText.trim()}
                                    aria-label="Gửi tin nhắn"
                                    className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#4d7c5d] text-white shadow hover:bg-[#5e8c6a] disabled:bg-slate-800 disabled:text-slate-600 transition-all"
                                  >
                                    <Send className="h-4 w-4" />
                                  </button>
                                </form>
                                <div className="mt-2 text-center text-[9px] text-slate-600 font-sans">
                                  * Khuyến cáo: Trợ lý AI chỉ mang tính chất tham khảo lâm sàng sơ bộ, không thay thế chẩn đoán của bác sĩ.
                                </div>
                              </div>
                            </footer>
                          </div>
                        )}

                        {/* PANEL 2: SECURE APPOINTMENT BOOKING FORM */}
                        {patientTab === 'booking' && (
                          <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                              
                              {/* Booking form */}
                              <div className="lg:col-span-7 bg-[#0f1712]/40 border border-[#1c2e24] rounded-3xl p-6 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-[#1c2e24] pb-3">
                                  <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#7FB08E]" />
                                    {t('bookingFormTitle')}
                                  </h3>
                                  <div className="flex items-center gap-1 text-[10px] text-[#7FB08E] font-mono">
                                    <Shield className="w-3 h-3 animate-pulse" />
                                    Client-Cipher On
                                  </div>
                                </div>

                                <form onSubmit={handleBookAppointmentSecure} className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide">{lang === 'vi' ? 'Họ tên Bệnh nhân' : 'Patient Name'}</label>
                                      <input
                                        type="text"
                                        value={bookingName}
                                        onChange={(e) => setBookingName(e.target.value)}
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-[#4d7c5d] focus:outline-none"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide font-sans">{lang === 'vi' ? 'Mã số CCCD' : 'CCCD ID'}</label>
                                      <input
                                        type="text"
                                        value={bookingCccd}
                                        onChange={(e) => setBookingCccd(e.target.value)}
                                        placeholder="12 số quốc gia"
                                        className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-[#4d7c5d] focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide">{t('deptLabel')}</label>
                                    <select
                                      value={bookingDept}
                                      onChange={(e) => setBookingDept(e.target.value)}
                                      className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-[#4d7c5d] focus:outline-none"
                                    >
                                      {MEDICAL_DEPARTMENTS.map((dept) => (
                                        <option key={dept.name} value={dept.name}>
                                          {dept.name} ({dept.description})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide">{t('slotLabel')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {slots.filter(s => s.department === bookingDept && !s.isBooked).map((slot) => (
                                        <button
                                          key={slot.id}
                                          type="button"
                                          onClick={() => setBookingSlot(slot.id)}
                                          className={`px-3 py-2 text-[10px] font-bold border rounded-xl transition-all ${
                                            bookingSlot === slot.id 
                                              ? 'bg-[#14231b] border-[#4d7c5d] text-[#7FB08E] shadow-md shadow-[#4d7c5d]/5' 
                                              : 'bg-[#070b09]/60 border-[#1c2e24] text-slate-300 hover:border-slate-700'
                                          }`}
                                        >
                                          {slot.time}
                                        </button>
                                      ))}
                                    </div>
                                    {slots.filter(s => s.department === bookingDept && !s.isBooked).length === 0 && (
                                      <p className="text-[10px] text-red-400 italic">Hết lịch trống cho chuyên khoa này ngày hôm nay.</p>
                                    )}
                                  </div>

                                  <div className="pt-2 flex items-center gap-3">
                                    <button
                                      type="submit"
                                      disabled={!bookingSlot}
                                      className="flex-1 bg-[#4d7c5d] hover:bg-[#5e8c6a] text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-600"
                                    >
                                      <Shield className="w-4 h-4" />
                                      {t('submitBookingBtn')}
                                    </button>
                                  </div>
                                </form>
                              </div>

                              {/* Simulation log and Active Bookings */}
                              <div className="lg:col-span-5 space-y-6 font-sans">
                                {/* Encryption shield status toast */}
                                {showBookingToast && (
                                  <div className="bg-[#14231b]/40 border border-[#4d7c5d]/20 p-5 rounded-3xl text-xs text-[#7FB08E] space-y-2 shadow-xl animate-fadeIn relative">
                                    <div className="flex items-center gap-2 font-bold text-slate-200">
                                      <Shield className="h-4 w-4 text-[#7FB08E]" />
                                      <span>{t('bookingToastTitle')}</span>
                                    </div>
                                    <p className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed text-slate-300 bg-[#070b09] p-3 rounded-xl border border-[#111a14] select-all">
                                      {bookingToastMessage}
                                    </p>
                                    <p className="text-[9px] text-slate-500 italic">{t('bookingToastFooter')}</p>
                                  </div>
                                )}

                                {/* My Active Bookings */}
                                <div className="bg-[#0f1712]/30 border border-[#1c2e24] rounded-3xl p-5 space-y-3 shadow-xl">
                                  <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-[#7FB08E]" />
                                    {t('activeBookingsTitle')} ({appointments.length})
                                  </h4>

                                  {appointments.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 italic">{t('noBookings')}</p>
                                  ) : (
                                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                                      {appointments.map((apt) => (
                                        <div key={apt.id} className="bg-[#070b09]/60 border border-[#1c2e24] p-3 rounded-xl space-y-1.5 relative overflow-hidden">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-200 font-sans">{apt.department}</span>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(apt.status)}`}>
                                              {apt.status === 'BOOKED' ? 'ĐÃ ĐẶT' : 'ĐÃ HỦY'}
                                            </span>
                                          </div>
                                          <div className="text-[9px] text-slate-400 font-mono space-y-0.5 leading-normal">
                                            <p className="flex items-center gap-1.5">
                                              <Lock className="w-2.5 h-2.5 text-[#7FB08E]" />
                                              Name: {apt.patientName.length > 20 ? apt.patientName.substring(0, 15) + '...' : apt.patientName}
                                            </p>
                                            <p className="flex items-center gap-1.5">
                                              <Lock className="w-2.5 h-2.5 text-[#7FB08E]" />
                                              CCCD: {apt.patientCccd.length > 20 ? apt.patientCccd.substring(0, 15) + '...' : apt.patientCccd}
                                            </p>
                                            <p>Slot: {apt.slot}</p>
                                          </div>
                                          {apt.status === 'BOOKED' && (
                                            <button
                                              onClick={() => {
                                                cancelAppointment('patient', userCccd || '', apt.id);
                                                addDevLog(`[Store] Appointment cancelled by patient.`);
                                              }}
                                              className="absolute right-2.5 bottom-2.5 text-red-400 hover:text-red-300 p-1"
                                              title="Hủy lịch hẹn"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PANEL 3: HEALTH RECORD */}
                        {patientTab === 'profile' && (
                          <div className="flex-1 overflow-y-auto p-6 font-sans">
                            <div className="max-w-3xl mx-auto space-y-6">
                              <div className="bg-[#0f1712]/40 border border-[#1c2e24] rounded-3xl p-6 space-y-4 shadow-xl">
                                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest flex items-center gap-2 border-b border-[#1c2e24] pb-3">
                                  <User className="w-4 h-4 text-[#7FB08E]" />
                                  {t('profileHeader')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                    <div className="bg-[#070b09] p-4 rounded-xl border border-[#1c2e24] space-y-1">
                                      <span className="text-[10px] text-slate-500 font-bold">{lang === 'vi' ? 'Họ và Tên' : 'Full Name'}</span>
                                      <p className="text-xs font-bold text-slate-200">{userName}</p>
                                    </div>
                                    <div className="bg-[#070b09] p-4 rounded-xl border border-[#1c2e24] space-y-1">
                                      <span className="text-[10px] text-slate-500 font-bold">{lang === 'vi' ? 'Số định danh quốc gia (CCCD)' : 'National ID (CCCD)'}</span>
                                      <p className="text-xs font-bold text-slate-200 font-mono">{userCccd}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div className="bg-[#070b09] p-4 rounded-xl border border-[#1c2e24] space-y-1">
                                      <span className="text-[10px] text-slate-500 font-bold">{t('conditionsLabel')}</span>
                                      <p className="text-xs font-bold text-slate-200">{patientConditions || t('noConditions')}</p>
                                    </div>
                                    <div className="bg-[#070b09] p-4 rounded-xl border border-[#1c2e24] space-y-1">
                                      <span className="text-[10px] text-slate-500 font-bold">{t('allergiesLabel')}</span>
                                      <p className="text-xs font-bold text-slate-200">{patientAllergies || t('noConditions')}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Onboarding Health summary */}
                              <div className="bg-[#0f1712]/20 border border-[#1c2e24] rounded-3xl p-6 space-y-4">
                                <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">{t('biometricAssessment')}</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="bg-[#070b09]/60 p-4 rounded-2xl border border-[#1c2e24]">
                                    <span className="text-[10px] text-slate-500 block mb-1">{t('heightText')}</span>
                                    <span className="text-lg font-bold text-slate-300">{patientHeight}</span>
                                    <span className="text-[10px] text-slate-500 block">cm</span>
                                  </div>
                                  <div className="bg-[#070b09]/60 p-4 rounded-2xl border border-[#1c2e24]">
                                    <span className="text-[10px] text-slate-500 block mb-1">{t('weightText')}</span>
                                    <span className="text-lg font-bold text-slate-300">{patientWeight}</span>
                                    <span className="text-[10px] text-slate-500 block">kg</span>
                                  </div>
                                  <div className="bg-[#070b09]/60 p-4 rounded-2xl border border-[#1c2e24]">
                                    <span className="text-[10px] text-slate-500 block mb-1">{t('bmiText')}</span>
                                    <span className="text-lg font-bold text-[#7FB08E]">{patientBmi}</span>
                                    <span className="text-[9px] text-[#7FB08E] block mt-1 font-semibold">{t('bmiStatusNormal')}</span>
                                  </div>
                                </div>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                    // Doctor Workspace View (Electronic Medical Record & Queue Management)
                    <div className="flex-1 flex overflow-hidden animate-fadeIn">
                      
                      {/* Left Panel: Queue & Appointment Manager */}
                      <div className="w-5/12 border-r border-[#111a14] bg-[#070b09] flex flex-col overflow-hidden font-sans">
                        <div className="p-4 border-b border-[#111a14] flex items-center justify-between shrink-0 bg-[#070b09]">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#7FB08E]" />
                            <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                              {t('queueTitle')} ({activeQueue.length})
                            </h2>
                          </div>
                          
                          {/* Decrypt info toggle */}
                          <button
                            onClick={() => {
                              setDecryptInfoActive(!decryptInfoActive);
                              addDevLog(`[UI] Doctor toggled Decrypt Info switch to: ${!decryptInfoActive}`);
                            }}
                            className={`text-xxs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all duration-200 ${
                              decryptInfoActive 
                                ? 'bg-red-950/40 border-red-500/20 text-red-400 shadow-md' 
                                : 'bg-[#14231b]/30 border-[#4d7c5d]/20 text-[#7FB08E] hover:bg-[#14231b]/50'
                            }`}
                          >
                            {decryptInfoActive ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{decryptInfoActive ? t('encryptBtn') : t('decryptBtn')}</span>
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {activeQueue.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                              <CheckCircle2 className="w-10 h-10 text-[#7FB08E]" />
                              <p className="text-xs text-slate-500 italic">Đã giải quyết sạch hàng đợi khám ngày hôm nay!</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {activeQueue.map((apt) => {
                                const isSelected = selectedQueuePatient?.id === apt.id;
                                
                                const deptName = castDepartment(apt.department);
                                let deptColor = 'bg-slate-900 border-slate-800 text-slate-400';
                                if (deptName === 'Khoa Tim Mạch') deptColor = 'bg-red-950/40 border-red-500/10 text-red-400';
                                if (deptName === 'Khoa Tai - Mũi - Họng') deptColor = 'bg-yellow-950/40 border-yellow-500/10 text-yellow-400';
                                if (deptName === 'Khoa Cơ Xương Khớp') deptColor = 'bg-indigo-950/40 border-indigo-500/10 text-indigo-400';
                                if (deptName === 'Khoa Da Liễu') deptColor = 'bg-teal-950/40 border-teal-500/10 text-teal-400';

                                return (
                                  <button
                                    key={apt.id}
                                    onClick={() => handleSelectActivePatient(apt)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 focus:outline-none ${
                                      isSelected 
                                        ? 'bg-[#14231b]/35 border-[#4d7c5d]/40 shadow-lg ring-1 ring-[#4d7c5d]/30' 
                                        : 'bg-[#0f1712]/40 hover:bg-[#0f1712] border-[#1c2e24]/60'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className={`text-xs font-bold flex items-center gap-1.5 ${isSelected ? 'text-[#7FB08E]' : 'text-slate-200'}`}>
                                        {decryptInfoActive ? (
                                          <>
                                            <Unlock className="w-3 h-3 text-red-400" />
                                            {selectedQueuePatient?.id === apt.id && decryptedPatientData ? decryptedPatientData.name : (lang === 'vi' ? 'Nhấp xem giải mã' : 'Click to decrypt')}
                                          </>
                                        ) : (
                                          <>
                                            <Lock className="w-3 h-3 text-[#7FB08E]" />
                                            {apt.patientName.substring(0, 15)}...
                                          </>
                                        )}
                                      </span>
                                      
                                      <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                        {apt.slot}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between w-full">
                                      <span className="text-[9px] text-slate-400 font-mono leading-normal">
                                        {decryptInfoActive ? (
                                          selectedQueuePatient?.id === apt.id && decryptedPatientData ? `CCCD: ${decryptedPatientData.cccd}` : 'CCCD: Encrypted'
                                        ) : (
                                          `CCCD: ${apt.patientCccd.substring(0, 15)}...`
                                        )}
                                      </span>

                                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${deptColor}`}>
                                        {deptName}
                                      </span>
                                    </div>

                                    {decryptInfoActive && selectedQueuePatient?.id === apt.id && !decryptedPatientData && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDecryptPatientDetails(apt);
                                        }}
                                        className="w-full text-center py-1 bg-red-950/20 hover:bg-red-950/40 text-[9px] text-red-400 font-bold rounded-xl border border-red-500/20 mt-1"
                                      >
                                        Xác thực & Giải mã nhanh
                                      </button>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Managed history EMR list */}
                        <div className="p-4 border-t border-[#111a14] bg-[#070b09] flex-col space-y-2 shrink-0 animate-fadeIn">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hồ Sơ Đã Quản Lý</span>
                          </div>
                          <div className="bg-[#0f1712]/40 border border-[#111a14] p-3 rounded-2xl text-[9px] text-slate-500 italic space-y-1">
                            <p>● BN: Nguyễn Văn A (Mã EMR: EMR-082) - Đã hoàn thành chẩn đoán</p>
                            <p>● BN: Phạm Thị B (Mã EMR: EMR-055) - Đã chẩn đoán tim mạch</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Panel: Active EMR Form & Sync Message Console */}
                      <div className="w-7/12 flex flex-col overflow-hidden bg-[#070b09]">
                        
                        {selectedQueuePatient ? (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            
                            {/* EMR Form Editor */}
                            <div className="p-6 border-b border-[#111a14] overflow-y-auto max-h-[60%] space-y-4 font-sans">
                              <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                                  {t('emrFormTitle')}
                                </h3>
                                <span className="text-[9px] text-[#7FB08E] flex items-center gap-1 font-mono">
                                  <span className="h-1.5 w-1.5 bg-[#4d7c5d] rounded-full animate-pulse" />
                                  {t('autoDraftText')}
                                </span>
                              </div>

                              <div className="p-4 bg-[#14231b]/20 border border-[#4d7c5d]/20 rounded-2xl text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="font-semibold text-slate-400">{lang === 'vi' ? 'Khám lâm sàng:' : 'Consult Specialty:'}</span>
                                  <span className="font-bold text-[#7FB08E] uppercase">{selectedQueuePatient.department}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-semibold text-slate-400">{lang === 'vi' ? 'Bệnh nhân:' : 'Patient Name:'}</span>
                                  <span className="font-medium text-slate-200">
                                    {decryptedPatientData ? decryptedPatientData.name : `${selectedQueuePatient.patientName.substring(0, 10)}... (Locked)`}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-semibold text-slate-400">{lang === 'vi' ? 'Mã số CCCD:' : 'CCCD ID:'}</span>
                                  <span className="font-medium text-slate-200 font-mono">
                                    {decryptedPatientData ? decryptedPatientData.cccd : `${selectedQueuePatient.patientCccd.substring(0, 10)}... (Locked)`}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-4 text-xs font-sans">
                                {/* Symptoms field */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-400">{t('emrSymptoms')}</label>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleVoiceRecord('symptoms')}
                                      className={`p-1 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold border transition-all ${
                                        isVoiceRecording && voiceTargetField === 'symptoms'
                                          ? 'bg-red-950 border-red-500/20 text-red-400'
                                          : 'bg-[#0f1712] border-[#1c2e24] text-slate-400'
                                      }`}
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${isVoiceRecording && voiceTargetField === 'symptoms' ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                                      <span>{isVoiceRecording && voiceTargetField === 'symptoms' ? t('stopVoiceBtn') : t('voiceInputBtn')}</span>
                                    </button>
                                  </div>
                                  <textarea
                                    value={emrSymptoms}
                                    onChange={(e) => setEmrSymptoms(e.target.value)}
                                    className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl p-3 text-xs focus:border-[#4d7c5d] focus:outline-none"
                                    rows={2}
                                    placeholder="Ghi nhận triệu chứng..."
                                  />
                                </div>

                                {/* Diagnosis field */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-400">{t('emrDiagnosis')}</label>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleVoiceRecord('diagnosis')}
                                      className={`p-1 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold border transition-all ${
                                        isVoiceRecording && voiceTargetField === 'diagnosis'
                                          ? 'bg-red-950 border-red-500/20 text-red-400'
                                          : 'bg-[#0f1712] border-[#1c2e24] text-slate-400'
                                      }`}
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${isVoiceRecording && voiceTargetField === 'diagnosis' ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                                      <span>{isVoiceRecording && voiceTargetField === 'diagnosis' ? t('stopVoiceBtn') : t('voiceInputBtn')}</span>
                                    </button>
                                  </div>
                                  <textarea
                                    value={emrDiagnosis}
                                    onChange={(e) => setEmrDiagnosis(e.target.value)}
                                    className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl p-3 text-xs focus:border-[#4d7c5d] focus:outline-none"
                                    rows={2}
                                    placeholder="Ghi nhận chẩn đoán..."
                                  />
                                </div>

                                {/* Prescription field */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-400">{t('emrPrescription')}</label>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleVoiceRecord('prescription')}
                                      className={`p-1 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold border transition-all ${
                                        isVoiceRecording && voiceTargetField === 'prescription'
                                          ? 'bg-red-950 border-red-500/20 text-red-400'
                                          : 'bg-[#0f1712] border-[#1c2e24] text-slate-400'
                                      }`}
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${isVoiceRecording && voiceTargetField === 'prescription' ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                                      <span>{isVoiceRecording && voiceTargetField === 'prescription' ? t('stopVoiceBtn') : t('voiceInputBtn')}</span>
                                    </button>
                                  </div>
                                  <textarea
                                    value={emrPrescription}
                                    onChange={(e) => setEmrPrescription(e.target.value)}
                                    className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl p-3 text-xs focus:border-[#4d7c5d] focus:outline-none"
                                    rows={2}
                                    placeholder="Kê đơn thuốc chi tiết..."
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                  onClick={handleEMRComplete}
                                  disabled={emrIsSaving}
                                  className="bg-[#4d7c5d] hover:bg-[#5e8c6a] text-white font-bold text-xs py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{emrIsSaving ? 'Saving...' : t('saveEmrBtn')}</span>
                                </button>
                              </div>
                            </div>

                            {/* Consultation Chat Timeline */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-[#070b09]/40 font-sans">
                              <div className="p-3 border-b border-[#111a14] bg-[#070b09] flex items-center justify-between shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Lịch sử Chat & Tư vấn an toàn
                                </span>
                                
                                <span className="text-[9px] text-[#7FB08E] bg-[#14231b]/50 px-2 py-0.5 rounded-xl border border-[#4d7c5d]/20 flex items-center gap-1.5 font-mono">
                                  <Database className="w-3 h-3" />
                                  <span>{t('syncStatusText')}</span>
                                </span>
                              </div>

                              {/* Message bubbles with proper flex column alignments */}
                              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin flex flex-col">
                                {doctorChatMessages.map((msg, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`p-3 rounded-2xl max-w-md ${
                                      msg.role === 'user' 
                                        ? 'bg-[#0f1712] border border-[#1c2e24] text-slate-200 self-start' 
                                        : 'bg-[#14231b]/20 border border-[#4d7c5d]/10 text-slate-200 ml-auto'
                                    }`}
                                  >
                                    <span className="text-[9px] font-bold block mb-1 text-slate-500">
                                      {msg.role === 'user' ? 'Bệnh Nhân' : 'Tư vấn EMR'}
                                    </span>
                                    <p className="text-xs">{msg.content}</p>
                                  </div>
                                ))}
                              </div>

                              <form onSubmit={handleDoctorChatSubmit} className="p-3 border-t border-[#111a14] bg-[#070b09] flex gap-2 shrink-0">
                                <input
                                  type="text"
                                  value={doctorChatInput}
                                  onChange={(e) => setDoctorChatInput(e.target.value)}
                                  placeholder="Nhập nội dung trao đổi lâm sàng hoặc phác đồ..."
                                  className="flex-1 bg-[#0f1712] border border-[#1c2e24] rounded-xl px-4 py-2 text-xs focus:border-[#4d7c5d] focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  className="bg-[#4d7c5d] hover:bg-[#5e8c6a] text-white p-2 px-4 rounded-xl text-xs font-bold shadow"
                                >
                                  Gửi
                                </button>
                              </form>
                            </div>

                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                            <Users className="w-12 h-12 text-slate-800" />
                            <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest">{t('noActivePatient')}</h3>
                            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{t('noActivePatientSub')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

        {/* Collapsible Sidebar: Security Conflict Resolution & Log Terminal */}
        {isSidebarOpen && (
          <aside className="w-80 border-l border-[#111a14] bg-[#070b09] flex flex-col shrink-0 overflow-hidden z-20">
            <div className="p-4 border-b border-[#111a14] flex items-center justify-between shrink-0 bg-[#070b09]">
              <span className="text-xs font-bold text-[#7FB08E] uppercase tracking-widest flex items-center gap-2 font-mono">
                <Shield className="w-4 h-4" />
                Security & Dev Console
              </span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-[10px] text-slate-500 hover:text-slate-400 font-bold font-sans"
              >
                {lang === 'vi' ? 'Ẩn bảng' : 'Hide panel'}
              </button>
            </div>

            {/* Panel 1: API Environment Variable Key manager */}
            <div className="p-4 border-b border-[#111a14] space-y-3 bg-[#070b09]/60 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#7FB08E]" />
                Environment Variable Manager
              </span>
              <div className="space-y-1.5 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-semibold font-mono">MEDIAGENT_API_KEY</span>
                  <span className="text-[9px] text-slate-500 italic">local only</span>
                </div>
                <div className="relative flex items-center bg-[#070b09] border border-[#1c2e24] rounded-xl px-2.5 py-1.5">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={mediagentApiKey}
                    onChange={(e) => {
                      setMediagentApiKey(e.target.value);
                      addDevLog(`[Env] Updated MEDIAGENT_API_KEY from dashboard.`);
                    }}
                    placeholder="Chạy chế độ giả lập (Mock)"
                    className="w-full bg-transparent border-none text-[10px] focus:outline-none text-[#7FB08E] font-mono"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-slate-500 hover:text-slate-400 px-1 ml-1"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Panel 2: Live Scrolling Logger Console */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/60 p-4">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Developer Live Event Log
                </span>
                <button
                  onClick={() => {
                    setDeveloperLogs([`[System] Log cleared.`]);
                  }}
                  className="text-[9px] text-slate-500 hover:text-slate-400"
                >
                  Clear
                </button>
              </div>

              {/* Log List */}
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[9px] text-[#7FB08E] leading-normal scrollbar-thin scrollbar-thumb-[#1c2e24] scrollbar-track-transparent">
                {developerLogs.map((log, idx) => {
                  let colorClass = 'text-slate-400';
                  if (log.includes('[aesGcm.ts]')) colorClass = 'text-emerald-400 font-semibold';
                  if (log.includes('[secureDb.ts]')) colorClass = 'text-indigo-400';
                  if (log.includes('[Type Casting]')) colorClass = 'text-yellow-450';
                  if (log.includes('[Auth]')) colorClass = 'text-teal-400';
                  if (log.includes('[Broadcast Event]')) colorClass = 'text-purple-400';

                  return (
                    <div key={idx} className={`${colorClass} break-words whitespace-pre-wrap`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

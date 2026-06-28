# CareAgent (formerly MEDIagent) - AI Secure Healthcare Portal

CareAgent is a production-ready, highly aesthetic web portal integrating patient triage, secure appointment booking, clinical consultation dialogue memory, and doctor EMR workspaces. It demonstrates client-side **Zero-Trust PII Masking** and **AES-256-GCM Encryption** to ensure patient health data privacy compliance.

---

## 🌟 Key Features

### 1. Dual-Role Authenticated Workspaces
- **Isolated User Workspaces**: Login session role strictly locks the active workspace layout (Patient Portal vs. Doctor EMR Dashboard). Users cannot dynamically switch role perspectives post-login without explicitly logging out.
- **Registry-Validated Registration**: Accounts are stored locally. Doctor registrations are strictly verified against a national registry database (valid sample IDs: `DOC-11223`, `DOC-22334`, `DOC-33445`, `DOC-44556`, `DOC-55667`).
- **CCCD Validation**: Patient sign-up and sign-in enforce a strict 12-digit format check for national ID numbers.

### 2. Client-Side Encryption & Zero-Trust PII Masking
- **Client-Side PII Masking**: Message streams scan and mask patient identifiable information (names, IDs, phone numbers) into `[MASKED_*]` tokens *prior* to external API transmission.
- **Dynamic Context Restoral**: Responses returning from external APIs containing `[MASKED_*]` tokens are reconstructed locally using a client-side token mapper before rendering.
- **AES-256-GCM Encrypted Bookings**: Patient names and CCCD IDs are encrypted in-browser before storing to the scheduling database, showing live encryption/decryption indicators.
- **Isolated Chat History**: Messages are saved in IndexedDB keyed by the active user's ID. Local React states are cleared synchronously upon login/logout to prevent cross-session history leakage.

### 3. AI Symptom Consultation & Confidence Cards
- **Dialogue History Memory**: The consultation interface tracks and transmits the full dialogue history context to the API endpoint, allowing the assistant to remember previous conversation turns (e.g., matching a patient's confirmation to book a clinical appointment).
- **Diagnostic Confidence Gauge**: Displays a diagnostic confidence rating (e.g. 96%) and references official clinical literature (e.g., WHO guidelines, American Heart Association, Ministry of Health) dynamically based on the matched medical department.
- **Clinical Safety Guardrails**: Restricts out-of-scope queries (non-medical topics), redirecting patients to health-related assistance. Triggers assertive emergency warning banners if high-risk cardiovascular symptoms are detected.

### 4. Doctor Dashboard & EMR Checkout
- **Clinical Queue**: Displays active booked patients with secure one-click decryption of name and CCCD ID details.
- **EMR Editor**: Supports symptoms record, diagnosis mapping, prescription, and simulated speech-to-text dictation.
- **Secure Checkout**: Completing EMR checkout logs out the patient and updates the database, utilizing the patient's assigned doctor ID to prevent database write conflicts.

### 5. Multi-Language Switcher (Bilingual)
- A global header language switcher allows instant toggle between 🇻🇳 **Tiếng Việt (VI)** and 🇬🇧 **English (EN)**, translating all user forms, onboarding flows, EMR reports, and alerts.

---

## 📂 Key File Structure

```bash
├── public/
│   └── logo.png                # Cropped transparent CareAgent robot mascot logo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── mediagent/
│   │   │   │   └── route.ts    # API route formatting dialogue memory for Gemini streaming
│   │   │   └── ...
│   │   ├── page.tsx            # Main Single-Page App portal containing UI layouts and states
│   │   └── ...
│   ├── components/
│   │   ├── doctor/
│   │   │   └── EMRForm.tsx     # EMR record drafting component
│   │   └── patient/
│   │       ├── BookingForm.tsx # Appointment scheduling forms
│   │       └── ...
│   ├── hooks/
│   │   └── useRealtimeSync.ts  # State broadcast sync across active tabs
│   ├── lib/
│   │   ├── aesGcm.ts           # Client-side AES-256-GCM cipher utility
│   │   └── secureDb.ts         # Multi-user isolated IndexedDB storage manager
│   ├── security/
│   │   ├── agentGuardrail.ts   # Medical clinical guardrail filters
│   │   ├── piiFilter.ts        # Regular-expression based PII masking engine
│   │   └── tokenMapper.ts      # Context mapper to decrypt masked tokens on client
│   └── store/
│       ├── useAuthStore.ts     # Zustand session storage persist store
│       └── useCalendarStore.ts # Centralized queue/appointment calendar store
├── vitest.setup.ts             # JSDOM local storage polyfills for vitest
└── package.json
```

---

## 🚀 How to Run Locally

### 1. Requirements
- Node.js 18+
- npm or yarn

### 2. Installation
Clone the repository and install the packages:
```bash
git clone https://github.com/pckhoa206/MediAgent.git
cd MediAgent
npm install
```

### 3. Setup Environment variables
Create a `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no API key is specified, the application automatically falls back to an SSE Mock simulation stream for all chat consults.*

### 4. Running the Development Server
Start the local server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Compiling for Production
Ensure code and types compile correctly:
```bash
npm run build
```

---

## 🧪 Running Automated Tests

We maintain a comprehensive suite of unit tests validating encryption, PII masking, guardrails, and calendar states.

Run the test suite:
```bash
npm test
```
Or run in watch mode:
```bash
npx vitest
```

# MediAgent

MediAgent is a medical concierge AI prototype focused on patient triage, doctor workflow, and secure client-side handling of sensitive health data.

## What changed in the Dev 2 upgrade

- Stronger appointment persistence through browser storage for booking and cancellation flows.
- Safer chat session storage by avoiding full message payload persistence in localStorage.
- A more realistic realtime sync layer using browser broadcast channels and calendar state changes.
- A more robust API client with automatic credentials handling and refresh-token-friendly request setup.
- Updated documentation for local development and testing.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Main routes

- /login
- /register
- /chat
- /patient/dashboard
- /doctor/dashboard

## Testing

```bash
npm test
```

## Notes

- Authentication is still mock-based for demo purposes.
- AI streaming can run in mock mode or with a real Gemini API key when configured.
- Sensitive patient data is masked client-side before being sent to external AI services.

# Coding Standards & DNA Rules for AI Agents

Welcome to the medical-grade AI Chatbot interface project. All code in this repository must conform to the strict standards detailed here to maintain security, accessibility, performance, and correctness.

## 1. Security & Zero-Trust PII Masking

- **No PII Transmission**: Patient Identifiable Information (PII) such as full names, phone numbers, and citizen identity numbers (CCCD/CMND) must never be sent to external LLM endpoints.
- **Client-Side Interception**: All messages must pass through the `piiFilter.ts` engine prior to api request dispatching.
- **Context Restoral (Token Mapper)**: Responses returned from public APIs containing `[MASKED_*]` tokens must be dynamically reconstructed using the local `tokenMapper.ts` before rendering in the DOM, preserving the user's personal context locally.
- **Encrypted Local Storage**: Transient chat state and token registries must be kept in encrypted stores (e.g. state-only in Zustand memory or AES-encrypted IndexedDB). Do not store cleartext PII in `localStorage` or `sessionStorage`.

## 2. Strict Typing (TypeScript)

- **No `any`**: Explicit type definitions are required for all objects, hooks, and functions. Use `unknown` with type guards if a type is genuinely variable.
- **Type Definitions**: All network payloads and component props must have corresponding TypeScript interfaces/types defined in `/types/` or co-located with their specific components.

## 3. Web Accessibility (WCAG 2.1 AA)

- **Semantic HTML**: Use native semantic HTML elements (`<main>`, `<section>`, `<article>`, `<nav>`).
- **Interactive Elements**: All buttons, inputs, and custom interactive cards must have descriptive `aria-label`, `aria-describedby`, or `role` attributes where applicable.
- **Focus Management**: Modals, alert dialogs, and newly injected alerts (such as the Triage Card) must manage focus correctly. Ensure the triage card utilizes `aria-live="assertive"` to immediately notify screen readers.
- **Colors**: Maintain a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text against background colors.

## 4. UI Rendering & Performance

- **Streaming Optimization**: When parsing Server-Sent Events (SSE), avoid triggering full component tree re-renders for every single token chunk. Batch stream state updates in Zustand.
- **Ref-based Scrolling**: Use React refs for auto-scroll containers rather than resetting state on every render, preventing input lag and scroll jitter.
- **Clean Styling**: Use TailwindCSS with Shadcn components. Adhere strictly to the established medical-grade theme (sober dark/light modes, accessible highlights, clear visual hierarchy).

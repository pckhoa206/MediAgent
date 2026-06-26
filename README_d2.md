#Technical Report — CONCIERGE MEDICAL AGENT

> 🇬🇧 **English** | 🇻🇳 **Tiếng Việt** (below)

---

## 🇬🇧 English

### Overview

This document describes all technical contributions made by **Developer 2**, focusing on system architecture, security, Mock API layer, AI-powered media features (Speech-to-EMR), and real-time sync simulation.

---

### 1. Architecture & Role-Based Security

- **`RoleGuard` (`src/components/security/RoleGuard.tsx`)**: A client-side Higher-Order Component implementing **Zero-Trust access control**. It wraps protected pages (`/patient/dashboard`, `/doctor/dashboard`) and reads the `role` field from the Zustand auth store. Any mismatch redirects to `/login` or `/unauthorized`.

- **`apiClient` (`src/services/apiClient.ts`)**: A wrapper around the native browser `fetch` API.
  - Automatically injects `Authorization: Bearer <token>` headers.
  - Catches **401 Unauthorized** responses and silently calls `/api/auth/refresh` to renew tokens without disrupting user experience.

---

### 2. Mock API Server (Next.js Serverless Route Handlers)

Built directly on Next.js App Router (`app/api/...`) — no MSW required, fully maintainable.

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Validates Citizen ID (CCCD) structure, checks for duplicates, saves user to in-memory store |
| `POST /api/auth/login` | Validates credentials, issues Access Token (JSON) + Refresh Token (HttpOnly Cookie) |
| `POST /api/auth/refresh` | Silently renews the Access Token using a valid Refresh Token |

- **`mockDb.ts`**: In-memory user registry. Stores full name, CCCD, DOB, gender, role, and Doctor ID so that registered names are correctly returned on login.
- **Duplicate detection**: Re-registering the same CCCD returns HTTP 409 Conflict.
- **Security**: Refresh Token is stored as an `HttpOnly` cookie — inaccessible to JavaScript, immune to XSS.

---

### 3. AI Agent & Media Features (Doctor Workspace)

- **Speech-to-EMR (`SpeechToTextRecorder.tsx`)**:
  - Integrates the **Web Speech API** (`window.SpeechRecognition`) for real-time, in-browser voice transcription.
  - Supports **bilingual input** — toggle between 🇬🇧 English (`en-US`) and 🇻🇳 Vietnamese (`vi-VN`) directly in the UI.
  - Falls back gracefully if the browser does not support the API.
  - Dynamic **Waveform animation** renders in sync with microphone activity.

- **Auto-save EMR (`EMRForm.tsx`)**:
  - Uses a **debounce pattern** (`useEffect` + `setTimeout`, 1.5s delay) to auto-save draft data to `localStorage` after the doctor stops typing.
  - Prevents data loss on accidental browser closure or power failure.

---

### 4. Client-side PII Protection

- **`piiHelper.ts` / `piiFilter.ts`**: Automatically scans and anonymises sensitive data before it is sent to any external AI model.
  - Masks phone numbers, Citizen ID numbers, and common Vietnamese name patterns (e.g., *Nguyễn Văn A* → `[MASKED_NAME_1]`).
  - A local mapping table allows the original data to be restored for internal display.
  - Integrated with `useChatStore.ts` for seamless chat experience.

---

### 5. Real-time Sync (Simulation)

- **`useRealtimeSync.ts`**: A React hook that simulates a WebSocket/SSE connection using `setInterval`. It periodically emits mock events (e.g., queue status updates) to keep the UI reactive — ready to be replaced with a real WebSocket endpoint in production.

---

### CCCD Validation Logic

Vietnam's Citizen Identity Card (CCCD) follows a strict 12-digit structure:
- Digits 1–3: Province/city code (001–096)
- Digit 4: Century code (0 = 1900s, 2 = 2000s) + gender (odd = male, even = female)
- Digits 5–12: Unique sequence

The registration form validates both the 12-digit length and the province code range, rejecting obviously fake IDs.

---

---

## 🇻🇳 Tiếng Việt

### Tổng quan

Tài liệu này mô tả chi tiết các đóng góp kỹ thuật của **Dev 2**, tập trung vào kiến trúc hệ thống, bảo mật phân quyền, tầng Mock API, tính năng AI Speech-to-EMR và mô phỏng đồng bộ thời gian thực.

---

### 1. Kiến trúc & Bảo mật Phân quyền (Role-based Security)

- **`RoleGuard` (`src/components/security/RoleGuard.tsx`)**: Component bảo vệ tuyến đường theo nguyên tắc **Zero-Trust**. Bọc các trang nhạy cảm như `/patient/dashboard` và `/doctor/dashboard`, kiểm tra `role` trong Zustand Store. Nếu không có quyền, hệ thống tự động redirect về `/login`.

- **`apiClient` (`src/services/apiClient.ts`)**: Bọc hàm `fetch` của trình duyệt.
  - Tự động gắn header `Authorization: Bearer <token>`.
  - Tự động bắt lỗi 401 và gọi ngầm `/api/auth/refresh` để lấy token mới, không làm gián đoạn trải nghiệm người dùng.

---

### 2. Mock API Server (Serverless Route Handlers)

Sử dụng trực tiếp Next.js App Router, không cần MSW, dễ bảo trì và mở rộng.

| Endpoint | Mô tả |
|---|---|
| `POST /api/auth/register` | Xác thực cấu trúc CCCD, kiểm tra trùng lặp, lưu user vào bộ nhớ tạm |
| `POST /api/auth/login` | Xác thực thông tin đăng nhập, cấp Access Token (JSON) + Refresh Token (HttpOnly Cookie) |
| `POST /api/auth/refresh` | Tự động gia hạn Access Token bằng Refresh Token hợp lệ |

- **`mockDb.ts`**: Registry in-memory lưu đầy đủ thông tin đăng ký (tên, CCCD, ngày sinh, giới tính, role, mã bác sĩ) để trả về đúng tên khi đăng nhập.
- **Phát hiện trùng lặp**: Đăng ký lại CCCD đã tồn tại trả về HTTP 409 Conflict.
- **Bảo mật**: Refresh Token lưu trong HttpOnly Cookie, JavaScript không thể đọc được, miễn nhiễm với tấn công XSS.

---

### 3. Tính năng AI Agent & Media (Không gian Bác sĩ)

- **Speech-to-EMR (`SpeechToTextRecorder.tsx`)**:
  - Tích hợp **Web Speech API** thực tế (`window.SpeechRecognition`) để chuyển giọng nói thành văn bản ngay trong trình duyệt.
  - Hỗ trợ **chuyển đổi ngôn ngữ** giữa 🇬🇧 Tiếng Anh (`en-US`) và 🇻🇳 Tiếng Việt (`vi-VN`) bằng nút toggle trong giao diện.
  - Tự động fallback nếu trình duyệt không hỗ trợ API.
  - Hiển thị **Sóng âm động** (waveform animation) khi đang thu âm.

- **Auto-save EMR (`EMRForm.tsx`)**:
  - Áp dụng kỹ thuật **Debounce** (`useEffect` + `setTimeout`, độ trễ 1.5 giây) để tự động lưu nháp vào `localStorage` sau khi bác sĩ ngừng nhập.
  - Tránh mất dữ liệu khi đóng trình duyệt đột ngột hoặc mất điện.

---

### 4. Bảo vệ Dữ liệu PII phía Client

- **`piiHelper.ts` / `piiFilter.ts`**: Tự động quét và ẩn danh dữ liệu nhạy cảm trước khi gửi ra mô hình AI bên ngoài.
  - Che số điện thoại, CCCD, và các dạng tên người Việt phổ biến (ví dụ: *Nguyễn Văn A* → `[MASKED_NAME_1]`).
  - Bảng ánh xạ nội bộ cho phép khôi phục dữ liệu gốc khi hiển thị trong giao diện.
  - Tích hợp vào `useChatStore.ts` để trải nghiệm chat liền mạch.

---

### 5. Đồng bộ Thời gian thực (Mô phỏng)

- **`useRealtimeSync.ts`**: Hook React mô phỏng kết nối WebSocket/SSE bằng `setInterval`, định kỳ bắn ra các sự kiện ảo (ví dụ: cập nhật hàng đợi) để UI luôn phản ứng linh hoạt — sẵn sàng thay thế bằng endpoint WebSocket thực tế khi triển khai production.

---

### Logic Xác thực CCCD

CCCD Việt Nam theo cấu trúc 12 chữ số:
- Chữ số 1–3: Mã tỉnh/thành phố (001–096)
- Chữ số 4: Mã thế kỷ + giới tính (lẻ = nam, chẵn = nữ)
- Chữ số 5–12: Số ngẫu nhiên duy nhất

Form đăng ký xác thực cả độ dài 12 chữ số lẫn phạm vi mã tỉnh, từ chối các CCCD giả rõ ràng.

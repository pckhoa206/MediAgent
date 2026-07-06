'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Settings, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Terminal as TerminalIcon, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  Server, 
  Cpu, 
  Play, 
  Trash2
} from 'lucide-react';

interface Endpoint {
  path: string;
  method: 'POST' | 'GET';
  description: string;
}

export default function BackendDashboard() {
  // Config States
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'MISSING' | 'SECURE'>('MISSING');
  
  // Module Toggles
  const [aesEnabled, setAesEnabled] = useState(false);
  const [indexedDbEnabled, setIndexedDbEnabled] = useState(false);
  const [strictModeEnabled, setStrictModeEnabled] = useState(true); // Default to true since we fixed it!

  // Terminal Simulator Logs
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Selected Endpoint to Test
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/chat/secure-stream');
  const [isTesting, setIsTesting] = useState(false);

  const endpoints: Endpoint[] = [
    { path: '/api/appointments/encrypt', method: 'POST', description: 'Encrypts cleartext patient identifiers (CCCD/Names) for calendar storage' },
    { path: '/api/chat/secure-stream', method: 'POST', description: 'Checks query guardrails and masks PII prior to streaming text' },
    { path: '/api/doctor/dashboard', method: 'GET', description: 'Loads doctor queue and patient appointments' }
  ];

  // Helper to add logs to terminal
  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [MEDIagent-Backend]`;
    let coloredLog = `${prefix} ${message}`;
    
    if (type === 'success') coloredLog = `🟢 ${prefix} ${message}`;
    else if (type === 'warn') coloredLog = `🟡 ${prefix} ${message}`;
    else if (type === 'error') coloredLog = `🔴 ${prefix} ${message}`;
    else coloredLog = `⚪ ${prefix} ${message}`;

    setLogs(prev => [...prev, coloredLog]);
  };

  // Scroll to bottom of terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Initial logs
  useEffect(() => {
    addLog("Initializing server components...");
    addLog("LLM_PROVIDER detected: Gemini Pro v1beta", 'success');
    addLog("ENCRYPTION_MODULE detected: Hardware-backed AES-GCM 256", 'info');
    addLog("Warning: No API_KEY configured. Fallback to Mock Mode enabled.", 'warn');
  }, []);

  // Save API Key
  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setApiKeyStatus('SECURE');
      addLog("API Key updated. Checking connection to generativelanguage.googleapis.com...", 'info');
      setTimeout(() => {
        addLog("API Connection test PASSED. Role: Gemini Developer Mode authorized.", 'success');
      }, 1000);
    } else {
      setApiKeyStatus('MISSING');
      addLog("API Key cleared. Fallback to internal Mock stream response.", 'warn');
    }
  };

  // Log module toggle changes
  const handleAesToggle = () => {
    const nextState = !aesEnabled;
    setAesEnabled(nextState);
    addLog(
      nextState 
        ? "AES-GCM Payload Encryption: [ACTIVE] - All client transmission payload will be encrypted."
        : "AES-GCM Payload Encryption: [INACTIVE] - Payloads sent in cleartext.",
      nextState ? 'success' : 'warn'
    );
  };

  const handleIndexedDbToggle = () => {
    const nextState = !indexedDbEnabled;
    setIndexedDbEnabled(nextState);
    addLog(
      nextState 
        ? "Secure Chat Logging: [ACTIVE] - Syncing chat logs with encrypted IndexedDB store."
        : "Secure Chat Logging: [INACTIVE] - Chats kept in transient state memory only.",
      nextState ? 'success' : 'warn'
    );
  };

  const handleStrictModeToggle = () => {
    const nextState = !strictModeEnabled;
    setStrictModeEnabled(nextState);
    addLog(
      nextState 
        ? "Next.js Build Fix Mode: [ACTIVE] - Strictly enforcing types and rendering checks."
        : "Next.js Build Fix Mode: [INACTIVE] - Disabling strict type-checks. Compiler warnings expected.",
      nextState ? 'info' : 'warn'
    );
  };

  // Test Endpoint request simulation
  const handleTestEndpoint = () => {
    setIsTesting(true);
    addLog(`POST Dispatch call to endpoint: ${selectedEndpoint}...`, 'info');

    setTimeout(() => {
      if (selectedEndpoint === '/api/chat/secure-stream') {
        const payload = {
          message: aesEnabled ? "[ENCRYPTED_PAYLOAD_HASH]" : "Tôi bị đau ngực trái lan ra tay",
          sessionId: "uuid-session-12345"
        };
        addLog(`Request payload: ${JSON.stringify(payload)}`, 'info');
        
        if (apiKeyStatus === 'MISSING') {
          addLog("Response from server (MOCK): Status 200 OK. Streaming chat tokens...", 'success');
        } else {
          addLog("Response from server (REAL-GEMINI): Status 200 OK. Streaming content parts...", 'success');
        }
      } else if (selectedEndpoint === '/api/appointments/encrypt') {
        if (aesEnabled) {
          addLog("AES-GCM module initialized. Encrypting CCCD '001200123456'...", 'info');
          addLog("Ciphertext generated: U2FsdGVkX1+QyM0hP0Qv...", 'success');
          addLog("IndexedDB put complete.", 'success');
        } else {
          addLog("Warning: Encryption disabled. Storing CCCD in cleartext!", 'warn');
          addLog("IndexedDB put complete.", 'success');
        }
      } else if (selectedEndpoint === '/api/doctor/dashboard') {
        if (!strictModeEnabled) {
          addLog("Server request crashed: Compile Error 'Type {} is not assignable to type ReactNode' on page.tsx:24", 'error');
        } else {
          addLog("Response from server: Status 200 OK. Queue items: 3 patients.", 'success');
        }
      }
      setIsTesting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden">
      
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950/80 px-6 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link 
            href="/chat"
            className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="Quay lại phòng chat"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-200 uppercase flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-400" />
              Backend Configuration & Simulation
            </h1>
            <p className="text-[10px] text-slate-500">Giả lập Endpoint, Quản lý Env Keys và Cấu hình máy chủ</p>
          </div>
        </div>
        <div className="text-xxs text-slate-500 font-mono">
          SERVER_HOST: localhost:3000
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Intro */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-400" />
            Bảng Cấu Hình & Giả Lập Server-side
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
            Trình quản lý này giả lập các biến môi trường (Environment Variables) trong tập tin `.env.local` 
            và luồng xử lý trên máy chủ Next.js API Routes. Cập nhật các switch để cấu hình mức độ bảo mật mã hóa dữ liệu đầu cuối.
          </p>
        </div>

        {/* Configurations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel - Configurations Form (Grid cols 5) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* Box 1: API Key Config */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  API Key Management
                </h3>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                  apiKeyStatus === 'SECURE' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-950 text-red-400 border border-red-500/20 animate-pulse'
                }`}>
                  {apiKeyStatus === 'SECURE' ? 'SECURE / AUTHORIZED' : 'CRITICAL: Key Missing'}
                </span>
              </div>

              <div className="space-y-3">
                <label className="text-xxs font-bold text-slate-500 block uppercase">Gemini API Key (GEMINI_API_KEY):</label>
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/40 pl-4 pr-10 py-3 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300"
                    aria-label={showApiKey ? "Hide key" : "Show key"}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Validate & Save Config
                </button>
                <p className="text-[9px] text-slate-500 leading-tight">
                  * Khóa API được lưu tạm trong bộ nhớ mô phỏng. Ở môi trường thật, vui lòng lưu tại tập tin <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-400 font-mono">.env.local</code> ở thư mục gốc.
                </p>
              </div>
            </div>

            {/* Box 2: Server Controls & Toggles */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                Backend Module Settings
              </h3>

              <div className="space-y-4">
                {/* Switch 1: AES-GCM Payload Encryption */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-900">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">AES-GCM Encryption</h4>
                    <p className="text-[10px] text-slate-500">Mã hóa các payload nhạy cảm ở client</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={aesEnabled}
                      onChange={handleAesToggle}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-slate-100"></div>
                  </label>
                </div>

                {/* Switch 2: Secure Chat Logging */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-900">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Secure Chat Logging (IndexedDB)</h4>
                    <p className="text-[10px] text-slate-500">Lưu trữ tin nhắn mã hóa dưới IndexedDB</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={indexedDbEnabled}
                      onChange={handleIndexedDbToggle}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-slate-100"></div>
                  </label>
                </div>

                {/* Switch 3: Strict Build Fix Mode */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-900">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Build Fix Mode (Strict Casting)</h4>
                    <p className="text-[10px] text-slate-500">Bật cơ chế ép kiểu an toàn ReactNode</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={strictModeEnabled}
                      onChange={handleStrictModeToggle}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-slate-100"></div>
                  </label>
                </div>

              </div>
            </div>

            {/* Box 3: Route Health Check Widget */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Route Health Check
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">/doctor/dashboard</span>
                  {strictModeEnabled ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      OPERATIONAL (PASS)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      CRITICAL FAIL (500)
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {strictModeEnabled 
                    ? "Tuyến đường an toàn. File page.tsx biên dịch tốt nhờ kiểu ép kiểu ReactNode."
                    : "Lỗi: Không tìm thấy khai báo client và ép kiểu, runtime ném lỗi 500."}
                </p>
              </div>
            </div>

          </div>

          {/* Right panel - Live Visualization & Terminal (Grid cols 7) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Box 4: Endpoint Testing Simulator */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                API Route Endpoint Tester
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Select Endpoint */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xxs font-bold text-slate-500 block uppercase">Chọn Endpoint thử nghiệm:</label>
                    <select
                      value={selectedEndpoint}
                      onChange={(e) => setSelectedEndpoint(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      {endpoints.map(e => (
                        <option key={e.path} value={e.path}>
                          [{e.method}] {e.path}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Test Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleTestEndpoint}
                      disabled={isTesting}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white shadow-md disabled:bg-slate-800 disabled:text-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                      {isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      Test Endpoint
                    </button>
                  </div>
                </div>

                {/* Endpoint Description */}
                <div className="bg-slate-900/30 border border-slate-900 p-3 rounded-xl text-xxs text-slate-400 leading-normal">
                  <strong>Mô tả tuyến đường: </strong> 
                  {endpoints.find(e => e.path === selectedEndpoint)?.description}
                </div>
              </div>
            </div>

            {/* Box 5: Live Terminal Output */}
            <div className="flex-1 rounded-2xl border border-slate-900 bg-slate-950 flex flex-col overflow-hidden min-h-[350px] shadow-2xl">
              {/* Terminal Title Bar */}
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-900 bg-slate-900/60 px-4">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xxs font-mono font-bold text-slate-400">SERVER LIVE LOG CONSOLE</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  title="Clear Terminal Logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Logs Stream */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic text-center pt-8">Console log is clean. Trigger settings or test an endpoint to view logs.</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed border-l-2 border-indigo-500/20 pl-2 text-slate-300 select-all">
                      {log}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center text-slate-600 text-[10px]">
        * Thiết kế phục vụ môi trường lập trình và gỡ lỗi nâng cao.
      </footer>

    </div>
  );
}

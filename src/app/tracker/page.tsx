'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Users, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Activity, 
  Database, 
  Key, 
  FileCode, 
  Sliders, 
  Play
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  complexity: 'Low' | 'Medium' | 'High';
  category: 'Build' | 'Security';
  progress: number; // 0 to 100
  resource: number; // 1 to 3 devs
  baseEffort: number; // in developer-days
}

export default function TrackerPage() {
  // 1. Initialize State for 3 Remediation Tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Fix Build Error (Doctor Dashboard)",
      description: "Thêm 'use client' vào trang Dashboard của Bác sĩ và sửa lỗi ép kiểu TypeScript tại page.tsx:24.",
      completed: false,
      complexity: "Low",
      category: "Build",
      progress: 0,
      resource: 1,
      baseEffort: 3,
    },
    {
      id: 2,
      title: "Appointment Encryption (AES-GCM/IndexedDB)",
      description: "Mã hóa tên và số căn cước công dân (CCCD) của bệnh nhân bằng AES-256-GCM trước khi lưu xuống bộ nhớ cục bộ.",
      completed: false,
      complexity: "High",
      category: "Security",
      progress: 0,
      resource: 1,
      baseEffort: 12,
    },
    {
      id: 3,
      title: "Secure Chat IndexedDB Integration",
      description: "Tích hợp secureDb.ts để mã hóa và lưu lịch sử chat vào IndexedDB, tránh mất dữ liệu khi reload/session refresh.",
      completed: false,
      complexity: "Medium",
      category: "Security",
      progress: 0,
      resource: 1,
      baseEffort: 6,
    }
  ]);

  // Filters State
  const [complexityFilter, setComplexityFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Build' | 'Security'>('All');

  // 2. Handle Inputs & Updates
  const handleProgressChange = (id: number, val: number) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? { ...t, progress: val, completed: val === 100 } : t)
    );
  };

  const handleResourceChange = (id: number, devs: number) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? { ...t, resource: devs } : t)
    );
  };

  // Helper to trigger fast simulation progress
  const autoCompleteTask = (id: number) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? { ...t, progress: 100, completed: true } : t)
    );
  };

  // 3. Real-Time Dynamic Calculations
  const t1 = tasks[0];
  const t2 = tasks[1];
  const t3 = tasks[2];

  // ETA Calculation: Remaining Effort = Base Effort * (1 - Progress/100) / Devs
  const t1Eta = (t1.baseEffort * (1 - t1.progress / 100)) / t1.resource;
  const t2Eta = (t2.baseEffort * (1 - t2.progress / 100)) / t2.resource;
  const t3Eta = (t3.baseEffort * (1 - t3.progress / 100)) / t3.resource;
  const totalRemainingEta = t1Eta + t2Eta + t3Eta;

  // System Security Score: Starts at 40%, scales to 100% when security tasks are complete
  const securityScore = Math.round(
    40 + (30 * t2.progress) / 100 + (30 * t3.progress) / 100
  );

  let securityStatus: 'VULNERABLE' | 'PARTIALLY_SECURED' | 'SECURED' = 'VULNERABLE';
  if (securityScore === 100) {
    securityStatus = 'SECURED';
  } else if (securityScore >= 60) {
    securityStatus = 'PARTIALLY_SECURED';
  }

  // Build Status
  const isBuildSuccess = t1.progress === 100;
  const buildStatusText = isBuildSuccess
    ? "SUCCESS"
    : "FAILED (Missing 'use client' / Type Casting Error)";

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesComplexity = complexityFilter === 'All' || t.complexity === complexityFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesComplexity && matchesCategory;
  });

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
              <Activity className="h-4 w-4 text-indigo-400" />
              Remediation Tracker
            </h1>
            <p className="text-[10px] text-slate-500">Mô phỏng & Đánh giá quá trình nâng cấp hệ thống</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xxs text-slate-500 font-mono hidden sm:inline">VIBECODING DAY 2</span>
          <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-xxs font-semibold text-indigo-400">
            Active Simulator
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Intro Banner */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-400" />
            Môi Trường Mô Phỏng Khắc Phục Lỗi Hệ Thống
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            Sử dụng các thanh trượt và nút phân bổ lập trình viên để cập nhật tiến trình sửa lỗi của dự án. 
            Các thông số KPIs, trạng thái biên dịch dự án và bản đồ luồng dữ liệu y tế sẽ tự động tính toán và cập nhật thời gian thực.
          </p>
        </div>

        {/* Overview Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Build Status */}
          <div className={`rounded-2xl border p-5 space-y-3 transition-all ${
            isBuildSuccess 
              ? 'border-emerald-500/20 bg-emerald-950/5 shadow-emerald-950/20 shadow-lg' 
              : 'border-red-500/20 bg-red-950/5 shadow-red-950/20 shadow-lg animate-pulse-subtle'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Trạng Thái Biên Dịch</span>
              {isBuildSuccess ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-red-400 animate-pulse" />
              )}
            </div>
            <div className="space-y-1">
              <div className={`text-lg font-extrabold tracking-tight ${
                isBuildSuccess ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {buildStatusText}
              </div>
              <p className="text-xxs text-slate-500 leading-tight">
                {isBuildSuccess 
                  ? "Đã khắc phục lỗi 'use client' và ép kiểu TypeScript thành công." 
                  : "Cần hoàn thành việc sửa lỗi dashboard bác sĩ (Task 1) để build."}
              </p>
            </div>
          </div>

          {/* Card 2: Security Score */}
          <div className={`rounded-2xl border p-5 space-y-3 transition-all ${
            securityStatus === 'SECURED'
              ? 'border-emerald-500/20 bg-emerald-950/5 shadow-emerald-950/20 shadow-lg'
              : securityStatus === 'PARTIALLY_SECURED'
              ? 'border-amber-500/20 bg-amber-950/5'
              : 'border-red-500/20 bg-red-950/5'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Điểm Bảo Mật Hệ Thống</span>
              {securityStatus === 'SECURED' ? (
                <Lock className="h-5 w-5 text-emerald-400" />
              ) : (
                <Unlock className="h-5 w-5 text-red-400 animate-bounce-slow" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${
                  securityStatus === 'SECURED' 
                    ? 'text-emerald-400' 
                    : securityStatus === 'PARTIALLY_SECURED' 
                    ? 'text-amber-400' 
                    : 'text-red-400'
                }`}>
                  {securityScore}%
                </span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  securityStatus === 'SECURED' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' 
                    : securityStatus === 'PARTIALLY_SECURED' 
                    ? 'bg-amber-950 text-amber-400 border border-amber-500/20' 
                    : 'bg-red-950 text-red-400 border border-red-500/20'
                }`}>
                  {securityStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xxs text-slate-500 leading-tight">
                {securityStatus === 'SECURED'
                  ? "Dữ liệu y tế & lịch sử chat đã được mã hóa lưu trữ hoàn toàn."
                  : securityStatus === 'PARTIALLY_SECURED'
                  ? "Dữ liệu bắt đầu được mã hóa, vẫn còn lỗ hổng rò rỉ cục bộ."
                  : "Cảnh báo: Dữ liệu nhạy cảm lưu dạng rõ (Cleartext) trong localStorage."}
              </p>
            </div>
          </div>

          {/* Card 3: Remaining ETA */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Thời Gian Hoàn Thành (ETA)</span>
              <Clock className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-100">
                {totalRemainingEta === 0 ? 'COMPLETED' : `${totalRemainingEta.toFixed(1)} ngày`}
              </div>
              <p className="text-xxs text-slate-500 leading-tight">
                {totalRemainingEta === 0 
                  ? "Hệ thống đã khắc phục hoàn toàn mọi vấn đề kỹ thuật."
                  : "ETA giảm khi tăng thêm nguồn lực Dev hoặc đẩy nhanh tiến độ."}
              </p>
            </div>
          </div>

        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Filter by Complexity */}
            <div className="flex items-center gap-2">
              <span className="text-xxs text-slate-500 font-bold uppercase">Độ Phức Tạp:</span>
              <div className="flex gap-1.5">
                {['All', 'High', 'Medium', 'Low'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setComplexityFilter(c as any)}
                    className={`px-2.5 py-1 text-xxs rounded-lg font-semibold border transition-all ${
                      complexityFilter === c
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-2">
              <span className="text-xxs text-slate-500 font-bold uppercase">Loại Task:</span>
              <div className="flex gap-1.5">
                {['All', 'Build', 'Security'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat as any)}
                    className={`px-2.5 py-1 text-xxs rounded-lg font-semibold border transition-all ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="text-xxs text-indigo-400 font-mono">
            Hiển thị: {filteredTasks.length} / 3 tasks
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            return (
              <div 
                key={task.id} 
                className={`rounded-2xl border bg-slate-950 p-5 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-all shadow-xl relative ${
                  task.completed ? 'border-emerald-500/20' : 'border-slate-900'
                }`}
              >
                {/* Task Ribbon Indicator */}
                {task.completed && (
                  <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black tracking-wide uppercase shadow">
                    DONE
                  </div>
                )}

                {/* Card Title & Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      task.complexity === 'High' 
                        ? 'bg-red-950/40 text-red-400 border border-red-500/10' 
                        : task.complexity === 'Medium' 
                        ? 'bg-amber-950/40 text-amber-400 border border-amber-500/10' 
                        : 'bg-sky-950/40 text-sky-400 border border-sky-500/10'
                    }`}>
                      {task.complexity} Complexity
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {task.category}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-100 leading-snug">{task.title}</h3>
                  <p className="text-xxs text-slate-400 leading-relaxed">{task.description}</p>
                </div>

                {/* Progress & Sliders Controls */}
                <div className="space-y-4 pt-2 border-t border-slate-900">
                  
                  {/* Progress Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xxs font-bold text-slate-500">
                      <span>TIẾN ĐỘ:</span>
                      <span className={`${task.completed ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {task.progress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={task.progress}
                        onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                        className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-100 ${
                          task.progress === 100 
                            ? 'bg-emerald-500' 
                            : task.progress > 50 
                            ? 'bg-indigo-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Resource Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xxs font-bold text-slate-500">
                      <span>DEV ALLOCATION:</span>
                      <span className="text-slate-300 flex items-center gap-1 font-mono">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {task.resource} Dev{task.resource > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleResourceChange(task.id, num)}
                          className={`py-1.5 text-xxs font-bold rounded-lg transition-all border ${
                            task.resource === num
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                              : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-800'
                          }`}
                        >
                          {num} Dev
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Instant Actions */}
                <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Effort: <span className="font-semibold text-slate-400 font-mono">{task.baseEffort} dev-days</span>
                  </span>
                  {!task.completed && (
                    <button
                      onClick={() => autoCompleteTask(task.id)}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Auto-Complete
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Dynamic Architectural Flow Chart */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Bản đồ Luồng Dữ Liệu Y Tế Cục Bộ (Medical Data Flow)
            </h3>
            <span className="text-[10px] text-slate-500 italic">Mô phỏng trạng thái truyền tải dữ liệu y tế thực tế</span>
          </div>

          <div className="flex flex-col gap-6 md:gap-4 md:flex-row md:items-center justify-between p-4 bg-slate-900/20 rounded-xl border border-slate-900 relative">
            
            {/* Step 1: User Chat Input */}
            <div className="flex-1 rounded-xl p-4 bg-slate-900 border border-slate-800/80 space-y-2 text-center relative">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileCode className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Patient Input</h4>
              <p className="text-[9px] text-slate-500 leading-normal">
                Bệnh nhân nhập triệu chứng kèm PII (Tên, SĐT, CCCD)
              </p>
              
              {/* Status Badge */}
              <div className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/15">
                piiFilter.ts ACTIVE
              </div>
            </div>

            {/* Arrow Connector 1 */}
            <div className="flex justify-center md:flex-initial text-slate-700 font-black animate-pulse">
              ➔
            </div>

            {/* Step 2: Public LLM Transmission */}
            <div className={`flex-1 rounded-xl p-4 border transition-all space-y-2 text-center ${
              isBuildSuccess 
                ? 'bg-slate-900 border-slate-800' 
                : 'bg-red-950/10 border-red-500/20 animate-pulse'
            }`}>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Public LLM Stream</h4>
              <p className="text-[9px] text-slate-500 leading-normal">
                Truyền tải chuỗi Masked PII lên máy chủ Gemini API
              </p>
              
              {/* Status Badge */}
              <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                isBuildSuccess
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/15'
                  : 'bg-red-950 text-red-400 border border-red-500/15'
              }`}>
                {isBuildSuccess ? "BUILD SUCCESS" : "BUILD BLOCKED"}
              </div>
            </div>

            {/* Arrow Connector 2 */}
            <div className="flex justify-center md:flex-initial text-slate-700 font-black animate-pulse">
              ➔
            </div>

            {/* Step 3: Local Storage (Calendar) */}
            <div className={`flex-1 rounded-xl p-4 border transition-all space-y-2 text-center ${
              t2.progress === 100 
                ? 'bg-slate-900 border-emerald-500/30' 
                : 'bg-red-950/10 border-red-500/20'
            }`}>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {t2.progress === 100 ? (
                  <Lock className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Unlock className="h-4 w-4 text-red-400 animate-pulse" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-200">Calendar Storage</h4>
              <p className="text-[9px] text-slate-500 leading-normal">
                Lưu trữ lịch khám trong localStorage
              </p>
              
              {/* Status Badge */}
              <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                t2.progress === 100
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/15'
                  : 'bg-red-950 text-red-400 border border-red-500/15'
              }`}>
                {t2.progress === 100 ? "AES-256 ENCRYPTED" : "CLEARTEXT LEAK"}
              </div>
            </div>

            {/* Arrow Connector 3 */}
            <div className="flex justify-center md:flex-initial text-slate-700 font-black animate-pulse">
              ➔
            </div>

            {/* Step 4: Chat Database Storage */}
            <div className={`flex-1 rounded-xl p-4 border transition-all space-y-2 text-center ${
              t3.progress === 100 
                ? 'bg-slate-900 border-emerald-500/30' 
                : 'bg-red-950/10 border-red-500/20'
            }`}>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Key className="h-4 w-4 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Secure Chat DB</h4>
              <p className="text-[9px] text-slate-500 leading-normal">
                Đồng bộ hóa tin nhắn vào IndexedDB
              </p>
              
              {/* Status Badge */}
              <div className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                t3.progress === 100
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/15'
                  : 'bg-red-950 text-red-400 border border-red-500/15'
              }`}>
                {t3.progress === 100 ? "SECURE DB SYNCED" : "TRANSIENT ONLY (NO PERSIST)"}
              </div>
            </div>

          </div>
        </div>

      </main>
      
      {/* Footer Disclaimer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center text-slate-600 text-[10px]">
        * Đây là môi trường giả lập (Simulation) dùng để phân tích bảo mật & chất lượng phần mềm MediAgent.
      </footer>

    </div>
  );
}

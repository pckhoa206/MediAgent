'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, ScrollText, Activity, RefreshCw } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId: string | null;
  role: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
}

interface AdminUser {
  cccd: string;
  fullName: string;
  role: string;
  isActive?: boolean;
  doctorId?: string;
}

export default function AdminPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditRes, usersRes] = await Promise.all([
        fetch('/api/audit-logs?limit=20'),
        fetch('/api/admin/users'),
      ]);
      const auditData = await auditRes.json();
      const userData = await usersRes.json();
      setLogs(auditData.auditLogs || []);
      setUsers(Object.values(userData.users || {}) as AdminUser[]);
    } catch {
      setLogs([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <div>
              <h1 className="text-xl font-semibold">Admin Console</h1>
              <p className="text-sm text-slate-400">Quản lý người dùng và theo dõi audit log.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-medium">Người dùng</h2>
              </div>
              <button onClick={() => void loadData()} className="rounded-lg border border-slate-700 p-2 text-slate-300">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.cccd} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium">{user.fullName || user.cccd}</p>
                      <p className="text-sm text-slate-400">{user.role} • {user.cccd}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${user.isActive === false ? 'bg-rose-900 text-rose-300' : 'bg-emerald-900 text-emerald-300'}`}>
                      {user.isActive === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && users.length === 0 && <p className="text-sm text-slate-500">Không có dữ liệu người dùng.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-4 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-medium">Audit Log</h2>
            </div>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{log.action}</p>
                    <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-400">{log.resource} • {log.role} • {log.ipAddress}</p>
                </div>
              ))}
              {!loading && logs.length === 0 && <p className="text-sm text-slate-500">Không có log nào.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

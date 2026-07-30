import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, AlertTriangle, Sparkles, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

export const AdminUsersDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/users/dashboard');
      if (res && res.ok) {
        setUsers(res.users || []);
      } else {
        setError(res?.error || 'Failed to fetch User Registry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching User Registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAiAsk = (prompt: string) => {
    toast.success(`AI Admin Query: "${prompt}" dispatched`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1700px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nexus-sf p-6 rounded-2xl border border-nexus-border shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-nexus-muted uppercase tracking-wider mb-1">
            <span>Workspace</span> / <span>Administration</span> / <span className="text-nexus-pur">Enterprise Users</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-nexus-white tracking-wide flex items-center gap-2.5">
            <Users className="text-nexus-pur" size={26} />
            Enterprise User Management & Security Controls
          </h1>
          <p className="text-xs text-nexus-muted mt-1">Multi-tenant user registry, MFA enforcement, roles, sessions, and trading permissions.</p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button onClick={() => toast.success("Exported Users Audit Log")} className="px-3.5 py-2 bg-nexus-bg hover:bg-nexus-bg2 text-nexus-text text-xs font-bold rounded-xl border border-nexus-border flex items-center gap-1.5 cursor-pointer">
            <Download size={14} /> Export Users
          </button>
          <button onClick={fetchUsers} disabled={loading} className="px-4 py-2 bg-nexus-pur text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-nexus-pur/20">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-xl bg-nexus-sf border border-nexus-border overflow-hidden flex flex-col shadow-xl">
            <div className="p-3.5 border-b border-nexus-border flex items-center justify-between bg-nexus-bg2/40">
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">Enterprise Users ({users.length})</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-nexus-muted text-xs animate-pulse">Loading user registry...</div>
            ) : error ? (
              <div className="p-4 text-center text-rose-400 text-xs flex items-center justify-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-nexus-border text-[10px] font-bold uppercase text-nexus-muted bg-nexus-bg/50 select-none">
                      <th className="p-2.5">User</th>
                      <th className="p-2.5">Organization</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5 text-center">MFA</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-border/30">
                    {users.map((u, i) => (
                      <tr key={i} className="hover:bg-nexus-bg2/60 transition cursor-pointer">
                        <td className="p-2.5 font-bold text-nexus-white">{u.name}<span className="text-[10px] text-nexus-muted block">{u.email}</span></td>
                        <td className="p-2.5 text-nexus-muted">{u.org}</td>
                        <td className="p-2.5 font-bold text-nexus-pur">{u.role}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-400">{u.mfa}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-400">{u.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-nexus-sf border border-nexus-border flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-nexus-border/50 pb-2">
              <Sparkles size={16} className="text-nexus-pur" />
              <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">AI User Security Assistant</span>
            </div>
            <button onClick={() => handleAiAsk("Audit user security risk scores")} className="w-full text-left p-2 bg-nexus-bg hover:bg-nexus-bg2 text-[11px] font-bold text-nexus-pur rounded-lg border border-nexus-pur/30 transition cursor-pointer">
              🤖 Audit Security Risk Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

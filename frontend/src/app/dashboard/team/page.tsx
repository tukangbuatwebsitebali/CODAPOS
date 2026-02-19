'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, X, Shield, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { userAPI } from '@/lib/api';
import type { User } from '@/types';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'bg-red-500/20 text-red-400' },
    owner: { label: 'Owner', color: 'bg-amber-500/20 text-amber-400' },
    admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400' },
    finance: { label: 'Finance', color: 'bg-emerald-500/20 text-emerald-400' },
    outlet_manager: { label: 'Manager', color: 'bg-blue-500/20 text-blue-400' },
    cashier: { label: 'Kasir', color: 'bg-white/10 text-white/60' },
};

export default function TeamPage() {
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [form, setForm] = useState({
        email: '', full_name: '', phone: '', role: 'cashier', temp_password: '',
    });
    const [editingRole, setEditingRole] = useState<string | null>(null);

    const loadTeam = useCallback(async () => {
        try {
            setLoading(true);
            const res = await userAPI.getTeam();
            // Filter out super_admin — they are global admins, not team members
            const all = (res.data.data || []) as User[];
            setMembers(all.filter(u => u.role !== 'super_admin'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTeam(); }, [loadTeam]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.full_name || !form.temp_password) return;
        try {
            await userAPI.invite(form);
            setForm({ email: '', full_name: '', phone: '', role: 'cashier', temp_password: '' });
            setShowInvite(false);
            loadTeam();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await userAPI.updateRole(userId, newRole);
            setEditingRole(null);
            loadTeam();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggle = async (userId: string) => {
        try {
            await userAPI.toggleActive(userId);
            loadTeam();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-900/20">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Kelola Tim</h1>
                        <p className="text-sm text-white/50">{members.length} anggota tim</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowInvite(!showInvite)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/30"
                >
                    {showInvite ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {showInvite ? 'Batal' : 'Undang'}
                </button>
            </div>

            {/* Invite Form */}
            {showInvite && (
                <form onSubmit={handleInvite} className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-[#1DA1F2]" />
                        Undang Anggota Baru
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Nama Lengkap *"
                            value={form.full_name}
                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                            required
                        />
                        <input
                            placeholder="Email *"
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                            required
                        />
                        <input
                            placeholder="No. Telepon"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                        />
                        <input
                            placeholder="Password Sementara *"
                            type="password"
                            value={form.temp_password}
                            onChange={e => setForm({ ...form, temp_password: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/50 mb-2">Role</label>
                        <select
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#1DA1F2]/50 w-full md:w-auto"
                        >
                            <option value="admin" className="bg-[#1a1a2e]">Admin</option>
                            <option value="finance" className="bg-[#1a1a2e]">Finance</option>
                            <option value="outlet_manager" className="bg-[#1a1a2e]">Outlet Manager</option>
                            <option value="cashier" className="bg-[#1a1a2e]">Kasir</option>
                        </select>
                    </div>
                    <button type="submit" className="px-6 py-2.5 bg-[#1DA1F2] text-white text-sm font-medium rounded-xl hover:bg-[#1DA1F2]/80 transition-colors">
                        Undang
                    </button>
                </form>
            )}

            {/* Team List */}
            {loading ? (
                <div className="glass-card p-12 text-center text-white/50">Memuat data...</div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-4 text-sm font-medium text-white/60">Anggota</th>
                                <th className="text-left p-4 text-sm font-medium text-white/60">Email</th>
                                <th className="text-left p-4 text-sm font-medium text-white/60">Role</th>
                                <th className="text-left p-4 text-sm font-medium text-white/60">Status</th>
                                <th className="text-left p-4 text-sm font-medium text-white/60">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => {
                                const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.cashier;
                                return (
                                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center text-white text-sm font-bold">
                                                    {member.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{member.full_name}</p>
                                                    {member.phone && (
                                                        <p className="text-xs text-white/40">{member.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-white/70">{member.email}</td>
                                        <td className="p-4">
                                            {editingRole === member.id && member.role !== 'owner' ? (
                                                <select
                                                    value={member.role}
                                                    onChange={e => handleRoleChange(member.id, e.target.value)}
                                                    onBlur={() => setEditingRole(null)}
                                                    autoFocus
                                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                                                >
                                                    <option value="admin" className="bg-[#1a1a2e]">Admin</option>
                                                    <option value="finance" className="bg-[#1a1a2e]">Finance</option>
                                                    <option value="outlet_manager" className="bg-[#1a1a2e]">Manager</option>
                                                    <option value="cashier" className="bg-[#1a1a2e]">Kasir</option>
                                                </select>
                                            ) : (
                                                <button
                                                    onClick={() => member.role !== 'owner' && setEditingRole(member.id)}
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${roleInfo.color} ${member.role !== 'owner' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                                                        }`}
                                                >
                                                    <Shield className="w-3 h-3" />
                                                    {roleInfo.label}
                                                    {member.role !== 'owner' && <ChevronDown className="w-3 h-3" />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs ${member.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {member.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {member.role !== 'owner' && (
                                                <button
                                                    onClick={() => handleToggle(member.id)}
                                                    className="transition-colors"
                                                    title={member.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                >
                                                    {member.is_active ? (
                                                        <ToggleRight className="w-6 h-6 text-green-400" />
                                                    ) : (
                                                        <ToggleLeft className="w-6 h-6 text-red-400" />
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {members.length === 0 && (
                        <div className="p-8 text-center text-white/40">Belum ada anggota tim</div>
                    )}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Store, ToggleLeft, ToggleRight, Percent, Zap, Settings2, Users, ChevronRight, Lock, CreditCard, Save, CheckCircle, AlertTriangle, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import { superAdminAPI } from '@/lib/api';
import type { Tenant, MerchantType, FeatureFlag, GlobalConfig, RolePermission } from '@/types';

type Tab = 'merchants' | 'types' | 'config' | 'roles' | 'payment';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>('merchants');
    const [merchants, setMerchants] = useState<Tenant[]>([]);
    const [merchantTypes, setMerchantTypes] = useState<MerchantType[]>([]);
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [configs, setConfigs] = useState<GlobalConfig[]>([]);
    const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // RBAC state
    const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
    const [rolesList, setRolesList] = useState<string[]>([]);
    const [actionsList, setActionsList] = useState<string[]>([]);
    const [roleLabels, setRoleLabels] = useState<Record<string, string>>({});
    const [actionLabels, setActionLabels] = useState<Record<string, string>>({});
    const [togglingPerm, setTogglingPerm] = useState<string | null>(null);

    // Midtrans state
    const [midtransMode, setMidtransMode] = useState<'sandbox' | 'production'>('sandbox');
    const [midtransMerchantId, setMidtransMerchantId] = useState('');
    const [midtransClientKey, setMidtransClientKey] = useState('');
    const [midtransServerKey, setMidtransServerKey] = useState('');
    const [savingMidtrans, setSavingMidtrans] = useState(false);
    const [midtransMsg, setMidtransMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // CRUD state for merchants
    const [editingMerchant, setEditingMerchant] = useState<Tenant | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', slug: '', subdomain: '', subscription_plan: '',
        open_time: '', close_time: '', merchant_type_id: '', revenue_share_pct: '',
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Tenant | null>(null);

    const loadMerchants = useCallback(async () => {
        try {
            const res = await superAdminAPI.getMerchants();
            setMerchants(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) { console.error(err); }
    }, []);

    const loadMerchantTypes = useCallback(async () => {
        try {
            const res = await superAdminAPI.getMerchantTypes();
            setMerchantTypes(res.data.data || []);
        } catch (err) { console.error(err); }
    }, []);

    const loadConfigs = useCallback(async () => {
        try {
            const res = await superAdminAPI.getConfigs();
            setConfigs(res.data.data || []);
        } catch (err) { console.error(err); }
    }, []);

    const loadRolePermissions = useCallback(async () => {
        try {
            const res = await superAdminAPI.getRolePermissions();
            setRolePerms(res.data.data || []);
            setRolesList(res.data.roles || []);
            setActionsList(res.data.actions || []);
            setRoleLabels(res.data.role_labels || {});
            setActionLabels(res.data.action_labels || {});
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        setLoading(true);
        if (activeTab === 'merchants') {
            Promise.all([loadMerchants(), loadMerchantTypes()]).finally(() => setLoading(false));
        }
        else if (activeTab === 'types') loadMerchantTypes().finally(() => setLoading(false));
        else if (activeTab === 'config') loadConfigs().finally(() => setLoading(false));
        else if (activeTab === 'roles') loadRolePermissions().finally(() => setLoading(false));
        else if (activeTab === 'payment') loadMidtransConfig().finally(() => setLoading(false));
    }, [activeTab, loadMerchants, loadMerchantTypes, loadConfigs, loadRolePermissions]);

    const loadMidtransConfig = async () => {
        try {
            const res = await superAdminAPI.getConfigs();
            const cfgs: GlobalConfig[] = res.data.data || [];
            const findVal = (key: string) => cfgs.find(c => c.key === key)?.value || '';
            setMidtransMode((findVal('midtrans_mode') || 'sandbox') as 'sandbox' | 'production');
            setMidtransMerchantId(findVal('midtrans_merchant_id'));
            setMidtransClientKey(findVal('midtrans_client_key'));
            setMidtransServerKey(findVal('midtrans_server_key'));
        } catch (err) { console.error(err); }
    };

    const handleSaveMidtrans = async () => {
        setSavingMidtrans(true);
        setMidtransMsg(null);
        try {
            await Promise.all([
                superAdminAPI.setConfig('midtrans_mode', midtransMode, 'Midtrans environment: sandbox atau production'),
                superAdminAPI.setConfig('midtrans_merchant_id', midtransMerchantId, 'Midtrans Merchant ID'),
                superAdminAPI.setConfig('midtrans_client_key', midtransClientKey, 'Midtrans Client Key'),
                superAdminAPI.setConfig('midtrans_server_key', midtransServerKey, 'Midtrans Server Key'),
            ]);
            setMidtransMsg({ type: 'success', text: 'Konfigurasi Midtrans berhasil disimpan! ✅' });
        } catch {
            setMidtransMsg({ type: 'error', text: 'Gagal menyimpan konfigurasi Midtrans' });
        } finally {
            setSavingMidtrans(false);
        }
    };

    const handleToggle = async (id: string, currentEnabled: boolean) => {
        try {
            await superAdminAPI.toggleMerchant(id, !currentEnabled);
            loadMerchants();
        } catch (err) { console.error(err); }
    };

    const handleLoadFeatures = async (merchantId: string) => {
        try {
            setSelectedMerchant(merchantId);
            const res = await superAdminAPI.getFeatureFlags(merchantId);
            setFeatureFlags(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleToggleFeature = async (featureKey: string, enabled: boolean) => {
        if (!selectedMerchant) return;
        try {
            await superAdminAPI.toggleFeatureFlag(selectedMerchant, featureKey, !enabled);
            handleLoadFeatures(selectedMerchant);
        } catch (err) { console.error(err); }
    };

    const handleEnableAll = async () => {
        if (!selectedMerchant) return;
        try {
            await superAdminAPI.enableAllFeatures(selectedMerchant);
            handleLoadFeatures(selectedMerchant);
        } catch (err) { console.error(err); }
    };

    // === CRUD handlers ===
    const openEditModal = (m: Tenant) => {
        setEditingMerchant(m);
        setEditForm({
            name: m.name,
            slug: m.slug,
            subdomain: m.subdomain,
            subscription_plan: m.subscription_plan,
            open_time: m.open_time || '09:00',
            close_time: m.close_time || '17:00',
            merchant_type_id: m.merchant_type_id || '',
            revenue_share_pct: String(m.revenue_share_pct ?? 10),
        });
        setEditMsg(null);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingMerchant) return;
        setSavingEdit(true);
        setEditMsg(null);
        try {
            // Update merchant details
            await superAdminAPI.updateMerchant(editingMerchant.id, {
                name: editForm.name,
                slug: editForm.slug,
                subdomain: editForm.subdomain,
                subscription_plan: editForm.subscription_plan,
                open_time: editForm.open_time,
                close_time: editForm.close_time,
                merchant_type_id: editForm.merchant_type_id || null,
            });
            // Update revenue share separately
            const pct = parseFloat(editForm.revenue_share_pct);
            if (!isNaN(pct)) {
                await superAdminAPI.updateRevenueShare(editingMerchant.id, pct);
            }
            setEditMsg({ type: 'success', text: 'Merchant berhasil diupdate! ✅' });
            loadMerchants();
            setTimeout(() => { setShowEditModal(false); setEditMsg(null); }, 1000);
        } catch {
            setEditMsg({ type: 'error', text: 'Gagal mengupdate merchant' });
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await superAdminAPI.deleteMerchant(id);
            loadMerchants();
            setConfirmDelete(null);
        } catch (err) { console.error(err); }
        finally { setDeletingId(null); }
    };

    const isPermAllowed = (role: string, action: string): boolean => {
        const perm = rolePerms.find(p => p.role === role && p.action === action);
        return perm?.is_allowed ?? false;
    };

    const handleTogglePermission = async (role: string, action: string) => {
        const key = `${role}-${action}`;
        setTogglingPerm(key);
        try {
            const current = isPermAllowed(role, action);
            await superAdminAPI.setRolePermission(role, action, !current);
            // Update local state optimistically
            setRolePerms(prev =>
                prev.map(p =>
                    p.role === role && p.action === action
                        ? { ...p, is_allowed: !current }
                        : p
                )
            );
        } catch (err) {
            console.error(err);
            loadRolePermissions(); // re-sync on error
        } finally {
            setTogglingPerm(null);
        }
    };

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'merchants', label: 'Merchants', icon: <Store className="w-4 h-4" /> },
        { key: 'types', label: 'Tipe Merchant', icon: <Settings2 className="w-4 h-4" /> },
        { key: 'config', label: 'Global Config', icon: <Settings2 className="w-4 h-4" /> },
        { key: 'roles', label: 'Role Akses', icon: <Lock className="w-4 h-4" /> },
        { key: 'payment', label: 'Pembayaran', icon: <CreditCard className="w-4 h-4" /> },
    ];

    const planOptions = ['free_trial', 'free-basic', 'starter', 'pro', 'enterprise'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Super Admin</h1>
                    <p className="text-sm text-white/50">Kelola merchant, tipe usaha, fitur, dan konfigurasi global</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setSelectedMerchant(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-[#1DA1F2] text-white shadow-lg shadow-blue-900/30'
                            : 'glass-card text-white/70 hover:text-white'
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="glass-card p-12 text-center text-white/50">Memuat data...</div>
            ) : (
                <>
                    {/* Merchants Tab */}
                    {activeTab === 'merchants' && (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-card p-4">
                                    <p className="text-sm text-white/50">Total Merchant</p>
                                    <p className="text-2xl font-bold text-white">{total}</p>
                                </div>
                                <div className="glass-card p-4">
                                    <p className="text-sm text-white/50">Aktif</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        {merchants.filter(m => m.is_enabled).length}
                                    </p>
                                </div>
                                <div className="glass-card p-4">
                                    <p className="text-sm text-white/50">Nonaktif</p>
                                    <p className="text-2xl font-bold text-red-400">
                                        {merchants.filter(m => !m.is_enabled).length}
                                    </p>
                                </div>
                            </div>

                            {/* Merchant List */}
                            <div className="glass-card overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left p-4 text-sm font-medium text-white/60">Merchant</th>
                                                <th className="text-left p-4 text-sm font-medium text-white/60 mobile-hide">Tipe</th>
                                                <th className="text-left p-4 text-sm font-medium text-white/60">Plan</th>
                                                <th className="text-left p-4 text-sm font-medium text-white/60 mobile-hide">Revenue %</th>
                                                <th className="text-left p-4 text-sm font-medium text-white/60">Status</th>
                                                <th className="text-left p-4 text-sm font-medium text-white/60">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {merchants.map(m => (
                                                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        <div>
                                                            <p className="font-medium text-white">{m.name}</p>
                                                            <p className="text-xs text-white/40">{m.subdomain}.codapos.com</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-white/70 mobile-hide">
                                                        {m.merchant_type ? `${m.merchant_type.icon || ''} ${m.merchant_type.name}` : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${m.subscription_plan === 'pro'
                                                            ? 'bg-[#1DA1F2]/20 text-[#1DA1F2]'
                                                            : 'bg-white/10 text-white/60'
                                                            }`}>
                                                            {m.subscription_plan}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-white/70 mobile-hide">
                                                        <div className="flex items-center gap-1">
                                                            <Percent className="w-3 h-3" />
                                                            {m.revenue_share_pct}%
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <button onClick={() => handleToggle(m.id, m.is_enabled)} className="transition-colors">
                                                            {m.is_enabled ? (
                                                                <ToggleRight className="w-6 h-6 text-green-400" />
                                                            ) : (
                                                                <ToggleLeft className="w-6 h-6 text-red-400" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(m)}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 text-xs font-medium transition-all"
                                                                title="Edit Merchant"
                                                            >
                                                                <Edit3 className="w-3 h-3" /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(m)}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                                                                title="Hapus Merchant"
                                                            >
                                                                <Trash2 className="w-3 h-3" /> Hapus
                                                            </button>
                                                            <button
                                                                onClick={() => handleLoadFeatures(m.id)}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 text-xs font-medium transition-all"
                                                                title="Kelola Fitur"
                                                            >
                                                                <Zap className="w-3 h-3" /> Fitur <ChevronRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {merchants.length === 0 && (
                                    <div className="p-8 text-center text-white/40">Belum ada merchant terdaftar</div>
                                )}
                            </div>

                            {/* Feature Flags Panel */}
                            {selectedMerchant && (
                                <div className="glass-card p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-[#1DA1F2]" />
                                            Feature Flags — {merchants.find(m => m.id === selectedMerchant)?.name}
                                        </h3>
                                        <button
                                            onClick={handleEnableAll}
                                            className="px-3 py-1.5 bg-[#1DA1F2] text-white text-sm rounded-lg hover:bg-[#1DA1F2]/80 transition-colors"
                                        >
                                            ⚡ Enable All (Pro)
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {featureFlags.map(flag => (
                                            <div
                                                key={flag.id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                            >
                                                <span className="text-sm text-white/80">{flag.feature_key.replace(/_/g, ' ')}</span>
                                                <button onClick={() => handleToggleFeature(flag.feature_key, flag.is_enabled)}>
                                                    {flag.is_enabled ? (
                                                        <ToggleRight className="w-6 h-6 text-green-400" />
                                                    ) : (
                                                        <ToggleLeft className="w-6 h-6 text-white/30" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ===== EDIT MODAL ===== */}
                            {showEditModal && editingMerchant && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                                    <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Edit3 className="w-5 h-5 text-[#1DA1F2]" /> Edit Merchant
                                            </h2>
                                            <button onClick={() => setShowEditModal(false)} className="text-white/40 hover:text-white">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="p-5 space-y-4">
                                            {editMsg && (
                                                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${editMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                    {editMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                    {editMsg.text}
                                                </div>
                                            )}

                                            {/* Name */}
                                            <div>
                                                <label className="text-xs text-white/50 mb-1.5 block">Nama Merchant</label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all"
                                                />
                                            </div>

                                            {/* Slug & Subdomain */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-white/50 mb-1.5 block">Slug</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.slug}
                                                        onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 mb-1.5 block">Subdomain</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.subdomain}
                                                        onChange={e => setEditForm(f => ({ ...f, subdomain: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Plan & Type */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-white/50 mb-1.5 block">Subscription Plan</label>
                                                    <select
                                                        value={editForm.subscription_plan}
                                                        onChange={e => setEditForm(f => ({ ...f, subscription_plan: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all appearance-none"
                                                    >
                                                        {planOptions.map(p => (
                                                            <option key={p} value={p} className="bg-[#0f172a] text-white">{p}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 mb-1.5 block">Tipe Merchant</label>
                                                    <select
                                                        value={editForm.merchant_type_id}
                                                        onChange={e => setEditForm(f => ({ ...f, merchant_type_id: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all appearance-none"
                                                    >
                                                        <option value="" className="bg-[#0f172a] text-white">— Tidak ada —</option>
                                                        {merchantTypes.map(mt => (
                                                            <option key={mt.id} value={mt.id} className="bg-[#0f172a] text-white">
                                                                {mt.icon} {mt.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Open/Close Time & Revenue */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-xs text-white/50 mb-1.5 block">Buka</label>
                                                    <input
                                                        type="time"
                                                        value={editForm.open_time}
                                                        onChange={e => setEditForm(f => ({ ...f, open_time: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 mb-1.5 block">Tutup</label>
                                                    <input
                                                        type="time"
                                                        value={editForm.close_time}
                                                        onChange={e => setEditForm(f => ({ ...f, close_time: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-white/50 mb-1.5 block">Revenue %</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={editForm.revenue_share_pct}
                                                        onChange={e => setEditForm(f => ({ ...f, revenue_share_pct: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                                            <button
                                                onClick={() => setShowEditModal(false)}
                                                className="px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white glass-card transition-all"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                disabled={savingEdit}
                                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#1DA1F2] to-[#A7D8FF] text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                {savingEdit ? 'Menyimpan...' : 'Simpan'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== DELETE CONFIRMATION ===== */}
                            {confirmDelete && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
                                    <div className="glass-card w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                                        <div className="p-6 text-center">
                                            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                                                <Trash2 className="w-7 h-7 text-red-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">Hapus Merchant?</h3>
                                            <p className="text-sm text-white/50 mb-1">
                                                Anda akan menghapus merchant:
                                            </p>
                                            <p className="text-base font-semibold text-red-400 mb-4">
                                                {confirmDelete.name}
                                            </p>
                                            <p className="text-xs text-white/30 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2">
                                                ⚠️ Semua data terkait merchant ini (produk, transaksi, outlet, user) akan terhapus secara permanen.
                                            </p>
                                        </div>
                                        <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white glass-card transition-all"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={() => handleDelete(confirmDelete.id)}
                                                disabled={deletingId === confirmDelete.id}
                                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/30 hover:shadow-red-900/50 flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                {deletingId === confirmDelete.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                {deletingId === confirmDelete.id ? 'Menghapus...' : 'Ya, Hapus'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Merchant Types Tab */}
                    {activeTab === 'types' && (
                        <div className="glass-card overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-sm font-medium text-white/60">Icon</th>
                                        <th className="text-left p-4 text-sm font-medium text-white/60">Nama</th>
                                        <th className="text-left p-4 text-sm font-medium text-white/60">Slug</th>
                                        <th className="text-left p-4 text-sm font-medium text-white/60">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {merchantTypes.map(mt => (
                                        <tr key={mt.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-2xl">{mt.icon || '📦'}</td>
                                            <td className="p-4 text-white font-medium">{mt.name}</td>
                                            <td className="p-4 text-white/60 text-sm">{mt.slug}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs ${mt.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {mt.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Global Config Tab */}
                    {activeTab === 'config' && (
                        <div className="glass-card overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-sm font-medium text-white/60">Key</th>
                                        <th className="text-left p-4 text-sm font-medium text-white/60">Value</th>
                                        <th className="text-left p-4 text-sm font-medium text-white/60">Deskripsi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {configs.map(cfg => (
                                        <tr key={cfg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-sm text-[#1DA1F2] font-mono">{cfg.key}</td>
                                            <td className="p-4 text-sm text-white">
                                                {cfg.key.includes('pass') || cfg.key.includes('secret')
                                                    ? '••••••••'
                                                    : cfg.value || <span className="text-white/30 italic">Belum diisi</span>
                                                }
                                            </td>
                                            <td className="p-4 text-sm text-white/50">{cfg.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Role Akses Tab */}
                    {activeTab === 'roles' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/20">
                                    <Lock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Permission Matrix</h3>
                                    <p className="text-xs text-white/40">Toggle akses fitur per role — Super Admin selalu bypass semua</p>
                                </div>
                            </div>

                            <div className="glass-card overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-4 text-sm font-medium text-white/60 sticky left-0 bg-[#0f172a]/90 backdrop-blur-sm min-w-[180px]">
                                                Aksi / Fitur
                                            </th>
                                            {rolesList.map(role => (
                                                <th key={role} className="p-4 text-center text-sm font-medium text-white/60 min-w-[110px]">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Users className="w-4 h-4 text-[#1DA1F2]" />
                                                        <span>{roleLabels[role] || role}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actionsList.map(action => (
                                            <tr key={action} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 sticky left-0 bg-[#0f172a]/90 backdrop-blur-sm">
                                                    <span className="text-sm text-white/80">
                                                        {actionLabels[action] || action.replace(/_/g, ' ')}
                                                    </span>
                                                    <p className="text-xs text-white/30 font-mono mt-0.5">{action}</p>
                                                </td>
                                                {rolesList.map(role => {
                                                    const allowed = isPermAllowed(role, action);
                                                    const key = `${role}-${action}`;
                                                    const isToggling = togglingPerm === key;
                                                    return (
                                                        <td key={key} className="p-4 text-center">
                                                            <button
                                                                onClick={() => handleTogglePermission(role, action)}
                                                                disabled={isToggling}
                                                                className={`transition-all duration-200 ${isToggling ? 'opacity-50 animate-pulse' : 'hover:scale-110'}`}
                                                            >
                                                                {allowed ? (
                                                                    <ToggleRight className="w-7 h-7 text-green-400 mx-auto" />
                                                                ) : (
                                                                    <ToggleLeft className="w-7 h-7 text-white/20 mx-auto" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {actionsList.length === 0 && (
                                    <div className="p-8 text-center text-white/40">Belum ada data permission</div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-6 text-xs text-white/40">
                                <div className="flex items-center gap-2">
                                    <ToggleRight className="w-5 h-5 text-green-400" />
                                    <span>Diizinkan</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ToggleLeft className="w-5 h-5 text-white/20" />
                                    <span>Ditolak</span>
                                </div>
                                <div className="ml-auto text-white/30">
                                    🔒 Super Admin selalu memiliki akses penuh
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pembayaran (Midtrans) Tab */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Integrasi Midtrans</h3>
                                    <p className="text-xs text-white/40">Kelola payment gateway untuk menerima pembayaran online</p>
                                </div>
                            </div>

                            {midtransMsg && (
                                <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${midtransMsg.type === 'success'
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    {midtransMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    {midtransMsg.text}
                                </div>
                            )}

                            {/* Mode Toggle */}
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-semibold text-white">Environment Mode</p>
                                        <p className="text-xs text-white/40 mt-0.5">Pilih mode Sandbox untuk testing atau Production untuk live</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${midtransMode === 'sandbox'
                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                            : 'bg-white/5 text-white/30'}`}>
                                            🧪 Sandbox
                                        </span>
                                        <button
                                            onClick={() => setMidtransMode(midtransMode === 'sandbox' ? 'production' : 'sandbox')}
                                            className={`relative w-14 h-7 rounded-full transition-all ${midtransMode === 'production' ? 'bg-emerald-500' : 'bg-yellow-500/50'}`}
                                        >
                                            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${midtransMode === 'production' ? 'translate-x-7' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${midtransMode === 'production'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-white/5 text-white/30'}`}>
                                            🚀 Production
                                        </span>
                                    </div>
                                </div>

                                {midtransMode === 'sandbox' && (
                                    <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300/80">
                                        ⚠️ Mode Sandbox aktif — transaksi hanya simulasi, tidak dikenakan biaya nyata.
                                    </div>
                                )}
                                {midtransMode === 'production' && (
                                    <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/80">
                                        ✅ Mode Production — transaksi real, pastikan Server Key dan Client Key sudah benar.
                                    </div>
                                )}
                            </div>

                            {/* API Keys */}
                            <div className="glass-card p-6 space-y-5">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                    🔑 API Keys
                                    <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full">
                                        {midtransMode === 'sandbox' ? 'SANDBOX' : 'PRODUCTION'}
                                    </span>
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-white/50 mb-1.5 block">Merchant ID</label>
                                        <input
                                            type="text"
                                            value={midtransMerchantId}
                                            onChange={(e) => setMidtransMerchantId(e.target.value)}
                                            placeholder="G844553457"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 mb-1.5 block">Client Key</label>
                                        <input
                                            type="text"
                                            value={midtransClientKey}
                                            onChange={(e) => setMidtransClientKey(e.target.value)}
                                            placeholder="SB-Mid-client-xxxx"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 mb-1.5 block">Server Key</label>
                                        <input
                                            type="password"
                                            value={midtransServerKey}
                                            onChange={(e) => setMidtransServerKey(e.target.value)}
                                            placeholder="SB-Mid-server-xxxx"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-2 focus:ring-[#1DA1F2]/10 transition-all font-mono"
                                        />
                                        <p className="text-[10px] text-white/25 mt-1">⚠️ Server Key bersifat rahasia, jangan dibagikan ke pihak lain</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveMidtrans}
                                    disabled={savingMidtrans}
                                    className="btn-primary flex items-center justify-center gap-2 w-full disabled:opacity-50"
                                >
                                    {savingMidtrans ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Simpan Konfigurasi
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Payment Methods Info */}
                            <div className="glass-card p-6">
                                <h4 className="text-sm font-semibold text-white mb-4">💳 Metode Pembayaran Aktif</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { icon: '📱', name: 'QRIS', desc: 'GoPay, ShopeePay, Dana, OVO', color: 'from-blue-500/10 to-purple-500/10 border-blue-500/20' },
                                        { icon: '💳', name: 'Kartu Debit/Kredit', desc: 'Visa, Mastercard, JCB', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20' },
                                        { icon: '🏦', name: 'Transfer Bank', desc: 'BCA, BNI, BRI, Permata VA', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
                                    ].map((method) => (
                                        <div key={method.name} className={`p-4 rounded-xl bg-gradient-to-br ${method.color} border`}>
                                            <div className="text-2xl mb-2">{method.icon}</div>
                                            <p className="text-sm font-medium text-white">{method.name}</p>
                                            <p className="text-[11px] text-white/40 mt-0.5">{method.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
    User, Shield, Building2, CreditCard, Crown, Save, Eye, EyeOff,
    Loader2, CheckCircle, AlertCircle, Clock, Mail, Phone, Lock,
    Landmark, Store,
} from "lucide-react";
import { userAPI } from "@/lib/api";
import { useAuthStore } from "@/store";

interface ProfileData {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string;
    role: string;
    is_active: boolean;
    last_login_at: string;
    tenant?: {
        id: string;
        name: string;
        slug: string;
        logo_url: string;
        subscription_plan: string;
        subscription_status: string;
        subscription_expires_at: string;
        open_time: string;
        close_time: string;
        merchant_type?: { name: string; slug: string; icon?: string };
        bank_name: string;
        bank_account_number: string;
        bank_account_holder: string;
    };
}

type ToastType = { message: string; type: "success" | "error" } | null;

export default function ProfilePage() {
    const { user: storeUser, login: storeLogin } = useAuthStore();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<ToastType>(null);

    // Profile form
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Merchant form
    const [merchantName, setMerchantName] = useState("");
    const [openTime, setOpenTime] = useState("");
    const [closeTime, setCloseTime] = useState("");
    const [savingMerchant, setSavingMerchant] = useState(false);

    // Bank form
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [bankHolder, setBankHolder] = useState("");
    const [savingBank, setSavingBank] = useState(false);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const res = await userAPI.getProfile();
            const data = res.data.data as ProfileData;
            setProfile(data);

            // Populate forms
            setFullName(data.full_name || "");
            setEmail(data.email || "");
            setPhone(data.phone || "");

            if (data.tenant) {
                setMerchantName(data.tenant.name || "");
                setOpenTime(data.tenant.open_time || "09:00");
                setCloseTime(data.tenant.close_time || "17:00");
                setBankName(data.tenant.bank_name || "");
                setBankAccount(data.tenant.bank_account_number || "");
                setBankHolder(data.tenant.bank_account_holder || "");
            }
        } catch {
            showToast("Gagal memuat profil", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const res = await userAPI.updateProfile({ full_name: fullName, phone, email });
            const updatedUser = res.data.data;
            // Update zustand store + localStorage
            const token = localStorage.getItem("codapos_token") || "";
            storeLogin(updatedUser, token);
            setProfile(updatedUser);
            showToast("Profil berhasil disimpan!", "success");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menyimpan profil";
            showToast(msg, "error");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            showToast("Password baru tidak cocok", "error");
            return;
        }
        if (newPassword.length < 6) {
            showToast("Password minimal 6 karakter", "error");
            return;
        }
        setSavingPassword(true);
        try {
            await userAPI.changePassword({ old_password: oldPassword, new_password: newPassword });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            showToast("Password berhasil diubah!", "success");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal mengubah password";
            showToast(msg, "error");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSaveMerchant = async () => {
        setSavingMerchant(true);
        try {
            await userAPI.updateMerchant({ name: merchantName, open_time: openTime, close_time: closeTime });
            showToast("Info merchant berhasil disimpan!", "success");
            fetchProfile();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menyimpan merchant";
            showToast(msg, "error");
        } finally {
            setSavingMerchant(false);
        }
    };

    const handleSaveBank = async () => {
        setSavingBank(true);
        try {
            await userAPI.updateMerchant({
                bank_name: bankName,
                bank_account_number: bankAccount,
                bank_account_holder: bankHolder,
            });
            showToast("Rekening berhasil disimpan!", "success");
            fetchProfile();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menyimpan rekening";
            showToast(msg, "error");
        } finally {
            setSavingBank(false);
        }
    };

    const roleLabels: Record<string, string> = {
        super_admin: "Super Administrator",
        owner: "Pemilik Bisnis",
        admin: "Administrator",
        finance: "Keuangan",
        outlet_manager: "Manajer Outlet",
        cashier: "Kasir",
        customer: "Pelanggan",
    };

    const planLabels: Record<string, string> = {
        "free-basic": "Free Basic",
        "free": "Free",
        "pro": "Pro",
        "enterprise": "Enterprise",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#1DA1F2] animate-spin" />
                    <p className="text-sm text-white/40">Memuat profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl animate-slide-in-up ${toast.type === "success"
                    ? "bg-green-500/20 border border-green-500/30 text-green-400"
                    : "bg-red-500/20 border border-red-500/30 text-red-400"
                    }`}>
                    {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white">Profil Saya</h1>
                <p className="text-sm text-white/40 mt-1">Kelola informasi akun, merchant, dan keamanan Anda</p>
            </div>

            {/* ====== SECTION 1: PROFILE INFO ====== */}
            <div className="glass p-6 animate-slide-in-up stagger-1">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#1DA1F2]/15 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#1DA1F2]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Informasi Profil</h2>
                        <p className="text-xs text-white/40">Data pribadi dan kontak Anda</p>
                    </div>
                </div>

                {/* Avatar + Role Badge */}
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-[#A7D8FF] flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-900/20">
                        {fullName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{fullName || "—"}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1DA1F2]/15 text-[#1DA1F2] border border-[#1DA1F2]/20">
                                <Crown className="w-3 h-3" />
                                {roleLabels[profile?.role || ""] || profile?.role}
                            </span>
                            {profile?.is_active && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {profile?.last_login_at && (
                            <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Login terakhir: {new Date(profile.last_login_at).toLocaleString("id-ID")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <User className="w-3 h-3" /> Nama Lengkap
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="input-glass"
                            placeholder="Nama lengkap"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="input-glass"
                            placeholder="email@contoh.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> Telepon
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="input-glass"
                            placeholder="08xxxxxxxxxx"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Shield className="w-3 h-3" /> Role
                        </label>
                        <div className="input-glass bg-white/3 cursor-not-allowed text-white/50">
                            {roleLabels[profile?.role || ""] || profile?.role || "—"}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-5">
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="btn-primary flex items-center gap-2"
                    >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Profil
                    </button>
                </div>
            </div>

            {/* ====== SECTION 2: CHANGE PASSWORD ====== */}
            <div className="glass p-6 animate-slide-in-up stagger-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Ubah Password</h2>
                        <p className="text-xs text-white/40">Keamanan akun Anda</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 block">
                            Password Lama
                        </label>
                        <div className="relative">
                            <input
                                type={showOld ? "text" : "password"}
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                className="input-glass pr-10"
                                placeholder="Masukkan password lama"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOld(!showOld)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                            >
                                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 block">
                            Password Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="input-glass pr-10"
                                placeholder="Minimal 6 karakter"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 block">
                            Konfirmasi Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="input-glass"
                            placeholder="Ulangi password baru"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-400 mt-1">Password tidak cocok</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-5">
                    <button
                        onClick={handleChangePassword}
                        disabled={savingPassword || !oldPassword || !newPassword || newPassword !== confirmPassword}
                        className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Ubah Password
                    </button>
                </div>
            </div>

            {/* ====== SECTION 3: MERCHANT INFO ====== */}
            <div className="glass p-6 animate-slide-in-up stagger-3">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Informasi Merchant</h2>
                        <p className="text-xs text-white/40">Data bisnis dan toko Anda</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Store className="w-3 h-3" /> Nama Merchant
                        </label>
                        <input
                            type="text"
                            value={merchantName}
                            onChange={e => setMerchantName(e.target.value)}
                            className="input-glass"
                            placeholder="Nama bisnis Anda"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Shield className="w-3 h-3" /> Tipe Merchant
                        </label>
                        <div className="input-glass bg-white/3 cursor-not-allowed text-white/50">
                            {profile?.tenant?.merchant_type?.name || "Belum ditentukan"}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Jam Buka
                        </label>
                        <input
                            type="time"
                            value={openTime}
                            onChange={e => setOpenTime(e.target.value)}
                            className="input-glass"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Jam Tutup
                        </label>
                        <input
                            type="time"
                            value={closeTime}
                            onChange={e => setCloseTime(e.target.value)}
                            className="input-glass"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-5">
                    <button
                        onClick={handleSaveMerchant}
                        disabled={savingMerchant}
                        className="btn-primary flex items-center gap-2"
                    >
                        {savingMerchant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Merchant
                    </button>
                </div>
            </div>

            {/* ====== SECTION 4: BANK ACCOUNT ====== */}
            <div className="glass p-6 animate-slide-in-up stagger-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Rekening Bank</h2>
                        <p className="text-xs text-white/40">Rekening untuk penerimaan dana</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 block">
                            Nama Bank
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={e => setBankName(e.target.value)}
                            className="input-glass"
                            placeholder="Contoh: BCA, Mandiri, BRI"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 block">
                            Nomor Rekening
                        </label>
                        <input
                            type="text"
                            value={bankAccount}
                            onChange={e => setBankAccount(e.target.value)}
                            className="input-glass"
                            placeholder="1234567890"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1.5 block">
                            Atas Nama
                        </label>
                        <input
                            type="text"
                            value={bankHolder}
                            onChange={e => setBankHolder(e.target.value)}
                            className="input-glass"
                            placeholder="Nama pemilik rekening"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-5">
                    <button
                        onClick={handleSaveBank}
                        disabled={savingBank}
                        className="btn-primary flex items-center gap-2"
                    >
                        {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Rekening
                    </button>
                </div>
            </div>

            {/* ====== SECTION 5: SUBSCRIPTION ====== */}
            <div className="glass p-6 animate-slide-in-up stagger-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Langganan</h2>
                        <p className="text-xs text-white/40">Status paket langganan Anda</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-subtle p-4 rounded-xl text-center">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Paket</p>
                        <p className="text-xl font-bold text-white">
                            {planLabels[profile?.tenant?.subscription_plan || ""] || profile?.tenant?.subscription_plan || "—"}
                        </p>
                    </div>
                    <div className="glass-subtle p-4 rounded-xl text-center">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${profile?.tenant?.subscription_status === "active"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                            }`}>
                            {profile?.tenant?.subscription_status === "active" ? "Aktif" : profile?.tenant?.subscription_status || "—"}
                        </span>
                    </div>
                    <div className="glass-subtle p-4 rounded-xl text-center">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Berlaku Sampai</p>
                        <p className="text-lg font-semibold text-white">
                            {profile?.tenant?.subscription_expires_at
                                ? new Date(profile.tenant.subscription_expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                                : "Selamanya"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

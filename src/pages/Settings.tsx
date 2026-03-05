import { useState, useEffect, useMemo } from "react";
import { Settings as SettingsIcon, Shield, Palette, User, Check, Loader2, Database, Download, Trash2, HardDrive, Clock, RefreshCw } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { pb } from "../lib/pb";
import { UserService } from "../services/api";
import { notifySettingsChange } from "../hooks/useAdminSettings";

export function Settings() {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("Profile");
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Profile State
    const [profileData, setProfileData] = useState({
        name: "",
        display_name: "",
        phone_number: "",
        institution: "",
        email: ""
    });

    // Security State
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        password: "",
        passwordConfirm: ""
    });

    // Preferences State
    const [language, setLanguage] = useState(localStorage.getItem('admin_language') || "en");
    const [notifications, setNotifications] = useState(localStorage.getItem('admin_notifications') === 'true');
    const [defaultPerPage, setDefaultPerPage] = useState(parseInt(localStorage.getItem('admin_per_page') || '15'));
    const [compactMode, setCompactMode] = useState(localStorage.getItem('admin_compact') === 'true');
    const [autoRefresh, setAutoRefresh] = useState(localStorage.getItem('admin_auto_refresh') === 'true');
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(parseInt(localStorage.getItem('admin_refresh_interval') || '60'));

    // Data & Storage state
    const [storageUsage, setStorageUsage] = useState<string>("Calculating...");
    const [exportingData, setExportingData] = useState(false);

    useEffect(() => {
        // Load initial profile data from authStore
        if (pb.authStore.model) {
            setProfileData({
                name: pb.authStore.model.name || "",
                display_name: pb.authStore.model.display_name || "",
                phone_number: pb.authStore.model.phone_number || "",
                institution: pb.authStore.model.institution || "",
                email: pb.authStore.model.email || ""
            });
        }
        // Calculate localStorage usage
        calculateStorageUsage();
    }, []);

    const calculateStorageUsage = () => {
        try {
            let totalBytes = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    totalBytes += (localStorage.getItem(key) || "").length * 2; // UTF-16
                }
            }
            if (totalBytes < 1024) {
                setStorageUsage(`${totalBytes} B`);
            } else if (totalBytes < 1024 * 1024) {
                setStorageUsage(`${(totalBytes / 1024).toFixed(1)} KB`);
            } else {
                setStorageUsage(`${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
            }
        } catch {
            setStorageUsage("Unable to calculate");
        }
    };

    const sessionInfo = useMemo(() => {
        const model = pb.authStore.model;
        if (!model) return null;
        return {
            userId: model.id,
            email: model.email,
            created: model.created ? new Date(model.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
            lastLogin: model.updated ? new Date(model.updated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
            isValid: pb.authStore.isValid,
            tokenExpiry: pb.authStore.token ? (() => {
                try {
                    const payload = JSON.parse(atob(pb.authStore.token.split('.')[1]));
                    return new Date(payload.exp * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                } catch { return '-'; }
            })() : '-'
        };
    }, []);

    const showMessage = (msg: string, isError = false) => {
        if (isError) {
            setErrorMsg(msg);
            setSuccessMsg("");
        } else {
            setSuccessMsg(msg);
            setErrorMsg("");
        }
        setTimeout(() => {
            setSuccessMsg("");
            setErrorMsg("");
        }, 3000);
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await UserService.updateProfile(profileData);
            showMessage("Profile updated successfully!");
        } catch (error: any) {
            showMessage(error.message || "Failed to update profile", true);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.password !== passwordData.passwordConfirm) {
            showMessage("New passwords do not match", true);
            return;
        }

        setIsLoading(true);
        try {
            await UserService.updatePassword(passwordData);
            showMessage("Password changed successfully!");
            setPasswordData({ oldPassword: "", password: "", passwordConfirm: "" });
        } catch (error: any) {
            showMessage(error.message || "Failed to change password. Please check your old password.", true);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreferencesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('admin_language', language);
        localStorage.setItem('admin_notifications', String(notifications));
        localStorage.setItem('admin_per_page', String(defaultPerPage));
        localStorage.setItem('admin_compact', String(compactMode));
        localStorage.setItem('admin_auto_refresh', String(autoRefresh));
        localStorage.setItem('admin_refresh_interval', String(autoRefreshInterval));
        notifySettingsChange();
        showMessage("Preferences saved successfully!");
    };

    const handleExportData = async () => {
        setExportingData(true);
        try {
            // Collect all localStorage data
            const exportData: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    exportData[key] = localStorage.getItem(key);
                }
            }
            // Add session info
            exportData._exportedAt = new Date().toISOString();
            exportData._exportedBy = pb.authStore.model?.email || 'unknown';

            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dahar-admin-settings-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showMessage("Settings exported successfully!");
        } catch {
            showMessage("Failed to export settings", true);
        } finally {
            setExportingData(false);
        }
    };

    const handleClearCache = () => {
        if (!confirm("This will clear all locally cached preferences and reload the page. Continue?")) return;
        const authToken = pb.authStore.token;
        const authModel = pb.authStore.model;
        localStorage.clear();
        // Restore auth to prevent logout
        if (authToken && authModel) {
            pb.authStore.save(authToken, authModel);
        }
        window.location.reload();
    };

    const tabs = [
        { label: "Profile", icon: User },
        { label: "Appearance", icon: Palette },
        { label: "Security", icon: Shield },
        { label: "Preferences", icon: SettingsIcon },
        { label: "Data & Storage", icon: Database },
        { label: "Session", icon: Clock },
    ];

    const inputClass = "w-full px-3 py-2 text-sm border border-white/10 bg-black/20 text-white rounded-lg focus:border-army-500/50 outline-none transition-all placeholder:text-white/20";
    const labelClass = "block text-xs font-semibold text-white/60 mb-1.5";

    return (
        <div className="space-y-5 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white/90">Settings</h1>
                    <p className="text-xs font-semibold text-white/50 mt-1">Manage your administrator account settings and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* Sidebar Navigation for Settings */}
                <div className="md:col-span-1 space-y-1 bg-secondary/30 p-2 rounded-xl border border-white/5 h-fit">
                    {tabs.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => { setActiveTab(item.label); setSuccessMsg(""); setErrorMsg(""); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === item.label
                                ? "bg-white/10 text-white shadow-sm border border-white/5"
                                : "text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="md:col-span-3 space-y-5">
                    {/* Status Messages */}
                    {successMsg && (
                        <div className="p-3 bg-army-500/10 border border-army-500/20 rounded-lg text-army-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                            <Check className="w-4 h-4" />
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {errorMsg}
                        </div>
                    )}

                    <div className="bg-secondary/30 border border-white/5 rounded-xl transition-colors overflow-hidden">

                        {/* PROFILE TAB */}
                        {activeTab === "Profile" && (
                            <form onSubmit={handleProfileSubmit}>
                                <div className="p-5 border-b border-white/5 bg-black/20">
                                    <h2 className="text-lg font-bold text-white">Personal Information</h2>
                                    <p className="text-xs font-semibold text-white/50 mt-1">Update your personal details associated with this account.</p>
                                </div>
                                <div className="p-5 space-y-5 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className={labelClass}>Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Display Name</label>
                                            <input
                                                type="text"
                                                value={profileData.display_name}
                                                onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                                                className={inputClass}
                                                placeholder="(Optional) Appears in UI"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone Number</label>
                                        <input
                                            type="text"
                                            value={profileData.phone_number}
                                            onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                                            className={inputClass}
                                            placeholder="+62..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-white/5 bg-white/5 text-white/40 rounded-lg outline-none cursor-not-allowed"
                                            placeholder="[EMAIL_ADDRESS]"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Institution / Company</label>
                                        <input
                                            type="text"
                                            value={profileData.institution}
                                            onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="p-5 bg-black/40 border-t border-white/5 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-5 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-semibold transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Profile
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* APPEARANCE TAB */}
                        {activeTab === "Appearance" && (
                            <div>
                                <div className="p-5 border-b border-white/5 bg-black/20">
                                    <h2 className="text-lg font-bold text-white">Theme Preferences</h2>
                                    <p className="text-xs font-semibold text-white/50 mt-1">Customize the visual appearance of the admin dashboard.</p>
                                </div>
                                <div className="p-5 max-w-3xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <button
                                            type="button"
                                            onClick={theme !== 'light' ? toggleTheme : undefined}
                                            className={`flex flex-col items-start p-4 rounded-xl border transition-all ${theme === 'light' ? 'border-army-500 bg-army-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                                        >
                                            <div className="w-full h-24 bg-white rounded-lg border border-slate-200 mb-4 shadow-sm flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-slate-100"></div>
                                            </div>
                                            <span className="text-sm font-bold text-white">Light Mode</span>
                                            <span className="text-xs font-semibold text-white/40 mt-1">Clean and bright</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={theme !== 'dark' ? toggleTheme : undefined}
                                            className={`flex flex-col items-start p-4 rounded-xl border transition-all ${theme === 'dark' ? 'border-army-500 bg-army-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                                        >
                                            <div className="w-full h-24 bg-[#0a0a0a] rounded-lg border border-white/10 mb-4 shadow-sm flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white/5"></div>
                                            </div>
                                            <span className="text-sm font-bold text-white">Dark Mode</span>
                                            <span className="text-xs font-semibold text-white/40 mt-1">Easy on the eyes</span>
                                        </button>
                                    </div>

                                    {/* Compact Mode */}
                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <h3 className="text-sm font-semibold text-white/80 mb-4">Layout Density</h3>
                                        <label className="flex items-center gap-3 p-4 border border-white/5 rounded-xl bg-black/20 cursor-pointer hover:bg-black/30 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={compactMode}
                                                onChange={(e) => {
                                                    setCompactMode(e.target.checked);
                                                    localStorage.setItem('admin_compact', String(e.target.checked));
                                                    notifySettingsChange();
                                                    showMessage("Layout density updated!");
                                                }}
                                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-army-500 focus:ring-army-500/50"
                                            />
                                            <div>
                                                <p className="font-semibold text-sm text-white">Compact Mode</p>
                                                <p className="text-xs font-medium text-white/50">Reduce padding and spacing for denser information display.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === "Security" && (
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="p-5 border-b border-white/5 bg-black/20">
                                    <h2 className="text-lg font-bold text-white">Change Password</h2>
                                    <p className="text-xs font-semibold text-white/50 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                                </div>
                                <div className="p-5 space-y-5 max-w-xl">
                                    <div>
                                        <label className={labelClass}>Current Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <label className={labelClass}>New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={passwordData.passwordConfirm}
                                            onChange={(e) => setPasswordData({ ...passwordData, passwordConfirm: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="p-5 bg-black/40 border-t border-white/5 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-5 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-semibold transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* PREFERENCES TAB */}
                        {activeTab === "Preferences" && (
                            <form onSubmit={handlePreferencesSubmit}>
                                <div className="p-5 border-b border-white/5 bg-black/20">
                                    <h2 className="text-lg font-bold text-white">System Preferences</h2>
                                    <p className="text-xs font-semibold text-white/50 mt-1">Local browser preferences for this dashboard.</p>
                                </div>
                                <div className="p-5 space-y-5 max-w-xl">
                                    <div>
                                        <label className={labelClass}>Dashboard Language</label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className={inputClass + " appearance-none cursor-pointer"}
                                        >
                                            <option value="en" className="bg-black">English (US)</option>
                                            <option value="id" className="bg-black">Bahasa Indonesia</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Default Items per Page</label>
                                        <select
                                            value={defaultPerPage}
                                            onChange={(e) => setDefaultPerPage(parseInt(e.target.value))}
                                            className={inputClass + " appearance-none cursor-pointer"}
                                        >
                                            <option value={10} className="bg-black">10 items</option>
                                            <option value={15} className="bg-black">15 items</option>
                                            <option value={25} className="bg-black">25 items</option>
                                            <option value={50} className="bg-black">50 items</option>
                                        </select>
                                        <p className="text-[11px] font-semibold text-white/40 mt-1.5">Applies to all data tables across the dashboard.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-4 border border-white/5 rounded-xl bg-black/20 cursor-pointer hover:bg-black/30 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={notifications}
                                                onChange={(e) => setNotifications(e.target.checked)}
                                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-army-500 focus:ring-army-500/50"
                                            />
                                            <div>
                                                <p className="font-semibold text-sm text-white">Browser Notifications</p>
                                                <p className="text-xs font-medium text-white/50">Receive alerts inside the dashboard for new bookings or payments.</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-4 border border-white/5 rounded-xl bg-black/20 cursor-pointer hover:bg-black/30 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={autoRefresh}
                                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-army-500 focus:ring-army-500/50"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-white">Auto Refresh Data</p>
                                                <p className="text-xs font-medium text-white/50">Automatically refresh data tables at a set interval.</p>
                                            </div>
                                        </label>

                                        {autoRefresh && (
                                            <div className="ml-8">
                                                <label className={labelClass}>Refresh Interval</label>
                                                <select
                                                    value={autoRefreshInterval}
                                                    onChange={(e) => setAutoRefreshInterval(parseInt(e.target.value))}
                                                    className={inputClass + " appearance-none cursor-pointer"}
                                                >
                                                    <option value={30} className="bg-black">Every 30 seconds</option>
                                                    <option value={60} className="bg-black">Every 1 minute</option>
                                                    <option value={120} className="bg-black">Every 2 minutes</option>
                                                    <option value={300} className="bg-black">Every 5 minutes</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 bg-black/40 border-t border-white/5 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-semibold transition-colors shadow-lg"
                                    >
                                        Save Preferences
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* DATA & STORAGE TAB */}
                        {activeTab === "Data & Storage" && (
                            <div>
                                <div className="p-5 border-b border-white/5 bg-black/20">
                                    <h2 className="text-lg font-bold text-white">Data & Storage</h2>
                                    <p className="text-xs font-semibold text-white/50 mt-1">Export your settings or clear locally cached data.</p>
                                </div>
                                <div className="p-5 space-y-5 max-w-2xl">
                                    {/* Storage Usage */}
                                    <div className="p-5 border border-white/5 rounded-xl bg-black/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <HardDrive className="w-5 h-5 text-white/40" />
                                            <h3 className="font-semibold text-sm text-white">Local Storage Usage</h3>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-white">{storageUsage}</span>
                                            <span className="text-[11px] text-white/40 font-semibold">of ~5 MB browser limit</span>
                                        </div>
                                        <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(100, (() => {
                                                        try {
                                                            let total = 0;
                                                            for (let i = 0; i < localStorage.length; i++) {
                                                                const key = localStorage.key(i);
                                                                if (key) total += (localStorage.getItem(key) || "").length * 2;
                                                            }
                                                            return (total / (5 * 1024 * 1024)) * 100;
                                                        } catch { return 0; }
                                                    })())}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Export Settings */}
                                    <div className="flex items-center justify-between p-5 border border-white/5 rounded-xl bg-secondary/30">
                                        <div className="flex items-center gap-3">
                                            <Download className="w-5 h-5 text-white/40" />
                                            <div>
                                                <h3 className="font-semibold text-sm text-white">Export Settings</h3>
                                                <p className="text-xs text-white/50 font-medium">Download all your preferences as a JSON file.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleExportData}
                                            disabled={exportingData}
                                            className="px-4 py-2 text-sm font-semibold text-white bg-white/10 border border-white/5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {exportingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Export
                                        </button>
                                    </div>

                                    {/* Clear Cache */}
                                    <div className="flex items-center justify-between p-5 border border-red-500/20 rounded-xl bg-red-500/10">
                                        <div className="flex items-center gap-3">
                                            <Trash2 className="w-5 h-5 text-red-400" />
                                            <div>
                                                <h3 className="font-semibold text-sm text-red-500">Clear Local Cache</h3>
                                                <p className="text-xs text-red-400/80 font-medium">Reset all preferences to default. You will stay logged in.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleClearCache}
                                            className="px-4 py-2 text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SESSION TAB */}
                        {activeTab === "Session" && (
                            <div>
                                <div className="p-5 border-b border-white/5 bg-black/20">
                                    <h2 className="text-lg font-bold text-white">Session Information</h2>
                                    <p className="text-xs font-semibold text-white/50 mt-1">View your current authentication session details.</p>
                                </div>
                                <div className="p-5 space-y-5 max-w-2xl">
                                    {sessionInfo && (
                                        <>
                                            {/* Session Status */}
                                            <div className="flex items-center gap-3 p-4 rounded-xl border border-army-500/20 bg-army-500/10">
                                                <div className="w-2.5 h-2.5 rounded-full bg-army-500 animate-pulse" />
                                                <span className="text-sm font-semibold text-army-400">Session Active</span>
                                            </div>

                                            {/* Info Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { label: "User ID", value: sessionInfo.userId },
                                                    { label: "Email", value: sessionInfo.email },
                                                    { label: "Account Created", value: sessionInfo.created },
                                                    { label: "Last Updated", value: sessionInfo.lastLogin },
                                                    { label: "Token Valid", value: sessionInfo.isValid ? "Yes" : "No" },
                                                    { label: "Token Expiry", value: sessionInfo.tokenExpiry },
                                                ].map((item) => (
                                                    <div key={item.label} className="p-4 rounded-xl border border-white/5 bg-black/20">
                                                        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">{item.label}</p>
                                                        <p className="text-sm font-semibold text-white break-all">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Refresh Token */}
                                            <div className="flex items-center justify-between p-5 border border-white/5 rounded-xl bg-secondary/30">
                                                <div className="flex items-center gap-3">
                                                    <RefreshCw className="w-5 h-5 text-white/40" />
                                                    <div>
                                                        <h3 className="font-semibold text-sm text-white">Refresh Session</h3>
                                                        <p className="text-xs text-white/50 font-medium">Re-authenticate to extend your session token.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        setIsLoading(true);
                                                        try {
                                                            await pb.collection('users').authRefresh();
                                                            showMessage("Session refreshed successfully!");
                                                        } catch {
                                                            showMessage("Failed to refresh session. Please log in again.", true);
                                                        } finally {
                                                            setIsLoading(false);
                                                        }
                                                    }}
                                                    disabled={isLoading}
                                                    className="px-4 py-2 text-sm font-semibold text-white bg-white/10 border border-white/5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                    Refresh
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

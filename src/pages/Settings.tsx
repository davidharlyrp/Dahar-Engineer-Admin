import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Shield, Palette, User, Check, Loader2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { pb } from "../lib/pb";
import { UserService } from "../services/api";

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
        showMessage("Preferences saved successfully!");
    };

    const tabs = [
        { label: "Profile", icon: User },
        { label: "Appearance", icon: Palette },
        { label: "Security", icon: Shield },
        { label: "Preferences", icon: SettingsIcon },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Manage your administrator account settings and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation for Settings */}
                <div className="md:col-span-1 space-y-1 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit">
                    {tabs.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => { setActiveTab(item.label); setSuccessMsg(""); setErrorMsg(""); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold transition-colors ${activeTab === item.label
                                ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="md:col-span-3 space-y-6">
                    {/* Status Messages */}
                    {successMsg && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                            <Check className="w-4 h-4" />
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-4">
                            {errorMsg}
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-colors overflow-hidden">

                        {/* PROFILE TAB */}
                        {activeTab === "Profile" && (
                            <form onSubmit={handleProfileSubmit}>
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Personal Information</h2>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Update your personal details associated with this account.</p>
                                </div>
                                <div className="p-6 space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Display Name</label>
                                            <input
                                                type="text"
                                                value={profileData.display_name}
                                                onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                                                className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                                placeholder="(Optional) Appears in UI"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                                        <input
                                            type="text"
                                            value={profileData.phone_number}
                                            onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                                            className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                            placeholder="+62..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                            placeholder="[EMAIL_ADDRESS]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Institution / Company</label>
                                        <input
                                            type="text"
                                            value={profileData.institution}
                                            onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                                            className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
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
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Theme Preferences</h2>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Customize the visual appearance of the admin dashboard.</p>
                                </div>
                                <div className="p-6 max-w-3xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <button
                                            type="button"
                                            onClick={theme !== 'light' ? toggleTheme : undefined}
                                            className={`flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all ${theme === 'light' ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900/50' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                        >
                                            <div className="w-full h-24 bg-white rounded-md border border-slate-200 mb-4 shadow-sm flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-slate-100"></div>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">Light Mode</span>
                                            <span className="text-xs font-semibold text-slate-500 mt-1">Clean and bright</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={theme !== 'dark' ? toggleTheme : undefined}
                                            className={`flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all ${theme === 'dark' ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900/50' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                        >
                                            <div className="w-full h-24 bg-slate-900 rounded-md border border-slate-700 mb-4 shadow-sm flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-slate-800"></div>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">Dark Mode</span>
                                            <span className="text-xs font-semibold text-slate-500 mt-1">Easy on the eyes</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === "Security" && (
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Change Password</h2>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                                </div>
                                <div className="p-6 space-y-6 max-w-xl">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 mt-4">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                            className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={passwordData.passwordConfirm}
                                            onChange={(e) => setPasswordData({ ...passwordData, passwordConfirm: e.target.value })}
                                            className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
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
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">System Preferences</h2>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Local browser preferences for this dashboard.</p>
                                </div>
                                <div className="p-6 space-y-6 max-w-xl">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Dashboard Language</label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="id">Bahasa Indonesia</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications}
                                                onChange={(e) => setNotifications(e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-slate-900 dark:focus:ring-slate-100"
                                            />
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Browser Notifications</p>
                                                <p className="text-xs font-semibold text-slate-500">Receive alerts inside the dashboard for new bookings or payments.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-md text-sm font-bold transition-colors shadow-sm"
                                    >
                                        Save Preferences
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

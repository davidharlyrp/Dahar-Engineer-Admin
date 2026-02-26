import {
    Menu, LogOut, Sun, Moon, Bell, Check, Users, BookOpen,
    Wallet, Activity, FileUp, MessageSquare, MessageCircle, Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pb } from "../../lib/pb";
import { useTheme } from "../../context/ThemeContext";
import { useState, useRef, useEffect } from "react";
import { useRealtimeNotifications } from "../../hooks/useRealtimeNotifications";
import type { NotificationType } from "../../hooks/useRealtimeNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils";

const iconMap: Record<NotificationType, any> = {
    user: Users,
    course: BookOpen,
    payment: Wallet,
    activity: Activity,
    file: FileUp,
    feedback: MessageSquare,
    comment: MessageCircle,
    review: Star
};

const colorMap: Record<NotificationType, string> = {
    user: "text-slate-500",
    course: "text-slate-500",
    payment: "text-slate-500",
    activity: "text-slate-500",
    file: "text-slate-500",
    feedback: "text-slate-500",
    comment: "text-slate-500",
    review: "text-slate-500"
};

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAllAsRead, autoOpenTrigger } = useRealtimeNotifications();

    useEffect(() => {
        if (autoOpenTrigger > 0) {
            setIsNotifOpen(true);
            markAllAsRead(); // Mark as read immediately when auto-opened
        }
    }, [autoOpenTrigger]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsNotifOpen(!isNotifOpen);
        if (!isNotifOpen && unreadCount > 0) {
            markAllAsRead();
        }
    };

    const handleLogout = () => {
        pb.authStore.clear();
        navigate("/login");
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-50 px-4 flex items-center justify-between shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden transition-colors"
                >
                    <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/Logo.png" alt="Logo" className="w-8 h-8" />
                    <span className="font-bold text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Dahar <span className="text-slate-500 font-normal dark:text-slate-400">Engineer</span></span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={handleBellClick}
                        className={cn(
                            "p-2 rounded-full transition-colors relative",
                            isNotifOpen ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                    >
                        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500 text-[8px] font-bold text-white items-center justify-center">
                                    {unreadCount}
                                </span>
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 transform origin-top-right transition-all">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto w-full">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50 w-full object-cover">
                                        {notifications.map(notif => {
                                            const Icon = iconMap[notif.type] || Bell;
                                            return (
                                                <div
                                                    key={notif.id}
                                                    className={cn(
                                                        "p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 text-left w-full",
                                                        notif.isNew ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                                                        notif.isNew
                                                            ? "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800"
                                                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                    )}>
                                                        <Icon className={cn("w-4 h-4", colorMap[notif.type])} />
                                                    </div>
                                                    <div className="flex-1 w-full max-w-[calc(100%-2.5rem)]">
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 w-full object-cover">
                                                            {notif.text}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                                                            {formatDistanceToNow(notif.date, { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {notif.isNew && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
                                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-sm font-medium">No recent notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline-block">Logout</span>
                </button>
            </div>
        </header>
    );
}

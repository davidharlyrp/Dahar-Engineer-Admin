import {
    Bell, Menu, Users, LogOut,
    BookOpen, Sun, Moon,
    Wallet, Activity, FileUp, MessageSquare, MessageCircle, Star, Check
} from 'lucide-react';
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
    user: "text-white/40",
    course: "text-white/40",
    payment: "text-white/40",
    activity: "text-white/40",
    file: "text-white/40",
    feedback: "text-white/40",
    comment: "text-white/40",
    review: "text-white/40"
};

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const {
        notifications, unreadCount, markAllAsRead,
        autoOpenTrigger
    } = useRealtimeNotifications();

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
        <header className="fixed top-0 left-0 right-0 h-12 bg-secondary border-b border-white/5 z-50 px-4 flex items-center justify-between shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-md hover:bg-white/5 lg:hidden transition-colors"
                >
                    <Menu className="w-5 h-5 text-white/60" />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/Logo.png" alt="Logo" className="w-8 h-8" />
                    <span className="font-bold text-2xl text-white tracking-tight">Dahar <span className="text-white/40 font-normal">Engineer</span></span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/60"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>

                {/* Desktop Quick Actions */}
                <div className="hidden lg:flex items-center space-x-4 ml-auto">
                    {/* Add any other desktop quick actions here in the future */}
                </div>

                <div className="relative" ref={notifRef}>
                    <button
                        onClick={handleBellClick}
                        className={cn(
                            "p-2 rounded-full transition-colors relative",
                            isNotifOpen ? "bg-white/10" : "hover:bg-white/5"
                        )}
                    >
                        <Bell className="w-5 h-5 text-white/60" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-army-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-army-500 text-[8px] font-bold text-black items-center justify-center">
                                    {unreadCount}
                                </span>
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-secondary rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 transform origin-top-right transition-all">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="font-bold text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] text-army-400 hover:text-army-300 font-bold uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto w-full custom-scrollbar">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-white/5 w-full object-cover">
                                        {notifications.map(notif => {
                                            const Icon = iconMap[notif.type] || Bell;
                                            return (
                                                <div
                                                    key={notif.id}
                                                    className={cn(
                                                        "p-4 hover:bg-white/5 transition-colors flex gap-3 text-left w-full",
                                                        notif.isNew ? "bg-white/[0.02]" : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                                                        notif.isNew
                                                            ? "bg-secondary border-army-500/20"
                                                            : "bg-secondary border-white/5"
                                                    )}>
                                                        <Icon className={cn("w-4 h-4", colorMap[notif.type])} />
                                                    </div>
                                                    <div className="flex-1 w-full max-w-[calc(100%-2.5rem)]">
                                                        <p className="text-sm text-white/80 w-full object-cover">
                                                            {notif.text}
                                                        </p>
                                                        <p className="text-[10px] text-white/40 font-semibold mt-1">
                                                            {formatDistanceToNow(notif.date, { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {notif.isNew && (
                                                        <div className="w-2 h-2 bg-army-500 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center flex flex-col items-center justify-center text-white/40">
                                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-sm font-semibold">No recent notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-red-400 transition-colors border border-transparent"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold hidden sm:inline-block">Logout</span>
                </button>
            </div>
        </header>
    );
}

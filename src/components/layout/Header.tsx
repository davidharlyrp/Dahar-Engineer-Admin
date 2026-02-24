import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pb } from "../../lib/pb";
import { useTheme } from "../../context/ThemeContext";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

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

                {/* <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-400 rounded-full ring-2 ring-white dark:ring-slate-800"></span>
                </button> */}

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

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Toaster } from 'react-hot-toast';
import { useAdminSettings } from "../../hooks/useAdminSettings";

export function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { compact } = useAdminSettings();
    const location = useLocation();

    return (
        <div className="min-h-screen transition-colors duration-200">
            <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white' }} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex lx:max-w-[1920px] mx-auto">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <main className="flex-1 lg:pl-64 pt-12 min-h-screen">
                    {location.pathname === "/second-brain" ?
                        <div className="flex-1 flex max-h-[100dvh]">
                            <Outlet />
                        </div> :
                        <div className={compact ? "p-2 md:p-3 lg:p-4 w-full mx-auto" : "p-4 md:p-6 lg:p-8 w-full mx-auto"}>
                            <Outlet />
                        </div>}
                </main>
            </div>
        </div>
    );
}


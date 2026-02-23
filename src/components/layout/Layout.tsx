import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen transition-colors duration-200">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex lx:max-w-[1920px] mx-auto">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <main className="flex-1 lg:pl-64 pt-16 min-h-screen">
                    <div className="p-4 md:p-6 lg:p-8 w-full mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

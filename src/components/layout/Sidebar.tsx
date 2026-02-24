import { cn } from "../../lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileUp,
    Briefcase,
    Wallet,
    Touchpad,
    ShoppingBag,
    Settings,
    FileText,
    Activity,
    CreditCard,
    BarChart3,
    Mail
} from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const location = useLocation();

    const navItems = [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "User Management", href: "/users", icon: Users },
        { label: "Course Booking", href: "/courses", icon: BookOpen },
        { label: "Promotional Email", href: "/promotional-email", icon: Mail },
        { label: "Portfolio", href: "/portfolio", icon: Briefcase },
        { label: "Cashflow", href: "/cashflow", icon: Wallet },
        { label: "Cashflow Report", href: "/cashflow-report", icon: BarChart3 },
        { label: "Product Payment", href: "/product-payment", icon: CreditCard },
        { label: "Dahar PDF", href: "/daharpdf", icon: FileText },
        { label: "TerraSim", href: "/terrasim", icon: Activity },
        { label: "Softwares", href: "/software", icon: Touchpad },
        { label: "Products", href: "/products", icon: ShoppingBag },
        { label: "Requested Files", href: "/files", icon: FileUp },
        { label: "Revit Files", href: "/revit-files", icon: FileUp },
        { label: "Resources", href: "/resources", icon: FileUp },
    ];

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-12 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 transition-colors duration-200",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                                    isActive
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-500")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <Link
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Settings
                    </Link>
                </div>
            </aside>
        </>
    );
}

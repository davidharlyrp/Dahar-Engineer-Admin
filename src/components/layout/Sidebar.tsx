import { cn } from "../../lib/utils";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
    Share2,
    CreditCard,
    BarChart3,
    Mail,
    Server,
    Link2,
    NotebookPen,
    Sigma,
    Library,
    FileCode2,
    Brain,
    Network,
    LayoutGrid,
    Layout,
    Layers,
    GraduationCap,
    X,
    FolderOpen,
    Box
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const location = useLocation();
    const { globalUnreadCount } = useChat();

    const navItems = [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "User Management", href: "/users", icon: Users },
        { label: "Course Monitor", href: "/course-monitor", icon: LayoutGrid },
        { label: "Course Booking", href: "/courses", icon: BookOpen },
        { label: "Blog Monitor", href: "/blog-monitor", icon: Layout },
        { label: "DELinxs Monitor", href: "/delinxs-monitor", icon: Share2 },
        { label: "Online Course", href: "/online-course", icon: GraduationCap },
        { label: "Course Report", href: "/course-report", icon: BarChart3 },
        { label: "Cashflow", href: "/cashflow", icon: Wallet },
        { label: "Cashflow Report", href: "/cashflow-report", icon: BarChart3 },
        { label: "Portfolio", href: "/portfolio", icon: Briefcase },
        { label: "Product Payment", href: "/product-payment", icon: CreditCard },
        { label: "Softwares", href: "/software", icon: Touchpad },
        { label: "Dahar PDF", href: "/daharpdf", icon: FileText },
        { label: "TerraSim", href: "/terrasim", icon: Activity },
        { label: "Products", href: "/products", icon: ShoppingBag },
        { label: "Requested Files", href: "/files", icon: FolderOpen },
        { label: "Revit Files", href: "/revit-files", icon: Box },
        { label: "Resources", href: "/resources", icon: FileUp },
        { label: "Promotional Email", href: "/promotional-email", icon: Mail },
        { label: "Server Monitor", href: "/server-monitor", icon: Server },
        { type: "separator" as const, label: "Knowledge Base", icon: Brain },
        { label: "Second Brain 3D", href: "/second-brain", icon: Network },
        { label: "Paper Linker", href: "/paper-linker", icon: Link2 },
        { label: "Eng. Journal", href: "/engineering-log", icon: NotebookPen },
        { label: "Derivations", href: "/derivations", icon: Sigma },
        { label: "Bibliography", href: "/bibliography", icon: Library },
        { label: "Documentation", href: "/documentation", icon: FileCode2 },
        { label: "Geotech Visualizer", href: "/geotech-visualizer", icon: Layers },
    ];

    return (
        <div className="relative z-50">
            {/* Mobile backdrop */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 bottom-0 bg-secondary border-r border-white/5 z-40 flex flex-col transition-all duration-300 ease-in-out h-screen",
                    "w-[100dvw] md:w-[280px]",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo Section */}
                <div className="p-4 flex items-center justify-center">
                    <Link
                        to="/"
                        className="flex items-center gap-2"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="w-4 h-4 flex items-center justify-center">
                            <img src="/Logo.png" alt="Dahar Engineer" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="text-sm font-bold tracking-tight text-white leading-tight">DAHAR</span>
                            <span className="text-sm font-semibold text-muted-foreground leading-tight">ENGINEER ADMIN</span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="h-px bg-white/5 mx-4" />

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
                    {navItems.map((item, index) => {
                        if (item.type === "separator") {
                            const SepIcon = item.icon;
                            return (
                                <div key={`sep-${index}`} className="pt-6 pb-2 px-3">
                                    <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <SepIcon className="w-3 h-3" />
                                        {item.label}
                                    </span>
                                </div>
                            );
                        }

                        const isActive = location.pathname === item.href;
                        const Icon = (item as any).icon;

                        return (
                            <Link
                                key={(item as any).href}
                                to={(item as any).href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "group relative flex items-center gap-0 py-2.5 px-3 rounded-md text-xs font-medium transition-all duration-200",
                                    "hover:bg-white/5 hover:gap-3",
                                    isActive
                                        ? "text-army-400 bg-transparent gap-3"
                                        : "text-foreground/70"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebarActiveIndicator"
                                        className="absolute left-0 inset-y-0 my-auto h-6 w-1 bg-army-500 rounded-r-full"
                                        transition={{ type: 'spring', stiffness: 600, damping: 45 }}
                                    />
                                )}

                                <span className={cn(
                                    "transition-all duration-200 overflow-hidden shrink-0 flex items-center justify-center",
                                    isActive || "w-0 min-w-0 group-hover:w-4 group-hover:min-w-4",
                                    isActive && "w-4 min-w-4"
                                )}>
                                    <Icon className={cn(
                                        "w-4 h-4 shrink-0 transition-opacity duration-200",
                                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    )} />
                                </span>

                                <span className="tracking-tight truncate">{(item as any).label}</span>

                                {(item as any).label === "Messages" && globalUnreadCount > 0 && (
                                    <span className="ml-auto bg-army-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm min-w-4 text-center">
                                        {globalUnreadCount > 99 ? '99+' : globalUnreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-4 border-t border-white/5">
                    <Link
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "group flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200"
                        )}
                    >
                        <Settings className="w-4 h-4 transition-transform group-hover:rotate-45" />
                        Settings
                    </Link>
                </div>
            </aside>
        </div>
    );
}

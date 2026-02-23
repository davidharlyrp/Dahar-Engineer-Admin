import { useState, useEffect } from "react";
import {
    Users, BookOpen, Wallet, Clock,
    Touchpad, ShoppingBag, Briefcase, FileText, Activity, Layers, Package, FileUp, MessageSquare
} from "lucide-react";
import {
    UserService,
    CourseService,
    CashflowService,
    ProductPaymentService,
    SoftwareService,
    PortfolioService,
    ProductService,
    RevitFileService,
    ResourceService,
    DaharPDFService,
    TerraSimService
} from "../services/api";
import { formatDistanceToNow } from "date-fns";

export function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);

    // Top Metrics
    const [totalUsers, setTotalUsers] = useState<number | string>("...");
    const [monthlyRevenue, setMonthlyRevenue] = useState<number | string>("...");
    const [activeCourses, setActiveCourses] = useState<number | string>("...");

    // Secondary Metrics Arrays
    const [assetStats, setAssetStats] = useState<{ label: string, value: number, icon: any }[]>([]);
    const [analyticsStats, setAnalyticsStats] = useState<{ label: string, value: number, icon: any }[]>([]);

    // Activity Feed
    const [recentActivities, setRecentActivities] = useState<{ id: string, date: Date, text: string, type: 'user' | 'course' | 'payment' | 'activity' | 'file' | 'feedback' }[]>([]);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch everything concurrently to minimize loading time
                const [
                    usersRes,
                    coursesRes,
                    cashflowRes,
                    paymentsRes,
                    softwareRes,
                    portfolioRes,
                    productsRes,
                    revitRes,
                    resourcesRes,
                    daharPdfRes,
                    terrasimRunsRes,
                    terrasimProjectsRes,
                    terrasimFeedbackRes
                ] = await Promise.allSettled([
                    UserService.getUsers(1, 10), // Get 10 for activity feed
                    CourseService.getBookings(1, 10), // Get 10 for activity
                    CashflowService.getStats(),
                    ProductPaymentService.getPayments(1, 10), // Get 10 for activity
                    SoftwareService.getSoftwares(1, 1),
                    PortfolioService.getPortfolio(1, 1),
                    ProductService.getProducts(1, 1),
                    RevitFileService.getRevitFiles(1, 10), // Get 10 for activity feed
                    ResourceService.getResources(1, 10), // Get 10 for activity feed
                    DaharPDFService.getHistory(1, 1),
                    TerraSimService.getRunningHistory(1, 10), // Get 10 for activity feed
                    TerraSimService.getProjects(1, 1),
                    TerraSimService.getFeedback(1, 10) // Get 10 for activity feed
                ]);

                if (!isMounted) return;

                // 1. Process Top Metrics
                const usersCount = usersRes.status === "fulfilled" ? usersRes.value.totalItems : 0;
                setTotalUsers(usersCount);

                const courseCount = coursesRes.status === "fulfilled" ? coursesRes.value.totalItems : 0;
                setActiveCourses(courseCount);

                const cashflowIncome = cashflowRes.status === "fulfilled" ? cashflowRes.value.income : 0;

                // Calculate total revenue from products (successful only)
                let productRevenue = 0;
                if (paymentsRes.status === "fulfilled") {
                    const successfulPayments = paymentsRes.value.items.filter(p => p.payment_status?.toLowerCase() === 'paid' || p.payment_status?.toLowerCase() === 'settled');
                    productRevenue = successfulPayments.reduce((sum, current) => sum + (current.final_amount || 0), 0);

                    // Fallback: If pagination only brought 10, we might need a dedicated endpoint for full revenue, 
                    // but for now, we'll use an aggregate from the recent fetch or assume it's calculated elsewhere.
                    // To be highly accurate, Cashflow should ideally represent all income if product payments are recorded there.
                    // Assuming they are distinct for this dense dashboard:
                }

                // For a denser top metric, we will just use Cashflow Income for now as the primary "Revenue" indicator,
                // or sum them if they are separate domains. Let's sum them for maximum density.
                setMonthlyRevenue(cashflowIncome + productRevenue);

                // 2. Process Secondary Metrics (Assets)
                setAssetStats([
                    { label: "Portfolio Projects", value: portfolioRes.status === "fulfilled" ? portfolioRes.value.totalItems : 0, icon: Briefcase },
                    { label: "Digital Products", value: productsRes.status === "fulfilled" ? productsRes.value.totalItems : 0, icon: ShoppingBag },
                    { label: "Software Hub", value: softwareRes.status === "fulfilled" ? softwareRes.value.totalItems : 0, icon: Touchpad },
                    { label: "Revit Library", value: revitRes.status === "fulfilled" ? revitRes.value.totalItems : 0, icon: Layers },
                    { label: "PDF Resources", value: resourcesRes.status === "fulfilled" ? resourcesRes.value.totalItems : 0, icon: FileUp },
                ]);

                // 3. Process Secondary Metrics (Analytics)
                setAnalyticsStats([
                    { label: "Dahar PDF Tool Uses", value: daharPdfRes.status === "fulfilled" ? daharPdfRes.value.totalItems : 0, icon: FileText },
                    { label: "TerraSim Simulations", value: terrasimRunsRes.status === "fulfilled" ? terrasimRunsRes.value.totalItems : 0, icon: Activity },
                    { label: "TerraSim Projects Saved", value: terrasimProjectsRes.status === "fulfilled" ? terrasimProjectsRes.value.totalItems : 0, icon: Package },
                ]);

                // 4. Build Unified Recent Activity Feed
                const activities: { id: string, date: Date, text: string, type: 'user' | 'course' | 'payment' | 'activity' | 'file' | 'feedback' }[] = [];

                if (usersRes.status === "fulfilled") {
                    usersRes.value.items.slice(0, 5).forEach(user => {
                        activities.push({
                            id: `user-${user.id}`,
                            date: new Date(user.created),
                            text: `${user.name || user.email} registered as a new user.`,
                            type: 'user'
                        });
                    });
                }

                if (coursesRes.status === "fulfilled") {
                    coursesRes.value.items.slice(0, 5).forEach(booking => {
                        activities.push({
                            id: `booking-${booking.id}`,
                            date: new Date(booking.created),
                            text: `${booking.full_name} booked "${booking.course_title}" session.`,
                            type: 'course'
                        });
                    });
                }

                if (paymentsRes.status === "fulfilled") {
                    paymentsRes.value.items.slice(0, 5).forEach(payment => {
                        activities.push({
                            id: `payment-${payment.id}`,
                            date: new Date(payment.payment_date || payment.created),
                            text: `Payment of Rp ${payment.final_amount.toLocaleString()} received for ${payment.product_name}.`,
                            type: 'payment'
                        });
                    });
                }

                if (terrasimRunsRes.status === "fulfilled") {
                    terrasimRunsRes.value.items.slice(0, 5).forEach(run => {
                        const userName = run.expand?.user_id?.name || "A user";
                        activities.push({
                            id: `terrasim-run-${run.id}`,
                            date: new Date(run.created),
                            text: `${userName} ran a TerraSim analysis.`,
                            type: 'activity'
                        });
                    });
                }

                if (daharPdfRes.status === "fulfilled") {
                    daharPdfRes.value.items.slice(0, 5).forEach(run => {
                        const userName = run.expand?.user?.name || "A user";
                        activities.push({
                            id: `daharpdf-run-${run.id}`,
                            date: new Date(run.created),
                            text: `${userName} ran a ${run.tool} tool from Dahar PDF.`,
                            type: 'activity'
                        });
                    });
                }

                if (terrasimFeedbackRes.status === "fulfilled") {
                    terrasimFeedbackRes.value.items.slice(0, 5).forEach(feedback => {
                        const userName = feedback.expand?.user?.name || "A user";
                        activities.push({
                            id: `terrasim-feedback-${feedback.id}`,
                            date: new Date(feedback.created),
                            text: `${userName} submitted TerraSim feedback: "${feedback.subject}".`,
                            type: 'feedback'
                        });
                    });
                }

                if (revitRes.status === "fulfilled") {
                    revitRes.value.items.slice(0, 5).forEach(file => {
                        activities.push({
                            id: `revit-${file.id}`,
                            date: new Date(file.created),
                            text: `New Revit file uploaded: ${file.display_name}.`,
                            type: 'file'
                        });
                    });
                }

                if (resourcesRes.status === "fulfilled") {
                    resourcesRes.value.items.slice(0, 5).forEach(res => {
                        activities.push({
                            id: `resource-${res.id}`,
                            date: new Date(res.created),
                            text: `New Resource uploaded: ${res.title}.`,
                            type: 'file'
                        });
                    });
                }

                // Sort descending by date and take top 8
                activities.sort((a, b) => b.date.getTime() - a.date.getTime());
                setRecentActivities(activities.slice(0, 8));

            } catch (error) {
                console.error("Dashboard: Error building dashboard data:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchDashboardData();
        return () => { isMounted = false; };
    }, []);

    const topStats = [
        {
            label: "Total Registered Users",
            value: typeof totalUsers === 'number' ? totalUsers.toLocaleString() : totalUsers,
            icon: Users,
        },
        {
            label: "Total Course Bookings",
            value: typeof activeCourses === 'number' ? activeCourses.toLocaleString() : activeCourses,
            icon: BookOpen,
        },
        {
            label: "Combined System Revenue",
            value: typeof monthlyRevenue === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 }).format(monthlyRevenue) : monthlyRevenue,
            icon: Wallet,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">System Dashboard</h1>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Live Data Sync</span>
                </div>
            </div>

            {/* Top KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topStats.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <stat.icon className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                                <stat.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                            </div>
                            <h3 className="font-bold text-slate-600 dark:text-slate-400">{stat.label}</h3>
                        </div>

                        <div className="flex items-baseline gap-3 relative z-10 mt-2">
                            {isLoading ? (
                                <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            ) : (
                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{stat.value}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Secondary Metrics: Assets */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                            <Database className="w-5 h-5 text-slate-400" /> Managed Assets Overview
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse h-24"></div>
                                ))
                            ) : (
                                assetStats.map((stat, idx) => (
                                    <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
                                        <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{stat.value}</span>
                                        <span className="text-xs font-semibold text-slate-500 mt-1">{stat.label}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-slate-400" /> Platform Usage Analytics
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse h-24"></div>
                                ))
                            ) : (
                                analyticsStats.map((stat, idx) => (
                                    <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
                                        <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{stat.value}</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">{stat.label}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Unified Recent Activity */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors flex flex-col h-full">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-400" /> Global Recent Activity
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            ))
                        ) : recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                                        {activity.type === 'user' && <Users className="w-4 h-4 text-slate-500" />}
                                        {activity.type === 'course' && <BookOpen className="w-4 h-4 text-slate-500" />}
                                        {activity.type === 'payment' && <Wallet className="w-4 h-4 text-slate-500" />}
                                        {activity.type === 'activity' && <Activity className="w-4 h-4 text-slate-500" />}
                                        {activity.type === 'file' && <FileUp className="w-4 h-4 text-slate-500" />}
                                        {activity.type === 'feedback' && <MessageSquare className="w-4 h-4 text-slate-500" />}
                                    </div>
                                    <div>
                                        <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-snug">{activity.text}</p>
                                        <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold mt-1">
                                            {formatDistanceToNow(activity.date, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center text-slate-500">
                                <p className="text-sm font-bold">No recent activities found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Temporary custom icons mimicking lucide for missing imports above if any
function Database(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
    );
}

function LineChart(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
        </svg>
    );
}

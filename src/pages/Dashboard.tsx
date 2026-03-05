import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, BookOpen, Wallet, Clock,
    Touchpad, ShoppingBag, Briefcase, FileText, Activity, Layers, Package, FileUp, MessageSquare, MessageCircle, Star,
    Database, LineChart, ChevronRight, TrendingUp
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
    TerraSimService,
    BlogCommentService,
    ReviewService
} from "../services/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";

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
    const [recentActivities, setRecentActivities] = useState<{ id: string, date: Date, text: string, type: 'user' | 'course' | 'payment' | 'activity' | 'file' | 'feedback' | 'comment' | 'review' }[]>([]);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
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
                    terrasimFeedbackRes,
                    commentsRes,
                    reviewsRes,
                    allPaidBookingsRes
                ] = await Promise.allSettled([
                    UserService.getUsers(1, 10),
                    CourseService.getBookings(1, 50),
                    CashflowService.getStats(),
                    ProductPaymentService.getPayments(1, 10),
                    SoftwareService.getSoftwares(1, 1),
                    PortfolioService.getPortfolio(1, 1),
                    ProductService.getProducts(1, 1),
                    RevitFileService.getRevitFiles(1, 10),
                    ResourceService.getResources(1, 10),
                    DaharPDFService.getHistory(1, 1),
                    TerraSimService.getRunningHistory(1, 10),
                    TerraSimService.getProjects(1, 1),
                    TerraSimService.getFeedback(1, 10),
                    BlogCommentService.getComments(1, 10),
                    ReviewService.getReviews(1, 10),
                    CourseService.getPaidBookings()
                ]);

                if (!isMounted) return;

                const usersCount = usersRes.status === "fulfilled" ? usersRes.value.totalItems : 0;
                setTotalUsers(usersCount);

                const courseCount = coursesRes.status === "fulfilled" ? coursesRes.value.totalItems : 0;
                setActiveCourses(courseCount);

                const cashflowIncome = cashflowRes.status === "fulfilled" ? cashflowRes.value.income : 0;

                let productRevenue = 0;
                if (paymentsRes.status === "fulfilled") {
                    const successfulPayments = paymentsRes.value.items.filter(p => p.payment_status?.toLowerCase() === 'paid' || p.payment_status?.toLowerCase() === 'settled');
                    productRevenue = successfulPayments.reduce((sum, current) => sum + (current.final_amount || 0), 0);
                }

                setMonthlyRevenue(cashflowIncome + productRevenue);

                setAssetStats([
                    { label: "Portfolio Projects", value: portfolioRes.status === "fulfilled" ? portfolioRes.value.totalItems : 0, icon: Briefcase },
                    { label: "Digital Products", value: productsRes.status === "fulfilled" ? productsRes.value.totalItems : 0, icon: ShoppingBag },
                    { label: "Software Hub", value: softwareRes.status === "fulfilled" ? softwareRes.value.totalItems : 0, icon: Touchpad },
                    { label: "Revit Library", value: revitRes.status === "fulfilled" ? revitRes.value.totalItems : 0, icon: Layers },
                    { label: "PDF Resources", value: resourcesRes.status === "fulfilled" ? resourcesRes.value.totalItems : 0, icon: FileUp },
                ]);

                setAnalyticsStats([
                    { label: "Dahar PDF Tool Uses", value: daharPdfRes.status === "fulfilled" ? daharPdfRes.value.totalItems : 0, icon: FileText },
                    { label: "TerraSim Simulations", value: terrasimRunsRes.status === "fulfilled" ? terrasimRunsRes.value.totalItems : 0, icon: Activity },
                    { label: "TerraSim Projects Saved", value: terrasimProjectsRes.status === "fulfilled" ? terrasimProjectsRes.value.totalItems : 0, icon: Package },
                ]);

                const activities: { id: string, date: Date, text: string, type: 'user' | 'course' | 'payment' | 'activity' | 'file' | 'feedback' | 'comment' | 'review' }[] = [];

                const bookingNameMap: Record<string, string> = {};
                if (allPaidBookingsRes.status === "fulfilled") {
                    allPaidBookingsRes.value.forEach(b => {
                        if (b.booking_group_id) bookingNameMap[b.booking_group_id] = b.full_name;
                    });
                }

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

                if (commentsRes.status === "fulfilled") {
                    commentsRes.value.items.slice(0, 5).forEach(comment => {
                        const userName = comment.expand?.user_id?.name || "A user";
                        const blogTitle = comment.expand?.blog_id?.title || "a blog post";
                        activities.push({
                            id: `comment-${comment.id}`,
                            date: new Date(comment.created),
                            text: `${userName} commented on "${blogTitle}".`,
                            type: 'comment'
                        });
                    });
                }

                if (reviewsRes.status === "fulfilled") {
                    reviewsRes.value.items.slice(0, 5).forEach(review => {
                        const userName = bookingNameMap[review.booking_group_id] ||
                            review.expand?.booking_group_id?.full_name ||
                            ReviewService.getDisplayName(review.expand?.user_id);
                        activities.push({
                            id: `review-${review.id}`,
                            date: new Date(review.created),
                            text: `${userName} submitted a ${review.rating}-star review.`,
                            type: 'review'
                        });
                    });
                }

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
            trend: "+12.5%",
            color: "army"
        },
        {
            label: "Course Bookings",
            value: typeof activeCourses === 'number' ? activeCourses.toLocaleString() : activeCourses,
            icon: BookOpen,
            trend: "+5.2%",
            color: "slate"
        },
        {
            label: "Total System Revenue",
            value: typeof monthlyRevenue === 'number' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumSignificantDigits: 3 }).format(monthlyRevenue) : monthlyRevenue,
            icon: Wallet,
            trend: "+8.1%",
            color: "army"
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "cubic-bezier(0.16, 1, 0.3, 1)" as any
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 p-6 lg:p-8"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Comprehensive overview of your engineering ecosystem
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-army-400 bg-army-900/20 border border-army-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-army-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-army-500"></span>
                    </span>
                    Live System Sync
                </div>
            </motion.div>

            {/* Top KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topStats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className="group relative bg-secondary border border-white/5 rounded-2xl p-6 overflow-hidden transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <stat.icon size={120} />
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "p-3 rounded-xl border transition-colors",
                                stat.color === "army"
                                    ? "bg-army-500/10 border-army-500/20 group-hover:bg-army-500/20"
                                    : "bg-white/5 border-white/10 group-hover:bg-white/10"
                            )}>
                                <stat.icon className={cn(
                                    "w-6 h-6",
                                    stat.color === "army" ? "text-army-400" : "text-white"
                                )} />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-army-400 bg-army-400/10 px-2 py-1 rounded-md">
                                <TrendingUp className="w-3 h-3" />
                                {stat.trend}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</h3>
                            <div className="flex items-baseline gap-2">
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse"></div>
                                ) : (
                                    <span className="text-3xl font-black text-white tracking-tighter italic">{stat.value}</span>
                                )}
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-army-600/50 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Secondary Metrics: Assets & Analytics */}
                <div className="lg:col-span-8 space-y-8">
                    <motion.div variants={itemVariants} className="bg-secondary rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                                <Database className="w-4 h-4 text-army-500" /> Asset Distribution
                            </h2>
                            <Link to="/resources" className="text-[10px] font-bold text-army-400 hover:text-army-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                                View All <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={`skeleton-asset-${i}`} className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse h-24"></div>
                                    ))
                                ) : (
                                    assetStats.map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/[0.05] transition-all group"
                                        >
                                            <stat.icon className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-army-400 transition-colors" />
                                            <span className="text-xl font-black text-white tracking-tighter italic leading-none">{stat.value}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground mt-2 uppercase tracking-tight">{stat.label}</span>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-secondary rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                                <LineChart className="w-4 h-4 text-army-500" /> Performance Analytics
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={`skeleton-analytics-${i}`} className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse h-28"></div>
                                ))
                            ) : (
                                analyticsStats.map((stat, idx) => (
                                    <div key={idx} className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-white/5 rounded-xl text-muted-foreground group-hover:text-army-400 group-hover:bg-army-500/10 transition-all">
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-[10px] font-bold text-army-500 bg-army-500/10 px-2 py-0.5 rounded uppercase tracking-widest">Active</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</div>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Unified Recent Activity */}
                <motion.div variants={itemVariants} className="lg:col-span-4 bg-secondary rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                            <Activity className="w-4 h-4 text-army-500" /> Transaction Log
                        </h2>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[400px] scrollbar-hide space-y-6">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={`skeleton-activity-${i}`} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse shrink-0" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-white/5 rounded w-full animate-pulse"></div>
                                            <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))
                            ) : recentActivities.length > 0 ? (
                                recentActivities.map((activity, idx) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-start gap-4 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0 border border-white/10 group-hover:border-army-500/30 group-hover:bg-army-500/10 transition-all">
                                            {activity.type === 'user' && <Users className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                            {activity.type === 'course' && <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                            {activity.type === 'payment' && <Wallet className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                            {activity.type === 'activity' && <Activity className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                            {activity.type === 'file' && <FileUp className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                            {activity.type === 'feedback' && <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                            {activity.type === 'comment' && <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                            {activity.type === 'review' && <Star className="w-4 h-4 text-muted-foreground group-hover:text-army-400" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-white text-xs font-semibold leading-relaxed line-clamp-2">{activity.text}</p>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(activity.date, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                    <Activity className="w-8 h-8 mb-4 " />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Logs</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center mt-auto">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">Real-time Event Stream</span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

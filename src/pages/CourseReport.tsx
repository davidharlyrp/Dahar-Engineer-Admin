import { useEffect, useState, useMemo } from "react";
import { type BookingRecord, type SessionReviewRecord, ReviewService } from "../services/api";
import { pb } from "../lib/pb";
import { cn } from "../lib/utils";
import { useTheme } from "../context/ThemeContext";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    AreaChart,
    Area
} from "recharts";
import {
    TrendingUp,
    Users,
    BookOpen,
    PieChart as PieChartIcon,
    BarChart2,
    Calendar,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown,
    Star
} from "lucide-react";

// --- Types ---
type TabType = "trends" | "distribution" | "users" | "mentors" | "scheduling" | "retention" | "status" | "reviews";
type RangeType = "7d" | "14d" | "30d" | "1y" | "this_month" | "this_year" | "custom";

interface TimeDataPoint {
    name: string;
    bookings: number;
    amount: number;
}

// --- Helpers ---
const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num);
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

// --- Sub-components ---

const StatCard = ({ title, value, icon: Icon, subValue, subValueType }: {
    title: string;
    value: string | number;
    icon: any;
    subValue?: string;
    subValueType?: "up" | "down" | "neutral"
}) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Icon className="w-5 h-5 text-slate-900 dark:text-slate-100" />
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
            {subValue && (
                <div className={cn(
                    "flex items-center text-xs font-medium",
                    subValueType === "up" ? "text-green-600 dark:text-green-400" :
                        subValueType === "down" ? "text-red-600 dark:text-red-400" : "text-slate-500"
                )}>
                    {subValueType === "up" && <ArrowUpRight className="w-3 h-3 mr-1" />}
                    {subValueType === "down" && <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {subValue}
                </div>
            )}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const tooltipLabel = label || payload[0]?.name || payload[0]?.payload?.name;

        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl outline-none">
                {tooltipLabel && <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{tooltipLabel}</p>}
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs py-1">
                        <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">
                            {entry.dataKey === 'amount' ? formatCurrency(entry.value) : formatNumber(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function CourseReport() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<TabType>("trends");
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Range state
    const [range, setRange] = useState<RangeType>("1y");
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");
    const [showRangeMenu, setShowRangeMenu] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await pb.collection("bookings").getFullList<BookingRecord>({
                filter: 'payment_status = "paid"',
                sort: "created",
            });
            setBookings(result);
        } catch (error) {
            console.error("CourseReport: Error fetching bookings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Data Processing ---

    const filteredBookings = useMemo(() => {
        const now = new Date();

        let startLimit: Date | null = null;
        let endLimit: Date | null = null;

        switch (range) {
            case "7d":
                startLimit = new Date(now);
                startLimit.setDate(now.getDate() - 7);
                break;
            case "14d":
                startLimit = new Date(now);
                startLimit.setDate(now.getDate() - 14);
                break;
            case "30d":
                startLimit = new Date(now);
                startLimit.setDate(now.getDate() - 30);
                break;
            case "1y":
                startLimit = new Date(now);
                startLimit.setFullYear(now.getFullYear() - 1);
                break;
            case "this_month":
                startLimit = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case "this_year":
                startLimit = new Date(now.getFullYear(), 0, 1);
                break;
            case "custom":
                if (customStart) startLimit = new Date(customStart);
                if (customEnd) {
                    endLimit = new Date(customEnd);
                    endLimit.setHours(23, 59, 59, 999);
                }
                break;
        }

        return bookings.filter(b => {
            const dateStr = b.session_date || b.created; // Fallback to created if session_date is missing
            const sessionDate = new Date(dateStr);
            if (startLimit && sessionDate < startLimit) return false;
            if (endLimit && sessionDate > endLimit) return false;
            return true;
        });
    }, [bookings, range, customStart, customEnd]);

    const timeData = useMemo(() => {
        const monthly: Record<string, TimeDataPoint> = {};
        filteredBookings.forEach(b => {
            const dateStr = b.session_date || b.created;
            const date = new Date(dateStr);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            if (!monthly[key]) {
                monthly[key] = { name: monthName, bookings: 0, amount: 0 };
            }
            monthly[key].bookings += 1;
            monthly[key].amount += b.total_amount || 0;
        });

        return Object.keys(monthly).sort().map(key => monthly[key]);
    }, [filteredBookings]);

    const distributionData = useMemo(() => {
        const counts: Record<string, number> = {};
        // Use all bookings for distribution to give global context, or filtered?
        // Let's use filtered for consistency if user changes range
        filteredBookings.forEach(b => {
            const type = b.course_type || "Unknown";
            counts[type] = (counts[type] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredBookings]);

    const topCourseData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredBookings.forEach(b => {
            const title = b.course_title || "Unknown";
            counts[title] = (counts[title] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [filteredBookings]);

    const userData = useMemo(() => {
        const users: Record<string, { total: number; courses: number; consultations: number; email: string }> = {};
        filteredBookings.forEach(b => {
            const name = b.full_name || "Anonymous";
            if (!users[name]) {
                users[name] = { total: 0, courses: 0, consultations: 0, email: b.email };
            }
            users[name].total += 1;
            if (b.course_type?.toLowerCase().includes('course')) {
                users[name].courses += 1;
            } else if (b.course_type?.toLowerCase().includes('consultation')) {
                users[name].consultations += 1;
            }
        });

        return Object.entries(users)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [filteredBookings]);

    const mentorData = useMemo(() => {
        const mentors: Record<string, number> = {};
        filteredBookings.forEach(b => {
            const name = b.mentor_name || "No Mentor";
            mentors[name] = (mentors[name] || 0) + 1;
        });

        return Object.entries(mentors)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredBookings]);

    const schedulingData = useMemo(() => {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayCounts: Record<string, number> = {};
        const hourCounts: Record<string, number> = {};

        // Initialize
        days.forEach(d => dayCounts[d] = 0);
        for (let i = 0; i < 24; i++) hourCounts[`${String(i).padStart(2, '0')}:00`] = 0;

        filteredBookings.forEach(b => {
            const dateStr = b.session_date || b.created;
            const date = new Date(dateStr);
            const dayName = days[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;

            if (b.session_time && b.session_time.includes(':')) {
                const hour = b.session_time.split(':')[0];
                if (!isNaN(parseInt(hour))) {
                    const hourKey = `${hour.padStart(2, '0')}:00`;
                    hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
                }
            }
        });

        const dayList = days.map(name => ({ name, value: dayCounts[name] }));
        const hourList = Object.entries(hourCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return { dayList, hourList };
    }, [filteredBookings]);

    const retentionData = useMemo(() => {
        const userBookings: Record<string, number> = {};
        filteredBookings.forEach(b => {
            userBookings[b.user_id] = (userBookings[b.user_id] || 0) + 1;
        });

        const counts = Object.values(userBookings);
        const totalStudents = counts.length;
        const returningStudents = counts.filter(c => c > 1).length;
        const singleStudents = totalStudents - returningStudents;

        const pieData = [
            { name: "One-time Students", value: singleStudents },
            { name: "Returning Students", value: returningStudents }
        ];

        // Distribution of bookings per student
        const freq: Record<string, number> = {
            "1 Booking": 0,
            "2-3 Bookings": 0,
            "4-5 Bookings": 0,
            "6+ Bookings": 0
        };

        counts.forEach(c => {
            if (c === 1) freq["1 Booking"]++;
            else if (c <= 3) freq["2-3 Bookings"]++;
            else if (c <= 5) freq["4-5 Bookings"]++;
            else freq["6+ Bookings"]++;
        });

        const barData = Object.entries(freq).map(([name, value]) => ({ name, value }));

        return { totalStudents, returningStudents, singleStudents, pieData, barData };
    }, [filteredBookings]);

    const statusData = useMemo(() => {
        const statuses: Record<string, number> = {};
        filteredBookings.forEach(b => {
            const status = b.booking_status || "Unknown";
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
            statuses[capitalizedStatus] = (statuses[capitalizedStatus] || 0) + 1;
        });

        return Object.entries(statuses)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredBookings]);

    const [reviews, setReviews] = useState<SessionReviewRecord[]>([]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await ReviewService.getAllReviews();
                setReviews(data);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            }
        };
        fetchReviews();
    }, []);

    const reviewData = useMemo(() => {
        // Rating Distribution
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;

        reviews.forEach(r => {
            const rating = Math.round(r.rating);
            if (dist[rating] !== undefined) dist[rating]++;
            totalRating += r.rating;
        });

        const ratingDist = [5, 4, 3, 2, 1].map(star => ({
            name: `${star} Stars`,
            value: dist[star]
        }));

        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

        // Unreviewed Groups
        // Find all unique booking groups from filtered paid bookings
        const groupMap: Record<string, { title: string, user: string, mentor: string, sessions: number }> = {};
        filteredBookings.forEach(b => {
            if (b.booking_group_id) {
                if (!groupMap[b.booking_group_id]) {
                    groupMap[b.booking_group_id] = {
                        title: b.course_title,
                        user: b.full_name,
                        mentor: b.mentor_name,
                        sessions: b.total_sessions || 1
                    };
                }
            }
        });

        // Check which groups have reviews
        const reviewedGroupIds = new Set(reviews.map(r => r.booking_group_id));
        const unreviewedGroups = Object.entries(groupMap)
            .filter(([id]) => !reviewedGroupIds.has(id))
            .map(([id, info]) => ({ id, ...info }));

        return { ratingDist, averageRating, totalReviews: reviews.length, unreviewedGroups, allReviews: reviews, groupMap };
    }, [reviews, filteredBookings]);

    const stats = useMemo(() => {
        return {
            totalBookings: filteredBookings.length,
            totalRevenue: filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
            uniqueUsers: new Set(filteredBookings.map(b => b.user_id)).size,
            coursesCount: filteredBookings.filter(b => b.course_type?.toLowerCase().includes('course')).length,
            consultCount: filteredBookings.filter(b => b.course_type?.toLowerCase().includes('consultation')).length
        };
    }, [filteredBookings]);

    const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#1e293b", "#475569"];
    const textTheme = isDark ? '#f1f5f9' : '#64748b';
    const gridTheme = isDark ? '#334155' : '#e2e8f0';

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
                <span className="text-sm font-medium">Analyzing Course Data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Course Analytics</h1>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Paid Bookings"
                    value={formatNumber(stats.totalBookings)}
                    icon={BookOpen}
                    subValue={`${formatNumber(stats.coursesCount)} Courses / ${formatNumber(stats.consultCount)} Consults`}
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={TrendingUp}
                    subValueType="up"
                    subValue="All time gross"
                />
                <StatCard
                    title="Active Students"
                    value={formatNumber(stats.uniqueUsers)}
                    icon={Users}
                    subValue="Distinct user accounts"
                />
                <StatCard
                    title="Top Choice"
                    value={topCourseData[0]?.name || "N/A"}
                    icon={Target}
                    subValue={`${topCourseData[0]?.value || 0} bookings total`}
                />
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 px-4">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
                        {[
                            { id: "trends", label: "Booking Trends", icon: TrendingUp },
                            { id: "distribution", label: "Course Popularity", icon: PieChartIcon },
                            { id: "users", label: "Top Students", icon: Users },
                            { id: "mentors", label: "Mentor Performance", icon: BarChart2 },
                            { id: "scheduling", label: "Scheduling Analysis", icon: Calendar },
                            { id: "retention", label: "Student Retention", icon: Target },
                            { id: "status", label: "Booking Status", icon: BarChart2 },
                            { id: "reviews", label: "Session Reviews", icon: Star },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-8 py-4">
                    {/* Trends Tab */}
                    {activeTab === "trends" && (
                        <div className="space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Booking Growth</h2>
                                    <p className="text-sm text-slate-500">Monthly evolution of course bookings.</p>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowRangeMenu(!showRangeMenu)}
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {range === "7d" ? "Last 7 Days" :
                                                range === "14d" ? "Last 14 Days" :
                                                    range === "30d" ? "Last 30 Days" :
                                                        range === "1y" ? "Last 1 Year" :
                                                            range === "this_month" ? "This Month" :
                                                                range === "this_year" ? "This Year" : "Custom Range"}
                                        </span>
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", showRangeMenu && "rotate-180")} />
                                    </button>

                                    {showRangeMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in duration-200">
                                            {[
                                                { id: "7d", label: "Last 7 Days" },
                                                { id: "14d", label: "Last 14 Days" },
                                                { id: "30d", label: "Last 30 Days" },
                                                { id: "1y", label: "Last 1 Year" },
                                                { id: "this_month", label: "This Month" },
                                                { id: "this_year", label: "This Year" },
                                                { id: "custom", label: "Custom Range" },
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setRange(item.id as RangeType);
                                                        if (item.id !== "custom") setShowRangeMenu(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                                        range === item.id
                                                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                    )}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}

                                            {range === "custom" && (
                                                <div className="p-3 border-t border-slate-100 dark:border-slate-700 mt-1 space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-slate-400">Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={customStart}
                                                            onChange={(e) => setCustomStart(e.target.value)}
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-slate-400">End Date</label>
                                                        <input
                                                            type="date"
                                                            value={customEnd}
                                                            onChange={(e) => setCustomEnd(e.target.value)}
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setShowRangeMenu(false)}
                                                        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-1.5 rounded-md text-xs font-bold"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="h-[450px] w-full py-12">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeData}>
                                        <defs>
                                            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={isDark ? "#f1f5f9" : "#0f172a"} stopOpacity={0.1} />
                                                <stop offset="95%" stopColor={isDark ? "#f1f5f9" : "#0f172a"} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridTheme} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                        <Area type="monotone" dataKey="bookings" name="Total Bookings" stroke={isDark ? "#f1f5f9" : "#0f172a"} strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Distribution Tab */}
                    {activeTab === "distribution" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Types Distribution</h2>
                                    <p className="text-sm text-slate-500">Comparison by service category.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={distributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {distributionData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ color: textTheme }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Top 10 Courses</h2>
                                    <p className="text-sm text-slate-500">Most requested specific courses.</p>
                                </div>
                                <div className="space-y-4">
                                    {topCourseData.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[300px]">{item.name}</span>
                                                <span className="font-bold text-slate-900 dark:text-slate-100">{item.value} bookings</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-1000"
                                                    style={{ width: `${(item.value / stats.totalBookings) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Students Tab */}
                    {activeTab === "users" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Most Active Students</h2>
                                <p className="text-sm text-slate-500">Top 10 users by number of taken courses and consultations.</p>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={userData} layout="vertical" margin={{ left: 50, right: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridTheme} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 11 }} width={120} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="courses" name="Courses" stackId="a" fill={isDark ? "#f1f5f9" : "#0f172a"} barSize={20} />
                                        <Bar dataKey="consultations" name="Consultations" stackId="a" fill={isDark ? "#64748b" : "#64748b"} radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Mentors Tab */}
                    {activeTab === "mentors" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mentor Activity</h2>
                                <p className="text-sm text-slate-500">Comparison of bookings assigned to each mentor.</p>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mentorData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridTheme} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Total Bookings" fill={isDark ? "#f1f5f9" : "#0f172a"} radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Scheduling Tab */}
                    {activeTab === "scheduling" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Day Distribution</h2>
                                    <p className="text-sm text-slate-500">Bookings by day of week.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={schedulingData.dayList}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridTheme} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 11 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 11 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Bookings" fill={isDark ? "#f1f5f9" : "#0f172a"} radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Peak Hours</h2>
                                    <p className="text-sm text-slate-500">Most popular session times.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={schedulingData.hourList}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridTheme} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 10 }} interval={2} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 11 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Bookings" fill="#64748b" radius={[4, 4, 0, 0]} barSize={15} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Retention Tab */}
                    {activeTab === "retention" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-3">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Loyalty</h2>
                                    <p className="text-sm text-slate-500">One-time vs returning students.</p>
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={retentionData.pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell key="cell-0" fill={isDark ? "#e2e8f0" : "#0f172a"} />
                                                <Cell key="cell-1" fill="#64748b" />
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ color: textTheme }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                    <p className="text-sm text-slate-500">Retention Rate</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {retentionData.totalStudents > 0
                                            ? `${((retentionData.returningStudents / retentionData.totalStudents) * 100).toFixed(1)}%`
                                            : "0%"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Booking Frequency</h2>
                                    <p className="text-sm text-slate-500">Number of sessions per student.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={retentionData.barData} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridTheme} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 11 }} width={100} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Students" fill={isDark ? "#f1f5f9" : "#0f172a"} radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Booking Status Tab */}
                    {activeTab === "status" && (
                        <div className="space-y-6 text-center lg:text-left">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Booking Status Distribution</h2>
                                <p className="text-sm text-slate-500">Operational status of paid bookings.</p>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-4 h-fit">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridTheme} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 11 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: textTheme, fontSize: 12 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar
                                                dataKey="value"
                                                name="Bookings"
                                                fill={isDark ? "#f1f5f9" : "#0f172a"}
                                                radius={[4, 4, 0, 0]}
                                                barSize={50}
                                            >
                                                {statusData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            entry.name === 'Completed' || entry.name === 'Finished' ? '#22c55e' :
                                                                entry.name === 'Cancelled' ? '#ef4444' :
                                                                    entry.name === 'Ongoing' ? '#3b82f6' :
                                                                        entry.name === 'Confirmed' ? '#f59e0b' :
                                                                            isDark ? "#f1f5f9" : "#0f172a"
                                                        }
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-rows gap-4 pt-4 h-fit">
                                    {statusData.map((stat, index) => (
                                        <div key={index} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{stat.name}</p>
                                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === "reviews" && (
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Rating Distribution</h2>
                                        <p className="text-sm text-slate-500">Breakdown of student feedback scores.</p>
                                    </div>
                                    <div className="flex items-center gap-8 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="text-center px-4">
                                            <p className="text-4xl font-black text-slate-900 dark:text-slate-100">{reviewData.averageRating}</p>
                                            <div className="flex items-center justify-center gap-0.5 text-slate-500 my-1">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={14} fill={s <= Math.round(Number(reviewData.averageRating)) ? "currentColor" : "none"} />
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{reviewData.totalReviews} Reviews</p>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const count = reviewData.ratingDist.find(d => d.name === `${star} Stars`)?.value || 0;
                                                const percent = reviewData.totalReviews > 0 ? (count / reviewData.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-3">
                                                        <span className="text-[11px] font-bold text-slate-500 w-4">{star}</span>
                                                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-slate-500 rounded-full"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 w-6 text-right">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-rose-500">Unreviewed Groups</h2>
                                        <p className="text-sm text-slate-500">Paid groups that haven't received any feedback yet.</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                        <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                                            {reviewData.unreviewedGroups.length > 0 ? (
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                                        <tr className="text-left text-[11px] uppercase text-slate-400">
                                                            <th className="px-4 py-3 font-bold">Course</th>
                                                            <th className="px-4 py-3 font-bold">Student</th>
                                                            <th className="px-4 py-3 font-bold text-right">ID</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {reviewData.unreviewedGroups.map(group => (
                                                            <tr key={group.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[150px]" title={group.title}>{group.title}</div>
                                                                    <div className="text-[10px] text-slate-400">Mentor: {group.mentor}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{group.user}</td>
                                                                <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-400">{group.id.slice(0, 8)}...</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-8 text-center text-slate-400 italic">No unreviewed groups found.</div>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Total Unreviewed: {reviewData.unreviewedGroups.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Latest Feedback</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reviewData.allReviews.slice(0, 6).map(review => (
                                        <div key={review.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                        <Users size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{ReviewService.getDisplayName(review.expand?.user_id)}</p>
                                                        <p className="text-[10px] text-slate-400">{new Date(review.created).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 text-slate-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 italic flex-1">"{review.comment}"</p>
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[10px]">
                                                <span className="text-slate-400">Booking: <span className="font-mono text-slate-600 dark:text-slate-200">{reviewData.groupMap[review.booking_group_id]?.title || review.booking_group_id.slice(0, 8)}</span></span>
                                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">Session {review.session_number}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {reviewData.allReviews.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-slate-400 italic">No reviews recorded yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState, useMemo } from "react";
import { type BookingRecord, type SessionReviewRecord, ReviewService } from "../services/api";
import { pb } from "../lib/pb";
import { cn } from "../lib/utils";
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
    <div className="bg-secondary p-6 rounded-2xl border border-white/5 transition-all hover:border-white/10">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">{title}</h3>
            <div className="p-2 bg-white/[0.02] rounded-lg">
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {subValue && (
                <div className={cn(
                    "flex items-center text-xs font-medium",
                    subValueType === "up" ? "text-green-400" :
                        subValueType === "down" ? "text-red-400" : "text-white/40"
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
            <div className="bg-[#0a0a0a] p-3 border border-white/10 rounded-xl shadow-xl outline-none">
                {tooltipLabel && <p className="text-sm font-bold text-white mb-2">{tooltipLabel}</p>}
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs py-1">
                        <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
                        <span className="text-white font-bold">
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
        const groupMap: Record<string, { title: string, user: string, mentor: string, sessions: number }> = {};
        bookings.forEach(b => {
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

    const COLORS = ["#4a5d23", "#5a6f2e", "#6b8239", "#7c9544", "#8da84f", "#9ebb5a", "#3d4e1c", "#556b28"];
    const gridStroke = "rgba(255,255,255,0.05)";
    const tickFill = "rgba(255,255,255,0.4)";

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Analyzing Course Data</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-white">Course Analytics</h1>
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
            <div className="bg-secondary border border-white/5 rounded-2xl overflow-hidden transition-colors">
                <div className="border-b border-white/5 bg-white/[0.02] px-4">
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
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
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
                                    <h2 className="text-xl font-bold text-white">Booking Growth</h2>
                                    <p className="text-sm text-white/40">Monthly evolution of course bookings.</p>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowRangeMenu(!showRangeMenu)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
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
                                        <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in duration-200">
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
                                                            ? "bg-white text-black"
                                                            : "text-white/60 hover:bg-white/5"
                                                    )}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}

                                            {range === "custom" && (
                                                <div className="p-3 border-t border-white/5 mt-1 space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-white/40">Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={customStart}
                                                            onChange={(e) => setCustomStart(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-white/40">End Date</label>
                                                        <input
                                                            type="date"
                                                            value={customEnd}
                                                            onChange={(e) => setCustomEnd(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setShowRangeMenu(false)}
                                                        className="w-full bg-white text-black py-1.5 rounded-md text-xs font-bold"
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
                                                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                        <Area type="monotone" dataKey="bookings" name="Total Bookings" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
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
                                    <h2 className="text-xl font-bold text-white">Types Distribution</h2>
                                    <p className="text-sm text-white/40">Comparison by service category.</p>
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
                                            <Legend wrapperStyle={{ color: tickFill }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Top 10 Courses</h2>
                                    <p className="text-sm text-white/40">Most requested specific courses.</p>
                                </div>
                                <div className="space-y-4">
                                    {topCourseData.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-white/60 truncate max-w-[300px]">{item.name}</span>
                                                <span className="font-bold text-white">{item.value} bookings</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-army-500 transition-all duration-1000"
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
                                <h2 className="text-xl font-bold text-white">Most Active Students</h2>
                                <p className="text-sm text-white/40">Top 10 users by number of taken courses and consultations.</p>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={userData} layout="vertical" margin={{ left: 50, right: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridStroke} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 11 }} width={120} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="courses" name="Courses" stackId="a" fill="#ffffff" barSize={20} />
                                        <Bar dataKey="consultations" name="Consultations" stackId="a" fill="rgba(255,255,255,0.3)" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Mentors Tab */}
                    {activeTab === "mentors" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Mentor Activity</h2>
                                <p className="text-sm text-white/40">Comparison of bookings assigned to each mentor.</p>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mentorData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Total Bookings" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={40} />
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
                                    <h2 className="text-xl font-bold text-white">Day Distribution</h2>
                                    <p className="text-sm text-white/40">Bookings by day of week.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={schedulingData.dayList}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 11 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 11 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Bookings" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Peak Hours</h2>
                                    <p className="text-sm text-white/40">Most popular session times.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={schedulingData.hourList}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 10 }} interval={2} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 11 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Bookings" fill="rgba(255,255,255,0.3)" radius={[4, 4, 0, 0]} barSize={15} />
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
                                    <h2 className="text-xl font-bold text-white">Student Loyalty</h2>
                                    <p className="text-sm text-white/40">One-time vs returning students.</p>
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
                                                <Cell key="cell-0" fill="#ffffff" />
                                                <Cell key="cell-1" fill="rgba(255,255,255,0.3)" />
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ color: tickFill }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 text-center">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Retention Rate</p>
                                    <p className="text-2xl font-bold text-white">
                                        {retentionData.totalStudents > 0
                                            ? `${((retentionData.returningStudents / retentionData.totalStudents) * 100).toFixed(1)}%`
                                            : "0%"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Booking Frequency</h2>
                                    <p className="text-sm text-white/40">Number of sessions per student.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={retentionData.barData} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridStroke} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 11 }} width={100} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Students" fill="#ffffff" radius={[0, 4, 4, 0]} barSize={20} />
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
                                <h2 className="text-xl font-bold text-white">Booking Status Distribution</h2>
                                <p className="text-sm text-white/40">Operational status of paid bookings.</p>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-4 h-fit">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 11 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: tickFill, fontSize: 12 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar
                                                dataKey="value"
                                                name="Bookings"
                                                fill="#ffffff"
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
                                                                            "#ffffff"
                                                        }
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-rows gap-4 pt-4 h-fit">
                                    {statusData.map((stat, index) => (
                                        <div key={index} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 transition-colors">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">{stat.name}</p>
                                            <p className="text-xl font-bold text-white">{stat.value}</p>
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
                                        <h2 className="text-xl font-bold text-white">Rating Distribution</h2>
                                        <p className="text-sm text-white/40">Breakdown of student feedback scores.</p>
                                    </div>
                                    <div className="flex items-center gap-8 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                        <div className="text-center px-4">
                                            <p className="text-4xl font-black text-white">{reviewData.averageRating}</p>
                                            <div className="flex items-center justify-center gap-0.5 text-white/40 my-1">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={14} fill={s <= Math.round(Number(reviewData.averageRating)) ? "currentColor" : "none"} />
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-white/40 font-semibold uppercase">{reviewData.totalReviews} Reviews</p>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const count = reviewData.ratingDist.find(d => d.name === `${star} Stars`)?.value || 0;
                                                const percent = reviewData.totalReviews > 0 ? (count / reviewData.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-3">
                                                        <span className="text-[11px] font-bold text-white/40 w-4">{star}</span>
                                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-white/40 rounded-full"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-white/40 w-6 text-right">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-rose-400">Unreviewed Groups</h2>
                                        <p className="text-sm text-white/40">Paid groups that haven't received any feedback yet.</p>
                                    </div>
                                    <div className="bg-secondary rounded-xl border border-white/5 overflow-hidden">
                                        <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                                            {reviewData.unreviewedGroups.length > 0 ? (
                                                <table className="w-full text-sm">
                                                    <thead className="bg-white/[0.02] sticky top-0">
                                                        <tr className="text-left text-[10px] uppercase tracking-widest text-white/40">
                                                            <th className="px-4 py-3 font-bold">Course</th>
                                                            <th className="px-4 py-3 font-bold">Student</th>
                                                            <th className="px-4 py-3 font-bold text-right">ID</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {reviewData.unreviewedGroups.map(group => (
                                                            <tr key={group.id} className="hover:bg-white/[0.02]">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium text-white truncate max-w-[150px]" title={group.title}>{group.title}</div>
                                                                    <div className="text-[10px] text-white/30">Mentor: {group.mentor}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-white/50">{group.user}</td>
                                                                <td className="px-4 py-3 text-right font-mono text-[10px] text-white/30">{group.id.slice(0, 8)}...</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-8 text-center text-white/30 italic">No unreviewed groups found.</div>
                                            )}
                                        </div>
                                        <div className="bg-white/[0.02] px-4 py-2 border-t border-white/5">
                                            <p className="text-[11px] font-semibold text-white/50">Total Unreviewed: {reviewData.unreviewedGroups.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-white">Latest Feedback</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reviewData.allReviews.slice(0, 6).map(review => (
                                        <div key={review.id} className="bg-secondary p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                                                        <Users size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-white">
                                                            {reviewData.groupMap[review.booking_group_id]?.user || review.expand?.booking_group_id?.full_name || ReviewService.getDisplayName(review.expand?.user_id)}
                                                        </p>
                                                        <p className="text-[10px] text-white/30">{new Date(review.created).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 text-white/40">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-white/60 italic flex-1">"{review.comment}"</p>
                                            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                                                <span className="text-white/30">Booking: <span className="font-mono text-white/50">{reviewData.groupMap[review.booking_group_id]?.title || review.booking_group_id.slice(0, 8)}</span></span>
                                                <span className="bg-white/5 px-2 py-0.5 rounded text-white/40">Session {review.session_number}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {reviewData.allReviews.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-white/30 italic">No reviews recorded yet.</div>
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

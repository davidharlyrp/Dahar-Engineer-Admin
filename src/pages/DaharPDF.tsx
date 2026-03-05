import { useState, useEffect, useCallback, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from "recharts";
import {
    FileText,
    Search,
    Clock,
    TrendingUp,
    Users,
    Activity,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import { DaharPDFService, type DaharPDFHistoryRecord } from "../services/api";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { useAdminSettings } from "../hooks/useAdminSettings";

export function DaharPDF() {
    const [history, setHistory] = useState<DaharPDFHistoryRecord[]>([]);
    const [fullHistory, setFullHistory] = useState<DaharPDFHistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { perPage, autoRefresh, refreshInterval } = useAdminSettings();

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const filter = search ? `tool ~ "${search}" || user.name ~ "${search}" || user.display_name ~ "${search}"` : "";
            const result = await DaharPDFService.getHistory(page, perPage, "-created", filter);
            setHistory(result.items);
            setTotalPages(result.totalPages);

            // Fetch all history for stats (simplified for now, ideally stats come from a dedicated API)
            const all = await DaharPDFService.getAllHistory();
            setFullHistory(all);
        } catch (error) {
            console.error("DaharPDF: Error fetching history:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, search, perPage]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchHistory, refreshInterval * 1000);
        return () => clearInterval(id);
    }, [autoRefresh, refreshInterval, fetchHistory]);

    // Reset page on search
    useEffect(() => {
        setPage(1);
    }, [search]);

    // Calculate Stats
    const stats = useMemo(() => {
        const toolCounts: Record<string, number> = {};
        const dailyActivity: Record<string, number> = {};
        const toolActivityByDate: Record<string, any> = {};
        const toolsSet = new Set<string>();

        fullHistory.forEach(item => {
            // Tool Stats
            const tool = item.tool || "Unknown";
            toolCounts[tool] = (toolCounts[tool] || 0) + 1;
            toolsSet.add(tool);

            // Activity over time (last 7 days)
            const d = new Date(item.created);
            const dateStr = format(d, "MMM dd");
            dailyActivity[dateStr] = (dailyActivity[dateStr] || 0) + 1;

            // Activity over time by tool
            const dateKey = format(d, "yyyy-MM-dd");
            if (!toolActivityByDate[dateKey]) {
                toolActivityByDate[dateKey] = { name: dateStr, timestamp: d.getTime() };
            }
            toolActivityByDate[dateKey][tool] = (toolActivityByDate[dateKey][tool] || 0) + 1;
        });

        const toolData = Object.entries(toolCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const activityData = Object.entries(dailyActivity)
            .map(([name, value]) => ({ name, value }))
            .slice(-7);

        const timeSeriesData = Object.values(toolActivityByDate)
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-14); // Last 14 days

        return {
            toolData,
            activityData,
            timeSeriesData,
            availableTools: Array.from(toolsSet),
            totalUses: fullHistory.length,
            activeUsers: new Set(fullHistory.map(h => h.user)).size,
            mostUsedTool: toolData[0]?.name || "-"
        };
    }, [fullHistory]);

    const COLORS = ["#ffffff", "#cccccc", "#999999", "#666666", "#333333"];

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Dahar PDF Overview</h1>
                    <p className="text-xs font-semibold text-white/40 mt-1 tracking-widest">Monitor Dahar PDF usage statistics and history</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Usage", value: stats.totalUses, icon: Activity, color: "text-white" },
                    { label: "Unique Users", value: stats.activeUsers, icon: Users, color: "text-white/80" },
                    { label: "Most Popular Tool", value: stats.mostUsedTool, icon: TrendingUp, color: "text-white/60" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-secondary p-6 rounded-2xl border border-white/5 shadow-sm transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">{stat.label}</span>
                        </div>
                        <div className="text-3xl font-bold text-white tracking-tighter">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tool Usage Chart */}
                <div className="bg-secondary p-6 rounded-2xl border border-white/5 shadow-sm transition-colors">
                    <h3 className="text-[10px] uppercase font-bold text-white/40 mb-6 flex items-center gap-2 tracking-widest">
                        <TrendingUp className="w-4 h-4" /> Tool Popularity
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.toolData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                                />
                                <YAxis
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0a0a0a',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
                                    }}
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                />
                                <Bar dataKey="value" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Distribution */}
                <div className="bg-secondary p-6 rounded-2xl border border-white/5 shadow-sm transition-colors">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-6 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Usage Distribution
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.toolData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="transparent"
                                >
                                    {stats.toolData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0a0a0a',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Time Series Chart */}
            <div className="bg-secondary p-6 rounded-2xl border border-white/5 shadow-sm transition-colors">
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Tool Usage Over Time
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0a0a0a',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }} />
                            {stats.availableTools.map((tool, index) => (
                                <Line
                                    key={tool}
                                    type="monotone"
                                    dataKey={tool}
                                    name={tool}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: COLORS[index % COLORS.length], stroke: 'transparent' }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-secondary border border-white/5 rounded-2xl shadow-sm overflow-hidden transition-colors">
                <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02]">
                    <h2 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Activity History
                    </h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Filter by tool or user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-army-500/40 transition-all font-semibold placeholder:text-white/30"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white/20 animate-spin mb-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 animate-pulse">Fetching Logs...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center text-white/40 text-[10px] font-bold uppercase tracking-widest">
                            No activity found.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-white/40 bg-white/[0.02] border-b border-white/5 uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Tool Used</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold border border-white/10 text-white/60">
                                                    {item.expand?.user?.name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white max-w-[150px] truncate">{item.expand?.user?.display_name || item.expand?.user?.name || "Guest"}</div>
                                                    <div className="text-[10px] text-white/40 font-semibold truncate max-w-[150px]">{item.expand?.user?.email || "Anonymous"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white text-[10px] font-bold border border-white/10 uppercase tracking-widest">
                                                {item.tool}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                                                Success
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[10px] text-white/40 font-semibold">
                                            {format(new Date(item.created), "MMM dd, yyyy • HH:mm")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 flex items-center justify-center gap-2 bg-white/[0.02]">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all border border-transparent hover:border-white/10"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                            Page {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all border border-transparent hover:border-white/10"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

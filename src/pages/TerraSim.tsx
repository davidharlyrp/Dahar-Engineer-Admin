import { useState, useEffect, useCallback, useMemo } from "react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import {
    Activity,
    FolderGit2,
    MessageSquare,
    Loader2,
    UserCircle2,
    Calendar,
    Hash,
    FileText,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { TerraSimService, type TerraSimFeedbackRecord, type TerraSimProjectRecord, type TerraSimRunningHistoryRecord } from "../services/api";
import { format } from "date-fns";

export function TerraSim() {
    const [runningHistory, setRunningHistory] = useState<TerraSimRunningHistoryRecord[]>([]);
    const [projects, setProjects] = useState<TerraSimProjectRecord[]>([]);
    const [feedback, setFeedback] = useState<TerraSimFeedbackRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

    const toggleUserAccordion = (userId: string) => {
        setExpandedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [historyRes, projectsRes, feedbackRes] = await Promise.all([
                TerraSimService.getRunningHistory(1, 1000, "+created"),
                TerraSimService.getProjects(1, 500, "-created"),
                TerraSimService.getFeedback(1, 50, "-created")
            ]);

            setRunningHistory(historyRes.items);
            setProjects(projectsRes.items);
            setFeedback(feedbackRes.items);
        } catch (error) {
            console.error("TerraSim: Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Process Running History Data for Chart
    const chartData = useMemo(() => {
        const dailyCounts: Record<string, number> = {};

        runningHistory.forEach(item => {
            const dateStr = format(new Date(item.created), "MMM dd, yyyy");
            dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        });

        // Convert to array and sort by date implicitly because runningHistory was fetched with +created
        const data = Object.entries(dailyCounts).map(([date, count]) => ({
            date,
            runs: count
        }));

        // Limit to last 30 days for better visualization if there's a lot of data
        return data.slice(-30);
    }, [runningHistory]);

    // Process Projects by User
    const projectsByUser = useMemo(() => {
        const grouped: Record<string, { user: any, projects: TerraSimProjectRecord[] }> = {};

        projects.forEach(project => {
            const userId = project.user;
            if (!grouped[userId]) {
                grouped[userId] = {
                    user: project.expand?.user || { id: userId, name: "Unknown User", email: "" },
                    projects: []
                };
            }
            grouped[userId].projects.push(project);
        });

        return Object.values(grouped).sort((a, b) => b.projects.length - a.projects.length);
    }, [projects]);

    const totalRuns = runningHistory.length;
    const totalProjects = projects.length;
    const totalFeedback = feedback.length;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 h-full">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-4" />
                <span className="text-sm font-bold text-slate-400 animate-pulse">Loading Data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">TerraSim Overview</h1>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <Activity className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">Total Validations (Runs)</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalRuns.toLocaleString()}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <FolderGit2 className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">Total Projects Saved</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalProjects.toLocaleString()}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">Feedback Received</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalFeedback.toLocaleString()}</div>
                </div>
            </div>

            {/* Running History Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-400" /> Validation Runs Over Time
                </h3>
                {chartData.length > 0 ? (
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b', fontWeight: 500 }}
                                    tickFormatter={(val) => val.split(',')[0]} // Show only 'MMM dd' on axis
                                />
                                <YAxis
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b', fontWeight: 500 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        borderRadius: '8px',
                                        border: 'none',
                                        color: '#f8fafc',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="runs"
                                    name="Simulations Run"
                                    stroke="#0f172a"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRuns)"
                                    activeDot={{ r: 3, fill: '#0f172a', stroke: '#fff', strokeWidth: 1 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[350px] flex items-center justify-center text-slate-500 text-sm font-medium">
                        No running history data available.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Projects Grouped by User */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-colors overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <FolderGit2 className="w-5 h-5 text-slate-400" /> Saved Projects by User
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 space-y-4">
                        {projectsByUser.length > 0 ? (
                            projectsByUser.map((group) => (
                                <div key={group.user.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleUserAccordion(group.user.id)}
                                        className="w-full bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800/50 p-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                {group.user.name?.charAt(0) || "U"}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{group.user.display_name || group.user.name || "Unknown User"}</div>
                                                <div className="text-[10px] text-slate-500 font-medium">{group.user.email || "No email"}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-400">
                                                {group.projects.length} Project{group.projects.length !== 1 ? 's' : ''}
                                            </div>
                                            <div className="text-slate-400">
                                                {expandedUsers.includes(group.user.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </button>

                                    {expandedUsers.includes(group.user.id) && (
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900/20">
                                            {group.projects.map(proj => (
                                                <li key={proj.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                                            {proj.name || "Untitled Project"}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end flex-shrink-0">
                                                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {format(new Date(proj.updated), "MMM dd, yyyy")}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Hash className="w-3 h-3" /> v{proj.version || "?"}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-slate-500">No projects found.</div>
                        )}
                    </div>
                </div>

                {/* Feedback List */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-colors overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-slate-400" /> User Feedback
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 space-y-4">
                        {feedback.length > 0 ? (
                            feedback.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                                {item.subject}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-400">v{item.version}</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-500">
                                            {format(new Date(item.created), "MMM dd, yyyy")}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 leading-tight">{item.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">{item.description}</p>

                                    {/* User info */}
                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                        <UserCircle2 className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {item.expand?.user?.display_name || item.expand?.user?.name || "Unknown User"}
                                        </span>
                                    </div>

                                    {/* Images if any */}
                                    {item.images && item.images.length > 0 && (
                                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 snap-x">
                                            {item.images.map((img, idx) => (
                                                <a
                                                    key={idx}
                                                    href={TerraSimService.getFeedbackImageUrl(item, img)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-shrink-0 snap-start block border border-slate-200 dark:border-slate-600 rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                                                >
                                                    <img
                                                        src={TerraSimService.getFeedbackImageUrl(item, img)}
                                                        alt="Feedback attachment"
                                                        className="h-20 w-auto object-cover"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-slate-500">No feedback entries found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

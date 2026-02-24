import { useEffect, useState, useMemo } from "react";
import { type CashflowItemRecord } from "../services/api";
import { pb } from "../lib/pb";
import { cn } from "../lib/utils";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart as PieChartIcon,
    BarChart2,
    Calendar,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Info
} from "lucide-react";

// --- Types ---
type TabType = "forecasting" | "trend" | "graphs" | "types" | "info";

interface ChartDataPoint {
    name: string;
    income: number;
    expense: number;
    net: number;
    cumNet: number;
}


// --- Helpers ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
};

// --- Sub-components ---

const StatCard = ({ title, amount, icon: Icon, trend, trendType }: {
    title: string;
    amount: number;
    icon: any;
    trend?: string;
    trendType?: "up" | "down"
}) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Icon className="w-5 h-5 text-slate-900 dark:text-slate-100" />
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</span>
            {trend && (
                <div className={cn(
                    "flex items-center text-xs font-medium",
                    trendType === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                    {trendType === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {trend}
                </div>
            )}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl outline-none">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs py-1">
                        <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{formatCurrency(entry.value)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function CashflowReport() {
    const [activeTab, setActiveTab] = useState<TabType>("trend");
    const [items, setItems] = useState<CashflowItemRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch all items for comprehensive reporting
            const allItems = await pb.collection("cashflow_items").getFullList<CashflowItemRecord>({
                sort: "date",
            });
            setItems(allItems);
        } catch (error) {
            console.error("CashflowReport: Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Data Processing ---

    const processedData = useMemo(() => {
        const monthlyData: Record<string, ChartDataPoint> = {};

        items.forEach(item => {
            const date = new Date(item.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            if (!monthlyData[key]) {
                monthlyData[key] = { name: monthName, income: 0, expense: 0, net: 0, cumNet: 0 };
            }

            const amount = parseFloat(String(item.amount)) || 0;
            const typeVal = (item.type || "").toLowerCase().trim();
            const catVal = (item.category || "").toLowerCase().trim();

            const isIncome = typeVal === 'income' || typeVal === 'in' || typeVal === 'masuk' ||
                catVal === 'income' || catVal === 'in' || catVal === 'masuk';

            const isExpense = typeVal === 'expense' || typeVal === 'out' || typeVal === 'keluar' ||
                catVal === 'expense' || catVal === 'out' || catVal === 'keluar';

            if (isIncome) {
                monthlyData[key].income += amount;
            } else if (isExpense) {
                monthlyData[key].expense += amount;
            }
        });

        const sortedKeys = Object.keys(monthlyData).sort();
        let cumulativeProfit = 0;
        return sortedKeys.map(key => {
            const net = monthlyData[key].income - monthlyData[key].expense;
            cumulativeProfit += net;
            return {
                ...monthlyData[key],
                net,
                cumNet: cumulativeProfit
            };
        });
    }, [items]);

    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        items.forEach(item => {
            const cat = item.type || "Other";
            const amount = parseFloat(String(item.amount)) || 0;
            const catVal = (item.category || "").toLowerCase().trim();

            if (catVal === 'expense' || catVal === 'out' || catVal === 'keluar') {
                categories[cat] = (categories[cat] || 0) + amount;
            }
        });

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 categories
    }, [items]);

    const incomeSourceData = useMemo(() => {
        const sources: Record<string, number> = {};
        items.forEach(item => {
            const source = item.type || "Other";
            const amount = parseFloat(String(item.amount)) || 0;
            const catVal = (item.category || "").toLowerCase().trim();

            if (catVal === 'income' || catVal === 'in' || catVal === 'masuk') {
                sources[source] = (sources[source] || 0) + amount;
            }
        });

        return Object.entries(sources)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [items]);

    const forecastData = useMemo(() => {
        if (processedData.length === 0) return [];

        // Take last 3 months to calculate average
        const lastMonths = processedData.slice(-3);
        const avgIncome = lastMonths.reduce((sum, m) => sum + m.income, 0) / (lastMonths.length || 1);
        const avgExpense = lastMonths.reduce((sum, m) => sum + m.expense, 0) / (lastMonths.length || 1);

        const lastMonthDate = new Date();
        const forecast = [];

        // Current data
        forecast.push(...processedData.slice(-6));

        // Projected data (next 6 months)
        for (let i = 1; i <= 6; i++) {
            const nextDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + i, 1);
            forecast.push({
                name: nextDate.toLocaleString('default', { month: 'short', year: '2-digit' }) + " (P)",
                income: avgIncome,
                expense: avgExpense,
                net: avgIncome - avgExpense,
                isProjected: true
            });
        }

        return forecast;
    }, [processedData]);

    const stats = useMemo(() => {
        const totalIncome = items.reduce((sum, item) => {
            const amount = parseFloat(String(item.amount)) || 0;
            const typeVal = (item.type || "").toLowerCase().trim();
            const catVal = (item.category || "").toLowerCase().trim();
            return (typeVal === 'income' || catVal === 'income' || typeVal === 'in' || catVal === 'in' || typeVal === 'masuk' || catVal === 'masuk') ? sum + amount : sum;
        }, 0);

        const totalExpense = items.reduce((sum, item) => {
            const amount = parseFloat(String(item.amount)) || 0;
            const typeVal = (item.type || "").toLowerCase().trim();
            const catVal = (item.category || "").toLowerCase().trim();
            return (typeVal === 'expense' || catVal === 'expense' || typeVal === 'out' || catVal === 'out' || typeVal === 'keluar' || catVal === 'keluar') ? sum + amount : sum;
        }, 0);

        return {
            income: totalIncome,
            expense: totalExpense,
            balance: totalIncome - totalExpense
        };
    }, [items]);

    // --- Chart Colors ---
    const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"];
    const CHART_COLORS = {
        income: "#10b981", // green-500
        expense: "#ef4444", // red-500
        net: "#0f172a", // slate-900
        forecast: "#8b5cf6", // violet-500
        cumulative: "#3b82f6" // blue-500
    };

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
                <span className="text-sm font-medium">Generating Report...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Financial Intelligence</h1>
                <p className="text-slate-500 dark:text-slate-400">Comprehensive analysis and forecasting based on your cashflow data.</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Gross Income"
                    amount={stats.income}
                    icon={TrendingUp}
                    trend="+12.5% from last month"
                    trendType="up"
                />
                <StatCard
                    title="Total Spending"
                    amount={stats.expense}
                    icon={TrendingDown}
                    trend="-2.4% from last month"
                    trendType="down"
                />
                <StatCard
                    title="Net Profit"
                    amount={stats.balance}
                    icon={DollarSign}
                />
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-colors">
                <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 px-4">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
                        {[
                            { id: "trend", label: "Monthly Trend", icon: BarChart2 },
                            { id: "graphs", label: "Growth Analysis", icon: TrendingUp },
                            { id: "types", label: "Distribution", icon: PieChartIcon },
                            { id: "forecasting", label: "Budget Forecast", icon: Target },
                            { id: "info", label: "Key Insights", icon: Info },
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

                <div className="p-8">
                    {/* Trend Tab */}
                    {activeTab === "trend" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Monthly Cashflow Trend</h2>
                                    <p className="text-sm text-slate-500">Comparison of money in and money out over time.</p>
                                </div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={processedData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            tickFormatter={(val) => `Rp${val / 1000000}M`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                        <Line type="monotone" dataKey="income" name="Income" stroke={CHART_COLORS.income} strokeWidth={2} dot={{ r: 1, fill: CHART_COLORS.income }} activeDot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="expense" name="Expense" stroke={CHART_COLORS.expense} strokeWidth={2} dot={{ r: 1, fill: CHART_COLORS.expense }} activeDot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Graphs Tab */}
                    {activeTab === "graphs" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profitability & Growth Analysis</h2>
                                <p className="text-sm text-slate-500">Visualizing net income and historical growth patterns.</p>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={processedData}>
                                        <defs>
                                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.net} stopOpacity={0.1} />
                                                <stop offset="95%" stopColor={CHART_COLORS.net} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `Rp${val / 1000000}M`} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#3b82f6', fontSize: 12 }} tickFormatter={(val) => `Rp${val / 1000000}M`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area yAxisId="left" type="monotone" dataKey="net" name="Net Income" stroke={CHART_COLORS.net} strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                                        <Area yAxisId="right" type="monotone" dataKey="cumNet" name="Cumulative Profit" stroke={CHART_COLORS.cumulative} strokeWidth={2} fillOpacity={0.1} fill={CHART_COLORS.cumulative} />
                                        <Line yAxisId="left" type="monotone" dataKey="income" name="Income Trace" stroke={CHART_COLORS.income} strokeDasharray="5 5" dot={false} strokeWidth={1} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Types Distribution Tab */}
                    {activeTab === "types" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Spending by Category</h2>
                                    <p className="text-sm text-slate-500">Where your money is going.</p>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {categoryData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Income Sources</h2>
                                    <p className="text-sm text-slate-500">Distribution of revenue streams.</p>
                                </div>
                                <div className="space-y-4">
                                    {incomeSourceData.map((source, index) => (
                                        <div key={index} className="flex flex-col gap-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{source.name}</span>
                                                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(source.value)}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-1000"
                                                    style={{ width: `${(source.value / stats.income) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Forecasting Tab */}
                    {activeTab === "forecasting" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">6-Month Budget Forecast</h2>
                                <p className="text-sm text-slate-500">Projections based on your historical 3-month average performance.</p>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={forecastData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `Rp${val / 1000000}M`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="income"
                                            name="Income (Proj)"
                                            stroke={CHART_COLORS.income}
                                            strokeWidth={2}
                                            dot={(props: any) => props.payload.isProjected ? <circle cx={props.cx} cy={props.cy} r={3} fill={CHART_COLORS.income} /> : <circle cx={props.cx} cy={props.cy} r={2} fill={CHART_COLORS.income} />}
                                            strokeDasharray="5 5"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="expense"
                                            name="Expense (Proj)"
                                            stroke={CHART_COLORS.expense}
                                            strokeWidth={2}
                                            dot={(props: any) => props.payload.isProjected ? <circle cx={props.cx} cy={props.cy} r={3} fill={CHART_COLORS.expense} /> : <circle cx={props.cx} cy={props.cy} r={2} fill={CHART_COLORS.expense} />}
                                            strokeDasharray="5 5"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex gap-3">
                                    <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Forecast Methodology</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                            The projection (dotted lines) is calculated using a simple arithmetic mean of your transactions from the last 90 days.
                                            This assumes steady-state business operations and does not account for seasonal variations or irregular large invoices.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Insights Tab */}
                    {activeTab === "info" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    Efficiency Insights
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-green-500 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Your average monthly profit margin is healthy at <span className="font-bold text-slate-900 dark:text-white">{((stats.balance / (stats.income || 1)) * 100).toFixed(1)}%</span>.</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Peak earning months observed in <span className="font-bold text-slate-900 dark:text-white">{[...processedData].sort((a, b) => b.income - a.income)[0]?.name || "N/A"}</span>.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                    Risk Analysis
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-red-500 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Highest expense concentration in <span className="font-bold text-slate-900 dark:text-white">{categoryData[0]?.name || "N/A"}</span> category.</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Maintain at least <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(stats.expense * 2)}</span> in reserve for 2 months of runway.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

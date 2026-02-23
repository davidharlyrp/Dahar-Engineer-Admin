import { useState, useEffect, useCallback } from "react";
import { ProductPaymentService, type PaymentHistoryRecord } from "../services/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Search,
    Filter,
    DollarSign,
    Check,
    ShoppingCart,
    Loader2
} from "lucide-react";
import { format } from "date-fns";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CheckboxFilterProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    isOpen: boolean;
    onToggle: () => void;
}

function CheckboxFilter({ options, selected, onChange, isOpen, onToggle }: CheckboxFilterProps) {
    return (
        <div className="relative inline-block ml-1">
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={cn(
                    "p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
                    selected.length > 0 ? "text-slate-900 dark:text-white" : "text-slate-400"
                )}
            >
                <Filter className={cn("w-3 h-3", selected.length > 0 && "fill-current")} />
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl z-[100] p-2 normal-case font-normal text-xs overflow-hidden">
                    <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                        {options.map(option => (
                            <label key={option} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option)}
                                    onChange={() => {
                                        const next = selected.includes(option)
                                            ? selected.filter(s => s !== option)
                                            : [...selected, option];
                                        onChange(next);
                                    }}
                                    className="rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-slate-900 dark:focus:ring-slate-100"
                                />
                                <span className="truncate text-slate-700 dark:text-slate-300">{option}</span>
                            </label>
                        ))}
                    </div>
                    {selected.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => onChange([])}
                                className="w-full py-1 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-bold"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ProductPayment() {
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<PaymentHistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Stats state
    const [stats, setStats] = useState({ revenue: 0, transactions: 0, successful: 0 });

    // Filtering states
    const [dateFilter, setDateFilter] = useState("all");
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

    // Checkbox Filter states
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

    // Open dropdown states for columns
    const [openFilter, setOpenFilter] = useState<"product" | "status" | "method" | null>(null);

    const [availableProducts, setAvailableProducts] = useState<string[]>([]);
    const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
    const [availableMethods, setAvailableMethods] = useState<string[]>([]);

    const getDateFilterQuery = (preset: string) => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().replace('T', ' ');

        switch (preset) {
            case "today":
                return `payment_date >= "${startOfDay}"`;
            case "last_7": {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                return `payment_date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "last_14": {
                const d = new Date();
                d.setDate(d.getDate() - 14);
                return `payment_date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_week": {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const d = new Date(now.setDate(diff));
                d.setHours(0, 0, 0, 0);
                return `payment_date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "last_30": {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                return `payment_date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_month": {
                const d = new Date(now.getFullYear(), now.getMonth(), 1);
                return `payment_date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_year": {
                const d = new Date(now.getFullYear(), 0, 1);
                return `payment_date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            default:
                return "";
        }
    };

    const buildFilterQuery = useCallback(() => {
        const conditions: string[] = [];

        // 1. Date filter
        if (dateFilter !== "all" && dateFilter !== "custom") {
            const dateQuery = getDateFilterQuery(dateFilter);
            if (dateQuery) conditions.push(`(${dateQuery})`);
        }

        // 2. Search filter (invoice, email, user_name)
        if (search) {
            conditions.push(`(invoice_id ~ "${search}" || user_email ~ "${search}" || user_name ~ "${search}" || product_name ~ "${search}")`);
        }

        // 3. Multi-select filters
        if (selectedProducts.length > 0) {
            const productConditions = selectedProducts.map(p => `product_name = "${p}"`).join(" || ");
            conditions.push(`(${productConditions})`);
        }

        if (selectedStatuses.length > 0) {
            const statusConditions = selectedStatuses.map(s => `payment_status = "${s}"`).join(" || ");
            conditions.push(`(${statusConditions})`);
        }

        if (selectedMethods.length > 0) {
            const methodConditions = selectedMethods.map(m => `payment_method = "${m}"`).join(" || ");
            conditions.push(`(${methodConditions})`);
        }

        return conditions.join(" && ");
    }, [dateFilter, search, selectedProducts, selectedStatuses, selectedMethods]);

    const calculateStats = (data: PaymentHistoryRecord[]) => {
        let revenue = 0;
        let successful = 0;

        data.forEach(item => {
            if (item.payment_status?.toLowerCase() === 'paid' || item.payment_status?.toLowerCase() === 'settled') {
                revenue += (item.final_amount || 0);
                successful++;
            }
        });

        setStats({
            revenue,
            transactions: data.length,
            successful
        });
    };

    const fetchAllDataForFiltersAndStats = useCallback(async () => {
        try {
            const allItems = await ProductPaymentService.getAllPayments();

            const products = new Set<string>();
            const statuses = new Set<string>();
            const methods = new Set<string>();

            allItems.forEach(item => {
                if (item.product_name) products.add(item.product_name);
                if (item.payment_status) statuses.add(item.payment_status);
                if (item.payment_method) methods.add(item.payment_method);
            });

            setAvailableProducts(Array.from(products).sort());
            setAvailableStatuses(Array.from(statuses).sort());
            setAvailableMethods(Array.from(methods).sort());

            // Initial stats calculation without filters
            calculateStats(allItems);
        } catch (error) {
            console.error("Error fetching filter data:", error);
        }
    }, []);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const filterStr = buildFilterQuery();
            const result = await ProductPaymentService.getPayments(currentPage, 30, "-payment_date", filterStr);
            setItems(result.items);
            setTotalPages(result.totalPages);

            // Re-calculate stats based on CURRENT filter across ALL pages
            // If there's a filter, we need to fetch all matching to get accurate stats
            if (filterStr) {
                // To avoid massive overhead on every keystroke, only fetch full if filtered
                const fullFiltered = await ProductPaymentService.getPayments(1, 5000, "-payment_date", filterStr);
                calculateStats(fullFiltered.items);
            } else {
                fetchAllDataForFiltersAndStats(); // Resets stats to global
            }

        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, buildFilterQuery, fetchAllDataForFiltersAndStats]);

    useEffect(() => {
        fetchAllDataForFiltersAndStats();
    }, [fetchAllDataForFiltersAndStats]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, dateFilter, selectedProducts, selectedStatuses, selectedMethods]);

    const dateOptions = [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "this_week", label: "This Week" },
        { value: "last_7", label: "Last 7 Days" },
        { value: "last_14", label: "Last 14 Days" },
        { value: "this_month", label: "This Month" },
        { value: "last_30", label: "Last 30 Days" },
        { value: "this_year", label: "This Year" },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenFilter(null);
            setIsDateFilterOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Product Payments</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage and track digital product transactions.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Presets Dropdown */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsDateFilterOpen(!isDateFilterOpen); setOpenFilter(null); }}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                        >
                            <Clock className="w-4 h-4 text-slate-400" />
                            {dateOptions.find(o => o.value === dateFilter)?.label || "Date Filter"}
                        </button>
                        {isDateFilterOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl z-50 py-1">
                                {dateOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setDateFilter(option.value);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between",
                                            dateFilter === option.value
                                                ? "bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white font-bold"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        )}
                                    >
                                        {option.label}
                                        {dateFilter === option.value && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search invoice, email or user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none transition-all placeholder:font-normal"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <DollarSign className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(stats.revenue)}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">Total Transactions</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {stats.transactions.toLocaleString()}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <Check className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">Successful Payments</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {stats.successful.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-colors overflow-hidden flex flex-col h-[600px]">
                <div className="flex-1 overflow-auto relative">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 uppercase font-black tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Date / Time</th>
                                <th className="px-6 py-4 whitespace-nowrap">Invoice ID</th>
                                <th className="px-6 py-4 whitespace-nowrap">User Name & Email</th>
                                <th className="px-6 py-4 whitespace-nowrap">
                                    Product Name
                                    <CheckboxFilter
                                        options={availableProducts}
                                        selected={selectedProducts}
                                        onChange={setSelectedProducts}
                                        isOpen={openFilter === "product"}
                                        onToggle={() => {
                                            if (openFilter === "product") setOpenFilter(null);
                                            else { setOpenFilter("product"); setIsDateFilterOpen(false); }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap">
                                    Method
                                    <CheckboxFilter
                                        options={availableMethods}
                                        selected={selectedMethods}
                                        onChange={setSelectedMethods}
                                        isOpen={openFilter === "method"}
                                        onToggle={() => {
                                            if (openFilter === "method") setOpenFilter(null);
                                            else { setOpenFilter("method"); setIsDateFilterOpen(false); }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap">
                                    Status
                                    <CheckboxFilter
                                        options={availableStatuses}
                                        selected={selectedStatuses}
                                        onChange={setSelectedStatuses}
                                        isOpen={openFilter === "status"}
                                        onToggle={() => {
                                            if (openFilter === "status") setOpenFilter(null);
                                            else { setOpenFilter("status"); setIsDateFilterOpen(false); }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Final Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-medium">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-4" />
                                            <span className="text-sm font-bold text-slate-400 animate-pulse">Loading payments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="h-64 text-center text-slate-500 font-semibold">
                                        No payments found matching the current filters.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group/row"
                                    >
                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 dark:text-slate-100">
                                                    {format(new Date(item.payment_date || item.created), "MMM dd, yyyy")}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                    {format(new Date(item.payment_date || item.created), "HH:mm")}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 cursor-default font-semibold text-[11px] uppercase tracking-wider">
                                            {item.invoice_id || "-"}
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                                                    {item.user_name || item.expand?.user_id?.display_name || item.expand?.user_id?.name || "Unknown User"}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                                    {item.user_email || item.expand?.user_id?.email || "-"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                                                    {item.product_name || "-"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default text-xs font-bold text-slate-600 dark:text-slate-300">
                                            {item.payment_method || "-"}
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-semibold border",
                                                item.payment_status?.toLowerCase() === 'paid' || item.payment_status?.toLowerCase() === 'settled'
                                                    ? "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                                                    : item.payment_status?.toLowerCase() === 'pending'
                                                        ? "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                                                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                            )}>
                                                {item.payment_status?.toUpperCase() || "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap text-right cursor-default">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(item.final_amount || 0)}
                                            </div>
                                            {item.discount_amount > 0 && (
                                                <div className="text-[10px] text-slate-400 font-semibold">
                                                    Disc: -{formatCurrency(item.discount_amount)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-xs font-bold text-slate-500">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

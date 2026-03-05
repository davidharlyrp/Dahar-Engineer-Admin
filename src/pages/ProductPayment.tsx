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
                    "p-0.5 rounded hover:bg-white/5 transition-colors",
                    selected.length > 0 ? "text-white" : "text-white/40"
                )}
            >
                <Filter className={cn("w-3 h-3", selected.length > 0 && "fill-current")} />
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-secondary border border-white/5 rounded-md shadow-xl z-[100] p-2 normal-case font-normal text-xs overflow-hidden">
                    <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                        {options.map(option => (
                            <label key={option} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option)}
                                    onChange={() => {
                                        const next = selected.includes(option)
                                            ? selected.filter(s => s !== option)
                                            : [...selected, option];
                                        onChange(next);
                                    }}
                                    className="rounded border-white/5 text-white focus:ring-army-500"
                                />
                                <span className="truncate text-white/80">{option}</span>
                            </label>
                        ))}
                    </div>
                    {selected.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <button
                                onClick={() => onChange([])}
                                className="w-full py-1 text-[10px] text-white/40 hover:text-white transition-colors font-bold"
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
                return `payment_date >="${startOfDay}"`;
            case "last_7": {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                return `payment_date >="${d.toISOString().replace('T', ' ')}"`;
            }
            case "last_14": {
                const d = new Date();
                d.setDate(d.getDate() - 14);
                return `payment_date >="${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_week": {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const d = new Date(now.setDate(diff));
                d.setHours(0, 0, 0, 0);
                return `payment_date >="${d.toISOString().replace('T', ' ')}"`;
            }
            case "last_30": {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                return `payment_date >="${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_month": {
                const d = new Date(now.getFullYear(), now.getMonth(), 1);
                return `payment_date >="${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_year": {
                const d = new Date(now.getFullYear(), 0, 1);
                return `payment_date >="${d.toISOString().replace('T', ' ')}"`;
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
            conditions.push(`(invoice_id ~"${search}"|| user_email ~"${search}"|| user_name ~"${search}"|| product_name ~"${search}")`);
        }

        // 3. Multi-select filters
        if (selectedProducts.length > 0) {
            const productConditions = selectedProducts.map(p => `product_name ="${p}"`).join("||");
            conditions.push(`(${productConditions})`);
        }

        if (selectedStatuses.length > 0) {
            const statusConditions = selectedStatuses.map(s => `payment_status ="${s}"`).join("||");
            conditions.push(`(${statusConditions})`);
        }

        if (selectedMethods.length > 0) {
            const methodConditions = selectedMethods.map(m => `payment_method ="${m}"`).join("||");
            conditions.push(`(${methodConditions})`);
        }

        return conditions.join("&&");
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
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Product Payments</h1>
                    <p className="text-sm text-white/40 font-medium">Manage and track digital product transactions.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Presets Dropdown */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsDateFilterOpen(!isDateFilterOpen); setOpenFilter(null); }}
                            className="flex items-center gap-2 px-3 py-2 bg-secondary border border-white/5 rounded-md text-sm font-bold text-white/80 hover:bg-white/5 transition-colors"
                        >
                            <Clock className="w-4 h-4 text-white/40" />
                            {dateOptions.find(o => o.value === dateFilter)?.label || "Date Filter"}
                        </button>
                        {isDateFilterOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-secondary border border-white/5 rounded-md shadow-xl z-50 py-1">
                                {dateOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setDateFilter(option.value);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between",
                                            dateFilter === option.value
                                                ? "bg-white/[0.02] text-white font-bold"
                                                : "text-white/60 hover:bg-white/5"
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search invoice, email or user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm font-semibold border border-white/5 bg-secondary text-white rounded-md focus:outline-none transition-all placeholder:font-normal"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary p-6 rounded-xl border border-white/5 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-bold text-white/40">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatCurrency(stats.revenue)}
                    </div>
                </div>

                <div className="bg-secondary p-6 rounded-xl border border-white/5 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-bold text-white/40">Total Transactions</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {stats.transactions.toLocaleString()}
                    </div>
                </div>

                <div className="bg-secondary p-6 rounded-xl border border-white/5 shadow-sm transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-bold text-white/40">Successful Payments</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {stats.successful.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-secondary border border-white/5 rounded-xl shadow-sm transition-colors overflow-hidden flex flex-col h-[600px]">
                <div className="flex-1 overflow-auto relative">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-white/40 bg-white/[0.02] border-b border-white/5 uppercase font-black tracking-widest sticky top-0 z-10">
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
                        <tbody className="divide-y divide-white/5 font-medium">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white/20 animate-spin mb-4" />
                                            <span className="text-sm font-bold text-white/40 animate-pulse">Loading payments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="h-64 text-center text-white/40 font-semibold">
                                        No payments found matching the current filters.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-white/5 transition-colors group/row"
                                    >
                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <div className="flex flex-col">
                                                <span className="text-white">
                                                    {format(new Date(item.payment_date || item.created), "MMM dd, yyyy")}
                                                </span>
                                                <span className="text-[10px] text-white/40 font-semibold mt-0.5">
                                                    {format(new Date(item.payment_date || item.created), "HH:mm")}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap text-white/40 cursor-default font-semibold text-[11px] uppercase tracking-wider">
                                            {item.invoice_id || "-"}
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <div className="flex flex-col">
                                                <span className="text-white font-semibold">
                                                    {item.user_name || item.expand?.user_id?.display_name || item.expand?.user_id?.name || "Unknown User"}
                                                </span>
                                                <span className="text-[11px] text-white/40 font-semibold mt-0.5">
                                                    {item.user_email || item.expand?.user_id?.email || "-"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-semibold">
                                                    {item.product_name || "-"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default text-xs font-semibold text-white/40">
                                            {item.payment_method || "-"}
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap cursor-default">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-semibold border",
                                                item.payment_status?.toLowerCase() === 'paid' || item.payment_status?.toLowerCase() === 'settled'
                                                    ? "bg-white/5 text-white/80 border-white/5"
                                                    : item.payment_status?.toLowerCase() === 'pending'
                                                        ? "bg-white/5 text-white/40 border-white/5"
                                                        : "bg-white/5 text-white/40 border-white/5"
                                            )}>
                                                {item.payment_status?.toUpperCase() || "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3 whitespace-nowrap text-right cursor-default">
                                            <div className="font-semibold text-white">
                                                {formatCurrency(item.final_amount || 0)}
                                            </div>
                                            {item.discount_amount > 0 && (
                                                <div className="text-[10px] text-white/40 font-semibold">
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
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/5">
                        <div className="text-xs font-bold text-white/40">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded text-white/40 hover:text-white disabled:opacity-30 transition-colors"
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

import { useEffect, useState } from "react";
import { CashflowService, type CashflowItemRecord, type CashflowNameRecord, type CashflowTagRecord } from "../services/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Search,
    Filter,
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Edit2,
    Trash2,
    Check,
    RotateCcw
} from "lucide-react";

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
                    "p-0.5 rounded hover:bg-white/10 transition-colors",
                    selected.length > 0 ? "text-white" : "text-white/40"
                )}
            >
                <Filter className={cn("w-3 h-3", selected.length > 0 && "fill-current")} />
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-secondary border border-white/10 rounded-xl shadow-xl z-[100] p-2 normal-case font-normal text-xs overflow-hidden">
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
                                    className="rounded border-white/20 bg-black/40 text-army-500 focus:ring-army-500/40"
                                />
                                <span className="truncate text-white/60">{option}</span>
                            </label>
                        ))}
                    </div>
                    {selected.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <button
                                onClick={() => onChange([])}
                                className="w-full py-1 text-[10px] text-white/40 hover:text-white transition-colors"
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

export function Cashflow() {
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<CashflowItemRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

    // Filtering states
    const [dateFilter, setDateFilter] = useState("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

    // Checkbox Filter states
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Open dropdown states for columns
    const [openFilter, setOpenFilter] = useState<"name" | "type" | "category" | null>(null);

    // Inline Editing states
    const [editingId, setEditingId] = useState<string | "new" | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<CashflowItemRecord>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [availableNames, setAvailableNames] = useState<CashflowNameRecord[]>([]);
    const [availableTags, setAvailableTags] = useState<CashflowTagRecord[]>([]);
    const [nameSearch, setNameSearch] = useState("");
    const [tagSearch, setTagSearch] = useState("");
    const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

    const getDateFilterQuery = (preset: string) => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().replace('T', ' ');

        switch (preset) {
            case "today":
                return `date >= "${startOfDay}"`;
            case "last_7": {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                return `date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "last_14": {
                const d = new Date();
                d.setDate(d.getDate() - 14);
                return `date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_week": {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const d = new Date(now.setDate(diff));
                d.setHours(0, 0, 0, 0);
                return `date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "last_30": {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                return `date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_month": {
                const d = new Date(now.getFullYear(), now.getMonth(), 1);
                return `date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "this_year": {
                const d = new Date(now.getFullYear(), 0, 1);
                return `date >= "${d.toISOString().replace('T', ' ')}"`;
            }
            case "custom": {
                if (!customStartDate && !customEndDate) return "";
                let q = "";
                if (customStartDate) {
                    q += `date >= "${customStartDate} 00:00:00"`;
                }
                if (customEndDate) {
                    if (q) q += " && ";
                    q += `date <= "${customEndDate} 23:59:59"`;
                }
                return q;
            }
            default:
                return "";
        }
    };

    const buildFilterQuery = () => {
        const queries: string[] = [];

        // Search Filter
        if (search.trim()) {
            queries.push(`(name ~ "${search}" || description ~ "${search}" || notes ~ "${search}")`);
        }

        // Date Filter
        const dateQuery = getDateFilterQuery(dateFilter);
        if (dateQuery) queries.push(`(${dateQuery})`);

        // Name Filters
        if (selectedNames.length > 0) {
            const nameQuery = selectedNames.map(n => `name = "${n}"`).join(" || ");
            queries.push(`(${nameQuery})`);
        }

        // Type Filters
        if (selectedTypes.length > 0) {
            const typeQuery = selectedTypes.map(t => `type = "${t}"`).join(" || ");
            queries.push(`(${typeQuery})`);
        }

        // Category Filters
        if (selectedCategories.length > 0) {
            const catQuery = selectedCategories.map(c => `category = "${c}"`).join(" || ");
            queries.push(`(${catQuery})`);
        }

        return queries.join(" && ");
    };

    const fetchData = async (page = 1) => {
        setIsLoading(true);
        try {
            const filterQuery = buildFilterQuery();
            const [itemsResult, statsResult, namesResult, tagsResult] = await Promise.all([
                CashflowService.getItems(page, 25, "-date", filterQuery),
                CashflowService.getStats(filterQuery),
                CashflowService.getNames(),
                CashflowService.getTags()
            ]);

            setItems(itemsResult.items);
            setCurrentPage(itemsResult.page);
            setTotalPages(itemsResult.totalPages);
            setStats(statsResult);
            setAvailableNames(namesResult);
            setAvailableTags(tagsResult);
        } catch (error) {
            console.error("Cashflow: Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1); // Reset to page 1 on filter change
    }, [dateFilter, selectedNames, selectedTypes, selectedCategories, search, customStartDate, customEndDate]);

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    useEffect(() => {
        const handleClickOutside = () => setOpenFilter(null);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    // Shortcut Ctrl+Enter
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                handleAddNewRow();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingId]);

    const handleAddNewRow = () => {
        if (editingId) return; // Already editing something
        setEditingId("new");
        setEditFormData({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toISOString().split('T')[1].substring(0, 5),
            type: "", // Label (e.g. Service Fee)
            category: "income", // Classification (e.g. income/expense)
            amount: 0,
            description: "",
            notes: ""
        });
        setNameSearch("");
        setTagSearch("");
    };

    const handleEditRow = (item: CashflowItemRecord) => {
        setEditingId(item.id);
        const datePart = item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0];
        let timePart = "";
        if (item.time) {
            try {
                timePart = new Date(item.time).toISOString().split('T')[1].substring(0, 5);
            } catch (e) {
                timePart = "";
            }
        }
        setEditFormData({
            ...item,
            date: datePart,
            time: timePart
        });
        setNameSearch(item.name || "");
        setTagSearch(item.type || ""); // Tag is now mapped to 'type' for existing data
    };

    const handleDeleteRow = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await CashflowService.deleteItem(id);
            await fetchData(currentPage);
        } catch (error) {
            alert("Failed to delete record.");
        }
    };

    const handleSaveRow = async () => {
        if (!editFormData.name || (editFormData.amount || 0) <= 0) {
            alert("Please provide a name and a valid amount.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if name is new
            const nameExists = availableNames.some(n => n.name.toLowerCase() === (editFormData.name || "").toLowerCase());
            if (!nameExists && editFormData.name) {
                await CashflowService.createName(editFormData.name);
            }

            // Check if tag is new
            if (editFormData.category) {
                const tagExists = availableTags.some(t => t.tag.toLowerCase() === (editFormData.category || "").toLowerCase());
                if (!tagExists) {
                    await CashflowService.createTag({ category: "General", tag: editFormData.category });
                }
            }

            const payload = {
                ...editFormData,
                date: new Date(editFormData.date!).toISOString(),
                time: editFormData.time ? new Date(`${editFormData.date}T${editFormData.time}`).toISOString() : undefined
            };

            if (editingId === "new") {
                await CashflowService.createItem(payload);
            } else {
                await CashflowService.updateItem(editingId!, payload);
            }

            await fetchData(currentPage);
            setEditingId(null);
            setEditFormData({});
        } catch (error) {
            console.error("Cashflow: Error saving:", error);
            alert("Failed to save transaction.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-white">Cashflow Management</h1>
                <button
                    onClick={handleAddNewRow}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary p-6 rounded-2xl border border-white/5 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-white/50">Total Income</h3>
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{formatCurrency(stats.income)}</span>
                </div>

                <div className="bg-secondary p-6 rounded-2xl border border-white/5 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-white/50">Total Expense</h3>
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{formatCurrency(stats.expense)}</span>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg text-black transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-black/50">Net Balance</h3>
                        <div className="p-2 bg-black/5 rounded-lg">
                            <DollarSign className="w-5 h-5 text-black/50" />
                        </div>
                    </div>
                    <span className="text-2xl font-bold">{formatCurrency(stats.balance)}</span>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-secondary border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors min-h-[400px]">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-army-500/40 focus:border-transparent transition-all placeholder:text-white/30"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                                className="inline-flex items-center px-3 py-2 border border-white/10 rounded-xl text-sm font-medium text-white/60 bg-black/40 hover:bg-white/5 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                {dateFilter === 'all' ? 'All Time' : dateFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>

                            {isDateFilterOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-secondary border border-white/10 rounded-xl shadow-lg z-[70] py-1 overflow-hidden">
                                    <div className="max-h-60 overflow-y-auto">
                                        {[
                                            { id: 'all', label: 'All Time' },
                                            { id: 'today', label: 'Today' },
                                            { id: 'last_7', label: 'Last 7 Days' },
                                            { id: 'last_14', label: 'Last 14 Days' },
                                            { id: 'last_30', label: 'Last 30 Days' },
                                            { id: 'this_week', label: 'This Week' },
                                            { id: 'this_month', label: 'This Month' },
                                            { id: 'this_year', label: 'This Year' },
                                            { id: 'custom', label: 'Custom Range' }
                                        ].map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => {
                                                    setDateFilter(preset.id);
                                                    if (preset.id !== 'custom') {
                                                        setIsDateFilterOpen(false);
                                                        setCurrentPage(1);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors",
                                                    dateFilter === preset.id ? "font-bold text-white" : "text-white/50"
                                                )}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {dateFilter === 'custom' && (
                                        <div className="px-4 py-3 border-t border-white/5 bg-black/40 space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-white/40">From</label>
                                                <input
                                                    type="date"
                                                    value={customStartDate}
                                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs bg-black/40 border border-white/10 rounded focus:ring-1 focus:ring-army-500/40 outline-none text-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-white/40">To</label>
                                                <input
                                                    type="date"
                                                    value={customEndDate}
                                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs bg-black/40 border border-white/10 rounded focus:ring-1 focus:ring-army-500/40 outline-none text-white"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setIsDateFilterOpen(false);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="flex-1 px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:opacity-90 transition-opacity"
                                                >
                                                    Apply
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCustomStartDate("");
                                                        setCustomEndDate("");
                                                        setDateFilter("all");
                                                        setIsDateFilterOpen(false);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="px-3 py-1.5 border border-white/10 text-xs text-white/40 rounded hover:bg-white/5"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-white/40">
                        <Clock className="w-8 h-8 mb-4 animate-spin opacity-20" />
                        <span>Loading transactions...</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-white/40 text-center px-4">
                        <DollarSign className="w-12 h-12 mb-4 opacity-10" />
                        <h3 className="text-lg font-medium text-white mb-1">No transactions found</h3>
                        <p className="text-sm">Add a new transaction to see it in the record.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-white/40 bg-white/[0.02] border-b border-white/5 uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Date</th>
                                    <th className="px-4 py-3 font-bold">Time</th>
                                    <th className="px-4 py-3 font-bold">
                                        <div className="flex items-center">
                                            Name
                                            <CheckboxFilter
                                                options={availableNames.map(n => n.name)}
                                                selected={selectedNames}
                                                onChange={setSelectedNames}
                                                isOpen={openFilter === 'name'}
                                                onToggle={() => setOpenFilter(openFilter === 'name' ? null : 'name')}
                                            />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 font-bold">
                                        <div className="flex items-center">
                                            Type
                                            <CheckboxFilter
                                                options={availableTags.map(t => t.tag)}
                                                selected={selectedTypes}
                                                onChange={setSelectedTypes}
                                                isOpen={openFilter === 'type'}
                                                onToggle={() => setOpenFilter(openFilter === 'type' ? null : 'type')}
                                            />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 font-bold">Description</th>
                                    <th className="px-4 py-3 font-bold">
                                        <div className="flex items-center">
                                            Category
                                            <CheckboxFilter
                                                options={["income", "expense"]}
                                                selected={selectedCategories}
                                                onChange={setSelectedCategories}
                                                isOpen={openFilter === 'category'}
                                                onToggle={() => setOpenFilter(openFilter === 'category' ? null : 'category')}
                                            />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 font-bold text-right">Amount</th>
                                    <th className="px-4 py-3 font-bold">Notes</th>
                                    <th className="px-4 py-3 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {editingId === "new" && (
                                    <tr className="bg-white/[0.02]">
                                        <td className="px-2 py-2">
                                            <input
                                                type="date"
                                                value={editFormData.date}
                                                onChange={e => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-28 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="time"
                                                value={editFormData.time}
                                                onChange={e => setEditFormData(prev => ({ ...prev, time: e.target.value }))}
                                                className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                            />
                                        </td>
                                        <td className="px-2 py-2 relative">
                                            <div className="flex flex-col gap-1 w-40">
                                                <input
                                                    type="text"
                                                    placeholder="Name..."
                                                    value={nameSearch}
                                                    onFocus={() => setIsNameDropdownOpen(true)}
                                                    onChange={e => {
                                                        setNameSearch(e.target.value);
                                                        setEditFormData(prev => ({ ...prev, name: e.target.value }));
                                                        setIsNameDropdownOpen(true);
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30"
                                                />
                                                {isNameDropdownOpen && (
                                                    <div className="absolute flex flex-col top-full left-0 h-200 w-full bg-secondary border border-white/10 rounded shadow-lg z-50 max-h-32 overflow-y-auto">
                                                        {availableNames.filter(n => n.name.toLowerCase().includes(nameSearch.toLowerCase())).map(n => (
                                                            <button
                                                                key={n.id}
                                                                onClick={() => {
                                                                    setEditFormData(prev => ({ ...prev, name: n.name }));
                                                                    setNameSearch(n.name);
                                                                    setIsNameDropdownOpen(false);
                                                                }}
                                                                className="w-full px-2 py-1 text-left text-xs text-white/60 hover:bg-white/5"
                                                            >
                                                                {n.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 relative">
                                            <div className="flex flex-col gap-1 w-32">
                                                <input
                                                    type="text"
                                                    placeholder="Tag..."
                                                    value={tagSearch}
                                                    onFocus={() => setIsTagDropdownOpen(true)}
                                                    onChange={e => {
                                                        setTagSearch(e.target.value);
                                                        setEditFormData(prev => ({ ...prev, type: e.target.value }));
                                                        setIsTagDropdownOpen(true);
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30"
                                                />
                                                {isTagDropdownOpen && (
                                                    <div className="absolute flex flex-col top-full left-0 h-200 w-full bg-secondary border border-white/10 rounded shadow-lg z-50 max-h-32 overflow-y-auto">
                                                        {availableTags.filter(t => t.tag.toLowerCase().includes(tagSearch.toLowerCase())).map(t => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => {
                                                                    setEditFormData(prev => ({ ...prev, type: t.tag }));
                                                                    setTagSearch(t.tag);
                                                                    setIsTagDropdownOpen(false);
                                                                }}
                                                                className="w-full px-2 py-1 text-left text-xs text-white/60 hover:bg-white/5"
                                                            >
                                                                {t.tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                placeholder="Description..."
                                                value={editFormData.description}
                                                onChange={e => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-40 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30"
                                            />
                                        </td>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditFormData(prev => ({ ...prev, category: 'income' }))} className={cn("px-2 py-0.5 text-[9px] rounded font-bold", editFormData.category === 'income' ? 'bg-green-600 text-white' : 'bg-white/5 text-white/40')}>IN</button>
                                            <button onClick={() => setEditFormData(prev => ({ ...prev, category: 'expense' }))} className={cn("px-2 py-0.5 text-[9px] rounded font-bold", editFormData.category === 'expense' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40')}>OUT</button>
                                        </div>
                                        <td className="px-2 py-2">
                                            <div className="flex items-center gap-1 w-32">
                                                <span className="text-[10px] text-white/30">Rp</span>
                                                <input
                                                    type="number"
                                                    value={editFormData.amount}
                                                    onChange={e => setEditFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-right text-white"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                placeholder="Notes..."
                                                value={editFormData.notes}
                                                onChange={e => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                className="w-40 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-center flex items-center justify-center gap-2 h-full">
                                            <button onClick={handleSaveRow} disabled={isSubmitting} className="p-1.5 bg-white text-black rounded hover:opacity-80 transition-opacity">
                                                {isSubmitting ? <Clock className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-1.5 border border-white/10 rounded hover:bg-white/5 transition-colors text-white/40">
                                                <RotateCcw className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                )}

                                {items.map((tx) => (
                                    editingId === tx.id ? (
                                        <tr key={tx.id} className="bg-white/[0.02]">
                                            <td className="px-2 py-2">
                                                <input
                                                    type="date"
                                                    value={editFormData.date}
                                                    onChange={e => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                                                    className="w-28 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="time"
                                                    value={editFormData.time}
                                                    onChange={e => setEditFormData(prev => ({ ...prev, time: e.target.value }))}
                                                    className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                />
                                            </td>
                                            <td className="px-2 py-2 relative">
                                                <input
                                                    type="text"
                                                    value={nameSearch}
                                                    onFocus={() => setIsNameDropdownOpen(true)}
                                                    onChange={e => {
                                                        setNameSearch(e.target.value);
                                                        setEditFormData(prev => ({ ...prev, name: e.target.value }));
                                                        setIsNameDropdownOpen(true);
                                                    }}
                                                    className="w-40 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                />
                                                {isNameDropdownOpen && (
                                                    <div className="absolute flex flex-col top-full left-0 h-200 w-full bg-secondary border border-white/10 rounded shadow-lg z-50 max-h-32 overflow-y-auto">
                                                        {availableNames.filter(n => n.name.toLowerCase().includes(nameSearch.toLowerCase())).map(n => (
                                                            <button
                                                                key={n.id}
                                                                onClick={() => {
                                                                    setEditFormData(prev => ({ ...prev, name: n.name }));
                                                                    setNameSearch(n.name);
                                                                    setIsNameDropdownOpen(false);
                                                                }}
                                                                className="w-full px-2 py-1 text-left text-xs text-white/60 hover:bg-white/5"
                                                            >
                                                                {n.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 relative">
                                                <div className="flex flex-col gap-1 w-32">
                                                    <input
                                                        type="text"
                                                        value={tagSearch}
                                                        onFocus={() => setIsTagDropdownOpen(true)}
                                                        onChange={e => {
                                                            setTagSearch(e.target.value);
                                                            setEditFormData(prev => ({ ...prev, category: e.target.value }));
                                                            setIsTagDropdownOpen(true);
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                    />
                                                    {isTagDropdownOpen && (
                                                        <div className="absolute flex flex-col top-full left-0 h-200 w-full bg-secondary border border-white/10 rounded shadow-lg z-50 max-h-32 overflow-y-auto">
                                                            {availableTags.filter(t => t.tag.toLowerCase().includes(tagSearch.toLowerCase())).map(t => (
                                                                <button
                                                                    key={t.id}
                                                                    onClick={() => {
                                                                        setEditFormData(prev => ({ ...prev, category: t.tag }));
                                                                        setTagSearch(t.tag);
                                                                        setIsTagDropdownOpen(false);
                                                                    }}
                                                                    className="w-full px-2 py-1 text-left text-xs text-white/60 hover:bg-white/5"
                                                                >
                                                                    {t.tag}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={editFormData.description}
                                                    onChange={e => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                                    className="w-40 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex gap-1">
                                                    <button onClick={() => setEditFormData(prev => ({ ...prev, type: 'income' }))} className={cn("px-2 py-1 text-[10px] rounded font-bold transition-colors", editFormData.type === 'income' ? 'bg-green-600 text-white' : 'bg-white/5 text-white/40')}>IN</button>
                                                    <button onClick={() => setEditFormData(prev => ({ ...prev, type: 'expense' }))} className={cn("px-2 py-1 text-[10px] rounded font-bold transition-colors", editFormData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40')}>OUT</button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center gap-1 w-32">
                                                    <span className="text-[10px] text-white/30">Rp</span>
                                                    <input
                                                        type="number"
                                                        value={editFormData.amount}
                                                        onChange={e => setEditFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-right text-white"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={editFormData.notes}
                                                    onChange={e => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                    className="w-40 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-center flex items-center justify-center gap-2">
                                                <button onClick={handleSaveRow} disabled={isSubmitting} className="p-1.5 bg-white text-black rounded hover:opacity-80 transition-opacity">
                                                    {isSubmitting ? <Clock className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 border border-white/10 rounded hover:bg-white/5 transition-colors text-white/40">
                                                    <RotateCcw className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-4 py-3 text-white/40 text-xs">
                                                {new Date(tx.date).toLocaleDateString("id-ID")}
                                            </td>
                                            <td className="px-4 py-3 text-white/30 text-xs">
                                                {tx.time ? new Date(tx.time).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-white max-w-[150px] truncate" title={tx.name}>
                                                {tx.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/50 uppercase tracking-tight">
                                                    {tx.type || "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white/40 text-xs max-w-[200px] truncate" title={tx.description}>
                                                {tx.description || "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const tVal = (tx.type || "").toLowerCase();
                                                    const cVal = (tx.category || "").toLowerCase();
                                                    const isInc = tVal === 'income' || cVal === 'income' || tVal === 'masuk' || cVal === 'masuk';
                                                    const isExp = tVal === 'expense' || cVal === 'expense' || tVal === 'keluar' || cVal === 'keluar';
                                                    return (
                                                        <span className={cn(
                                                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                                                            isInc ? 'bg-green-500/10 text-green-400' :
                                                                isExp ? 'bg-red-500/10 text-red-400' :
                                                                    'bg-white/5 text-white/40'
                                                        )}>
                                                            {tx.category || tx.type}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className={cn(
                                                "px-4 py-3 font-semibold text-right",
                                                (() => {
                                                    const tVal = (tx.type || "").toLowerCase();
                                                    const cVal = (tx.category || "").toLowerCase();
                                                    return tVal === 'income' || cVal === 'income' || tVal === 'masuk' || cVal === 'masuk';
                                                })() ? 'text-green-400' : 'text-red-400'
                                            )}>
                                                {(() => {
                                                    const tVal = (tx.type || "").toLowerCase();
                                                    const cVal = (tx.category || "").toLowerCase();
                                                    return tVal === 'income' || cVal === 'income' || tVal === 'masuk' || cVal === 'masuk' ? '+' : '-';
                                                })()}{formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-white/30 text-xs max-w-[200px] truncate" title={tx.notes}>
                                                {tx.notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-center opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => handleEditRow(tx)} className="p-1.5 text-white/40 hover:text-white transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDeleteRow(tx.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.02] mt-auto">
                        <p className="text-xs text-white/40 font-medium tracking-tight">
                            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="p-2 rounded-xl border border-white/10 bg-secondary text-white/40 disabled:opacity-50 hover:bg-white/5 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || isLoading}
                                className="p-2 rounded-xl border border-white/10 bg-secondary text-white/40 disabled:opacity-50 hover:bg-white/5 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

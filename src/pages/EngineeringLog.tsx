import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    NotebookPen,
    Calendar,
    Filter,
} from "lucide-react";
import {
    EngineeringLogService,
    type EngineeringLogRecord,
} from "../services/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APPLICATIONS = ["TerraSim", "TerraPile", "DeSys", "DaharPDF", "Admin Panel", "Other"];
const CATEGORIES = ["Architecture", "Algorithm", "Bug Fix", "Optimization", "Research", "Other"];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EngineeringLog() {
    const [records, setRecords] = useState<EngineeringLogRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterApp, setFilterApp] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [application, setApplication] = useState("");
    const [category, setCategory] = useState("");
    const [content, setContent] = useState("");
    const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

    // ---- Data ----

    const fetchData = async () => {
        setLoading(true);
        try {
            setRecords(await EngineeringLogService.getAll());
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ---- Filter ----

    const filtered = records.filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
            r.title.toLowerCase().includes(q) ||
            r.content?.toLowerCase().includes(q) ||
            r.application.toLowerCase().includes(q);
        const matchApp = filterApp ? r.application === filterApp : true;
        return matchSearch && matchApp;
    });

    // Group by date
    const grouped = filtered.reduce<Record<string, EngineeringLogRecord[]>>((acc, r) => {
        const key = r.log_date?.slice(0, 10) || r.created.slice(0, 10);
        (acc[key] = acc[key] || []).push(r);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // ---- Modal ----

    const openCreate = () => {
        setEditingId(null);
        setTitle("");
        setApplication("");
        setCategory("");
        setContent("");
        setLogDate(new Date().toISOString().slice(0, 10));
        setModalOpen(true);
    };

    const openEdit = (r: EngineeringLogRecord) => {
        setEditingId(r.id);
        setTitle(r.title);
        setApplication(r.application);
        setCategory(r.category);
        setContent(r.content);
        setLogDate(r.log_date?.slice(0, 10) || r.created.slice(0, 10));
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); };

    // ---- CRUD ----

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = { title, application, category, content, log_date: logDate };
            if (editingId) {
                await EngineeringLogService.update(editingId, data);
            } else {
                await EngineeringLogService.create(data);
            }
            closeModal();
            fetchData();
        } catch (err) {
            alert("Save failed: " + (err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this log entry?")) return;
        try {
            await EngineeringLogService.remove(id);
            fetchData();
        } catch (err) {
            alert("Delete failed: " + (err as Error).message);
        }
    };

    // ---- Render ----

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Engineering Journal
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">
                        Log technical decisions and the reasoning behind them
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Entry
                </button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search entries…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 transition-colors"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <select
                        value={filterApp}
                        onChange={(e) => setFilterApp(e.target.value)}
                        className="pl-10 pr-8 py-2.5 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:ring-2 focus:ring-army-500/40 appearance-none transition-colors"
                    >
                        <option value="">All Apps</option>
                        {APPLICATIONS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                    <span className="text-xs uppercase tracking-widest font-bold text-white/40">Loading</span>
                </div>
            ) : sortedDates.length === 0 ? (
                <div className="bg-secondary/20 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                    <NotebookPen className="w-12 h-12 mx-auto text-white/20 mb-4" />
                    <h2 className="text-lg font-bold text-white mb-1">No entries yet</h2>
                    <p className="text-sm text-white/40">
                        Start documenting your engineering decisions
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedDates.map((date) => (
                        <div key={date}>
                            {/* Date header */}
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-white/40" />
                                <span className="text-sm font-semibold text-white/40">
                                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>

                            {/* Entries */}
                            <div className="space-y-3 pl-6 border-l-2 border-white/10">
                                {grouped[date].map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="bg-secondary/20 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-white">
                                                        {entry.title}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded-full bg-army-500/10 text-[10px] font-medium text-army-400 border border-army-500/20">
                                                        {entry.application}
                                                    </span>
                                                    {entry.category && (
                                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-medium text-white/40 border border-white/10">
                                                            {entry.category}
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.content && (
                                                    <p className="text-sm text-white/50 mt-2 whitespace-pre-wrap line-clamp-4">
                                                        {entry.content}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => openEdit(entry)}
                                                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-xl bg-secondary/20 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white">
                                {editingId ? "Edit Entry" : "New Journal Entry"}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-white/40 hover:text-white rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                    placeholder="Decision title…"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Date</label>
                                    <input
                                        type="date"
                                        value={logDate}
                                        onChange={(e) => setLogDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Application</label>
                                    <select
                                        value={application}
                                        onChange={(e) => setApplication(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                    >
                                        <option value="">Select…</option>
                                        {APPLICATIONS.map((a) => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                    >
                                        <option value="">Select…</option>
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Content (Markdown)</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={10}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 resize-none"
                                    placeholder="## Why this decision was made&#10;&#10;Write your reasoning in Markdown…"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !title.trim()}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-black bg-white rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

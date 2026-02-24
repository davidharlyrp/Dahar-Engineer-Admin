import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    Library,
    ExternalLink,
    Filter,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
    BibliographyService,
    type BibliographyRecord,
} from "../services/api";

const STATUSES = [
    { value: "to_read", label: "To Read", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { value: "in_progress", label: "In Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    { value: "read", label: "Read", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "implemented", label: "Implemented", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
];

export function Bibliography() {
    const [records, setRecords] = useState<BibliographyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [authors, setAuthors] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());
    const [journal, setJournal] = useState("");
    const [doi, setDoi] = useState("");
    const [abstract, setAbstract] = useState("");
    const [tags, setTags] = useState("");
    const [status, setStatus] = useState<BibliographyRecord["status"]>("to_read");
    const [notes, setNotes] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            setRecords(await BibliographyService.getAll());
        } catch (err) {
            console.error("Failed to fetch bibliography:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = records.filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
            r.title.toLowerCase().includes(q) ||
            r.authors.toLowerCase().includes(q) ||
            r.tags.toLowerCase().includes(q);
        const matchStatus = filterStatus ? r.status === filterStatus : true;
        return matchSearch && matchStatus;
    });

    const openCreate = () => {
        setEditingId(null);
        setTitle("");
        setAuthors("");
        setYear(new Date().getFullYear());
        setJournal("");
        setDoi("");
        setAbstract("");
        setTags("");
        setStatus("to_read");
        setNotes("");
        setModalOpen(true);
    };

    const openEdit = (r: BibliographyRecord) => {
        setEditingId(r.id);
        setTitle(r.title);
        setAuthors(r.authors);
        setYear(r.year);
        setJournal(r.journal);
        setDoi(r.doi);
        setAbstract(r.abstract);
        setTags(r.tags);
        setStatus(r.status);
        setNotes(r.notes);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = new FormData();
            data.append("title", title);
            data.append("authors", authors);
            data.append("year", String(year));
            data.append("journal", journal);
            data.append("doi", doi);
            data.append("abstract", abstract);
            data.append("tags", tags);
            data.append("status", status);
            data.append("notes", notes);

            if (editingId) {
                await BibliographyService.update(editingId, data);
            } else {
                await BibliographyService.create(data);
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
        if (!confirm("Delete this reference?")) return;
        try {
            await BibliographyService.remove(id);
            fetchData();
        } catch (err) {
            alert("Delete failed: " + (err as Error).message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Bibliography & Tagging
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage scientific references and research reading lists
                    </p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Reference
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search references…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none">
                        <option value="">All Statuses</option>
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
                    <Library className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No references found</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add your first scientific paper</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((r) => {
                        const sConfig = STATUSES.find(s => s.value === r.status) || STATUSES[0];
                        return (
                            <div key={r.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all flex flex-col h-full">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium font-mono", sConfig.color)}>
                                        {sConfig.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEdit(r)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDelete(r.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                                    {r.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">
                                    {r.authors} ({r.year})
                                </p>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                    {r.journal}
                                </p>

                                <div className="mt-auto pt-4 space-y-3">
                                    {r.tags && (
                                        <div className="flex flex-wrap gap-1">
                                            {r.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                                                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-400">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {r.doi && (
                                        <a href={r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                            <ExternalLink className="w-3 h-3" /> DOI Link
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {editingId ? "Edit Reference" : "New Reference"}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Paper Title" />
                            <div className="grid grid-cols-4 gap-4">
                                <input value={authors} onChange={(e) => setAuthors(e.target.value)} className="col-span-3 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Authors (e.g. Smith, J., Doe, A.)" />
                                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Year" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input value={journal} onChange={(e) => setJournal(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Journal / Conference" />
                                <input value={doi} onChange={(e) => setDoi(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="DOI or URL" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Tags (comma separated)" />
                                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none" placeholder="Abstract (optional)" />
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none" placeholder="Personal notes..." />
                        </div>
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:bg-slate-700 rounded-lg">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !title} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-black disabled:opacity-50">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    Link2,
    ExternalLink,
    Code2,
} from "lucide-react";
import {
    ResearchLinkService,
    type ResearchLinkRecord,
    type CodeMapping,
} from "../services/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_MAPPING: CodeMapping = {
    app: "",
    className: "",
    functionName: "",
    description: "",
};

const APPS = ["TerraSim", "DeSys", "TerraPile", "Other"];

function parseTags(raw: string): string[] {
    return raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PaperLinker() {
    const [records, setRecords] = useState<ResearchLinkRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [paperUrl, setPaperUrl] = useState("");
    const [tags, setTags] = useState("");
    const [notes, setNotes] = useState("");
    const [mappings, setMappings] = useState<CodeMapping[]>([{ ...EMPTY_MAPPING }]);

    // ---- Data fetching ----

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await ResearchLinkService.getAll();
            setRecords(data);
        } catch (err) {
            console.error("Failed to fetch research links:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ---- Filtering ----

    const filtered = records.filter((r) => {
        const q = search.toLowerCase();
        return (
            r.title.toLowerCase().includes(q) ||
            r.tags.toLowerCase().includes(q) ||
            r.notes?.toLowerCase().includes(q)
        );
    });

    // ---- Modal helpers ----

    const openCreate = () => {
        setEditingId(null);
        setTitle("");
        setPaperUrl("");
        setTags("");
        setNotes("");
        setMappings([{ ...EMPTY_MAPPING }]);
        setModalOpen(true);
    };

    const openEdit = (r: ResearchLinkRecord) => {
        setEditingId(r.id);
        setTitle(r.title);
        setPaperUrl(r.paper_url);
        setTags(r.tags);
        setNotes(r.notes || "");
        setMappings(
            Array.isArray(r.code_mappings) && r.code_mappings.length > 0
                ? r.code_mappings
                : [{ ...EMPTY_MAPPING }]
        );
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    // ---- CRUD ----

    const handleSave = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", title);
            fd.append("paper_url", paperUrl);
            fd.append("tags", tags);
            fd.append("notes", notes);
            fd.append("code_mappings", JSON.stringify(mappings.filter((m) => m.app || m.className || m.functionName)));

            if (editingId) {
                await ResearchLinkService.update(editingId, fd);
            } else {
                await ResearchLinkService.create(fd);
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
        if (!confirm("Delete this research link?")) return;
        try {
            await ResearchLinkService.remove(id);
            fetchData();
        } catch (err) {
            alert("Delete failed: " + (err as Error).message);
        }
    };

    // ---- Mapping row helpers ----

    const updateMapping = (idx: number, field: keyof CodeMapping, value: string) => {
        setMappings((prev) =>
            prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
        );
    };

    const addMapping = () => setMappings((prev) => [...prev, { ...EMPTY_MAPPING }]);
    const removeMapping = (idx: number) => setMappings((prev) => prev.filter((_, i) => i !== idx));

    // ---- Render ----

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Paper‑to‑Code Linker
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">
                        Link research papers to specific code implementations
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Link
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    placeholder="Search papers, tags…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 transition-colors"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                    <span className="text-xs uppercase tracking-widest font-bold text-white/40">Loading</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-secondary/20 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                    <Link2 className="w-12 h-12 mx-auto text-white/20 mb-4" />
                    <h2 className="text-lg font-bold text-white mb-1">No links yet</h2>
                    <p className="text-sm text-white/40">
                        Create your first paper‑to‑code link above
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((r) => (
                        <div
                            key={r.id}
                            className="bg-secondary/20 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-white truncate">
                                        {r.title}
                                    </h3>
                                    {r.paper_url && (
                                        <a
                                            href={r.paper_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white mt-1 transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            {r.paper_url}
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => openEdit(r)}
                                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Tags */}
                            {r.tags && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {parseTags(r.tags).map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-medium text-white/50"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Code Mappings */}
                            {Array.isArray(r.code_mappings) && r.code_mappings.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                                        <Code2 className="w-3 h-3" /> Code Mappings
                                    </span>
                                    <div className="grid gap-2">
                                        {r.code_mappings.map((m, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-black/40 rounded-xl p-3 border border-white/5"
                                            >
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[10px]">
                                                        {m.app}
                                                    </span>
                                                    <span className="font-mono text-white/50">
                                                        {m.className}{m.functionName ? `.${m.functionName}` : ""}
                                                    </span>
                                                </div>
                                                {m.description && (
                                                    <p className="text-xs text-white/40 mt-1.5">
                                                        {m.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-2xl bg-secondary/20 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white">
                                {editingId ? "Edit Link" : "New Paper Link"}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-white/40 hover:text-white rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Paper Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                    placeholder="e.g. Modified Cam Clay Model (Roscoe & Burland, 1968)"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Paper URL</label>
                                <input
                                    value={paperUrl}
                                    onChange={(e) => setPaperUrl(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                    placeholder="https://doi.org/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tags</label>
                                <input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                    placeholder="FEM, ConstitutiveModel, MCC"
                                />
                            </div>

                            {/* Code Mappings */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Code Mappings</label>
                                    <button
                                        type="button"
                                        onClick={addMapping}
                                        className="text-xs text-white/40 hover:text-white transition-colors"
                                    >
                                        + Add Row
                                    </button>
                                </div>
                                {mappings.map((m, idx) => (
                                    <div key={idx} className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={m.app}
                                                onChange={(e) => updateMapping(idx, "app", e.target.value)}
                                                className="flex-1 px-2 py-1.5 rounded border border-white/10 bg-black/40 text-xs text-white focus:outline-none"
                                            >
                                                <option value="">Application</option>
                                                {APPS.map((a) => (
                                                    <option key={a} value={a}>{a}</option>
                                                ))}
                                            </select>
                                            <input
                                                value={m.className}
                                                onChange={(e) => updateMapping(idx, "className", e.target.value)}
                                                placeholder="Class"
                                                className="flex-1 px-2 py-1.5 rounded border border-white/10 bg-black/40 text-xs text-white font-mono focus:outline-none"
                                            />
                                            <input
                                                value={m.functionName}
                                                onChange={(e) => updateMapping(idx, "functionName", e.target.value)}
                                                placeholder="Function"
                                                className="flex-1 px-2 py-1.5 rounded border border-white/10 bg-black/40 text-xs text-white font-mono focus:outline-none"
                                            />
                                            {mappings.length > 1 && (
                                                <button onClick={() => removeMapping(idx)} className="p-1 text-white/40 hover:text-red-400 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            value={m.description}
                                            onChange={(e) => updateMapping(idx, "description", e.target.value)}
                                            placeholder="Description of the implementation logic…"
                                            className="w-full px-2 py-1.5 rounded border border-white/10 bg-black/40 text-xs text-white focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 resize-none"
                                    placeholder="Additional notes…"
                                />
                            </div>
                        </div>

                        {/* Footer */}
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

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    Sigma,
} from "lucide-react";
import {
    DerivationService,
    type DerivationRecord,
} from "../services/api";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DerivationTracker() {
    const [records, setRecords] = useState<DerivationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [latexContent, setLatexContent] = useState("");
    const [application, setApplication] = useState("");
    const [tags, setTags] = useState("");
    const [relatedPaper, setRelatedPaper] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            setRecords(await DerivationService.getAll());
        } catch (err) {
            console.error("Failed to fetch derivations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = records.filter((r) => {
        const q = search.toLowerCase();
        return (
            r.title.toLowerCase().includes(q) ||
            r.tags.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setLatexContent("\\int_0^\\infty x^2 e^{-x} dx = 2");
        setApplication("");
        setTags("");
        setRelatedPaper("");
        setModalOpen(true);
    };

    const openEdit = (r: DerivationRecord) => {
        setEditingId(r.id);
        setTitle(r.title);
        setDescription(r.description);
        setLatexContent(r.latex_content);
        setApplication(r.application);
        setTags(r.tags);
        setRelatedPaper(r.related_paper);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = { title, description, latex_content: latexContent, application, tags, related_paper: relatedPaper };
            if (editingId) {
                await DerivationService.update(editingId, data);
            } else {
                await DerivationService.create(data);
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
        if (!confirm("Delete this derivation?")) return;
        try {
            await DerivationService.remove(id);
            fetchData();
        } catch (err) {
            alert("Delete failed: " + (err as Error).message);
        }
    };

    return (
        <div className="space-y-6 p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Derivation Tracker
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">
                        Mathematical derivations with live LaTeX rendering
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Derivation
                </button>
            </div>

            <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    placeholder="Search by title, tags…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 transition-colors"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 flex-1 gap-3">
                    <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                    <span className="text-xs uppercase tracking-widest font-bold text-white/40">Loading</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-secondary/20 border border-dashed border-white/10 rounded-2xl p-12 text-center flex-1">
                    <Sigma className="w-12 h-12 mx-auto text-white/20 mb-4" />
                    <h2 className="text-lg font-bold text-white mb-1">No derivations yet</h2>
                    <p className="text-sm text-white/40">
                        Start tracking your mathematical modeling
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max overflow-y-auto pb-6">
                    {filtered.map((r) => (
                        <div
                            key={r.id}
                            className="bg-secondary/20 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col h-[350px]"
                        >
                            <div className="flex items-start justify-between gap-3 shrink-0">
                                <div>
                                    <h3 className="font-bold text-white line-clamp-2">
                                        {r.title}
                                    </h3>
                                    <p className="text-xs text-white/40 mt-1 line-clamp-1">
                                        {r.application}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 bg-white/[0.02] p-1 rounded-lg">
                                    <button onClick={() => openEdit(r)} className="p-1 text-white/40 hover:text-white hover:bg-white/5 rounded transition-colors" title="Edit">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="p-1 text-white/40 hover:text-red-400 hover:bg-white/5 rounded transition-colors" title="Delete">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-white/50 mt-3 line-clamp-2 shrink-0">
                                {r.description}
                            </p>

                            <div className="flex-1 mt-4 overflow-hidden bg-black/40 rounded-xl p-4 border border-white/5 flex items-center justify-center text-white">
                                <div className="max-h-full max-w-full overflow-auto">
                                    <BlockMath math={r.latex_content} />
                                </div>
                            </div>

                            {r.tags && (
                                <div className="flex flex-wrap gap-1.5 mt-4 shrink-0">
                                    {r.tags.split(',').filter(Boolean).map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-medium text-white/50">
                                            #{t.trim()}
                                        </span>
                                    ))}
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
                    <div className="relative w-full max-w-5xl bg-secondary/20 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
                            <h2 className="text-lg font-bold text-white">
                                {editingId ? "Edit Derivation" : "New Derivation"}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-white/40 hover:text-white rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                            {/* Editor Form */}
                            <div className="flex-1 flex flex-col border-r border-white/5 bg-white/[0.02] overflow-y-auto p-5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Metadata</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 mb-3"
                                        placeholder="Title (e.g. Yield Surface Function)"
                                    />
                                    <input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 mb-3"
                                        placeholder="Short description..."
                                    />
                                    <div className="flex gap-3 mb-3">
                                        <input
                                            value={application}
                                            onChange={(e) => setApplication(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                            placeholder="Application (e.g. TerraSim)"
                                        />
                                        <input
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40"
                                            placeholder="Tags (comma separated)"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block flex-shrink-0">LaTeX Content</label>
                                    <textarea
                                        value={latexContent}
                                        onChange={(e) => setLatexContent(e.target.value)}
                                        className="w-full flex-1 p-4 rounded-xl border border-white/10 bg-black/40 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-army-500/40 resize-none"
                                        placeholder="\int_0^\infty x^2 e^{-x} dx = 2"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-secondary/20">
                                <div className="p-3 border-b border-white/5 bg-white/[0.02] shrink-0">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Live Preview</span>
                                </div>
                                <div className="flex-1 overflow-auto p-8 flex items-center justify-center text-white">
                                    <div className="max-w-full overflow-x-auto text-xl bg-black/40 rounded-xl p-8 border border-white/5 shadow-inner">
                                        <ErrorBoundary>
                                            <BlockMath math={latexContent || "\\text{Waiting for input...}"} />
                                        </ErrorBoundary>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5 shrink-0">
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

// Simple Error Boundary for KaTeX to prevent app crashes on invalid LaTeX
function ErrorBoundary({ children }: { children: React.ReactNode }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => { setHasError(false); }, [children]);

    if (hasError) {
        return <div className="text-red-400 text-sm font-mono bg-red-500/10 p-4 rounded-lg border border-red-500/20">Invalid LaTeX syntax</div>;
    }

    try {
        return <>{children}</>;
    } catch (err) {
        setHasError(true);
        return <div className="text-red-400 text-sm font-mono">Invalid LaTeX syntax</div>;
    }
}

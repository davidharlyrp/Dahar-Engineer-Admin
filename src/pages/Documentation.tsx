import { useState, useEffect, useRef } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    FileCode2,
    UploadCloud,
    Save
} from "lucide-react";
import {
    DocumentationService,
    type DocumentationRecord,
} from "../services/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function Documentation() {
    const [records, setRecords] = useState<DocumentationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [content, setContent] = useState("");
    const [fileInput, setFileInput] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const batchInputRef = useRef<HTMLInputElement>(null);
    const [uploadingBatch, setUploadingBatch] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            setRecords(await DocumentationService.getAll());
        } catch (err) {
            console.error("Failed to fetch documentation:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = records.filter((r) => {
        const q = search.toLowerCase();
        return (
            r.title.toLowerCase().includes(q) ||
            (r.tags && r.tags.toLowerCase().includes(q)) ||
            (r.category && r.category.toLowerCase().includes(q))
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setTitle("");
        setCategory("");
        setTags("");
        setContent("# New Documentation\n\nWrite your content here...");
        setFileInput(null);
        setModalOpen(true);
    };

    const openEdit = (r: DocumentationRecord) => {
        setEditingId(r.id);
        setTitle(r.title);
        setCategory(r.category);
        setTags(r.tags);
        setContent(r.content || "");
        setFileInput(null);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("category", category);
            formData.append("tags", tags);
            formData.append("content", content);
            if (fileInput) {
                formData.append("file", fileInput);
            }

            if (editingId) {
                await DocumentationService.update(editingId, formData);
            } else {
                await DocumentationService.create(formData);
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
        if (!confirm("Delete this documentation?")) return;
        try {
            await DocumentationService.remove(id);
            fetchData();
        } catch (err) {
            alert("Delete failed: " + (err as Error).message);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileInput(file);
        if (file.name.endsWith('.md')) {
            try {
                const text = await file.text();
                setContent(text);
                if (!title) {
                    setTitle(file.name.replace('.md', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
                }
            } catch (error) {
                console.error("Error reading file:", error);
                alert("Failed to parse markdown file");
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith('.md')) {
            setFileInput(file);
            const text = await file.text();
            setContent(text);
            if (!title) setTitle(file.name.replace('.md', ''));
        }
    };

    const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        if (!confirm(`Are you sure you want to upload ${files.length} markdown files?`)) return;
        setUploadingBatch(true);
        try {
            for (const file of files) {
                if (file.name.endsWith('.md')) {
                    const text = await file.text();
                    const fileTitle = file.name.replace('.md', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    const formData = new FormData();
                    formData.append("title", fileTitle);
                    formData.append("content", text);
                    formData.append("category", "Imported");
                    formData.append("file", file);
                    await DocumentationService.create(formData);
                }
            }
            fetchData();
            alert(`Successfully batch uploaded ${files.length} files.`);
        } catch (error) {
            console.error("Batch upload failed:", error);
            alert("Failed to complete batch upload.");
        } finally {
            setUploadingBatch(false);
            if (batchInputRef.current) batchInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Documentation Editor
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Technical documentation with TeX support
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input type="file" multiple accept=".md" ref={batchInputRef} onChange={handleBatchUpload} className="hidden" />
                    <button
                        onClick={() => batchInputRef.current?.click()}
                        disabled={uploadingBatch}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {uploadingBatch ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                        Batch Upload
                    </button>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Doc
                    </button>
                </div>
            </div>

            <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search docs…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 flex-1"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center flex-1">
                    <FileCode2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No docs yet</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Write some technical documentation</p>
                </div>
            ) : (
                <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm transition-all h-full overflow-y-auto">
                    {filtered.map((r) => (
                        <div key={r.id} className="bg-white dark:bg-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all flex flex-col sm:flex-row gap-4 sm:items-center group">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                                        <FileCode2 className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                                {r.title}
                                            </h3>
                                            <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full shrink-0">
                                                {r.category || 'Uncategorized'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 italic opacity-70">
                                            {r.content.substring(0, 150).replace(/[#*`]/g, '').trim()}...
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 sm:ml-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                <div className="text-[10px] text-slate-400 hidden lg:block text-right leading-tight">
                                    <p>Updated: {new Date(r.updated).toLocaleDateString()}</p>
                                    <p>{Math.round(r.content.length / 5)} words</p>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-md p-0.5 border border-slate-200 dark:border-slate-800">
                                    <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 rounded transition-all" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Full Screen Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 animate-in fade-in duration-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20">
                        <div className="flex items-center gap-4 flex-1 mr-4">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-xl font-bold bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none w-full"
                                placeholder="Documentation Title"
                            />
                            <div className="hidden lg:flex items-center gap-2">
                                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-slate-900 dark:text-slate-100 focus:outline-none w-32 border border-transparent focus:border-slate-300 transition-all" />
                                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags..." className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-slate-900 dark:text-slate-100 focus:outline-none w-32 border border-transparent focus:border-slate-300 transition-all" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <input type="file" accept=".md" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors group">
                                <UploadCloud className="w-4 h-4 group-hover:scale-110 transition-transform" /> Import MD
                            </button>
                            <button onClick={handleSave} disabled={saving || !title} className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-black dark:hover:bg-white rounded transition-all shadow-md active:scale-95 disabled:opacity-50">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save"}
                            </button>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Split Pane Container */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50 dark:bg-slate-950">
                        {/* Editor Pane */}
                        <div
                            className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] min-h-0 relative shadow-inner"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full p-8 font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-300 focus:outline-none resize-none bg-transparent"
                                placeholder="# Title\n\nWrite markdown here..."
                                spellCheck={false}
                            />
                        </div>

                        {/* Preview Pane */}
                        <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-[#0d1117] text-slate-900 dark:text-slate-200 relative border-l border-slate-200 dark:border-slate-800">
                            <div className="absolute inset-0 p-8">
                                <article className="markdown-body" style={{ backgroundColor: 'transparent', color: 'inherit' }}>
                                    <ReactMarkdown
                                        remarkPlugins={[[remarkMath, { singleDollarText: true }], remarkGfm]}
                                        rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false }], rehypeHighlight]}
                                        components={{
                                            //@ts-ignore
                                            math: ({ value, children }) => {
                                                const content = value || (Array.isArray(children) ? children.join('') : children) || '';
                                                return (
                                                    <div className="my-8 py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg flex justify-center overflow-x-auto border-y border-slate-100 dark:border-slate-800 shadow-inner not-prose">
                                                        <span className="block p-4 scale-110 text-slate-900 dark:text-slate-100">
                                                            {String(content)}
                                                        </span>
                                                    </div>
                                                );
                                            },
                                        }}
                                    >
                                        {content || "*Live preview...*"}
                                    </ReactMarkdown>
                                </article>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

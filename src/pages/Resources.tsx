import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    Download,
    Edit2,
    Trash2,
    Loader2,
    X,
    UploadCloud,
    FileText
} from "lucide-react";
import { ResourceService, type ResourceRecord } from "../services/api";
import { cn } from "../lib/utils";
import { useAdminSettings } from "../hooks/useAdminSettings";

export function Resources() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<ResourceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ResourceRecord | null>(null);
    const [filters, setFilters] = useState({
        category: "",
    });
    const { perPage, autoRefresh, refreshInterval } = useAdminSettings();

    // Reset to page 1 when filters or search change
    useEffect(() => {
        setPage(1);
    }, [search, filters]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            let filterString = search ? `title ~ "${search}" || author ~ "${search}" || category ~ "${search}" || subcategory ~ "${search}"` : "";

            if (filters.category) {
                const catFilter = `category = "${filters.category}"`;
                filterString = filterString ? `(${filterString}) && ${catFilter} ` : catFilter;
            }

            const result = await ResourceService.getResources(page, perPage, "-created", filterString);
            setItems(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Resources: Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, search, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchData, refreshInterval * 1000);
        return () => clearInterval(id);
    }, [autoRefresh, refreshInterval, fetchData]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;
        try {
            await ResourceService.deleteResource(id);
            fetchData();
        } catch (error) {
            alert("Failed to delete resource.");
        }
    };

    const handleDownload = (item: ResourceRecord) => {
        const url = ResourceService.getFileUrl(item, item.file);
        window.open(url, "_blank");
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white/90">Resources</h1>
                    <p className="text-xs font-semibold text-white/50 mt-1">Manage downloadable documents and learning materials.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedItem(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors shadow-lg"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                </button>
            </div>

            {/* Controls */}
            <div className="bg-secondary/30 border border-white/5 rounded-xl shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4 transition-colors">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-white/10 bg-black/20 text-white rounded-lg focus:outline-none focus:border-army-500/50 transition-all placeholder:text-white/20"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                            className="inline-flex items-center px-3 py-2 border border-white/10 rounded-lg text-sm font-semibold text-white/80 bg-black/20 hover:bg-white/5 transition-colors focus:outline-none focus:border-army-500/50"
                        >
                            <option value="" className="bg-[#1a1a1a]">All Categories</option>
                            <option value="ebooks" className="bg-[#1a1a1a]">E-Books</option>
                            <option value="modul" className="bg-[#1a1a1a]">Modules</option>
                            <option value="regulations" className="bg-[#1a1a1a]">Regulations</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 border border-white/10 rounded-lg p-1 bg-black/20">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === "grid"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === "list"
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40">
                    <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-50" />
                    <span className="text-sm font-semibold animate-pulse">Scanning server...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40 text-center px-4 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                    <FileText className="w-10 h-10 mb-4 opacity-20" />
                    <h3 className="text-sm font-bold text-white mb-1">No Resources Found</h3>
                    <p className="text-xs font-semibold">Upload your first PDF or document to get started.</p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="group bg-secondary/20 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col relative hover:shadow-2xl hover:shadow-black/50">
                                    <div className="aspect-[4/1] w-full bg-black/40 flex items-center justify-center relative overflow-hidden">
                                        <FileText className="w-12 h-12 text-white/10 transition-transform group-hover:scale-110 duration-500" />

                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                            <button
                                                onClick={() => handleDownload(item)}
                                                className="p-3 bg-white text-black rounded-full shadow-2xl hover:scale-110 hover:bg-army-400 transition-all"
                                                title="Download PDF"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="absolute top-2 right-2">
                                            <span className="px-2 py-0.5 rounded-full bg-black/80 text-white text-[9px] font-bold tracking-wider border border-white/10">
                                                {item.file_type.split('/')[1]?.toUpperCase() || 'PDF'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-white text-sm leading-tight group-hover:text-army-400 transition-colors line-clamp-2 mb-1 min-h-[2.5rem]">
                                            {item.title}
                                        </h3>
                                        <p className="text-[10px] text-white/40 font-semibold mb-3">By {item.author || 'Unknown Author'}</p>

                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-white/60">
                                                {item.category}
                                            </span>
                                            {item.year_released && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-white/60">
                                                    {item.year_released}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="text-[10px] text-white/40 font-semibold">
                                                By {item.uploaded_by_name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-white/40 font-semibold">{(item.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                                                <span className="w-px h-3 bg-white/10" />
                                                <span className="text-[10px] text-white/40 font-semibold">{item.download_count} <Download className="w-3 h-3 inline" /></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 border-t border-white/5 bg-black/40 flex justify-end gap-2 text-normal">
                                        <button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-secondary/30 border border-white/5 rounded-xl shadow-sm overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-white/40 bg-black/40 border-b border-white/5 uppercase font-bold tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Resource</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Author</th>
                                            <th className="px-6 py-4">Size</th>
                                            <th className="px-6 py-4 text-right">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-medium">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group/row">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0 w-12 h-12 bg-black/40 rounded-lg border border-white/5 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                                                            <FileText className="w-6 h-6 text-white/20" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-semibold text-white/90 truncate mb-1">
                                                                {item.title}
                                                            </h3>
                                                            <div className="flex flex-wrap gap-2 text-[10px] text-white/40 font-medium tracking-wider">
                                                                {item.subcategory || 'General'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px] font-semibold">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded bg-black/40 text-white/50 text-[10px] font-semibold">
                                                        {item.author || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-white/40">
                                                    {(item.file_size / (1024 * 1024)).toFixed(2)} MB
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleDownload(item)}
                                                            className="p-1.5 text-white/40 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-px h-3 bg-white/10" />
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-white/40 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 text-white/40 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm font-semibold text-white bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-semibold text-white/50">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-sm font-semibold text-white bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <ResourceModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    item={selectedItem}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    item?: ResourceRecord | null;
    onSuccess: () => void;
}

function ResourceModal({ isOpen: _isOpen, onClose, item, onSuccess }: ResourceModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        year_released: new Date().getFullYear(),
        category: "Book",
        subcategory: "",
        is_active: true
    });

    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || "",
                author: item.author || "",
                year_released: item.year_released || new Date().getFullYear(),
                category: item.category || "Book",
                subcategory: item.subcategory || "",
                is_active: item.is_active ?? true
            });
        }
    }, [item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("author", formData.author);
            data.append("year_released", formData.year_released.toString());
            data.append("category", formData.category);
            data.append("subcategory", formData.subcategory);
            data.append("is_active", formData.is_active.toString());

            if (file) {
                data.append("file", file);
                data.append("file_name", file.name);
                data.append("file_size", file.size.toString());
                data.append("file_type", file.type);
            }

            if (item) {
                await ResourceService.updateResource(item.id, data);
            } else {
                await ResourceService.createResource(data);
            }
            onSuccess();
        } catch (error) {
            console.error("ResourceModal: Error saving:", error);
            alert("Failed to save resource.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-white">
                        {item ? "Edit Resource" : "Add New Resource"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-white/60">Document Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all outline-none text-sm placeholder:text-white/20 placeholder:font-normal font-medium"
                                placeholder="e.g. Master Plan for Jakarta 2024"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-white/60">Author / Publisher</label>
                                <input
                                    value={formData.author}
                                    onChange={e => setFormData(p => ({ ...p, author: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all outline-none text-sm placeholder:text-white/20 placeholder:font-normal font-medium"
                                    placeholder="e.g. PUPR"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-white/60">Year Released</label>
                                <input
                                    type="number"
                                    value={formData.year_released}
                                    onChange={e => setFormData(p => ({ ...p, year_released: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all outline-none text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-white/60">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all outline-none text-sm font-medium"
                                >
                                    <option value="Book" className="bg-[#1a1a1a]">Book</option>
                                    <option value="Journal" className="bg-[#1a1a1a]">Journal</option>
                                    <option value="Handout" className="bg-[#1a1a1a]">Handout</option>
                                    <option value="Specification" className="bg-[#1a1a1a]">Specification</option>
                                    <option value="Other" className="bg-[#1a1a1a]">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-white/60">Subcategory</label>
                                <input
                                    value={formData.subcategory}
                                    onChange={e => setFormData(p => ({ ...p, subcategory: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all outline-none text-sm placeholder:text-white/20 placeholder:font-normal font-medium"
                                    placeholder="e.g. Structural Engineering"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="text-xs font-semibold text-white/60 mb-2 block">Upload PDF Document</label>
                            <div
                                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-army-500', 'bg-army-500/5'); }}
                                onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-army-500', 'bg-army-500/5'); }}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-army-500', 'bg-army-500/5');
                                    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                                }}
                                className={cn(
                                    "p-8 border border-dashed rounded-xl bg-black/20 text-center transition-all cursor-pointer group hover:bg-white/[0.02]",
                                    file || item?.file ? "border-solid border-army-500/50 bg-army-500/5" : "border-white/10 hover:border-white/30"
                                )}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <UploadCloud className={cn("w-8 h-8 mx-auto mb-3 transition-colors", file || item?.file ? "text-army-400" : "text-white/20 group-hover:text-white/40")} />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-white">
                                        {file ? file.name : (item?.file_name || "Drop PDF File Here")}
                                    </p>
                                    <p className="text-xs text-white/40 font-medium">
                                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Support for PDF, DOCX, ZIP files"}
                                    </p>
                                </div>
                                <input id="file-upload" type="file" hidden onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                                className={cn(
                                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    formData.is_active ? "bg-army-500" : "bg-white/10"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                        formData.is_active ? "translate-x-4" : "translate-x-0"
                                    )}
                                />
                            </button>
                            <span className="text-xs font-semibold text-white/60">Active Status</span>
                        </div>
                    </div>

                </form>
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                        {item ? "Save Changes" : "Create Resource"}
                    </button>
                </div>
            </div>
        </div>
    );
}

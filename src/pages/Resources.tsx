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
    const perPage = 15;

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Resources</h1>
                </div>
                <button
                    onClick={() => {
                        setSelectedItem(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4 transition-colors">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all font-medium placeholder:font-normal"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                            className="inline-flex items-center px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            <option value="">All Categories</option>
                            <option value="ebooks">E-Books</option>
                            <option value="modul">Modules</option>
                            <option value="regulations">Regulations</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === "grid"
                                ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
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
                                ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-20" />
                    <span className="text-sm font-medium animate-pulse">Scanning server...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-center px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
                    <FileText className="w-12 h-12 mb-4 opacity-10" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No Resources Found</h3>
                    <p className="text-sm text-slate-500 font-medium">Upload your first PDF or document to get started.</p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden hover:shadow-xl hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col relative">
                                    <div className="aspect-[4/1] w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 transition-transform group-hover:scale-110 duration-500" />

                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                            <button
                                                onClick={() => handleDownload(item)}
                                                className="p-3 bg-white text-slate-900 rounded-full shadow-2xl hover:scale-110 transition-transform"
                                                title="Download PDF"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="absolute top-2 right-2">
                                            <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[9px] border border-white/20">
                                                {item.file_type.split('/')[1]?.toUpperCase() || 'PDF'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-2 mb-1 min-h-[2.5rem]">
                                            {item.title}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 mb-3">By {item.author || 'Unknown Author'}</p>

                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {item.category}
                                            </span>
                                            {item.year_released && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    {item.year_released}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                By {item.uploaded_by_name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-400 font-medium">{(item.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                                                <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                                                <span className="text-[10px] text-slate-400 font-medium">{item.download_count} DL</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end gap-2 text-normal">
                                        <button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Resource</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Author</th>
                                            <th className="px-6 py-4">Size</th>
                                            <th className="px-6 py-4 text-right">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0 w-12 h-16 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                                                            <FileText className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mb-1">
                                                                {item.title}
                                                            </h3>
                                                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                                                {item.subcategory || 'General'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px]">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">
                                                        {item.author || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                    {(item.file_size / (1024 * 1024)).toFixed(2)} MB
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleDownload(item)}
                                                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
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
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
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
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] transition-colors animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {item ? "Edit Resource" : "Add New Resource"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Document Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                placeholder="e.g. Master Plan for Jakarta 2024"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Author / Publisher</label>
                                <input
                                    value={formData.author}
                                    onChange={e => setFormData(p => ({ ...p, author: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                    placeholder="e.g. PUPR"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year Released</label>
                                <input
                                    type="number"
                                    value={formData.year_released}
                                    onChange={e => setFormData(p => ({ ...p, year_released: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                >
                                    <option value="Book">Book</option>
                                    <option value="Journal">Journal</option>
                                    <option value="Handout">Handout</option>
                                    <option value="Specification">Specification</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subcategory</label>
                                <input
                                    value={formData.subcategory}
                                    onChange={e => setFormData(p => ({ ...p, subcategory: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                    placeholder="e.g. Structural Engineering"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Upload PDF Document</label>
                            <div
                                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-slate-900', 'dark:border-slate-100'); }}
                                onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-slate-900', 'dark:border-slate-100'); }}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-slate-900', 'dark:border-slate-100');
                                    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                                }}
                                className={cn(
                                    "p-10 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 text-center transition-all cursor-pointer",
                                    file || item?.file ? "border-solid border-slate-200 dark:border-slate-700" : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                                )}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <UploadCloud className={cn("w-10 h-10 mx-auto mb-4 transition-colors", file || item?.file ? "text-slate-900 dark:text-slate-100" : "text-slate-400")} />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {file ? file.name : (item?.file_name || "Drop PDF File Here")}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Support for PDF, DOCX, ZIP files"}
                                    </p>
                                </div>
                                <input id="file-upload" type="file" hidden onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                                className={cn(
                                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    formData.is_active ? "bg-slate-900 dark:bg-slate-100" : "bg-slate-200 dark:bg-slate-700"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 shadow ring-0 transition duration-200 ease-in-out",
                                        formData.is_active ? "translate-x-4" : "translate-x-0"
                                    )}
                                />
                            </button>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Active Status</span>
                        </div>
                    </div>

                </form>
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-md hover:bg-black dark:hover:bg-white disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {item ? "Save Changes" : "Create Resource"}
                    </button>
                </div>
            </div>
        </div>
    );
}

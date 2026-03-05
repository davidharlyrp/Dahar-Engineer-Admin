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
    Package,
    FileUp
} from "lucide-react";
import { RevitFileService, type RevitFileRecord } from "../services/api";
import { cn } from "../lib/utils";
import { useAdminSettings } from "../hooks/useAdminSettings";

export const REVIT_CATEGORIES = [
    { id: 'structural_framing', name: 'Structural Framing' },
    { id: 'structural_columns', name: 'Structural Columns' },
    { id: 'structural_foundations', name: 'Structural Foundations' },
    { id: 'doors', name: 'Doors' },
    { id: 'windows', name: 'Windows' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'lighting_fixtures', name: 'Lighting Fixtures' },
    { id: 'electrical_fixtures', name: 'Electrical Fixtures' },
    { id: 'mechanical_equipment', name: 'Mechanical Equipment' },
    { id: 'plumbing_fixtures', name: 'Plumbing Fixtures' },
    { id: 'site_elements', name: 'Site Elements' },
    { id: 'landscape', name: 'Landscape' },
    { id: 'generic_models', name: 'Generic Models' },
    { id: 'specialty_equipment', name: 'Specialty Equipment' },
    { id: 'curtain_panels', name: 'Curtain Panels' },
    { id: 'railings', name: 'Railings' },
    { id: 'stairs', name: 'Stairs' },
    { id: 'roofs', name: 'Roofs' },
    { id: 'walls', name: 'Walls' },
    { id: 'floors', name: 'Floors' },
    { id: 'ceilings', name: 'Ceilings' }
];

export function RevitFiles() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<RevitFileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RevitFileRecord | null>(null);
    const [filters, setFilters] = useState({
        category: "",
        version: ""
    });
    const { perPage, autoRefresh, refreshInterval } = useAdminSettings();

    // Reset to page 1 when filters or search change
    useEffect(() => {
        setPage(1);
    }, [search, filters]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            let filterString = search ? `(display_name ~"${search}"|| file_name ~"${search}"|| category ~"${search}"|| revit_version ~"${search}"|| uploaded_by_name ~"${search}")` : "";

            if (filters.category) {
                const catFilter = `category ="${filters.category}"`;
                filterString = filterString ? `${filterString} && ${catFilter}` : catFilter;
            }
            if (filters.version) {
                const verFilter = `revit_version ="${filters.version}"`;
                filterString = filterString ? `${filterString} && ${verFilter}` : verFilter;
            }

            const result = await RevitFileService.getRevitFiles(page, perPage, "-created", filterString);
            setItems(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("RevitFiles: Error fetching data:", error);
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
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            await RevitFileService.deleteRevitFile(id);
            fetchData();
        } catch (error) {
            alert("Failed to delete file.");
        }
    };

    const handleDownload = (item: RevitFileRecord) => {
        const url = RevitFileService.getFileUrl(item, item.file);
        window.open(url, "_blank");
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Revit Files</h1>
                </div>
                <button
                    onClick={() => {
                        setSelectedItem(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload File
                </button>
            </div>

            {/* Controls */}
            <div className="bg-secondary/20 border border-white/5 rounded-xl shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4 transition-colors">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-white/5 bg-secondary text-white rounded-md focus:outline-none focus:ring-2 focus:ring-army-500 transition-all font-medium placeholder:font-normal"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                            className="inline-flex items-center px-3 py-2 border border-white/5 rounded-md text-sm font-medium text-white/80 bg-secondary hover:bg-white/5 transition-colors shadow-sm"
                        >
                            <option value="">All Categories</option>
                            {REVIT_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <select
                            value={filters.version}
                            onChange={(e) => setFilters(f => ({ ...f, version: e.target.value }))}
                            className="inline-flex items-center px-3 py-2 border border-white/5 rounded-md text-sm font-medium text-white/80 bg-secondary hover:bg-white/5 transition-colors shadow-sm"
                        >
                            <option value="">All Versions</option>
                            <option value="2021">2021</option>
                            <option value="2022">2022</option>
                            <option value="2023">2023</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 border border-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === "grid"
                                ? "bg-white/5 text-white shadow-sm"
                                : "text-white/40 hover:text-white"
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
                                ? "bg-white/5 text-white shadow-sm"
                                : "text-white/40 hover:text-white"
                        )}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40">
                    <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-20" />
                    <span className="text-sm font-medium animate-pulse">Scanning server...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40 text-center px-4 border-2 border-dashed border-white/5 rounded-2xl bg-white/50">
                    <Package className="w-12 h-12 mb-4 opacity-10" />
                    <h3 className="text-lg font-bold text-white mb-1">No Assets Found</h3>
                    <p className="text-sm text-white/40 font-medium">Try adjusting your filters or upload a new Revit file to get started.</p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="group bg-secondary/20 border border-white/5 rounded-xl shadow-sm overflow-hidden hover:shadow-xl hover:border-white/5 transition-all flex flex-col relative">
                                    <div className="aspect-[1/1] w-full bg-white/5 flex items-center justify-center relative overflow-hidden">
                                        {item.preview_image ? (
                                            <img
                                                src={RevitFileService.getFileUrl(item, item.preview_image, '400x400')}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                                alt={item.display_name}
                                            />
                                        ) : (
                                            <FileUp className="w-12 h-12 text-white/20" />
                                        )}

                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                            <button
                                                onClick={() => handleDownload(item)}
                                                className="p-3 bg-white text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
                                                title="Download Content"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-white/40 transition-colors line-clamp-1 mb-1">
                                            {item.display_name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/60">
                                                {REVIT_CATEGORIES.find((cat) => cat.id === item.category)?.name || item.category}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/60">
                                                v{item.revit_version}
                                            </span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="text-[10px] text-white/40 font-medium">
                                                By {item.uploaded_by_name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-white/40 font-medium">{(item.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                                                <span className="w-px h-3 bg-white/5" />
                                                <span className="text-[10px] text-white/40 font-medium">{item.download_count} <Download className="w-3 h-3 inline" /></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 border-t border-white/5 bg-black/20 flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-white/40 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-secondary border border-white/5 rounded-xl shadow-sm overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-white/40 bg-white/[0.02] border-b border-white/5 uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">File Item</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Version</th>
                                            <th className="px-6 py-4">Size</th>
                                            <th className="px-6 py-4 text-right">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-medium">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group/row">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0 w-20 h-20 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                                                            {item.preview_image ? (
                                                                <img
                                                                    src={RevitFileService.getFileUrl(item, item.preview_image, '200x200')}
                                                                    className="w-full h-full object-cover"
                                                                    alt={item.display_name}
                                                                />
                                                            ) : (
                                                                <Package className="w-8 h-8 text-white/10" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-semibold text-white truncate mb-1">
                                                                {item.display_name}
                                                            </h3>
                                                            <p className="text-xs text-white/40 truncate">{item.uploaded_by_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px]">
                                                        {REVIT_CATEGORIES.find((cat) => cat.id === item.category)?.name || item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-black/60 text-[10px]">
                                                        v{item.revit_version}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-white/40">
                                                    {(item.file_size / (1024 * 1024)).toFixed(2)} MB
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleDownload(item)}
                                                            className="p-1.5 text-white/40 hover:text-white transition-colors"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-px h-3 bg-white/5" />
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-white/40 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 text-white/40 hover:text-red-500 transition-colors"
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
                                className="px-4 py-2 text-sm font-medium text-white/80 bg-secondary border border-white/5 rounded-md hover:bg-white/5 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-white/40">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-sm font-medium text-white/80 bg-secondary border border-white/5 rounded-md hover:bg-white/5 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <RevitFileModal
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

interface RevitFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    item?: RevitFileRecord | null;
    onSuccess: () => void;
}

function RevitFileModal({ isOpen: _isOpen, onClose, item, onSuccess }: RevitFileModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        display_name: "",
        category: REVIT_CATEGORIES[0].name,
        revit_version: "2024",
    });

    const [files, setFiles] = useState<{
        preview: File | null;
        content: File | null;
    }>({
        preview: null,
        content: null
    });

    const [previews, setPreviews] = useState<{
        preview: string | null;
    }>({
        preview: null
    });

    useEffect(() => {
        if (item) {
            setFormData({
                display_name: item.display_name || "",
                category: item.category || REVIT_CATEGORIES[0].name,
                revit_version: item.revit_version || "2024",
            });
            setPreviews({
                preview: RevitFileService.getFileUrl(item, item.preview_image)
            });
        }
    }, [item]);

    const handleFileChange = (field: "preview" | "content", file: File) => {
        setFiles(prev => ({ ...prev, [field]: file }));
        if (field === "preview") {
            setPreviews({ preview: URL.createObjectURL(file) });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append("display_name", formData.display_name);
            data.append("category", formData.category);
            data.append("revit_version", formData.revit_version);

            if (files.preview) data.append("preview_image", files.preview);
            if (files.content) {
                data.append("file", files.content);
                data.append("file_name", files.content.name);
                data.append("file_size", files.content.size.toString());
            }

            if (item) {
                await RevitFileService.updateRevitFile(item.id, data);
            } else {
                await RevitFileService.createRevitFile(data);
            }
            onSuccess();
        } catch (error) {
            console.error("RevitFileModal: Error saving:", error);
            alert("Failed to save asset.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-secondary rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] transition-colors animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">
                        {item ? "Edit Revit File" : "Add New Revit File"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white/40 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-white/80">Display Name</label>
                            <input
                                required
                                value={formData.display_name}
                                onChange={e => setFormData(p => ({ ...p, display_name: e.target.value }))}
                                className="w-full px-3 py-2 bg-secondary border border-white/5 rounded-md text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                                placeholder="e.g. Modern Sliding Glass Door Family"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/80">Category</label>
                                <select
                                    value={REVIT_CATEGORIES.find(cat => cat.id === formData.category)?.name || formData.category}
                                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-3 py-2 bg-secondary border border-white/5 rounded-md text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                                >
                                    {REVIT_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/80">Revit Version</label>
                                <select
                                    value={formData.revit_version}
                                    onChange={e => setFormData(p => ({ ...p, revit_version: e.target.value }))}
                                    className="w-full px-3 py-2 bg-secondary border border-white/5 rounded-md text-white focus:ring-2 focus:ring-army-500 transition-all outline-none"
                                >
                                    <option value="2021">2021</option>
                                    <option value="2022">2022</option>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Thumbnail</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-white/5', ''); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-white/5', ''); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-white/5', '');
                                        if (e.dataTransfer.files?.[0]) handleFileChange("preview", e.dataTransfer.files[0]);
                                    }}
                                    onClick={() => document.getElementById('preview-upload')?.click()}
                                    className={cn(
                                        "relative aspect-video border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center text-center bg-white/[0.02]",
                                        previews.preview ? "border-solid border-white/5" : "border-white/5 hover:border-white/5"
                                    )}
                                >
                                    {previews.preview ? (
                                        <>
                                            <img src={previews.preview} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                <UploadCloud className="w-6 h-6 mb-1" />
                                                <span className="text-[10px] font-bold">Replace</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-4">
                                            <UploadCloud className="w-6 h-6 text-white/40 mb-2 mx-auto" />
                                            <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Drop Thumbnail Here</span>
                                        </div>
                                    )}
                                    <input id="preview-upload" type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleFileChange("preview", e.target.files[0])} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Revit File (.rvt/.rfa)</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-white/5', ''); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-white/5', ''); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-white/5', '');
                                        if (e.dataTransfer.files?.[0]) handleFileChange("content", e.dataTransfer.files[0]);
                                    }}
                                    className={cn(
                                        "p-6 border-2 border-dashed rounded-xl bg-white/[0.02] text-center transition-all cursor-pointer",
                                        files.content || item?.file ? "border-solid border-white/5" : "border-white/5 hover:border-white/5"
                                    )}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <UploadCloud className={cn("w-8 h-8 mx-auto mb-3 transition-colors", files.content || item?.file ? "text-blue-500" : "text-white/40")} />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-white">
                                            {files.content ? files.content.name : (item?.file_name || "Drop Revit File Here")}
                                        </p>
                                        {files.content && (
                                            <p className="text-[10px] font-medium text-white/40">
                                                {(files.content.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        )}
                                    </div>
                                    <input id="file-upload" type="file" hidden onChange={e => e.target.files?.[0] && handleFileChange("content", e.target.files[0])} />
                                </div>
                            </div>
                        </div>
                    </div>

                </form>
                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-white/5 text-white text-sm font-medium rounded-md hover:bg-black disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {item ? "Save Changes" : "Upload File"}
                    </button>
                </div>
            </div>
        </div>
    );
}

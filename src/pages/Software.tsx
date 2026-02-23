import { useState, useEffect, useCallback, useRef } from "react";
import {
    Touchpad,
    Plus,
    Search,
    LayoutGrid,
    List,
    Edit2,
    Trash2,
    Loader2,
    X,
    UploadCloud,
    Image as ImageIcon
} from "lucide-react";
import { SoftwareService, type SoftwareRecord } from "../services/api";
import { cn } from "../lib/utils";

interface SoftwareModalProps {
    isOpen: boolean;
    onClose: () => void;
    software?: SoftwareRecord | null;
    onSuccess: () => void;
}

function SoftwareModal({ isOpen, onClose, software, onSuccess }: SoftwareModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        version: "",
        description: "",
        category: "",
        link: "",
    });

    // File states
    const [files, setFiles] = useState<{
        logo: File | null;
        thumbnail: File | null;
        preview: File | null;
    }>({
        logo: null,
        thumbnail: null,
        preview: null
    });

    const [previews, setPreviews] = useState<{
        logo: string | null;
        thumbnail: string | null;
        preview: string | null;
    }>({
        logo: null,
        thumbnail: null,
        preview: null
    });

    useEffect(() => {
        if (software) {
            setFormData({
                name: software.name || "",
                version: software.version || "",
                description: software.description || "",
                category: software.category || "",
                link: software.link || "",
            });
            setPreviews({
                logo: SoftwareService.getFileUrl(software, software.logo),
                thumbnail: SoftwareService.getFileUrl(software, software.thumbnail),
                preview: SoftwareService.getFileUrl(software, software.preview),
            });
        } else {
            setFormData({ name: "", version: "", description: "", category: "", link: "" });
            setFiles({ logo: null, thumbnail: null, preview: null });
            setPreviews({ logo: null, thumbnail: null, preview: null });
        }
        setError(null);
    }, [software, isOpen]);

    const handleFileChange = (field: keyof typeof files, file: File | null) => {
        if (!file) return;
        setFiles(prev => ({ ...prev, [field]: file }));
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("version", formData.version);
            data.append("category", formData.category);
            data.append("description", formData.description);
            data.append("link", formData.link);

            if (files.logo) data.append("logo", files.logo);
            if (files.thumbnail) data.append("thumbnail", files.thumbnail);
            if (files.preview) data.append("preview", files.preview);

            if (software) {
                await SoftwareService.updateSoftware(software.id, data);
            } else {
                await SoftwareService.createSoftware(data);
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save software");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] transition-colors animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {software ? "Edit Software" : "Add New Software"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Software Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                placeholder="e.g. TerraSim"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                            <input
                                required
                                value={formData.category}
                                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                placeholder="e.g. Geotechnical"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Version</label>
                            <input
                                required
                                value={formData.version}
                                onChange={e => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                placeholder="1.0.0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Link</label>
                        <input
                            required
                            value={formData.link}
                            onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none resize-none"
                            placeholder="Briefly describe the software..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* File Upload Fields */}
                        <FileDropZone
                            label="Logo"
                            preview={previews.logo}
                            onFileSelect={(file) => handleFileChange("logo", file)}
                            aspect="square"
                        />
                        <FileDropZone
                            label="Thumbnail"
                            preview={previews.thumbnail}
                            onFileSelect={(file) => handleFileChange("thumbnail", file)}
                            aspect="video"
                        />
                        <FileDropZone
                            label="Preview Image"
                            preview={previews.preview}
                            onFileSelect={(file) => handleFileChange("preview", file)}
                            aspect="video"
                        />
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
                        disabled={isLoading}
                        className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-md hover:bg-black dark:hover:bg-white disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {software ? "Save Changes" : "Create Software"}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface FileDropZoneProps {
    label: string;
    preview: string | null;
    onFileSelect: (file: File) => void;
    aspect?: "square" | "video";
}

function FileDropZone({ label, preview, onFileSelect, aspect = "video" }: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center text-center",
                    aspect === "square" ? "aspect-square" : "aspect-video",
                    isDragging
                        ? "border-slate-900 bg-slate-50 dark:bg-slate-900/10"
                        : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50",
                    preview && "border-solid border-slate-200 dark:border-slate-700"
                )}
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                            <UploadCloud className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold">Replace</span>
                        </div>
                    </>
                ) : (
                    <div className="p-4">
                        <UploadCloud className="w-6 h-6 text-slate-400 dark:text-slate-600 mb-2 mx-auto" />
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider font-bold">Drop here</span>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
                />
            </div>
        </div>
    );
}

export function Software() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [softwares, setSoftwares] = useState<SoftwareRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const perPage = 12;

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSoftware, setSelectedSoftware] = useState<SoftwareRecord | null>(null);

    const fetchSoftwares = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await SoftwareService.getSoftwares(page, perPage);
            setSoftwares(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Software: Error fetching softwares:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchSoftwares();
    }, [fetchSoftwares]);

    const handleEdit = (sw: SoftwareRecord) => {
        setSelectedSoftware(sw);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedSoftware(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this software?")) return;
        try {
            await SoftwareService.deleteSoftware(id);
            fetchSoftwares();
        } catch {
            alert("Failed to delete software");
        }
    };

    const filteredSoftwares = softwares.filter(sw =>
        sw.name.toLowerCase().includes(search.toLowerCase()) ||
        sw.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Software Management</h1>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Software
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search software..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                    />
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
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                    <Loader2 className="w-8 h-8 text-slate-600 dark:text-slate-400 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Loading softwares...</p>
                </div>
            ) : filteredSoftwares.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-6">
                        <Touchpad className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No software found</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                        {search ? `No software matches "${search}"` : "You haven't added any software yet. Start by adding your first product."}
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="text-slate-900 dark:text-slate-100 font-medium hover:underline text-sm"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {filteredSoftwares.map((sw) => (
                                <div key={sw.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col">
                                    <div className="aspect-1/1 bg-white dark:bg-slate-900 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                        {sw.logo ? (
                                            <img
                                                src={SoftwareService.getFileUrl(sw, sw.logo) ?? undefined}
                                                alt={sw.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                                                v{sw.version}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors mb-1">
                                            {sw.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                            {sw.description}
                                        </p>
                                        <a href={sw.link} target="_blank" className="underline text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                            {sw.link}
                                        </a>
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">
                                                Updated {new Date(sw.updated).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(sw)}
                                                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sw.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 uppercase">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Software</th>
                                            <th className="px-6 py-3 font-medium">Description</th>
                                            <th className="px-6 py-3 font-medium">Version</th>
                                            <th className="px-6 py-3 font-medium">Updated</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {filteredSoftwares.map((sw) => (
                                            <tr key={sw.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 object-contain">
                                                            {sw.logo ? (
                                                                <img
                                                                    src={SoftwareService.getFileUrl(sw, sw.logo) ?? undefined}
                                                                    alt=""
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="w-full h-full text-slate-300 dark:text-slate-700" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-start justify-center">
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">{sw.name}</span>
                                                            <a href={sw.link} target="_blank" className="underline text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                                                {sw.link}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                                    {sw.description}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                                                        v{sw.version}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {new Date(sw.updated).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(sw)}
                                                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sw.id)}
                                                            className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
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

            {/* Software Modal */}
            <SoftwareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                software={selectedSoftware}
                onSuccess={fetchSoftwares}
            />
        </div>
    );
}

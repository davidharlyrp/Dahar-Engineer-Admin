import { useState, useEffect, useCallback, useRef } from "react";
import {
    Touchpad,
    Plus,
    Search,
    LayoutGrid,
    List,
    Edit2,
    Trash2,
    Clock,
    X,
    UploadCloud,
    Image as ImageIcon
} from "lucide-react";
import { SoftwareService, type SoftwareRecord } from "../services/api";
import { cn } from "../lib/utils";
import { useAdminSettings } from "../hooks/useAdminSettings";

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
        isMaintain: false,
    });

    // File states
    const [files, setFiles] = useState<{
        logo: File | null;
        thumbnail: File | null;
    }>({
        logo: null,
        thumbnail: null,
    });

    const [previews, setPreviews] = useState<{
        logo: string | null;
        thumbnail: string | null;
    }>({
        logo: null,
        thumbnail: null,
    });

    const [previewFiles, setPreviewFiles] = useState<{ file: File; url: string }[]>([]);
    const [existingPreviews, setExistingPreviews] = useState<{ name: string; url: string }[]>([]);

    useEffect(() => {
        if (software) {
            setFormData({
                name: software.name || "",
                version: software.version || "",
                description: software.description || "",
                category: software.category || "",
                link: software.link || "",
                isMaintain: software.isMaintain || false,
            });
            setPreviews({
                logo: SoftwareService.getFileUrl(software, software.logo),
                thumbnail: SoftwareService.getFileUrl(software, software.thumbnail),
            });
            const existing = (software.preview || []).map(p => ({
                name: p,
                url: SoftwareService.getFileUrl(software, p) as string
            })).filter(p => p.url);
            setExistingPreviews(existing);
            setPreviewFiles([]);
        } else {
            setFormData({ name: "", version: "", description: "", category: "", link: "", isMaintain: false });
            setFiles({ logo: null, thumbnail: null });
            setPreviews({ logo: null, thumbnail: null });
            setExistingPreviews([]);
            setPreviewFiles([]);
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

    const handlePreviewFilesChange = (newFiles: File[]) => {
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewFiles(prev => [...prev, { file, url: reader.result as string }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveExistingPreview = (index: number) => {
        setExistingPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNewPreview = (index: number) => {
        setPreviewFiles(prev => prev.filter((_, i) => i !== index));
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
            data.append("isMaintain", String(formData.isMaintain));

            if (files.logo) data.append("logo", files.logo);
            if (files.thumbnail) data.append("thumbnail", files.thumbnail);

            previewFiles.forEach(p => {
                data.append("preview", p.file);
            });

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {software ? "Modify Software" : "Register Software"}
                        </h2>
                        <p className="text-xs font-semibold text-white/40 tracking-widest mt-1">Configure your software asset details</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-500 uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Software Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                placeholder="e.g. TerraSim"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Category</label>
                            <input
                                required
                                value={formData.category}
                                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                placeholder="e.g. Geotechnical"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Link</label>
                            <input
                                required
                                value={formData.link}
                                onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Version</label>
                            <div className="relative">
                                <input
                                    required
                                    value={formData.version}
                                    onChange={e => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                    placeholder="1.0.0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-1">
                        <Switch
                            checked={formData.isMaintain}
                            onChange={() => setFormData(prev => ({ ...prev, isMaintain: !prev.isMaintain }))}
                        />
                        <label className="text-xs font-semibold text-white/40 tracking-widest cursor-pointer select-none">Maintenance Mode</label>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none resize-none placeholder:text-white/10"
                            placeholder="Briefly describe the software..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <MultiFileDropZone
                            label="Previews"
                            existingPreviews={existingPreviews}
                            newPreviews={previewFiles}
                            onFilesSelect={handlePreviewFilesChange}
                            onRemoveExisting={handleRemoveExistingPreview}
                            onRemoveNew={handleRemoveNewPreview}
                            aspect="video"
                        />
                    </div>
                </form>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-8 py-2.5 bg-army-500 hover:bg-army-400 text-black text-xs font-semibold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : (software ? "Save Changes" : "Create Software")}
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
            <span className="text-xs font-semibold text-white/40 tracking-widest ml-1">{label}</span>
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center text-center",
                    aspect === "square" ? "aspect-square" : "aspect-video",
                    isDragging
                        ? "border-army-500/50 bg-army-500/5 shadow-inner"
                        : "border-white/10 hover:border-white/20 bg-black/40",
                    preview && "border-solid border-white/10"
                )}
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                            <UploadCloud className="w-6 h-6 mb-1 text-army-400" />
                            <span className="text-xs font-semibold tracking-widest">Replace</span>
                        </div>
                    </>
                ) : (
                    <div className="p-4 group">
                        <UploadCloud className="w-7 h-7 text-white/10 mb-2 mx-auto group-hover:text-army-400 transition-colors" />
                        <span className="text-xs text-white/20 font-semibold tracking-widest group-hover:text-white/40 transition-colors">Select File</span>
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

interface MultiFileDropZoneProps {
    label: string;
    existingPreviews: { name: string; url: string }[];
    newPreviews: { file: File; url: string }[];
    onFilesSelect: (files: File[]) => void;
    onRemoveExisting: (index: number) => void;
    onRemoveNew: (index: number) => void;
    aspect?: "square" | "video";
}

function MultiFileDropZone({
    label,
    existingPreviews,
    newPreviews,
    onFilesSelect,
    onRemoveExisting,
    onRemoveNew,
    aspect = "video"
}: MultiFileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelect(Array.from(e.dataTransfer.files));
        }
    };

    const totalCount = existingPreviews.length + newPreviews.length;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
                <span className="text-xs font-semibold text-white/40 tracking-widest">{label}</span>
                {totalCount > 0 && (
                    <span className="text-xs text-army-400 font-semibold tracking-widest">
                        {totalCount} item{totalCount !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {(totalCount > 0) && (
                <div className="grid grid-cols-2 gap-3">
                    {existingPreviews.map((p, idx) => (
                        <div key={`existing-${idx}`} className={cn(
                            "relative border border-white/5 rounded-xl overflow-hidden group/item bg-black/40",
                            aspect === "square" ? "aspect-square" : "aspect-video"
                        )}>
                            <img src={p.url} alt="Preview" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => onRemoveExisting(idx)}
                                    className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-all active:scale-90"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {newPreviews.map((p, idx) => (
                        <div key={`new-${idx}`} className={cn(
                            "relative border-2 border-army-500/20 rounded-xl overflow-hidden group/item bg-black/40",
                            aspect === "square" ? "aspect-square" : "aspect-video"
                        )}>
                            <img src={p.url} alt="New Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => onRemoveNew(idx)}
                                    className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-all active:scale-90"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center text-center py-6 group",
                    aspect === "square" ? "aspect-square" : "aspect-video",
                    isDragging
                        ? "border-army-500/50 bg-army-500/5 shadow-inner"
                        : "border-white/10 hover:border-white/20 bg-black/40"
                )}
            >
                <div className="flex flex-col items-center">
                    <Plus className="w-6 h-6 text-white/10 group-hover:text-army-400 transition-colors mb-2" />
                    <span className="text-[10px] text-white/20 font-semibold tracking-widest group-hover:text-white/40 transition-colors">
                        Add Media
                    </span>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            onFilesSelect(Array.from(e.target.files));
                            e.target.value = '';
                        }
                    }}
                />
            </div>
        </div>
    );
}

const Switch = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={cn(
            "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-300 ease-in-out focus:outline-none",
            checked ? "bg-army-500" : "bg-black/40"
        )}
    >
        <span
            className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-300 ease-in-out",
                checked ? "translate-x-5" : "translate-x-0.5"
            )}
        />
    </button>
);

export function Software() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [softwares, setSoftwares] = useState<SoftwareRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { perPage, autoRefresh, refreshInterval } = useAdminSettings();

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

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchSoftwares, refreshInterval * 1000);
        return () => clearInterval(id);
    }, [autoRefresh, refreshInterval, fetchSoftwares]);

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

    const handleToggleMaintain = async (sw: SoftwareRecord) => {
        try {
            await SoftwareService.updateSoftware(sw.id, { isMaintain: !sw.isMaintain });
            fetchSoftwares();
        } catch {
            alert("Failed to update maintenance status");
        }
    };

    const filteredSoftwares = softwares.filter(sw =>
        sw.name.toLowerCase().includes(search.toLowerCase()) ||
        sw.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Software Management</h1>
                        <p className="text-xs font-semibold text-white/40 mt-1 tracking-widest">Manage your software catalog and maintenance modes</p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-white/90 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Software
                </button>
            </div>

            {/* Controls */}
            <div className="bg-secondary/20 border border-white/5 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search software..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-black/20 border border-white/5 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-transparent transition-all placeholder:text-white/20"
                    />
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            viewMode === "grid"
                                ? "bg-white/10 shadow-sm text-white"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            viewMode === "list"
                                ? "bg-white/10 shadow-sm text-white"
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
                    <Clock className="w-12 h-12 mb-4 animate-pulse opacity-50" />
                    <span className="text-sm font-bold uppercase tracking-widest">Syncing software catalog...</span>
                </div>
            ) : filteredSoftwares.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40 text-center px-4 border-2 border-dashed border-white/5 rounded-3xl">
                    <Touchpad className="w-16 h-16 mb-4 opacity-20" />
                    <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">No software found</h2>
                    <p className="text-sm font-semibold max-w-xs mb-8">
                        {search ? `No software matches "${search}"` : "Start building your software catalog for your clients."}
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="text-army-400 font-bold hover:text-army-300 text-xs uppercase tracking-widest transition-colors"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredSoftwares.map((sw) => (
                                <div key={sw.id} className="group bg-black/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden hover:border-white/10 transition-all flex flex-col">
                                    <div className="aspect-square bg-black/40 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                        {sw.logo ? (
                                            <img
                                                src={SoftwareService.getFileUrl(sw, sw.logo) ?? undefined}
                                                alt={sw.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-10 h-10 text-white/10" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex items-center gap-2">
                                            {sw.isMaintain && (
                                                <span className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-army-400 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                                                    Maintenance
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-white/[0.02] to-transparent">
                                        <h3 className="font-bold text-white group-hover:text-army-400 transition-colors mb-2 tracking-tight">
                                            {sw.name}
                                        </h3>
                                        <p className="text-xs font-medium text-white/40 line-clamp-2 mb-4 leading-relaxed">
                                            {sw.description}
                                        </p>
                                        <div className="mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                                                        v{sw.version}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter mt-0.5">
                                                        {new Date(sw.updated).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(sw)}
                                                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                        title="Edit Software"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sw.id)}
                                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                        title="Delete Software"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-black/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] font-semibold text-white/40 bg-black/40 border-b border-white/5 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Software</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4 text-center">Maintain</th>
                                            <th className="px-6 py-4">Version</th>
                                            <th className="px-6 py-4">Updated</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredSoftwares.map((sw) => (
                                            <tr key={sw.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                                            {sw.logo ? (
                                                                <img
                                                                    src={SoftwareService.getFileUrl(sw, sw.logo) ?? undefined}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="w-5 h-5 text-white/10" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-start justify-center">
                                                            <span className="font-bold text-white group-hover:text-army-400 transition-colors tracking-tight">{sw.name}</span>
                                                            <a href={sw.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-white/20 tracking-relaxed mt-0.5">{sw.link}</a>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-white/40 max-w-xs truncate">
                                                    {sw.description}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={sw.isMaintain}
                                                            onChange={() => handleToggleMaintain(sw)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                                                        v{sw.version}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-tighter">
                                                    {new Date(sw.updated).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleEdit(sw)}
                                                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sw.id)}
                                                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
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
                        <div className="flex items-center justify-center gap-2 mt-12 mb-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center justify-center min-w-[100px] px-6 py-2 text-xs font-bold uppercase tracking-widest text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all active:scale-95"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-xs font-bold text-white tracking-widest">
                                    {page.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mx-1">/</span>
                                <span className="text-xs font-bold text-white/40 tracking-widest">
                                    {totalPages.toString().padStart(2, '0')}
                                </span>
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="inline-flex items-center justify-center min-w-[100px] px-6 py-2 text-xs font-bold uppercase tracking-widest text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all active:scale-95"
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

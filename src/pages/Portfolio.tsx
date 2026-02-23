import { useEffect, useState } from "react";
import { Plus, Search, Image as ImageIcon, MapPin, Calendar, Edit2, Trash2, X, Upload } from "lucide-react";
import { PortfolioService, type PortfolioRecord } from "../services/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// function cn(...inputs: ClassValue[]) {
//     return twMerge(clsx(inputs));
// }

export function Portfolio() {
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<PortfolioRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const filter = search ? `project ~ "${search}" || client ~ "${search}"` : "";
            const result = await PortfolioService.getPortfolio(1, 50, "-created", filter);
            setItems(result.items);
        } catch (error) {
            console.error("Portfolio: Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await PortfolioService.deletePortfolio(id);
            await fetchData();
        } catch (error) {
            alert("Failed to delete project.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Portfolio Management</h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex items-center justify-between transition-colors">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search portfolio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                    />
                </div>
                <div className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {isLoading ? "Loading..." : `Showing ${items.length} projects`}
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500">
                    <ImageIcon className="w-8 h-8 mb-4 animate-pulse opacity-20" />
                    <span>Loading projects...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-center px-4">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No projects found</h3>
                    <p className="text-sm">Click "Add Project" to start building your portfolio.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col">
                            <div className={cn(
                                "h-48 bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden bg-cover bg-center transition-transform group-hover:scale-105 duration-500",
                                !item.thumbnail && "bg-slate-200"
                            )} style={{ backgroundImage: item.thumbnail ? `url(${PortfolioService.getFileUrl(item, item.thumbnail, '400x300')})` : 'none' }}>
                                {!item.thumbnail && <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700" />}
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-sm text-white border border-white/20">
                                        {item.category || "Project"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight mb-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-2">
                                    {item.project}
                                </h3>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{item.client}</p>

                                <div className="mt-auto space-y-2">
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <MapPin className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                        <span className="truncate">{item.location}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <Calendar className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                        {item.year || "-"}
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setEditingId(item.id);
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Add/Edit Project */}
            {isModalOpen && (
                <ProjectModal
                    id={editingId}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchData();
                    }}
                    existingData={editingId ? items.find(i => i.id === editingId) : undefined}
                />
            )}
        </div>
    );
}

interface ProjectModalProps {
    id: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingData?: PortfolioRecord;
}

function ProjectModal({ id, isOpen: _isOpen, onClose, onSuccess, existingData }: ProjectModalProps) {
    const [formData, setFormData] = useState({
        project: existingData?.project || "",
        category: existingData?.category || "",
        location: existingData?.location || "",
        year: existingData?.year || new Date().getFullYear(),
        area: existingData?.area || "",
        client: existingData?.client || "",
        long_description: existingData?.long_description || ""
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [previewFiles, setPreviewFiles] = useState<File[]>([]);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
        existingData?.thumbnail ? PortfolioService.getFileUrl(existingData, existingData.thumbnail) : null
    );
    const [previewsMap, setPreviewsMap] = useState<{ url: string, isExisting: boolean, name?: string }[]>(
        existingData?.preview?.map(p => ({ url: PortfolioService.getFileUrl(existingData, p), isExisting: true, name: p })) || []
    );
    const [deletedExistingPreviews, setDeletedExistingPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleThumbnailChange = (file: File) => {
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const handlePreviewsChange = (files: FileList | File[]) => {
        const newFiles = Array.from(files);
        setPreviewFiles(prev => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(f => ({ url: URL.createObjectURL(f), isExisting: false }));
        setPreviewsMap(prev => [...prev, ...newPreviews]);
    };

    const removePreview = (index: number) => {
        const item = previewsMap[index];
        if (item.isExisting && item.name) {
            setDeletedExistingPreviews(prev => [...prev, item.name!]);
        } else {
            // Find which index in previewFiles this newly added file corresponds to
            // This is slightly tricky since previewsMap includes existing ones
            const newlyAddedIndex = previewsMap.slice(0, index).filter(p => !p.isExisting).length;
            setPreviewFiles(prev => prev.filter((_, i) => i !== newlyAddedIndex));
        }
        setPreviewsMap(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append("project", formData.project);
            data.append("category", formData.category);
            data.append("location", formData.location);
            data.append("year", formData.year.toString());
            data.append("area", formData.area);
            data.append("client", formData.client);
            data.append("long_description", formData.long_description);

            if (thumbnailFile) {
                data.append("thumbnail", thumbnailFile);
            }

            previewFiles.forEach(file => {
                data.append("preview", file);
            });

            if (deletedExistingPreviews.length > 0) {
                deletedExistingPreviews.forEach(name => {
                    data.append("preview-", name);
                });
            }

            if (id) {
                await PortfolioService.updatePortfolio(id, data);
            } else {
                await PortfolioService.createPortfolio(data);
            }
            onSuccess();
        } catch (error) {
            console.error("ProjectModal: Error saving:", error);
            alert("Failed to save project.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{id ? "Edit Project" : "Add New Project"}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.project}
                                    onChange={e => setFormData(p => ({ ...p, project: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                                    placeholder="Enter project title..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                                        placeholder="e.g. Infrastructure"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Year</label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData(p => ({ ...p, year: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Client</label>
                                <input
                                    type="text"
                                    value={formData.client}
                                    onChange={e => setFormData(p => ({ ...p, client: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                                    placeholder="Company or organization name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                                            placeholder="City, Province"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Area</label>
                                    <input
                                        type="text"
                                        value={formData.area}
                                        onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                                        placeholder="e.g. 5,000 sqm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                                <textarea
                                    value={formData.long_description}
                                    onChange={e => setFormData(p => ({ ...p, long_description: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all resize-none"
                                    placeholder="Detailed project breakdown..."
                                />
                            </div>
                        </div>

                        {/* Media Upload */}
                        <div className="space-y-6">
                            {/* Thumbnail Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cover Thumbnail</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-slate-900', 'dark:border-slate-100'); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-slate-900', 'dark:border-slate-100'); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-slate-900', 'dark:border-slate-100');
                                        if (e.dataTransfer.files?.[0]) handleThumbnailChange(e.dataTransfer.files[0]);
                                    }}
                                    className="relative group h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/30 overflow-hidden transition-all"
                                >
                                    {thumbnailPreview ? (
                                        <>
                                            <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover" alt="Thumbnail" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <button type="button" onClick={() => document.getElementById('thumb-input')?.click()} className="p-2 bg-white/20 text-white rounded-full backdrop-blur-md">
                                                    <Upload className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">Drag & Drop or click to upload</p>
                                        </div>
                                    )}
                                    <input id="thumb-input" type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleThumbnailChange(e.target.files[0])} />
                                    <button type="button" onClick={() => document.getElementById('thumb-input')?.click()} className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"></button>
                                </div>
                            </div>

                            {/* Previews Upload */}
                            <div className="space-y-2 text-normal">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Gallery (Multiple)</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-slate-900', 'dark:border-slate-100'); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-slate-900', 'dark:border-slate-100'); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-slate-900', 'dark:border-slate-100');
                                        if (e.dataTransfer.files) handlePreviewsChange(e.dataTransfer.files);
                                    }}
                                    className="min-h-[160px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/30 transition-all"
                                >
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {previewsMap.map((item, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group/preview">
                                                <img src={item.url} className="w-full h-full object-cover" alt="Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => removePreview(i)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('previews-input')?.click()}
                                            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <Plus className="w-6 h-6 text-slate-400" />
                                        </button>
                                    </div>
                                    {!previewsMap.length && <p className="text-[10px] text-center text-slate-400">Add up to 99 preview images</p>}
                                    <input id="previews-input" type="file" multiple hidden accept="image/*" onChange={e => e.target.files && handlePreviewsChange(e.target.files)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-2 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Upload className="w-4 h-4 animate-bounce" />
                                    Saving...
                                </>
                            ) : (
                                "Save Project"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

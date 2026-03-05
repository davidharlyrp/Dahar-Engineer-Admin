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
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white/90">Portfolio Management</h1>
                    <p className="text-xs font-semibold text-white/50 mt-1">Add, edit, and organize your featured projects.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors shadow-lg"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                </button>
            </div>

            <div className="bg-secondary/30 border border-white/5 rounded-xl p-4 flex items-center justify-between transition-colors">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search portfolio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-white/10 bg-black/20 text-white rounded-lg focus:outline-none focus:border-army-500/50 transition-all placeholder:text-white/20"
                    />
                </div>
                <div className="hidden sm:block text-xs text-white/50 font-semibold">
                    {isLoading ? "Loading..." : `Showing ${items.length} projects`}
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40">
                    <ImageIcon className="w-8 h-8 mb-4 animate-pulse opacity-50" />
                    <span className="text-sm font-semibold">Loading projects...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40 text-center px-4">
                    <ImageIcon className="w-10 h-10 mb-4 opacity-20" />
                    <h3 className="text-sm font-semibold text-white mb-1">No projects found</h3>
                    <p className="text-xs">Click "Add Project" to start building your portfolio.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="group bg-secondary/20 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col hover:shadow-2xl hover:shadow-black/50">
                            <div className={cn(
                                "h-48 bg-black/40 flex items-center justify-center relative overflow-hidden bg-cover bg-center transition-transform group-hover:scale-105 duration-500",
                                !item.thumbnail && "bg-black/60"
                            )} style={{ backgroundImage: item.thumbnail ? `url(${PortfolioService.getFileUrl(item, item.thumbnail, '400x300')})` : 'none' }}>
                                {!item.thumbnail && <ImageIcon className="w-10 h-10 text-white/10" />}
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-white border border-white/10">
                                        {item.category || "Project"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-white text-base leading-tight mb-1 group-hover:text-army-400 transition-colors line-clamp-2">
                                    {item.project}
                                </h3>

                                <p className="text-[11px] font-semibold tracking-wider uppercase text-white/40 mb-4">{item.client}</p>

                                <div className="mt-auto space-y-2">
                                    <div className="flex items-center text-xs font-medium text-white/50">
                                        <MapPin className="w-3.5 h-3.5 mr-2 text-army-500 flex-shrink-0" />
                                        <span className="truncate">{item.location}</span>
                                    </div>
                                    <div className="flex items-center text-xs font-medium text-white/50">
                                        <Calendar className="w-3.5 h-3.5 mr-2 text-army-500 flex-shrink-0" />
                                        {item.year || "-"}
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-3 border-t border-white/5 bg-black/40 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setEditingId(item.id);
                                        setIsModalOpen(true);
                                    }}
                                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h2 className="text-lg font-bold text-white">{id ? "Edit Project" : "Add New Project"}</h2>
                    <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold tracking-relaxed text-white/50">Project Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.project}
                                    onChange={e => setFormData(p => ({ ...p, project: e.target.value }))}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-army-500/50 outline-none transition-all text-sm text-white placeholder:text-white/20"
                                    placeholder="Enter project title..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-relaxed text-white/50">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                        className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-army-500/50 outline-none transition-all text-sm text-white placeholder:text-white/20"
                                        placeholder="e.g. Infrastructure"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-relaxed text-white/50">Year</label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData(p => ({ ...p, year: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-army-500/50 outline-none transition-all text-sm text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold tracking-relaxed text-white/50">Client</label>
                                <input
                                    type="text"
                                    value={formData.client}
                                    onChange={e => setFormData(p => ({ ...p, client: e.target.value }))}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-army-500/50 outline-none transition-all text-sm text-white placeholder:text-white/20"
                                    placeholder="Company or organization name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-relaxed text-white/50">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-army-500/50 outline-none transition-all text-sm text-white placeholder:text-white/20"
                                            placeholder="City, Province"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-relaxed text-white/50">Area</label>
                                    <input
                                        type="text"
                                        value={formData.area}
                                        onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                                        className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-army-500/50 outline-none transition-all text-sm text-white placeholder:text-white/20"
                                        placeholder="e.g. 5,000 sqm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold tracking-relaxed text-white/50">Description</label>
                                <textarea
                                    value={formData.long_description}
                                    onChange={e => setFormData(p => ({ ...p, long_description: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-army-500/50 outline-none transition-all text-sm text-white placeholder:text-white/20 resize-none"
                                    placeholder="Detailed project breakdown..."
                                />
                            </div>
                        </div>

                        {/* Media Upload */}
                        <div className="space-y-6">
                            {/* Thumbnail Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold tracking-relaxed text-white/50">Cover Thumbnail</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-army-500', 'bg-army-500/10'); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-army-500', 'bg-army-500/10'); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-army-500', 'bg-army-500/10');
                                        if (e.dataTransfer.files?.[0]) handleThumbnailChange(e.dataTransfer.files[0]);
                                    }}
                                    className="relative group h-40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center bg-black/20 overflow-hidden transition-all hover:border-white/20"
                                >
                                    {thumbnailPreview ? (
                                        <>
                                            <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover" alt="Thumbnail" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <button type="button" onClick={() => document.getElementById('thumb-input')?.click()} className="p-2 bg-white/20 text-white rounded-full backdrop-blur-md hover:bg-white/30 transition-colors">
                                                    <Upload className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-8 h-8 text-white/20 mb-2 group-hover:scale-110 transition-transform group-hover:text-white/40" />
                                            <p className="text-xs text-white/40 font-semibold tracking-tight">Drag & Drop or click to upload</p>
                                        </div>
                                    )}
                                    <input id="thumb-input" type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleThumbnailChange(e.target.files[0])} />
                                    <button type="button" onClick={() => document.getElementById('thumb-input')?.click()} className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"></button>
                                </div>
                            </div>

                            {/* Previews Upload */}
                            <div className="space-y-2 text-normal">
                                <label className="text-xs font-semibold tracking-relaxed text-white/50">Project Gallery (Multiple)</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-army-500', 'bg-army-500/10'); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-army-500', 'bg-army-500/10'); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-army-500', 'bg-army-500/10');
                                        if (e.dataTransfer.files) handlePreviewsChange(e.dataTransfer.files);
                                    }}
                                    className="min-h-[160px] border-2 border-dashed border-white/10 rounded-xl p-4 bg-black/20 transition-all hover:border-white/20"
                                >
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {previewsMap.map((item, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 group/preview">
                                                <img src={item.url} className="w-full h-full object-cover" alt="Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => removePreview(i)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity backdrop-blur-sm"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('previews-input')?.click()}
                                            className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/30 transition-colors"
                                        >
                                            <Plus className="w-6 h-6 text-white/30" />
                                        </button>
                                    </div>
                                    {!previewsMap.length && <p className="text-[10px] text-center text-white/40">Add up to 99 preview images</p>}
                                    <input id="previews-input" type="file" multiple hidden accept="image/*" onChange={e => e.target.files && handlePreviewsChange(e.target.files)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end gap-3 bg-black/40 -mx-6 -mb-6 px-6 pb-6 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg border border-white/10 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-lg bg-white text-black text-sm font-bold shadow-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
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

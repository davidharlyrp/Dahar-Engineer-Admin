import { useEffect, useState } from "react";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { Plus, Search, Image as ImageIcon, Edit2, Trash2, X, Upload, ShoppingBag, Package, FileText, Globe, CheckCircle2, Clock, LayoutGrid, List } from "lucide-react";
import { ProductService, type ProductRecord } from "../services/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Products() {
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<ProductRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { perPage, autoRefresh, refreshInterval } = useAdminSettings();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const filter = search ? `name ~ "${search}" || category ~ "${search}"` : "";
            const result = await ProductService.getProducts(page, perPage, "-created", filter);
            setItems(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Products: Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, page, perPage]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchData, refreshInterval * 1000);
        return () => clearInterval(id);
    }, [autoRefresh, refreshInterval]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await ProductService.deleteProduct(id);
            await fetchData();
        } catch (error) {
            alert("Failed to delete product.");
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Products Management</h1>
                        <p className="text-xs font-semibold text-white/40 mt-1">Manage your digital assets and marketplace items</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-white/90 transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </button>
            </div>

            <div className="bg-secondary/20 border border-white/5 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search products..."
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
                    <ShoppingBag className="w-12 h-12 mb-4 animate-pulse opacity-50" />
                    <span className="text-sm font-bold uppercase tracking-widest">Syncing products...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-white/40 text-center px-4 border-2 border-dashed border-white/5 rounded-3xl">
                    <Package className="w-16 h-16 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">No products found</h3>
                    <p className="text-sm font-semibold max-w-xs">Start adding your digital products to the marketplace.</p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="group bg-black/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden hover:border-white/10 transition-all flex flex-col">
                                    <div className="aspect-[4/3] bg-black/40 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                        {item.thumbnail ? (
                                            <img
                                                src={ProductService.getFileUrl(item, item.thumbnail, '500x500')}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-10 h-10 text-white/10" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border",
                                                item.is_active
                                                    ? "bg-army-500/20 text-army-400 border-army-500/20"
                                                    : "bg-white/5 text-white/40 border-white/10"
                                            )}>
                                                {item.is_active ? "Active" : "Archived"}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-3 right-3">
                                            <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-army-400 text-xs font-bold border border-white/5">
                                                Rp {item.main_price?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-white/[0.02] to-transparent">
                                        <h3 className="font-bold text-white group-hover:text-army-400 transition-colors mb-2 line-clamp-1 tracking-tight">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs font-medium text-white/40 line-clamp-2 mb-4 leading-relaxed flex-1">
                                            {item.short_description || "No description provided."}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-tighter bg-white/5 text-white/30 border border-white/5">
                                                    {item.category}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-tighter bg-white/5 text-white/30 border border-white/5">
                                                    v{item.version || "1.0.0"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(item.id);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                                            {item.thumbnail ? (
                                                                <img
                                                                    src={ProductService.getFileUrl(item, item.thumbnail, '100x100')}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-white/10" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white group-hover:text-army-400 transition-colors tracking-tight">{item.name}</span>
                                                            <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mt-0.5">v{item.version || "1.0.0"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-white/40 max-w-xs truncate">
                                                    {item.short_description}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 text-[10px] font-semibold tracking-widest border border-white/5">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-army-400 font-bold text-xs tracking-tight">
                                                    Rp {item.main_price?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(item.id);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
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

            {/* Modal for Add/Edit Product */}
            {isModalOpen && (
                <ProductModal
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

interface ProductModalProps {
    id: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingData?: ProductRecord;
}

function ProductModal({ id, isOpen: _isOpen, onClose, onSuccess, existingData }: ProductModalProps) {
    const [formData, setFormData] = useState({
        name: existingData?.name || "",
        category: existingData?.category || "",
        sub_category: existingData?.sub_category || "",
        short_description: existingData?.short_description || "",
        long_description: existingData?.long_description || "",
        main_price: existingData?.main_price || 0,
        discount_price: existingData?.discount_price || 0,
        version: existingData?.version || "1.0.0",
        language: existingData?.language || "English",
        is_active: existingData?.is_active ?? true,
        features: Array.isArray(existingData?.features) ? existingData.features.join("\n") : ""
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [pictureFiles, setPictureFiles] = useState<File[]>([]);
    const [downloadFile, setDownloadFile] = useState<File | null>(null);

    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
        existingData?.thumbnail ? ProductService.getFileUrl(existingData, existingData.thumbnail) : null
    );
    const [picturesMap, setPicturesMap] = useState<{ url: string, isExisting: boolean, name?: string }[]>(
        existingData?.pictures?.map(p => ({ url: ProductService.getFileUrl(existingData, p), isExisting: true, name: p })) || []
    );
    const [deletedExistingPictures, setDeletedExistingPictures] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleThumbnailChange = (file: File) => {
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const handlePicturesChange = (files: FileList | File[]) => {
        const newFiles = Array.from(files);
        setPictureFiles(prev => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(f => ({ url: URL.createObjectURL(f), isExisting: false }));
        setPicturesMap(prev => [...prev, ...newPreviews]);
    };

    const removePicture = (index: number) => {
        const item = picturesMap[index];
        if (item.isExisting && item.name) {
            setDeletedExistingPictures(prev => [...prev, item.name!]);
        } else {
            const newlyAddedIndex = picturesMap.slice(0, index).filter(p => !p.isExisting).length;
            setPictureFiles(prev => prev.filter((_, i) => i !== newlyAddedIndex));
        }
        setPicturesMap(prev => prev.filter((_, i) => i !== index));
    };

    const handleDownloadFileChange = (file: File) => {
        setDownloadFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("category", formData.category);
            data.append("sub_category", formData.sub_category);
            data.append("short_description", formData.short_description);
            data.append("long_description", formData.long_description);
            data.append("main_price", formData.main_price.toString());
            data.append("discount_price", formData.discount_price.toString());
            data.append("version", formData.version);
            data.append("language", formData.language);
            data.append("is_active", formData.is_active.toString());

            // Convert features string back to JSON array
            const featuresArray = formData.features.split("\n").filter(f => f.trim());
            data.append("features", JSON.stringify(featuresArray));

            if (thumbnailFile) {
                data.append("thumbnail", thumbnailFile);
            }

            pictureFiles.forEach(file => {
                data.append("pictures", file);
            });

            if (deletedExistingPictures.length > 0) {
                deletedExistingPictures.forEach(name => {
                    data.append("pictures-", name);
                });
            }

            if (downloadFile) {
                data.append("file", downloadFile);
                data.append("file_name", downloadFile.name);
                data.append("file_size", downloadFile.size.toString());
                const format = downloadFile.name.split('.').pop();
                if (format) data.append("file_format", format.toUpperCase());
            }

            if (id) {
                await ProductService.updateProduct(id, data);
            } else {
                await ProductService.createProduct(data);
            }
            onSuccess();
        } catch (error) {
            console.error("ProductModal: Error saving:", error);
            alert("Failed to save product.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {id ? "Edit Product" : "Launch New Product"}
                        </h2>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Configure your digital asset details</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin scrollbar-thumb-white/10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Primary Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                        placeholder="e.g. Modern Bridge Design Toolkit"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Category</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.category}
                                            onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                            placeholder="e.g. Templates"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Sub Category</label>
                                        <input
                                            type="text"
                                            value={formData.sub_category}
                                            onChange={e => setFormData(p => ({ ...p, sub_category: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                            placeholder="e.g. Structural"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Short Description</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.short_description}
                                        onChange={e => setFormData(p => ({ ...p, short_description: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                        placeholder="One-liner that sells the product"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Full Description</label>
                                    <textarea
                                        value={formData.long_description}
                                        onChange={e => setFormData(p => ({ ...p, long_description: e.target.value }))}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none resize-none scrollbar-thin placeholder:text-white/10"
                                        placeholder="Detailed breakdown of features, requirements, and benefits..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-white/40 tracking-widest ml-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-army-400" /> Key Features (One per line)
                                    </label>
                                    <textarea
                                        value={formData.features}
                                        onChange={e => setFormData(p => ({ ...p, features: e.target.value }))}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none resize-none placeholder:text-white/10"
                                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3..."
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Version</label>
                                            <div className="relative">
                                                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input
                                                    type="text"
                                                    value={formData.version}
                                                    onChange={e => setFormData(p => ({ ...p, version: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Language</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input
                                                    type="text"
                                                    value={formData.language}
                                                    onChange={e => setFormData(p => ({ ...p, language: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pt-3 px-1">
                                            <div
                                                onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                                                className={cn(
                                                    "w-10 h-5 rounded-full relative transition-all cursor-pointer border",
                                                    formData.is_active ? "bg-army-500 border-army-400" : "bg-white/5 border-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all shadow-sm",
                                                    formData.is_active ? "left-[22px] bg-black" : "left-1 bg-white/20"
                                                )} />
                                            </div>
                                            <label className="text-xs font-semibold text-white/40 tracking-widest cursor-pointer select-none">
                                                Product is Active
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Assets */}
                        <div className="space-y-8">
                            {/* Pricing Card */}
                            <div className="p-6 bg-black/40 border border-white/10 rounded-2xl shadow-xl space-y-4">
                                <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Product Pricing</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-army-400 uppercase">Rp</span>
                                        <input
                                            type="number"
                                            value={formData.main_price}
                                            onChange={e => setFormData(p => ({ ...p, main_price: parseFloat(e.target.value) }))}
                                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-1 focus:ring-army-500 text-lg font-bold"
                                            placeholder="Price"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 uppercase">Rp</span>
                                        <input
                                            type="number"
                                            placeholder="Discount (Optional)"
                                            value={formData.discount_price}
                                            onChange={e => setFormData(p => ({ ...p, discount_price: parseFloat(e.target.value) }))}
                                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-white/60 outline-none focus:ring-1 focus:ring-white/10 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Triple Upload Zone */}
                            <div className="space-y-6">
                                {/* Zone 1: Thumbnail */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Featured Image</label>
                                    <div
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-army-500/50', 'bg-army-500/5'); }}
                                        onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-army-500/50', 'bg-army-500/5'); }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('border-army-500/50', 'bg-army-500/5');
                                            if (e.dataTransfer.files?.[0]) handleThumbnailChange(e.dataTransfer.files[0]);
                                        }}
                                        className="relative group h-36 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-black/40 overflow-hidden transition-all hover:border-white/20"
                                    >
                                        {thumbnailPreview ? (
                                            <>
                                                <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Thumbnail" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                                                    <button type="button" onClick={() => document.getElementById('product-thumb')?.click()} className="p-3 bg-white/10 text-white rounded-full border border-white/20 hover:bg-white/20 transition-all active:scale-95">
                                                        <Upload className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-6 h-6 text-white/20 mx-auto mb-2 group-hover:scale-110 group-hover:text-army-400 transition-all" />
                                                <p className="text-xs font-semibold text-white/40 tracking-widest ml-1">Add Cover Image</p>
                                            </div>
                                        )}
                                        <input id="product-thumb" type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleThumbnailChange(e.target.files[0])} />
                                        <button type="button" onClick={() => document.getElementById('product-thumb')?.click()} className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"></button>
                                    </div>
                                </div>

                                {/* Zone 2: Gallery */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Product Gallery</label>
                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 transition-all">
                                        <div className="grid grid-cols-4 gap-2">
                                            {picturesMap.slice(-7).map((item, i) => (
                                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/5 bg-black/40 group/preview">
                                                    <img src={item.url} className="w-full h-full object-cover opacity-80" alt="Gallery" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePicture(i)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-md opacity-0 group-hover/preview:opacity-100 transition-opacity active:scale-90"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('product-gallery')?.click()}
                                                className="aspect-square rounded-lg border-2 border-dashed border-white/5 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all group/add"
                                            >
                                                <Plus className="w-5 h-5 text-white/10 group-hover/add:text-army-400 transition-colors" />
                                            </button>
                                        </div>
                                        <input id="product-gallery" type="file" multiple hidden accept="image/*" onChange={e => e.target.files && handlePicturesChange(e.target.files)} />
                                    </div>
                                </div>

                                {/* Zone 3: Main File */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-white/40 tracking-widest ml-1">Source File</label>
                                    <div
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-white/[0.02]', 'border-army-500/30'); }}
                                        onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-white/[0.02]', 'border-army-500/30'); }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('bg-white/[0.02]', 'border-army-500/30');
                                            if (e.dataTransfer.files?.[0]) handleDownloadFileChange(e.dataTransfer.files[0]);
                                        }}
                                        className="relative p-6 border-2 border-dashed border-white/10 rounded-2xl bg-black/40 transition-all text-center group"
                                    >
                                        <div className="space-y-4">
                                            <div className="p-3 bg-white/5 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto border border-white/5 group-hover:border-army-500/20 transition-all">
                                                <FileText className={cn("w-7 h-7 transition-colors", downloadFile || existingData?.file ? "text-army-400" : "text-white/10")} />
                                            </div>
                                            <div className="px-2">
                                                <p className="text-xs font-bold text-white truncate max-w-full">
                                                    {downloadFile ? downloadFile.name : (existingData?.file_name || "No file uploaded")}
                                                </p>
                                                <p className="text-[10px] font-semibold text-white/40 tracking-widest ml-1">
                                                    {downloadFile ? `${(downloadFile.size / (1024 * 1024)).toFixed(2)} MB` : (existingData?.file_size ? `${(existingData.file_size / (1024 * 1024)).toFixed(2)} MB` : "ZIP, PDF, or Design Source")}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('main-file')?.click()}
                                                className="text-[10px] font-semibold text-white/60 hover:text-white uppercase tracking-widest bg-white/5 hover:bg-white/10 px-5 py-2 rounded-xl transition-all border border-white/5"
                                            >
                                                Change Asset
                                            </button>
                                        </div>
                                        <input id="main-file" type="file" hidden onChange={e => e.target.files?.[0] && handleDownloadFileChange(e.target.files[0])} />
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-army-500 hover:bg-army-400 text-white text-xs font-semibold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : (id ? "Save Changes" : "Launch Product")}
                    </button>
                </div>
            </div>
        </div>
    );
}

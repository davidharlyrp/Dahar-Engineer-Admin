import { useEffect, useState } from "react";
import { Plus, Search, Image as ImageIcon, Edit2, Trash2, X, Upload, ShoppingBag, Package, FileText, Globe, CheckCircle2, Loader2, LayoutGrid, List } from "lucide-react";
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
    const perPage = 15;

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
    }, [search, page]);

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Products Management</h1>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
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
                <div className="py-24 flex flex-col items-center justify-center text-slate-500">
                    <ShoppingBag className="w-8 h-8 mb-4 animate-pulse opacity-20" />
                    <span className="text-sm font-medium">Syncing products...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-center px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Package className="w-12 h-12 mb-4 opacity-10" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No products found</h3>
                    <p className="text-sm text-slate-500 font-medium">Start adding your digital products to the marketplace.</p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col">
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-900 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                        {item.thumbnail ? (
                                            <img
                                                src={ProductService.getFileUrl(item, item.thumbnail, '500x500')}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-md border border-white/20",
                                                item.is_active ? "bg-slate-900/90 text-white" : "bg-slate-500/50 text-white"
                                            )}>
                                                {item.is_active ? "Active" : "Archived"}
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                                                Rp. {item.main_price?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors mb-1 line-clamp-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-8">
                                            {item.short_description || "No description provided."}
                                        </p>
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {item.category}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                v{item.version || "1.0.0"}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
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
                                            <th className="px-6 py-3 font-medium">Product</th>
                                            <th className="px-6 py-3 font-medium">Description</th>
                                            <th className="px-6 py-3 font-medium">Category</th>
                                            <th className="px-6 py-3 font-medium">Price</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0">
                                                            {item.thumbnail ? (
                                                                <img
                                                                    src={ProductService.getFileUrl(item, item.thumbnail, '100x100')}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                                                            <span className="text-[10px] text-slate-500">v{item.version || "1.0.0"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                                    {item.short_description}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                                                    Rp. {item.main_price?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(item.id);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
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
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {id ? "Edit Product" : "Launch New Product"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Primary Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                        placeholder="e.g. Modern Bridge Design Toolkit"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.category}
                                            onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                            placeholder="e.g. Templates"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sub Category</label>
                                        <input
                                            type="text"
                                            value={formData.sub_category}
                                            onChange={e => setFormData(p => ({ ...p, sub_category: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                            placeholder="e.g. Structural"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Short Description</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.short_description}
                                        onChange={e => setFormData(p => ({ ...p, short_description: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                        placeholder="One-liner that sells the product"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Description</label>
                                    <textarea
                                        value={formData.long_description}
                                        onChange={e => setFormData(p => ({ ...p, long_description: e.target.value }))}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all resize-none scrollbar-thin"
                                        placeholder="Detailed breakdown of features, requirements, and benefits..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <CheckCircle2 className="w-3 h-3" /> Key Features (One per line)
                                    </label>
                                    <textarea
                                        value={formData.features}
                                        onChange={e => setFormData(p => ({ ...p, features: e.target.value }))}
                                        rows={5}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all resize-none text-sm"
                                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3..."
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Version</label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={formData.version}
                                                    onChange={e => setFormData(p => ({ ...p, version: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={formData.language}
                                                    onChange={e => setFormData(p => ({ ...p, language: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={formData.is_active}
                                                onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                                                className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 accent-slate-900 dark:accent-slate-100"
                                            />
                                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Product is Active</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Assets */}
                        <div className="space-y-8">
                            {/* Pricing Card */}
                            <div className="p-6 bg-slate-900 border border-white/10 rounded-2xl shadow-xl space-y-4">
                                <label className="text-sm font-medium text-slate-400">Product Pricing</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500">Rp. </span>
                                        <input
                                            type="number"
                                            value={formData.main_price}
                                            onChange={e => setFormData(p => ({ ...p, main_price: parseFloat(e.target.value) }))}
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-slate-700 dark:focus:ring-slate-500 text-xl font-bold"
                                            placeholder="Price"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">Rp. </span>
                                        <input
                                            type="number"
                                            value={formData.discount_price}
                                            onChange={e => setFormData(p => ({ ...p, discount_price: parseFloat(e.target.value) }))}
                                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-700 text-sm"
                                            placeholder="Discount Price (Optional)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Triple Upload Zone */}
                            <div className="space-y-6">
                                {/* Zone 1: Thumbnail */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured Image</label>
                                    <div
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-slate-900', 'dark:ring-slate-100'); }}
                                        onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-slate-900', 'dark:ring-slate-100'); }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('ring-2', 'ring-slate-900', 'dark:ring-slate-100');
                                            if (e.dataTransfer.files?.[0]) handleThumbnailChange(e.dataTransfer.files[0]);
                                        }}
                                        className="relative group h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 overflow-hidden transition-all"
                                    >
                                        {thumbnailPreview ? (
                                            <>
                                                <img src={thumbnailPreview} className="absolute inset-0 w-full h-full object-cover" alt="Thumbnail" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                                    <button type="button" onClick={() => document.getElementById('product-thumb')?.click()} className="p-3 bg-white/20 text-white rounded-full shadow-2xl hover:bg-white/40 transition-colors">
                                                        <Upload className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1 group-hover:scale-125 transition-transform" />
                                                <p className="text-sm font-medium text-slate-500">Add Cover</p>
                                            </div>
                                        )}
                                        <input id="product-thumb" type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleThumbnailChange(e.target.files[0])} />
                                        <button type="button" onClick={() => document.getElementById('product-thumb')?.click()} className="absolute inset-0 w-full h-full cursor-pointer z-0 opacity-0"></button>
                                    </div>
                                </div>

                                {/* Zone 2: Gallery */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Gallery</label>
                                    <div
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-slate-900', 'dark:ring-slate-100'); }}
                                        onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-slate-900', 'dark:ring-slate-100'); }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('ring-2', 'ring-slate-900', 'dark:ring-slate-100');
                                            if (e.dataTransfer.files) handlePicturesChange(e.dataTransfer.files);
                                        }}
                                        className="min-h-[120px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/50 transition-all"
                                    >
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {picturesMap.slice(-7).map((item, i) => (
                                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group/preview">
                                                    <img src={item.url} className="w-full h-full object-cover shadow-inner" alt="Gallery" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePicture(i)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('product-gallery')?.click()}
                                                className="aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm"
                                            >
                                                <Plus className="w-5 h-5 text-slate-400" />
                                            </button>
                                        </div>
                                        {!picturesMap.length && <p className="text-sm text-center text-slate-400 font-medium">Image Gallery</p>}
                                        <input id="product-gallery" type="file" multiple hidden accept="image/*" onChange={e => e.target.files && handlePicturesChange(e.target.files)} />
                                    </div>
                                </div>

                                {/* Zone 3: Main File */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source File</label>
                                    <div
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-100', 'dark:bg-slate-800/50', 'border-slate-400'); }}
                                        onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-800/50', 'border-slate-400'); }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-800/50', 'border-slate-400');
                                            if (e.dataTransfer.files?.[0]) handleDownloadFileChange(e.dataTransfer.files[0]);
                                        }}
                                        className="relative p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/50 transition-all text-center"
                                    >
                                        <div className="space-y-3">
                                            <div className="p-3 bg-white dark:bg-slate-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm border border-slate-100 dark:border-slate-800">
                                                <FileText className={cn("w-6 h-6", downloadFile || existingData?.file ? "text-blue-500" : "text-slate-400")} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate px-2">
                                                    {downloadFile ? downloadFile.name : (existingData?.file_name || "No file uploaded")}
                                                </p>
                                                <p className="text-xs font-medium text-slate-500 mt-1">
                                                    {downloadFile ? `${(downloadFile.size / (1024 * 1024)).toFixed(2)} MB` : (existingData?.file_size ? `${(existingData.file_size / (1024 * 1024)).toFixed(2)} MB` : "ZIP, PDF, or Design Source")}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('main-file')?.click()}
                                                className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest bg-slate-400/10 px-4 py-1.5 rounded-full transition-colors"
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
                        {id ? "Save Changes" : "Launch Product"}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { UploadCloud, FileText, Trash2, Download, Plus, X, Clock, User, MessageSquare, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { FileService, UserService, type RequestedFileRecord, type RequestedFileItemRecord, type UserRecord } from "../services/api";
import { pb } from "../lib/pb";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Files() {
    const [requests, setRequests] = useState<RequestedFileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Upload form state
    const [uploadData, setUploadData] = useState({
        recipient_id: "",
        subject: "",
        description: "",
    });
    const [userSearch, setUserSearch] = useState("");
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isModalDragging, setIsModalDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);

    const fetchRequests = async (page = 1) => {
        setIsLoading(true);
        try {
            const result = await FileService.getRequestedFiles(page, 10);
            setRequests(result.items);
            setCurrentPage(result.page);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Files: Error fetching requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const result = await UserService.getUsers(1, 50);
            setUsers(result.items);
        } catch (error) {
            console.error("Files: Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchRequests(currentPage);
        fetchUsers();
    }, [currentPage]);

    const handleUpload = async () => {
        if (!uploadData.recipient_id || !uploadData.subject || selectedFiles.length === 0) {
            alert("Please fill in all required fields and select at least one file.");
            return;
        }

        setIsSubmitting(true);
        try {
            await FileService.createRequestWithFiles(
                {
                    ...uploadData,
                    sender_id: pb.authStore.model?.id || "",
                },
                selectedFiles
            );
            await fetchRequests();
            setIsUploadModalOpen(false);
            setUploadData({ recipient_id: "", subject: "", description: "" });
            setUserSearch("");
            setIsUserDropdownOpen(false);
            setSelectedFiles([]);
        } catch (error) {
            console.error("Files: Error uploading files:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this file request and all its items?")) return;
        try {
            await FileService.deleteRequest(id);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Files: Error deleting request:", error);
        }
    };

    return (
        <div className="space-y-5 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white/90">File Management</h1>
                    <p className="text-xs font-semibold text-white/50 mt-1">Manage requested files and user uploads.</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors shadow-lg"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Upload
                </button>
            </div>

            {/* File List */}
            <div className="bg-secondary/30 border border-white/5 rounded-xl min-h-[400px] flex flex-col">
                <div className="p-5 border-b border-white/5 bg-black/20 rounded-t-xl">
                    <h2 className="text-sm font-bold text-white">Requested Files</h2>
                </div>

                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-white/40">
                        <Loader2 className="w-6 h-6 mb-4 animate-spin opacity-50" />
                        <span className="text-sm font-semibold">Loading files...</span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-white/40 text-center px-4">
                        <FileText className="w-10 h-10 mb-4 opacity-20" />
                        <h3 className="text-sm font-semibold text-white mb-1">No file requests yet</h3>
                        <p className="text-xs">Click "New Upload" to start sending files.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 flex-1 p-2">
                        {requests.map((request) => (
                            <FileRequestItem
                                key={request.id}
                                request={request}
                                recipientName={request.expand?.recipient_id ? (request.expand.recipient_id.display_name || request.expand.recipient_id.name) : "Unknown User"}
                                onDelete={() => handleDelete(request.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20 rounded-b-xl">
                        <p className="text-xs text-white/50 font-semibold tracking-tight">
                            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="p-1.5 rounded-lg border border-white/10 bg-black/40 text-white/60 disabled:opacity-50 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || isLoading}
                                className="p-1.5 rounded-lg border border-white/10 bg-black/40 text-white/60 disabled:opacity-50 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h2 className="text-lg font-bold text-white">Upload Files</h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1.5 relative">
                                <label className="text-xs font-semibold text-white/60">Recipient</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={userSearch}
                                        onFocus={() => setIsUserDropdownOpen(true)}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            setIsUserDropdownOpen(true);
                                        }}
                                        className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:border-army-500/50 outline-none placeholder:text-white/20"
                                    />
                                    {isUserDropdownOpen && (
                                        <div className="absolute z-[60] w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                                            {users.filter(u =>
                                                (u.display_name || u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
                                                u.email.toLowerCase().includes(userSearch.toLowerCase())
                                            ).length === 0 ? (
                                                <div className="p-3 text-xs text-white/40 text-center">No users found</div>
                                            ) : (
                                                users
                                                    .filter(u =>
                                                        (u.display_name || u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
                                                        u.email.toLowerCase().includes(userSearch.toLowerCase())
                                                    )
                                                    .map(u => (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setUploadData(prev => ({ ...prev, recipient_id: u.id }));
                                                                setUserSearch(u.display_name || u.name || u.email);
                                                                setIsUserDropdownOpen(false);
                                                            }}
                                                            className={cn(
                                                                "w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors flex flex-col",
                                                                uploadData.recipient_id === u.id ? "bg-army-500/20 text-army-400" : "text-white/80"
                                                            )}
                                                        >
                                                            <span className="font-medium">{u.display_name || u.name}</span>
                                                            <span className="text-[10px] text-white/40">{u.email}</span>
                                                        </button>
                                                    ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                {isUserDropdownOpen && (
                                    <div
                                        className="fixed inset-0 z-[55]"
                                        onClick={() => setIsUserDropdownOpen(false)}
                                    />
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/60">Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Project Blueprint"
                                    value={uploadData.subject}
                                    onChange={e => setUploadData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:border-army-500/50 outline-none placeholder:text-white/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/60">Description</label>
                                <textarea
                                    placeholder="Add some context..."
                                    rows={3}
                                    value={uploadData.description}
                                    onChange={e => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:border-army-500/50 outline-none placeholder:text-white/20 resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-white/60">Files</label>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2",
                                        isModalDragging
                                            ? "border-army-500 bg-army-500/10 scale-[0.98]"
                                            : "border-white/10 hover:border-white/20 bg-black/20"
                                    )}
                                    onDragOver={(e) => { e.preventDefault(); setIsModalDragging(true); }}
                                    onDragLeave={() => setIsModalDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsModalDragging(false);
                                        if (e.dataTransfer.files) {
                                            setSelectedFiles(Array.from(e.dataTransfer.files));
                                        }
                                    }}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        onChange={e => {
                                            if (e.target.files) {
                                                setSelectedFiles(Array.from(e.target.files));
                                            }
                                        }}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <div className={cn(
                                            "p-3 rounded-full transition-colors",
                                            isModalDragging ? "bg-army-500/20 text-army-400" : "bg-white/5 text-white/40"
                                        )}>
                                            <UploadCloud className="w-8 h-8 transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm font-semibold text-white block">
                                                {isModalDragging ? "Drop to upload" : "Click or drag files here"}
                                            </span>
                                            <span className="text-[10px] text-white/40">Support for PDF, Images, ZIP</span>
                                        </div>
                                    </label>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs font-semibold text-white/50">Selected ({selectedFiles.length})</p>
                                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                            {selectedFiles.map((f, i) => (
                                                <div key={i} className="text-xs py-1.5 px-3 bg-white/5 rounded-lg flex items-center justify-between text-white/80 border border-white/5">
                                                    <span className="truncate max-w-[200px]">{f.name}</span>
                                                    <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 bg-black/40 border-t border-white/5 flex gap-3">
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isSubmitting || selectedFiles.length === 0}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-black bg-white rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UploadCloud className="w-4 h-4" /> Upload Files</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function FileRequestItem({ request, recipientName, onDelete }: { request: RequestedFileRecord, recipientName: string, onDelete: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [items, setItems] = useState<RequestedFileItemRecord[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    const toggleExpand = async () => {
        if (!isExpanded && items.length === 0) {
            setIsLoadingItems(true);
            try {
                const fetchedItems = await FileService.getFileItems(request.id);
                setItems(fetchedItems);
            } catch (error) {
                console.error("Error fetching items:", error);
            } finally {
                setIsLoadingItems(false);
            }
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="group transition-all">
            <div
                className={cn(
                    "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors",
                    isExpanded && "bg-white/5"
                )}
                onClick={toggleExpand}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-black/40 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-white truncate max-w-[200px] sm:max-w-md">{request.subject}</h4>
                        <div className="text-[10px] text-white/40 flex flex-wrap gap-x-3 items-center mt-0.5">
                            <span className="flex items-center gap-1 font-medium"><User className="w-3 h-3 text-army-500" /> {recipientName}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-white/30" /> {new Date(request.upload_date).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {request.description && <MessageSquare className="w-4 h-4 text-white/20" />}
                    <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-black/20">
                    {request.description && (
                        <div className="mb-4 text-xs text-white/60 px-4 py-3 bg-black/40 rounded-lg border border-white/5 mt-3">
                            <p className="font-semibold text-[10px] text-white/40 mb-1">Description</p>
                            {request.description}
                        </div>
                    )}

                    <div className="space-y-1 pl-4 sm:pl-12 mt-2">
                        {isLoadingItems ? (
                            <div className="py-2 text-xs text-white/40 flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Fetching file items...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-2 text-xs text-white/40 italic">No files attached to this request.</div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg transition-colors group/item">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/item:bg-army-500 transition-colors" />
                                        <span className="text-xs font-medium text-white/80 truncate max-w-[200px] sm:max-w-md">{item.original_filename}</span>
                                        <span className="text-[10px] text-white/40">({(item.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <a
                                        href={FileService.getFileUrl(item, item.file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { useEffect, useState } from "react";
import { UploadCloud, FileText, Trash2, Download, Plus, X, Clock, User, MessageSquare, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">File Management</h1>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Upload
                </button>
            </div>

            {/* File List */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors min-h-[400px]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">Requested Files</h2>
                </div>

                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-500">
                        <Clock className="w-8 h-8 mb-4 animate-spin opacity-20" />
                        <span>Loading files...</span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-500 text-center px-4">
                        <FileText className="w-12 h-12 mb-4 opacity-10" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No file requests yet</h3>
                        <p className="text-sm">Click "New Upload" to start sending files.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
                        <p className="text-xs text-slate-500 font-medium tracking-tight">
                            Page <span className="text-slate-900 dark:text-slate-100">{currentPage}</span> of <span className="text-slate-900 dark:text-slate-100">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || isLoading}
                                className="p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upload Files</h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recipient</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none"
                                    />
                                    {isUserDropdownOpen && (
                                        <div className="absolute z-[60] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto overflow-x-hidden">
                                            {users.filter(u =>
                                                (u.display_name || u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
                                                u.email.toLowerCase().includes(userSearch.toLowerCase())
                                            ).length === 0 ? (
                                                <div className="p-3 text-sm text-slate-500 text-center">No users found</div>
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
                                                                "w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex flex-col",
                                                                uploadData.recipient_id === u.id ? "bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                                                            )}
                                                        >
                                                            <span className="font-medium">{u.display_name || u.name}</span>
                                                            <span className="text-[10px] text-slate-500">{u.email}</span>
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Project Blueprint"
                                    value={uploadData.subject}
                                    onChange={e => setUploadData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                <textarea
                                    placeholder="Add some context..."
                                    rows={3}
                                    value={uploadData.description}
                                    onChange={e => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Files</label>
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-2",
                                        isModalDragging
                                            ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900/50 scale-[0.98]"
                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
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
                                            isModalDragging ? "bg-slate-200 dark:bg-slate-700" : "bg-slate-100 dark:bg-slate-900"
                                        )}>
                                            <UploadCloud className={cn(
                                                "w-8 h-8 transition-colors",
                                                isModalDragging ? "text-slate-900 dark:text-slate-100" : "text-slate-400"
                                            )} />
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">
                                                {isModalDragging ? "Drop to upload" : "Click or drag files here"}
                                            </span>
                                            <span className="text-[10px] text-slate-500">Support for PDF, Images, ZIP</span>
                                        </div>
                                    </label>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected ({selectedFiles.length})</p>
                                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                            {selectedFiles.map((f, i) => (
                                                <div key={i} className="text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-900/50 rounded flex items-center justify-between text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                                                    <span className="truncate max-w-[200px]">{f.name}</span>
                                                    <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isSubmitting || selectedFiles.length === 0}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 rounded-md hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <><UploadCloud className="w-4 h-4" /> Upload Files</>}
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
                    "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors",
                    isExpanded && "bg-slate-50 dark:bg-slate-700/20"
                )}
                onClick={toggleExpand}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{request.subject}</h4>
                        <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 items-center">
                            <span className="flex items-center gap-1 font-medium"><User className="w-3 h-3 text-slate-400" /> {recipientName}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {new Date(request.upload_date).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {request.description && <MessageSquare className="w-4 h-4 text-slate-300" />}
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                    {request.description && (
                        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400 px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 mt-2">
                            <p className="font-semibold text-[10px] uppercase text-slate-400 mb-1">Description</p>
                            {request.description}
                        </div>
                    )}

                    <div className="space-y-1 pl-4 sm:pl-12">
                        {isLoadingItems ? (
                            <div className="py-4 text-xs text-slate-400 flex items-center gap-2">
                                <Clock className="w-3 h-3 animate-spin" /> Fetching file items...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-4 text-xs text-slate-400 italic">No files attached to this request.</div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex items-center justify-between py-2 px-3 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors group/item">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-md">{item.original_filename}</span>
                                        <span className="text-[10px] text-slate-400">({(item.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <a
                                        href={FileService.getFileUrl(item, item.file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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

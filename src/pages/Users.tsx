import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, UserIcon, ChevronLeft, ChevronRight, X, Loader2, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Phone, Building2, Coins, Check } from "lucide-react";
import { UserService, type UserRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Users() {
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const { perPage, autoRefresh, refreshInterval } = useAdminSettings();

    // Sorting state
    const [sortField, setSortField] = useState<string>("created");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        display_name: "",
        phone_number: "",
        institution: "",
        isAdmin: false
    });

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            // Construct sort string for PocketBase (e.g., "-created" or "name")
            const sortParam = sortDirection === "desc" ? `-${sortField}` : sortField;
            const result = await UserService.getUsers(page, perPage, sortParam);
            setUsers(result.items);
            setTotalPages(result.totalPages);
            setTotalItems(result.totalItems);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, perPage, sortDirection, sortField]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchUsers, refreshInterval * 1000);
        return () => clearInterval(id);
    }, [autoRefresh, refreshInterval, fetchUsers]);

    const filteredUsers = users.filter((u: UserRecord) => {
        const searchTerm = search.toLowerCase();
        const dn = (u.display_name || "").toLowerCase();
        const n = (u.name || "").toLowerCase();
        const e = (u.email || "").toLowerCase();
        return dn.includes(searchTerm) || n.includes(searchTerm) || e.includes(searchTerm);
    });

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection(field === "created" ? "desc" : "asc");
        }
        setPage(1);
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 opacity-40" />;
        return sortDirection === "asc"
            ? <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-white" />
            : <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-white" />;
    };

    const openEditModal = (user: UserRecord) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name || "",
            display_name: user.display_name || "",
            phone_number: user.phone_number || "",
            institution: user.institution || "",
            isAdmin: user.isAdmin
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setEditFormData({
            ...editFormData,
            [e.target.name]: value
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSaving(true);
        try {
            await UserService.updateUser(editingUser.id, editFormData);
            // Refresh data to show changes
            await fetchUsers();
            closeEditModal();
        } catch (error) {
            console.error("Failed to update user", error);
            // TODO: show UI toaster error here
        } finally {
            setIsSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: "circOut" as any }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 lg:space-y-8 p-6 lg:p-8"
        >
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        User Management
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Manage your students, admins, and members
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" /> Add User
                </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-secondary border border-white/5 rounded-2xl overflow-hidden min-h-[600px] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-white/10 bg-black/40 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all placeholder:text-white/20"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setViewMode("table")}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    viewMode === "table"
                                        ? "bg-white/10 shadow-sm text-white"
                                        : "text-white/40 hover:text-white/60 hover:bg-white/5"
                                )}
                                title="Table View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all",
                                    viewMode === "grid"
                                        ? "bg-white/10 shadow-sm text-white"
                                        : "text-white/40 hover:text-white/60 hover:bg-white/5"
                                )}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-army-400 bg-army-500/10 px-3 py-1.5 rounded-full border border-army-500/20 whitespace-nowrap hidden sm:block">
                            {users.length} of {totalItems} Users
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto min-h-[400px]">
                    {viewMode === "table" ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-white/40 bg-white/[0.02] border-b border-white/5 uppercase tracking-widest font-bold">
                                <tr>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center">User {getSortIcon("name")}</div>
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-white transition-colors gap-2"
                                        onClick={() => handleSort("phone_number")}
                                    >
                                        <div className="flex items-center">Phone Number {getSortIcon("phone_number")}</div>
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort("institution")}
                                    >
                                        <div className="flex items-center">Institution {getSortIcon("institution")}</div>
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort("isAdmin")}
                                    >
                                        <div className="flex items-center">Role {getSortIcon("isAdmin")}</div>
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort("total_coins")}
                                    >
                                        <div className="flex items-center">Total Coins {getSortIcon("total_coins")}</div>
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort("newsletter")}
                                    >
                                        <div className="flex items-center">Newsletter {getSortIcon("newsletter")}</div>
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort("created")}
                                    >
                                        <div className="flex items-center">Joined {getSortIcon("created")}</div>
                                    </th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-white/40">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="w-6 h-6 animate-spin opacity-50" />
                                                <span className="text-xs uppercase tracking-widest font-bold">Loading users...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-white/40 text-xs uppercase tracking-widest font-bold">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user: UserRecord) => {
                                        const displayName = UserService.getDisplayName(user);
                                        const avatarUrl = UserService.getAvatarUrl(user);

                                        return (
                                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all">
                                                            <UserIcon className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-white tracking-relaxed">{displayName}</div>
                                                        <div className="text-white/40 flex items-center gap-2 text-[11px]">
                                                            {user.email}
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[9px]",
                                                                user.verified ? "bg-army-500/10 text-army-400 border border-army-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                            )}>
                                                                {user.verified ? "verified" : "not verified"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-white/60 font-medium text-xs">{user.phone_number || "-"}</td>
                                                <td className="px-6 py-4 text-white/60 font-medium text-xs">{user.institution || "-"}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest",
                                                        user.isAdmin
                                                            ? 'bg-army-500 text-white border border-army-400/50'
                                                            : 'bg-white/5 text-white/60 border border-white/10'
                                                    )}>
                                                        {user.isAdmin ? "Admin" : "User"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 font-bold text-army-400 bg-army-500/10 w-fit px-2 py-1 rounded-lg border border-army-500/20 text-xs">
                                                        <Coins className="w-3.5 h-3.5" />
                                                        {user.total_coins}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest",
                                                        user.newsletter
                                                            ? 'bg-white/10 text-white border border-white/20'
                                                            : 'bg-transparent text-white/40 border border-white/10'
                                                    )}>
                                                        {user.newsletter ? "Yes" : "No"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-white/40 font-medium text-xs">{new Date(user.created).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-2 bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-white/40">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Loading users...</span>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-20 text-white/40 text-xs font-bold uppercase tracking-widest">
                                    No users found.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {filteredUsers.map((user: UserRecord, i: number) => {
                                            const displayName = UserService.getDisplayName(user);
                                            const avatarUrl = UserService.getAvatarUrl(user);

                                            return (
                                                <motion.div
                                                    key={user.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-all group flex flex-col justify-between h-full relative overflow-hidden"
                                                >
                                                    {user.isAdmin && (
                                                        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                                                            <div className="absolute top-[-30px] right-[-30px] w-full h-full bg-army-500/20 blur-2xl" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-4 relative z-10">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {avatarUrl ? (
                                                                    <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-lg shrink-0" />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all shrink-0">
                                                                        <UserIcon className="w-6 h-6" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-white truncate tracking-tight text-sm" title={displayName}>{displayName}</div>
                                                                    <div className="text-[10px] text-white/40 font-medium truncate">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5">
                                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                                <Phone className="w-3.5 h-3.5 opacity-60" />
                                                                <span>{user.phone_number || "No phone"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                                <Building2 className="w-3.5 h-3.5 opacity-60" />
                                                                <span className="truncate">{user.institution || "No institution"}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                                <div className="flex items-center gap-1.5 font-bold text-army-400 bg-army-500/10 w-fit px-2 py-1 rounded-lg border border-army-500/20 text-xs">
                                                                    <Coins className="w-3.5 h-3.5" />
                                                                    {user.total_coins}
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                                    <span className={cn(
                                                                        "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest",
                                                                        user.isAdmin ? "bg-army-500 text-white" : "bg-white/5 text-white/60"
                                                                    )}>
                                                                        {user.isAdmin ? "Admin" : "User"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                                            Joined {new Date(user.created).toLocaleDateString()}
                                                        </span>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openEditModal(user)}
                                                                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                title="Edit User"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                        <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                            Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={page === totalPages}
                                className="p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Edit User Modal Overlay */}
            <AnimatePresence>
                {isEditModalOpen && editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeEditModal}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-secondary rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
                        >
                            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Edit User</h2>
                                <button
                                    onClick={closeEditModal}
                                    className="p-1.5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="edit-user-form" onSubmit={handleSaveEdit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Email (Read Only)</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={editingUser.email}
                                            className="w-full px-4 py-2.5 text-sm border border-white/10 rounded-xl bg-black/20 text-white/40 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-[10px] text-white/40">Email cannot be changed directly via admin dashboard.</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditFormChange}
                                            className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Display Name</label>
                                        <input
                                            type="text"
                                            name="display_name"
                                            value={editFormData.display_name}
                                            onChange={handleEditFormChange}
                                            className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Phone Number</label>
                                            <input
                                                type="text"
                                                name="phone_number"
                                                value={editFormData.phone_number}
                                                onChange={handleEditFormChange}
                                                className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Institution</label>
                                            <input
                                                type="text"
                                                name="institution"
                                                value={editFormData.institution}
                                                onChange={handleEditFormChange}
                                                className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 mt-4">
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className={cn(
                                                "w-5 h-5 rounded flex items-center justify-center transition-all",
                                                editFormData.isAdmin ? "bg-army-500 border border-army-400" : "bg-black/40 border border-white/20 group-hover:border-white/40"
                                            )}>
                                                {editFormData.isAdmin && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                name="isAdmin"
                                                checked={editFormData.isAdmin}
                                                onChange={handleEditFormChange}
                                                className="hidden"
                                            />
                                            <span className="text-xs font-bold tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">Grant Admin Privileges</span>
                                        </label>
                                    </div>
                                </form>
                            </div>

                            <div className="p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="edit-user-form"
                                    disabled={isSaving}
                                    className="inline-flex items-center px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-black bg-white hover:bg-white/90 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-white shadow-lg"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

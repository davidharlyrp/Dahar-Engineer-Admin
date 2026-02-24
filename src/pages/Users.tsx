import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, UserIcon, ChevronLeft, ChevronRight, X, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { UserService, type UserRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";

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

    const filteredUsers = users.filter((u) => {
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
            ? <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-slate-900 dark:text-slate-100" />
            : <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-slate-900 dark:text-slate-100" />;
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">User Management</h1>
                <button className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Showing {users.length} of {totalItems} users
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 uppercase">
                            <tr>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                    onClick={() => handleSort("name")}
                                >
                                    <div className="flex items-center">User {getSortIcon("name")}</div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                    onClick={() => handleSort("phone_number")}
                                >
                                    <div className="flex items-center">Phone Number {getSortIcon("phone_number")}</div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                    onClick={() => handleSort("institution")}
                                >
                                    <div className="flex items-center">Institution {getSortIcon("institution")}</div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                    onClick={() => handleSort("isAdmin")}
                                >
                                    <div className="flex items-center">Role {getSortIcon("isAdmin")}</div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                    onClick={() => handleSort("total_coins")}
                                >
                                    <div className="flex items-center">Total Coins {getSortIcon("total_coins")}</div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                    onClick={() => handleSort("created")}
                                >
                                    <div className="flex items-center">Joined {getSortIcon("created")}</div>
                                </th>
                                <th className="px-6 py-3 font-medium text-right dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const displayName = UserService.getDisplayName(user);
                                    const avatarUrl = UserService.getAvatarUrl(user);

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{displayName}</div>
                                                    <div className="text-slate-500 dark:text-slate-400">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.phone_number || "-"}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.institution || "-"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isAdmin
                                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {user.isAdmin ? "Admin" : "User"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.total_coins}</td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(user.created).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
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
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Page <span className="font-medium text-slate-900 dark:text-slate-100">{page}</span> of <span className="font-medium text-slate-900 dark:text-slate-100">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Modal Overlay */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                        onClick={closeEditModal}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh] border dark:border-slate-700">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit User</h2>
                            <button
                                onClick={closeEditModal}
                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto">
                            <form id="edit-user-form" onSubmit={handleSaveEdit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email (Read Only)</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={editingUser.email}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed directly via admin dashboard.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleEditFormChange}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        name="display_name"
                                        value={editFormData.display_name}
                                        onChange={handleEditFormChange}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            name="phone_number"
                                            value={editFormData.phone_number}
                                            onChange={handleEditFormChange}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Institution</label>
                                        <input
                                            type="text"
                                            name="institution"
                                            value={editFormData.institution}
                                            onChange={handleEditFormChange}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="isAdmin"
                                            checked={editFormData.isAdmin}
                                            onChange={handleEditFormChange}
                                            className="w-4 h-4 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-slate-900 dark:focus:ring-slate-100"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">Grant Admin Privileges</span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="edit-user-form"
                                disabled={isSaving}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white rounded-md transition-colors disabled:opacity-70 shadow-sm"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

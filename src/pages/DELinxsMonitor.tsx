import { useState, useEffect, useCallback } from "react";
import {
    Users,
    MessageSquare,
    Clock,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Heart,
    MessageCircle,
    Globe,
    ExternalLink,
    Search,
    ShieldAlert,
    RefreshCw,
    RotateCcw
} from "lucide-react";
import { DELinxsService, UserService, type DELinkRecord, type DELinkUserRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";

type TabType = "analytics" | "users" | "content";

export function DELinxsMonitor() {
    const [activeTab, setActiveTab] = useState<TabType>("analytics");
    const { perPage } = useAdminSettings();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-outfit">DELink Monitor</h1>
                </div>
                <div className="flex gap-2">
                    <a
                        href="https://delinxs.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                        <Globe className="w-4 h-4" />
                        Visit DELink
                    </a>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all min-h-[600px]">
                {/* Tabs Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center",
                                activeTab === "analytics"
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center",
                                activeTab === "users"
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab("content")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center",
                                activeTab === "content"
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Content
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1">
                    {activeTab === "analytics" && <DELinxsAnalyticsTab />}
                    {activeTab === "users" && <DELinxsUsersTab perPage={perPage} />}
                    {activeTab === "content" && <DELinxsContentTab perPage={perPage} />}
                </div>
            </div>
        </div>
    );
}

function DELinxsAnalyticsTab() {
    const [stats, setStats] = useState({ totalPosts: 0, totalUsers: 0, totalLikes: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            // In actual production, these would be calls to aggregate endpoints or filtered counts
            const posts = await DELinxsService.getPosts(1, 1);
            const users = await DELinxsService.getDELinxsUsers(1, 1);

            setStats({
                totalPosts: posts.totalItems,
                totalUsers: users.totalItems,
                totalLikes: 0 // Placeholder as fetching total likes across all records might be slow
            });
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (isLoading) {
        return (
            <div className="h-full py-32 flex flex-col items-center justify-center text-slate-500">
                <Clock className="w-10 h-10 mb-4 animate-spin opacity-20" />
                <span className="font-medium">Loading analytics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-tight">Overview</h3>
                <button
                    onClick={fetchStats}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                    title="Refresh Stats"
                >
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={MessageSquare}
                    label="Total Nodes"
                    value={stats.totalPosts}
                    color="text-slate-600 dark:text-slate-400"
                    bg="bg-slate-50 dark:bg-slate-500/10"
                />
                <StatCard
                    icon={Users}
                    label="Registered Users"
                    value={stats.totalUsers}
                    color="text-slate-600 dark:text-slate-400"
                    bg="bg-slate-50 dark:bg-slate-500/10"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Platform Growth"
                    value={84}
                    isPercent
                    color="text-slate-600 dark:text-slate-400"
                    bg="bg-slate-50 dark:bg-slate-500/10"
                />
            </div>

            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Engagements Overview</h3>
                <p className="text-sm text-slate-500 max-w-sm">Detailed interaction metrics and user behavior analysis are being prepared.</p>
            </div>
        </div>
    );
}

function DELinxsUsersTab({ perPage }: { perPage: number }) {
    const [users, setUsers] = useState<DELinkUserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const filter = searchTerm ? `display_name ~ "${searchTerm}" || institution ~ "${searchTerm}" || role ~ "${searchTerm}"` : "";
            const result = await DELinxsService.getDELinxsUsers(page, perPage, filter);
            setUsers(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Failed to fetch DELinxs users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, perPage, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-tight">Community Members</h3>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
                        title="Refresh List"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <Clock className="w-10 h-10 mb-2 animate-spin opacity-20" />
                    <span>Fetching users...</span>
                </div>
            ) : users.length === 0 ? (
                <div className="py-20 text-center text-slate-500">No users found.</div>
            ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-slate-500 border-b border-slate-100 dark:border-slate-700 uppercase bg-slate-50 dark:bg-slate-900/50">
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Institution</th>
                                <th className="px-4 py-3 font-medium text-center">Nodes</th>
                                <th className="px-4 py-3 font-medium text-center">Total Likes</th>
                                <th className="px-4 py-3 font-medium text-center">Connections</th>
                                <th className="px-4 py-3 font-medium text-center">Supports</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                            {user.expand?.user_id?.avatar ? (
                                                <img src={UserService.getAvatarUrl(user.expand.user_id) || undefined} className="w-full h-full object-cover" />
                                            ) : <Users className="w-4 h-4" />}
                                        </div>
                                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{user.display_name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 truncate">{user.institution || "-"}</td>
                                    <td className="px-4 py-3 text-center font-medium">
                                        <UserPostCounter userId={user.user_id} />
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium">
                                        <UserLikeCounter userId={user.user_id} />
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium">{user.connections?.length || 0}</td>
                                    <td className="px-4 py-3 text-center font-medium">
                                        <SupportCounter userId={user.user_id} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                            {user.role || "Member"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pt-6 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function DELinxsContentTab({ perPage }: { perPage: number }) {
    const [posts, setPosts] = useState<DELinkRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        try {
            const filter = searchTerm ? `content ~ "${searchTerm}" || hashtag ~ "${searchTerm}"` : "";
            const result = await DELinxsService.getPosts(page, perPage, filter);
            setPosts(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Failed to fetch DELinxs posts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, perPage, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPosts();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPosts]);

    const handleToggleTakedown = async (post: DELinkRecord) => {
        const isRestoring = post.is_takedown;
        if (!confirm(isRestoring ? "Restore this node?" : "Are you sure you want to take down this node?")) return;

        setIsUpdating(post.id);
        try {
            await DELinxsService.updatePost(post.id, {
                is_takedown: !isRestoring,
                is_edited: true,
                edited_date: new Date().toISOString()
            });
            await fetchPosts();
        } catch (error) {
            alert(`Failed to ${isRestoring ? "restore" : "takedown"} post.`);
            console.error(error);
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-tight">Content Monitor (Nodes)</h3>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                        />
                    </div>
                    <button
                        onClick={fetchPosts}
                        className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all"
                        title="Refresh Content"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <Clock className="w-10 h-10 mb-2 animate-spin opacity-20" />
                    <span>Fetching content...</span>
                </div>
            ) : posts.length === 0 ? (
                <div className="py-20 text-center text-slate-500">No content found.</div>
            ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-slate-500 border-b border-slate-100 dark:border-slate-700 uppercase bg-slate-50 dark:bg-slate-900/50">
                                <th className="px-4 py-3 font-medium">Poster</th>
                                <th className="px-4 py-3 font-medium">Content Preview</th>
                                <th className="px-4 py-3 font-medium text-center">Stats</th>
                                <th className="px-4 py-3 font-medium text-center">Media</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {posts.map(post => {
                                const publicUrl = `https://delinxs.com/${post.id}`;
                                const isTakedown = post.is_takedown;

                                return (
                                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                                    {post.expand?.user_id?.avatar ? (
                                                        <img src={UserService.getAvatarUrl(post.expand.user_id) || undefined} className="w-full h-full object-cover" />
                                                    ) : <Users className="w-4 h-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{post.expand?.user_id?.name || "Member"}</div>
                                                    <div className="text-[10px] text-slate-400">{new Date(post.created).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs xl:max-w-md">
                                            <div className={cn(
                                                "text-xs line-clamp-2",
                                                isTakedown ? "text-red-500 font-medium italic" : "text-slate-600 dark:text-slate-400"
                                            )}>
                                                {isTakedown ? "Node ini di takedown karena tidak sesuai dengan ketentuan yang ada." : (post.content || <span className="opacity-50 italic">No text content</span>)}
                                            </div>
                                            {post.hashtag && <div className="text-[10px] text-slate-400 mt-1">{post.hashtag}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                    <Heart className="w-3 h-3" /> {isTakedown ? 0 : (post.likes?.length || 0)}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                    <ReplyCounter postId={post.id} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {post.attachment && post.attachment.length > 0 ? (
                                                <div className="inline-flex relative">
                                                    <img
                                                        src={DELinxsService.getFileUrl(post, post.attachment[0], "100x100") || undefined}
                                                        className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-700"
                                                    />
                                                    {post.attachment.length > 1 && (
                                                        <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-[8px] px-1 rounded-full">
                                                            +{post.attachment.length - 1}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-300">None</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={publicUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                                                    title="View Public"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleToggleTakedown(post)}
                                                    disabled={isUpdating === post.id}
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-all",
                                                        isTakedown
                                                            ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600"
                                                            : "text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
                                                    )}
                                                    title={isTakedown ? "Restore Node" : "Takedown Node"}
                                                >
                                                    {isUpdating === post.id ? (
                                                        <Clock className="w-4 h-4 animate-spin" />
                                                    ) : isTakedown ? (
                                                        <RotateCcw className="w-4 h-4" />
                                                    ) : (
                                                        <ShieldAlert className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pt-6 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Small helper components for counts that require async lookup

function SupportCounter({ userId }: { userId: string }) {
    const [count, setCount] = useState<number | null>(null);
    useEffect(() => {
        DELinxsService.getSupportCount(userId).then(setCount);
    }, [userId]);
    return <span>{count ?? "..."}</span>;
}

function UserPostCounter({ userId }: { userId: string }) {
    const [count, setCount] = useState<number | null>(null);
    useEffect(() => {
        DELinxsService.getUserPostCount(userId).then(setCount);
    }, [userId]);
    return <span>{count ?? "..."}</span>;
}

function UserLikeCounter({ userId }: { userId: string }) {
    const [count, setCount] = useState<number | null>(null);
    useEffect(() => {
        DELinxsService.getUserTotalLikes(userId).then(setCount);
    }, [userId]);
    return <span>{count ?? "..."}</span>;
}

function ReplyCounter({ postId }: { postId: string }) {
    const [count, setCount] = useState<number | null>(null);
    useEffect(() => {
        DELinxsService.getReplyCount(postId).then(setCount);
    }, [postId]);
    return <><MessageCircle className="w-3 h-3" /> {count ?? "..."}</>;
}

function StatCard({ icon: Icon, label, value, color, bg, isPercent = false }: { icon: any, label: string, value: number, color: string, bg: string, isPercent?: boolean }) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", bg, color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                <h4 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {value.toLocaleString()}{isPercent ? "%" : ""}
                </h4>
            </div>
        </div>
    );
}

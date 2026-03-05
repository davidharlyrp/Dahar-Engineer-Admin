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
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">DELink Monitor</h1>
                </div>
                <div className="flex gap-2">
                    <a
                        href="https://delinxs.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                        <Globe className="w-4 h-4" />
                        Visit DELink
                    </a>
                </div>
            </div>

            <div className="bg-secondary/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all min-h-[600px]">
                {/* Tabs Header */}
                <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex bg-black/40 p-1 rounded-xl w-full sm:w-auto border border-white/5">
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all text-center",
                                activeTab === "analytics"
                                    ? "bg-white/10 shadow-sm text-white"
                                    : "text-white/40 hover:text-white/80"
                            )}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all text-center",
                                activeTab === "users"
                                    ? "bg-white/10 shadow-sm text-white"
                                    : "text-white/40 hover:text-white/80"
                            )}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab("content")}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all text-center",
                                activeTab === "content"
                                    ? "bg-white/10 shadow-sm text-white"
                                    : "text-white/40 hover:text-white/80"
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
            <div className="h-full py-32 flex flex-col items-center justify-center text-white/40">
                <Clock className="w-10 h-10 mb-4 animate-spin opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Loading Analytics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Overview</h3>
                <button
                    onClick={fetchStats}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
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
                    color="text-white/60"
                    bg="bg-white/5"
                />
                <StatCard
                    icon={Users}
                    label="Registered Users"
                    value={stats.totalUsers}
                    color="text-white/60"
                    bg="bg-white/5"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Platform Growth"
                    value={84}
                    isPercent
                    color="text-army-400"
                    bg="bg-army-500/10"
                />
            </div>

            <div className="p-8 border border-dashed border-white/10 bg-black/20 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                    <TrendingUp className="w-6 h-6 text-white/40" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Engagements Overview</h3>
                <p className="text-sm text-white/40 max-w-sm">Detailed interaction metrics and user behavior analysis are being prepared.</p>
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
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Community Members</h3>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-army-500/40 transition-all text-white placeholder:text-white/30"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all"
                        title="Refresh List"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-white/40">
                    <Clock className="w-10 h-10 mb-2 animate-spin opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Fetching Users...</span>
                </div>
            ) : users.length === 0 ? (
                <div className="py-20 text-center text-white/40 text-sm">No users found.</div>
            ) : (
                <div className="overflow-x-auto border border-white/5 bg-secondary rounded-2xl">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-bold tracking-widest text-white/40 border-b border-white/5 uppercase bg-white/[0.02]">
                                <th className="px-4 py-4">User</th>
                                <th className="px-4 py-4">Institution</th>
                                <th className="px-4 py-4 text-center">Nodes</th>
                                <th className="px-4 py-4 text-center">Total Likes</th>
                                <th className="px-4 py-4 text-center">Connections</th>
                                <th className="px-4 py-4 text-center">Supports</th>
                                <th className="px-4 py-4">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 overflow-hidden shrink-0 border border-white/10">
                                            {user.expand?.user_id?.avatar ? (
                                                <img src={UserService.getAvatarUrl(user.expand.user_id) || undefined} className="w-full h-full object-cover" />
                                            ) : <Users className="w-4 h-4" />}
                                        </div>
                                        <div className="font-semibold text-white truncate">{user.display_name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-white/40 truncate text-xs">{user.institution || "-"}</td>
                                    <td className="px-4 py-3 text-center font-medium text-white/80">
                                        <UserPostCounter userId={user.user_id} />
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium text-white/80">
                                        <UserLikeCounter userId={user.user_id} />
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium text-white/80">{user.connections?.length || 0}</td>
                                    <td className="px-4 py-3 text-center font-medium text-white/80">
                                        <SupportCounter userId={user.user_id} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-medium text-white/60">
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
                <div className="pt-4 flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white/40">PAGE {page} OF {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all text-white/60 hover:text-white"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all text-white/60 hover:text-white"
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
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Content Monitor (Nodes)</h3>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-army-500/40 transition-all text-white placeholder:text-white/30"
                        />
                    </div>
                    <button
                        onClick={fetchPosts}
                        className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all"
                        title="Refresh Content"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-white/40">
                    <Clock className="w-10 h-10 mb-2 animate-spin opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Fetching Content...</span>
                </div>
            ) : posts.length === 0 ? (
                <div className="py-20 text-center text-white/40 text-sm">No content found.</div>
            ) : (
                <div className="overflow-x-auto border border-white/5 bg-secondary rounded-2xl">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-bold tracking-widest text-white/40 border-b border-white/5 uppercase bg-white/[0.02]">
                                <th className="px-4 py-4">Poster</th>
                                <th className="px-4 py-4">Content Preview</th>
                                <th className="px-4 py-4 text-center">Stats</th>
                                <th className="px-4 py-4 text-center">Media</th>
                                <th className="px-4 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {posts.map(post => {
                                const publicUrl = `https://delinxs.com/${post.id}`;
                                const isTakedown = post.is_takedown;

                                return (
                                    <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 shrink-0 overflow-hidden border border-white/10">
                                                    {post.expand?.user_id?.avatar ? (
                                                        <img src={UserService.getAvatarUrl(post.expand.user_id) || undefined} className="w-full h-full object-cover" />
                                                    ) : <Users className="w-4 h-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-white truncate">{post.expand?.user_id?.name || "Member"}</div>
                                                    <div className="text-[10px] text-white/40">{new Date(post.created).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs xl:max-w-md">
                                            <div className={cn(
                                                "text-xs line-clamp-2",
                                                isTakedown ? "text-red-400 font-medium italic" : "text-white/60"
                                            )}>
                                                {isTakedown ? "Node ini di takedown karena tidak sesuai dengan ketentuan yang ada." : (post.content || <span className="opacity-50 italic">No text content</span>)}
                                            </div>
                                            {post.hashtag && <div className="text-[10px] text-white/40 mt-1">{post.hashtag}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-white/40">
                                                    <Heart className="w-3 h-3 text-red-400/80" /> {isTakedown ? 0 : (post.likes?.length || 0)}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-white/40">
                                                    <ReplyCounter postId={post.id} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {post.attachment && post.attachment.length > 0 ? (
                                                <div className="inline-flex relative">
                                                    <img
                                                        src={DELinxsService.getFileUrl(post, post.attachment[0], "100x100") || undefined}
                                                        className="w-8 h-8 rounded border border-white/10 object-cover"
                                                    />
                                                    {post.attachment.length > 1 && (
                                                        <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] px-1 rounded-full border border-white/10">
                                                            +{post.attachment.length - 1}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-white/20">None</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={publicUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                                                    title="View Public"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleToggleTakedown(post)}
                                                    disabled={isUpdating === post.id}
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-all border",
                                                        isTakedown
                                                            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20"
                                                            : "text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/20"
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
                <div className="pt-4 flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white/40">PAGE {page} OF {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all text-white/60 hover:text-white"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all text-white/60 hover:text-white"
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
    return <><MessageCircle className="w-3 h-3 text-white/40" /> {count ?? "..."}</>;
}

function StatCard({ icon: Icon, label, value, color, bg, isPercent = false }: { icon: any, label: string, value: number, color: string, bg: string, isPercent?: boolean }) {
    return (
        <div className="bg-secondary border border-white/5 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border border-white/5", bg, color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{label}</p>
                <h4 className="text-3xl font-bold text-white tracking-tighter">
                    {value.toLocaleString()}{isPercent ? "%" : ""}
                </h4>
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { Search, Edit2, Trash2, Clock, Image as ImageIcon, AlertCircle, Plus, User, Calendar, Eye, ThumbsUp, MessageSquare, TrendingUp, MessageCircle, CornerDownRight, Globe, RefreshCw } from "lucide-react";
import { BlogService, BlogCommentService, type BlogRecord, type BlogCommentRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";
import { BlogEditorOverlay } from "../components/blog/BlogEditorOverlay";

type TabType = "analytics" | "articles";

export function BlogMonitor() {
    const [activeTab, setActiveTab] = useState<TabType>("analytics");
    const [blogs, setBlogs] = useState<BlogRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Editor Overlay State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<BlogRecord | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

    const { perPage } = useAdminSettings();

    const fetchBlogs = async () => {
        setIsLoading(true);
        try {
            const filterString = search ? `title ~ "${search}" || author ~ "${search}" || category ~ "${search}"` : "";
            const result = await BlogService.getBlogs(page, perPage, "-created", filterString);
            setBlogs(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("BlogMonitor: Error fetching blogs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, [search, page, perPage]);

    const handleToggleActive = async (blog: BlogRecord) => {
        try {
            await BlogService.updateBlog(blog.id, { is_active: !blog.is_active });
            setBlogs(prev => prev.map(b => b.id === blog.id ? { ...b, is_active: !blog.is_active } : b));
        } catch (error) {
            console.error("Error toggling blog active state:", error);
        }
    };

    const handleDeleteBlog = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this blog post?")) return;
        try {
            await BlogService.deleteBlog(id);
            fetchBlogs();
        } catch (error) {
            console.error("Error deleting blog:", error);
        }
    };

    const handleOpenEditor = (blog: BlogRecord | null = null) => {
        setEditingBlog(blog);
        setIsEditorOpen(true);
    };

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            const response = await fetch("https://api.netlify.com/build_hooks/699f9c6894e938489d2e40e6", {
                method: "POST"
            });
            if (response.ok) {
                setIsDeployModalOpen(false); // Close modal on success
                // Temporarily using alert for success, can be replaced with toast later if needed.
                alert("Deploy triggered successfully! Your main website will be updated in a few minutes.");
            } else {
                throw new Error("Failed to trigger build");
            }
        } catch (error) {
            console.error("Deploy error:", error);
            alert("Error triggering build. Please check console or try again later.");
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white/90">Blog Monitor</h1>
                    <p className="text-xs font-semibold text-white/50 mt-1">Manage and track your blog post performance.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsDeployModalOpen(true)}
                        disabled={isDeploying}
                        className="flex items-center gap-2 px-5 py-2 bg-secondary/50 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                    >
                        {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-white/40" />}
                        {isDeploying ? "Deploying..." : "Publish to Live"}
                    </button>
                    {activeTab === "articles" && (
                        <button
                            onClick={() => handleOpenEditor()}
                            className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-all shadow-lg active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> New Blog
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-secondary/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all min-h-[600px]">
                <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex bg-black/40 p-1 rounded-lg w-full sm:w-auto border border-white/10">
                        <button
                            onClick={() => { setActiveTab("analytics"); }}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-all text-center",
                                activeTab === "analytics"
                                    ? "bg-white/10 shadow-sm text-white"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            Analytics & Comments
                        </button>
                        <button
                            onClick={() => { setActiveTab("articles"); setSearch(""); setPage(1); }}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-semibold transition-all text-center",
                                activeTab === "articles"
                                    ? "bg-white/10 shadow-sm text-white"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            Articles
                        </button>
                    </div>

                    {activeTab === "articles" && (
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-army-500 transition-all font-medium placeholder:text-white/20 placeholder:font-normal"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 flex-1">
                    {activeTab === "articles" && isLoading ? (
                        <div className="h-full py-32 flex flex-col items-center justify-center text-white/40">
                            <Clock className="w-10 h-10 mb-4 animate-spin opacity-50" />
                            <span className="font-semibold text-sm">Fetching blogs...</span>
                        </div>
                    ) : activeTab === "articles" && blogs.length === 0 ? (
                        <div className="h-full py-32 flex flex-col items-center justify-center text-white/40">
                            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                            <span className="font-semibold text-sm">No blog posts found.</span>
                        </div>
                    ) : activeTab === "articles" && blogs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {blogs.map(blog => (
                                <BlogCard
                                    key={blog.id}
                                    blog={blog}
                                    onEdit={() => handleOpenEditor(blog)}
                                    onDelete={() => handleDeleteBlog(blog.id)}
                                    onToggle={() => handleToggleActive(blog)}
                                />
                            ))}
                        </div>
                    ) : activeTab === "analytics" && (
                        <BlogAnalyticsTab />
                    )}
                </div>

                {/* Pagination */}
                {activeTab === "articles" && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                        <span className="text-xs text-white/40 font-semibold">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Editor Overlay */}
            {isEditorOpen && (
                <BlogEditorOverlay
                    blog={editingBlog}
                    onClose={() => setIsEditorOpen(false)}
                    onSuccess={() => { setIsEditorOpen(false); fetchBlogs(); }}
                />
            )}

            {/* Deploy Confirmation Modal */}
            {isDeployModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] rounded-2xl max-w-md w-full shadow-2xl border border-white/10 overflow-hidden text-center">
                        <div className="p-6 sm:p-8 flex flex-col items-center">
                            <h2 className="text-xl font-bold text-white mb-2">Deploy Changes to Live?</h2>
                            <p className="text-sm text-white/50 font-medium mb-8 max-w-sm">
                                This action will trigger a rebuild on Netlify. Your latest articles and edits will be published to your main website.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setIsDeployModalOpen(false)}
                                    disabled={isDeploying}
                                    className="flex-1 px-4 py-2.5 bg-white/5 text-white/70 font-semibold rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeploy}
                                    disabled={isDeploying}
                                    className="flex-1 px-4 py-2.5 bg-army-500 hover:bg-army-400 text-black font-bold rounded-xl disabled:opacity-50 transition-all shadow-lg flex justify-center items-center gap-2"
                                >
                                    {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <Globe className="w-4 h-4 text-black" />}
                                    {isDeploying ? "Deploying..." : "Yes, Publish"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BlogCard({ blog, onEdit, onDelete, onToggle }: { blog: BlogRecord, onEdit: () => void, onDelete: () => void, onToggle: () => void }) {
    const mainImage = blog.images && blog.images.length > 0 ? BlogService.getFileUrl(blog, blog.images[0], '400x400') : null;
    const blogUrl = `https://daharengineer.com/blog/${blog.page_name}`;

    return (
        <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden group shadow-sm hover:shadow-lg hover:border-white/10 transition-all duration-300 flex flex-col h-full">
            <div className="h-52 bg-white/5 flex items-center justify-center shrink-0 border-b border-white/5 relative overflow-hidden">
                {mainImage ? (
                    <img src={mainImage} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-white/10">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-[10px] font-bold tracking-widest">NO THUMBNAIL</span>
                    </div>
                )}

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold bg-black/60 text-white rounded border border-white/10 shadow-sm backdrop-blur-md">
                        {blog.category || "Uncategorized"}
                    </span>
                </div>

                <div className="absolute top-4 right-4">
                    <StatusToggle isActive={blog.is_active} onToggle={onToggle} />
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-white text-base leading-snug line-clamp-2 mb-2 group-hover:text-army-400 transition-colors">{blog.title}</h3>
                <p className="text-xs text-white/50 line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {blog.excerpt || "No summary available."}
                </p>
                <a href={blogUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-army-500 hover:text-army-400 transition-colors bg-army-500/10 hover:bg-army-500/20 px-2 py-1 rounded inline-flex w-fit mb-4 truncate max-w-full">
                    <Globe className="w-3 h-3 mr-1.5 shrink-0" />
                    <span className="truncate">{blogUrl}</span>
                </a>

                <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-white/5">
                    <div className="flex items-center text-[10px] font-medium text-white/40">
                        <User className="w-3.5 h-3.5 mr-1.5 opacity-60 text-white" />
                        <span className="truncate">{blog.author || "Dahar Engineer"}</span>
                    </div>
                    <div className="flex items-center text-[10px] font-medium text-white/40 justify-end">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-60 text-white" />
                        {blog.published_date ? new Date(blog.published_date).toLocaleDateString() : "Draft"}
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <button
                        onClick={onEdit}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex items-center justify-center px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold rounded-lg transition-all active:scale-95"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusToggle({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-all shadow-inner border",
                isActive ? "bg-army-500 border-army-400" : "bg-black/60 border-white/10"
            )}
        >
            <span
                className={cn(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all shadow-md",
                    isActive ? "translate-x-4.5 bg-black" : "translate-x-1 bg-white/50"
                )}
                style={{ transform: isActive ? 'translateX(0px)' : '-translateX(9px)' }}
            />
        </button>
    );
}

function BlogAnalyticsTab() {
    const [stats, setStats] = useState({ views: 0, likes: 0, comments: 0 });
    const [topBlogs, setTopBlogs] = useState<BlogRecord[]>([]);
    const [recentComments, setRecentComments] = useState<BlogCommentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAnalytics = async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            // Fetch all blogs to aggregate views and likes, and find top blogs
            const blogsResult = await BlogService.getBlogs(1, 100, "-view_count,-like_count");
            const blogs = blogsResult.items;

            let totalViews = 0;
            let totalLikes = 0;
            blogs.forEach(b => {
                totalViews += b.view_count || 0;
                totalLikes += b.like_count || 0;
            });

            // Fetch recent comments
            const commentsResult = await BlogCommentService.getComments(1, 20, "-created");
            const comments = commentsResult.items;

            setStats({
                views: totalViews,
                likes: totalLikes,
                comments: commentsResult.totalItems,
            });

            // Get top 5 blogs by views/likes
            setTopBlogs(blogs.slice(0, 5));
            setRecentComments(comments);

        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics(true);
    }, []);

    const handleDeleteComment = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await BlogCommentService.deleteComment(id);
            fetchAnalytics(); // Refresh
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full py-32 flex flex-col items-center justify-center text-white/40">
                <Clock className="w-10 h-10 mb-4 animate-spin opacity-50" />
                <span className="font-semibold text-sm">Loading analytics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Analytics & Comments Overview</h2>
                </div>
                <button
                    onClick={() => fetchAnalytics(false)}
                    disabled={isLoading || isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", (isLoading || isRefreshing) && "animate-spin")} />
                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>
            </div>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Eye} label="Total Page Views" value={stats.views} color="text-white" bg="bg-white/5" />
                <StatCard icon={ThumbsUp} label="Total Likes" value={stats.likes} color="text-white" bg="bg-white/5" />
                <StatCard icon={MessageSquare} label="Total Comments" value={stats.comments} color="text-white" bg="bg-white/5" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Top Articles */}
                <div className="bg-black/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2 bg-black/40">
                        <TrendingUp className="w-4 h-4 text-white/50" />
                        <h3 className="font-bold text-white text-sm">Top Performing Articles</h3>
                    </div>
                    <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                        {topBlogs.length === 0 ? (
                            <div className="p-8 text-center text-sm text-white/40 font-medium">No article data available.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {topBlogs.map((blog, idx) => (
                                    <div key={blog.id} className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-semibold text-white/50 shrink-0">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-white truncate">{blog.title}</h4>
                                            <p className="text-[10px] uppercase font-semibold tracking-widest text-white/40 truncate mt-1">{blog.category || "Uncategorized"}</p>
                                        </div>
                                        <div className="flex gap-4 shrink-0 px-2">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center text-xs font-semibold text-white/80">
                                                    <Eye className="w-3.5 h-3.5 mr-1 text-white/40" /> {blog.view_count || 0}
                                                </div>
                                                <div className="flex items-center text-[10px] font-semibold text-white/40 mt-0.5">
                                                    <ThumbsUp className="w-3.5 h-3.5 mr-1" /> {blog.like_count || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Comments */}
                <div className="bg-black/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2 bg-black/40">
                        <MessageCircle className="w-4 h-4 text-white/50" />
                        <h3 className="font-bold text-white text-sm">Recent Comments</h3>
                    </div>
                    <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                        {recentComments.length === 0 ? (
                            <div className="p-8 text-center text-sm text-white/40 font-medium">No comments found.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {recentComments.map(comment => (
                                    <div key={comment.id} className="p-5 hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3">
                                                {comment.parent && (
                                                    <div className="mt-1 flex items-center text-white/30" title="This is a reply to another comment">
                                                        <CornerDownRight className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-bold text-sm text-white">
                                                        {comment.expand?.user_id?.name || "Unknown User"}
                                                    </span>
                                                    <span className="text-[10px] text-white/40 ml-2 font-medium">
                                                        {new Date(comment.created).toLocaleString()}
                                                    </span>
                                                    <div className="text-xs text-white/50 mt-0.5 max-w-sm truncate" title={comment.expand?.blog_id?.title}>
                                                        on: <span className="font-semibold text-white/70">{comment.expand?.blog_id?.title || "Unknown Blog"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/20 rounded transition-colors"
                                                title="Delete comment"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className={cn(
                                            "mt-3 text-sm text-white/80 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed",
                                            comment.parent ? "ml-7" : ""
                                        )}>
                                            {comment.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any, label: string, value: number, color: string, bg: string }) {
    return (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-6 shadow-sm flex items-center gap-5 hover:border-white/10 transition-colors">
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center border border-white/5", bg, color)}>
                <Icon className="w-5 h-5 opacity-80" />
            </div>
            <div>
                <p className="text-xs font-semibold text-white/50 mb-1">{label}</p>
                <h4 className="text-3xl font-bold text-white tracking-tight">{value.toLocaleString()}</h4>
            </div>
        </div>
    );
}

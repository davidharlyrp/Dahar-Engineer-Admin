import { useEffect, useState } from "react";
import { Search, Edit2, Trash2, Clock, Image as ImageIcon, AlertCircle, Plus, User, Calendar, Eye, ThumbsUp, MessageSquare, TrendingUp, MessageCircle, CornerDownRight, Globe, RefreshCw } from "lucide-react";
import { BlogService, BlogCommentService, type BlogRecord, type BlogCommentRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";
import { BlogEditorOverlay } from "../components/blog/BlogEditorOverlay";

type TabType = "articles" | "analytics";

export function BlogMonitor() {
    const [activeTab, setActiveTab] = useState<TabType>("articles");
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-outfit">Blog Monitor</h1>
                    <p className="text-xs text-slate-500 font-medium">Manage and monitor website articles</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsDeployModalOpen(true)}
                        disabled={isDeploying}
                        className="flex items-center gap-2 px-5 py-2 bg-slate-600 dark:bg-slate-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                    >
                        {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {isDeploying ? "Deploying..." : "Publish to Live"}
                    </button>
                    {activeTab === "articles" && (
                        <button
                            onClick={() => handleOpenEditor()}
                            className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> New Blog
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all min-h-[600px]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => { setActiveTab("articles"); setSearch(""); setPage(1); }}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center",
                                activeTab === "articles"
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Articles
                        </button>
                        <button
                            onClick={() => { setActiveTab("analytics"); }}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center",
                                activeTab === "analytics"
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Analytics & Comments
                        </button>
                    </div>

                    {activeTab === "articles" && (
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 flex-1">
                    {activeTab === "articles" && isLoading ? (
                        <div className="h-full py-32 flex flex-col items-center justify-center text-slate-500">
                            <Clock className="w-10 h-10 mb-4 animate-spin opacity-20" />
                            <span className="font-medium">Fetching blogs...</span>
                        </div>
                    ) : activeTab === "articles" && blogs.length === 0 ? (
                        <div className="h-full py-32 flex flex-col items-center justify-center text-slate-500">
                            <AlertCircle className="w-12 h-12 mb-4 opacity-10" />
                            <span className="font-medium">No blog posts found.</span>
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
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center">
                        <div className="p-6 sm:p-8 flex flex-col items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Deploy Changes to Live?</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
                                This action will trigger a rebuild on Netlify. Your latest articles and edits will be published to your main website.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setIsDeployModalOpen(false)}
                                    disabled={isDeploying}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeploy}
                                    disabled={isDeploying}
                                    className="flex-1 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md flex justify-center items-center gap-2"
                                >
                                    {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 flex flex-col h-full">
            <div className="h-52 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border-b border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                {mainImage ? (
                    <img src={mainImage} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-[10px] font-bold">NO THUMBNAIL</span>
                    </div>
                )}

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-900/80 text-white rounded shadow-sm backdrop-blur-md">
                        {blog.category || "Uncategorized"}
                    </span>
                </div>

                <div className="absolute bottom-4 right-4">
                    <StatusToggle isActive={blog.is_active} onToggle={onToggle} />
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2 mb-2 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">{blog.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {blog.excerpt || "No summary available."}
                </p>
                <a href={blogUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                    {blogUrl}
                </a>

                <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t border-slate-50 dark:border-slate-700">
                    <div className="flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <User className="w-3 h-3 mr-1.5 opacity-60" />
                        <span className="truncate">{blog.author || "Dahar Engineer"}</span>
                    </div>
                    <div className="flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400 justify-end">
                        <Calendar className="w-3 h-3 mr-1.5 opacity-60" />
                        {blog.published_date ? new Date(blog.published_date).toLocaleDateString() : "Draft"}
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <button
                        onClick={onEdit}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-semibold rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                    >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex items-center justify-center px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-semibold rounded transition-all active:scale-95"
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
                "relative inline-flex h-6 w-12 items-center rounded-full transition-all shadow-inner",
                isActive ? "bg-slate-500" : "bg-slate-300 dark:bg-slate-600"
            )}
        >
            <span
                className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-md",
                    isActive ? "translate-x-7" : "translate-x-1"
                )}
            />
        </button>
    );
}

function BlogAnalyticsTab() {
    const [stats, setStats] = useState({ views: 0, likes: 0, comments: 0 });
    const [topBlogs, setTopBlogs] = useState<BlogRecord[]>([]);
    const [recentComments, setRecentComments] = useState<BlogCommentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAnalytics = async () => {
        setIsLoading(true);
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

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
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
            <div className="h-full py-32 flex flex-col items-center justify-center text-slate-500">
                <Clock className="w-10 h-10 mb-4 animate-spin opacity-20" />
                <span className="font-medium">Loading analytics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Eye} label="Total Page Views" value={stats.views} color="text-slate-600 dark:text-slate-400" bg="bg-slate-50 dark:bg-slate-500/10" />
                <StatCard icon={ThumbsUp} label="Total Likes" value={stats.likes} color="text-slate-600 dark:text-slate-400" bg="bg-slate-50 dark:bg-slate-500/10" />
                <StatCard icon={MessageSquare} label="Total Comments" value={stats.comments} color="text-slate-600 dark:text-slate-400" bg="bg-slate-50 dark:bg-slate-500/10" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Top Articles */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Top Performing Articles</h3>
                    </div>
                    <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                        {topBlogs.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500">No article data available.</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {topBlogs.map((blog, idx) => (
                                    <div key={blog.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{blog.title}</h4>
                                            <p className="text-xs text-slate-500 truncate">{blog.category || "Uncategorized"}</p>
                                        </div>
                                        <div className="flex gap-4 shrink-0 px-2">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> {blog.view_count || 0}
                                                </div>
                                                <div className="flex items-center text-[10px] text-slate-500">
                                                    <ThumbsUp className="w-3 h-3 mr-1" /> {blog.like_count || 0}
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
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                        <MessageCircle className="w-4 h-4 text-slate-500" />
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Comments</h3>
                    </div>
                    <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                        {recentComments.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500">No comments found.</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {recentComments.map(comment => (
                                    <div key={comment.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3">
                                                {comment.parent && (
                                                    <div className="mt-1 flex items-center text-slate-400" title="This is a reply to another comment">
                                                        <CornerDownRight className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                                        {comment.expand?.user_id?.name || "Unknown User"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-2">
                                                        {new Date(comment.created).toLocaleString()}
                                                    </span>
                                                    <div className="text-xs text-slate-500 mt-0.5 max-w-sm truncate" title={comment.expand?.blog_id?.title}>
                                                        on: <span className="font-medium text-slate-600 dark:text-slate-400">{comment.expand?.blog_id?.title || "Unknown Blog"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                                title="Delete comment"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className={cn(
                                            "mt-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800",
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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", bg, color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                <h4 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value.toLocaleString()}</h4>
            </div>
        </div>
    );
}

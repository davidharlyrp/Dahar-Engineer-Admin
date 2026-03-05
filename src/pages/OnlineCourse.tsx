import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Clock, AlertCircle, LayoutGrid, Layers, ShieldCheck, BarChart3, Edit2, Trash2, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { OnlineCourseService, type OnlineCourseRecord, type OnlineCourseAccessRecord, type OnlineCourseProgressRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";

type TabType = "courses" | "access" | "progress" | "certificates";

export function OnlineCourse() {
    const [activeTab, setActiveTab] = useState<TabType>("courses");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [courses, setCourses] = useState<OnlineCourseRecord[]>([]);
    const [accessRecords, setAccessRecords] = useState<OnlineCourseAccessRecord[]>([]);
    const [progressRecords, setProgressRecords] = useState<OnlineCourseProgressRecord[]>([]);

    const { perPage } = useAdminSettings();
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const filterString = search ? `title ~ "${search}" || course_name ~ "${search}"` : "";

            if (activeTab === "courses") {
                const result = await OnlineCourseService.getOnlineCourses(page, perPage, "-created", filterString);
                setCourses(result.items);
                setTotalPages(result.totalPages);
            } else if (activeTab === "access") {
                // Filter for PAID or SETTLED status only
                const accessFilter = filterString
                    ? `(${filterString}) && (payment_status = "paid" || payment_status = "settled")`
                    : `payment_status = "paid" || payment_status = "settled"`;

                const result = await OnlineCourseService.getAccessRecords(page, perPage, "-created", accessFilter);
                setAccessRecords(result.items);
                setTotalPages(result.totalPages);
            } else if (activeTab === "progress") {
                const result = await OnlineCourseService.getProgressRecords(page, perPage, "-created", filterString);
                setProgressRecords(result.items);
                setTotalPages(result.totalPages);
            } else if (activeTab === "certificates") {
                const certFilter = filterString
                    ? `(${filterString}) && certificateId != ""`
                    : `certificateId != ""`;
                const result = await OnlineCourseService.getProgressRecords(page, perPage, "-created", certFilter);
                setProgressRecords(result.items); // Reusing progressRecords state for certificates
                setTotalPages(result.totalPages);
            }
        } catch (error) {
            console.error("OnlineCourse: Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        try {
            const newCourse = await OnlineCourseService.createOnlineCourse({
                title: "New Course",
                slug: `new-course-${Date.now()}`,
                isActive: false,
                isNew: true,
                level: "beginner",
                price: 0,
                duration: "0 hours",
                totalModules: 0,
                totalSteps: 0
            });
            navigate(`/online-course/edit/${newCourse.id}`);
        } catch (error) {
            console.error("Error creating course:", error);
            alert("Failed to create course");
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, search, page, perPage]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearch("");
        setPage(1);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Online Course</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCreateCourse}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Course
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden flex flex-col transition-colors min-h-[500px]">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-md w-full sm:w-auto">
                        <TabButton
                            active={activeTab === "courses"}
                            onClick={() => handleTabChange("courses")}
                            icon={LayoutGrid}
                            label="Courses"
                        />
                        <TabButton
                            active={activeTab === "access"}
                            onClick={() => handleTabChange("access")}
                            icon={ShieldCheck}
                            label="Access"
                        />
                        <TabButton
                            active={activeTab === "progress"}
                            onClick={() => handleTabChange("progress")}
                            icon={BarChart3}
                            label="Progress"
                        />
                        <TabButton
                            active={activeTab === "certificates"}
                            onClick={() => handleTabChange("certificates")}
                            icon={Award}
                            label="Certificates"
                        />
                    </div>

                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                        />
                    </div>
                </div>

                <div className="p-4 flex-1">
                    {loading ? (
                        <div className="h-full py-20 flex flex-col items-center justify-center text-slate-500">
                            <Clock className="w-6 h-6 mb-2 animate-spin opacity-20" />
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === "courses" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {courses.length > 0 ? (
                                        courses.map(course => (
                                            <CourseCard key={course.id} course={course} onUpdate={fetchData} />
                                        ))
                                    ) : (
                                        <EmptyState label="No courses found." />
                                    )}
                                </div>
                            )}

                            {activeTab === "access" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">User</th>
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Course</th>
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {accessRecords.length > 0 ? (
                                                accessRecords.map(record => (
                                                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                                            {record.expand?.user_id?.name || "Unknown User"}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-medium">
                                                            {record.course_name}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: record.payment_currency || 'IDR' }).format(record.payment_amount || 0)}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className={cn(
                                                                "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                                                                record.payment_status?.toLowerCase() === "paid" || record.payment_status?.toLowerCase() === "settled"
                                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                                            )}>
                                                                {record.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-500 dark:text-slate-500 whitespace-nowrap">
                                                            {new Date(record.created).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-center text-slate-500 opacity-50">No access records found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === "certificates" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse font-medium">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Student</th>
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Course</th>
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Completed At</th>
                                                <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">Certificate No.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-600 dark:text-slate-400">
                                            {progressRecords.length > 0 ? (
                                                progressRecords.map(record => (
                                                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-3 py-2">{record.expand?.userId?.name || "Unknown"}</td>
                                                        <td className="px-3 py-2">{record.expand?.courseId?.title || "Unknown Course"}</td>
                                                        <td className="px-3 py-2">{record.completedAt ? new Date(record.completedAt).toLocaleDateString() : "-"}</td>
                                                        <td className="px-3 py-2">
                                                            <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                                                {record.certificateId}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center text-slate-500 opacity-50">No certificates found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === "progress" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {progressRecords.length > 0 ? (
                                        progressRecords.map(progress => (
                                            <ProgressCard key={progress.id} progress={progress} />
                                        ))
                                    ) : (
                                        <EmptyState label="No progress records found." />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-30 transition-all font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-semibold text-slate-500">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-30 transition-all font-medium"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                active
                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
}

function CourseCard({ course, onUpdate }: { course: OnlineCourseRecord, onUpdate: () => void }) {
    const navigate = useNavigate();
    const [updating, setUpdating] = useState(false);

    const toggleStatus = async (field: 'isActive' | 'isNew') => {
        if (updating) return;
        setUpdating(true);
        try {
            await OnlineCourseService.updateOnlineCourse(course.id, {
                [field]: !course[field]
            });
            onUpdate();
        } catch (error) {
            console.error(`Error toggling ${field}:`, error);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this course? This will NOT delete modules and steps automatically from this view. It is recommended to delete modules from the editor.")) return;
        try {
            await OnlineCourseService.deleteOnlineCourse(course.id);
            onUpdate();
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm group">
            <div className="h-32 bg-slate-100 dark:bg-slate-900/50 relative overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-700/50">
                {course.thumbnail ? (
                    <img src={OnlineCourseService.getFileUrl(course, course.thumbnail, '400x400')} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                        <LayoutGrid className="w-8 h-8" />
                    </div>
                )}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20">
                    <span className="px-1.5 py-1 text-[10px] font-medium bg-white/90 backdrop-blur-sm text-slate-800 rounded-md shadow-sm">
                        {course.level}
                    </span>
                    <ToggleSwitch
                        label="New"
                        active={course.isNew}
                        onClick={() => toggleStatus('isNew')}
                        disabled={updating}
                        activeColor="bg-slate-900"
                    />
                    <ToggleSwitch
                        label="Active"
                        active={course.isActive}
                        onClick={() => toggleStatus('isActive')}
                        disabled={updating}
                        activeColor="bg-emerald-500"
                    />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button
                        onClick={() => navigate(`/online-course/edit/${course.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-md text-[10px] font-semibold hover:scale-105 transition-transform"
                    >
                        <Edit2 className="w-3 h-3" /> Edit Content
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 bg-red-500 text-white rounded-md hover:scale-105 transition-transform"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1 leading-tight">{course.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description || "No description provided."}
                    </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center text-[10px] text-slate-500 font-medium">
                            <Clock className="w-3 h-3 mr-1 opacity-60" />
                            {course.duration}
                        </div>
                        <div className="flex items-center text-[10px] text-slate-500 font-medium">
                            <Layers className="w-3 h-3 mr-1 opacity-60" />
                            {course.totalModules} Modules
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        {course.discountPrice > 0 && course.discountPrice < course.price && (
                            <span className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(course.price || 0)}
                            </span>
                        )}
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                                (course.discountPrice > 0 && course.discountPrice < course.price) ? course.discountPrice : (course.price || 0)
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProgressCard({ progress }: { progress: OnlineCourseProgressRecord }) {
    const totalSteps = progress.expand?.courseId?.totalSteps || 100;
    const completedSteps = progress.completedSteps?.length || 0;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                            {progress.expand?.userId?.name || "Student"}
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {progress.expand?.courseId?.title || "Course"}
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    {percentage}%
                </span>
            </div>

            <div className="space-y-2">
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-slate-900 dark:bg-slate-100 h-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{completedSteps} / {totalSteps} steps</span>
                    <span>{progress.completedModules?.length || 0} modules done</span>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
            <AlertCircle className="w-6 h-6 mb-2 opacity-20" />
            <span className="text-sm">{label}</span>
        </div>
    );
}

function ToggleSwitch({ label, active, onClick, disabled, activeColor = "bg-emerald-500" }: { label: string, active: boolean, onClick: () => void, disabled?: boolean, activeColor?: string }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-1.5 px-1.5 py-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm hover:bg-white transition-all group"
        >
            <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900 leading-none">{label}</span>
            <div className={cn(
                "w-5 h-2.5 rounded-full relative transition-colors duration-200 shrink-0",
                active ? activeColor : "bg-slate-200"
            )}>
                <div className={cn(
                    "absolute top-0.5 w-1.5 h-1.5 bg-white rounded-full transition-all duration-200",
                    active ? "left-[12px]" : "left-0.5"
                )} />
            </div>
        </button>
    );
}

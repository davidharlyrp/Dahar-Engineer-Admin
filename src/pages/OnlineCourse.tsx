import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Clock, AlertCircle, LayoutGrid, Layers, ShieldCheck, BarChart3, Edit2, Trash2, ChevronLeft, ChevronRight, Award, Filter } from "lucide-react";
import { OnlineCourseService, type OnlineCourseRecord, type OnlineCourseAccessRecord, type OnlineCourseProgressRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";
import { GiveAccessModal } from "../components/course/GiveAccessModal";

type TabType = "courses" | "access" | "progress" | "certificates";

export function OnlineCourse() {
    const [activeTab, setActiveTab] = useState<TabType>("courses");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isGiveAccessModalOpen, setIsGiveAccessModalOpen] = useState(false);

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
                setProgressRecords(result.items);
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
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        Online Courses
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Manage your curriculum, enrollment, and student outcomes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === "access" && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsGiveAccessModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-army-500/10 border border-army-500/20 text-army-400 rounded-xl text-xs font-semibold hover:bg-army-500/20 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Grant Access
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateCourse}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
                    >
                        <Plus className="w-4 h-4" /> New Course
                    </motion.button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-secondary border border-white/5 rounded-2xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex bg-black p-1 rounded-xl w-full lg:w-auto">
                        <TabButton
                            active={activeTab === "courses"}
                            onClick={() => handleTabChange("courses")}
                            icon={LayoutGrid}
                            label="Catalog"
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
                            label="Outcome"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search course..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs bg-black border border-white/10 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500/50 transition-all font-medium placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <button className="p-2 bg-black border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full py-32 flex flex-col items-center justify-center text-muted-foreground"
                            >
                                <div className="relative h-12 w-12 mb-4">
                                    <div className="absolute inset-0 rounded-full border-2 border-white/5" />
                                    <div className="absolute inset-0 rounded-full border-2 border-army-500 border-t-transparent animate-spin" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === "courses" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {courses.length > 0 ? (
                                            courses.map(course => (
                                                <CourseCard key={course.id} course={course} onUpdate={fetchData} />
                                            ))
                                        ) : (
                                            <EmptyState label="No courses available in this segment." />
                                        )}
                                    </div>
                                )}

                                {activeTab === "access" && (
                                    <div className="overflow-x-auto scrollbar-hide">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest">Student Entity</th>
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest">Module Access</th>
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest">Valuation</th>
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest">Protocol</th>
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-right">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {accessRecords.length > 0 ? (
                                                    accessRecords.map(record => (
                                                        <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded bg-army-500/10 border border-army-500/20 flex items-center justify-center text-army-400 font-bold">
                                                                        {record.expand?.user_id?.name?.charAt(0) || "U"}
                                                                    </div>
                                                                    <span className="text-white font-semibold">{record.expand?.user_id?.name || "Anonymous"}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-muted-foreground font-medium">
                                                                {record.course_name}
                                                            </td>
                                                            <td className="px-4 py-4 text-white font-mono">
                                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: record.payment_currency || 'IDR' }).format(record.payment_amount || 0)}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className={cn(
                                                                    "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest",
                                                                    record.payment_status?.toLowerCase() === "paid" || record.payment_status?.toLowerCase() === "settled"
                                                                        ? "bg-army-500/10 text-army-400 border border-army-500/20"
                                                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                )}>
                                                                    {record.payment_status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-muted-foreground text-right font-medium">
                                                                {new Date(record.created).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-32 text-center text-muted-foreground opacity-30 italic">No historical access data found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === "certificates" && (
                                    <div className="overflow-x-auto scrollbar-hide">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest">Achiever</th>
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest">Credential Name</th>
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest">Issue Date</th>
                                                    <th className="px-4 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-right">Verification ID</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-muted-foreground">
                                                {progressRecords.length > 0 ? (
                                                    progressRecords.map(record => (
                                                        <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group text-white">
                                                            <td className="px-4 py-4 font-semibold">{record.expand?.userId?.name || "Achiever"}</td>
                                                            <td className="px-4 py-4 text-muted-foreground font-medium">{record.expand?.courseId?.title || "Course Name"}</td>
                                                            <td className="px-4 py-4 text-muted-foreground font-medium">{record.completedAt ? new Date(record.completedAt).toLocaleDateString() : "-"}</td>
                                                            <td className="px-4 py-4 text-right">
                                                                <span className="bg-army-500/10 border border-army-500/20 text-army-400 px-2 py-1 rounded font-mono text-[10px]">
                                                                    {record.certificateId}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-32 text-center text-muted-foreground opacity-30 italic">No credentials issued in this cycle.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === "progress" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {progressRecords.length > 0 ? (
                                            progressRecords.map(progress => (
                                                <ProgressCard key={progress.id} progress={progress} />
                                            ))
                                        ) : (
                                            <EmptyState label="No progress telemetry found." />
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-center gap-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 text-muted-foreground hover:text-white disabled:opacity-20 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Record {page} / {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 text-muted-foreground hover:text-white disabled:opacity-20 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </motion.div>

            <GiveAccessModal
                isOpen={isGiveAccessModalOpen}
                onClose={() => setIsGiveAccessModalOpen(false)}
                onSuccess={() => fetchData()}
            />
        </motion.div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-tight transition-all relative overflow-hidden group",
                active
                    ? "text-white"
                    : "text-muted-foreground hover:text-white"
            )}
        >
            {active && (
                <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <Icon className={cn("w-3.5 h-3.5 relative z-10", active ? "text-army-400" : "text-muted-foreground group-hover:text-white")} />
            <span className="relative z-10">{label}</span>
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
        if (!window.confirm("Permanent erasure protocol initiated. Proceed?")) return;
        try {
            await OnlineCourseService.deleteOnlineCourse(course.id);
            onUpdate();
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-secondary/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-army-500/30 shadow-xl"
        >
            <div className="h-40 bg-black relative overflow-hidden shrink-0">
                {course.thumbnail ? (
                    <img
                        src={OnlineCourseService.getFileUrl(course, course.thumbnail, '400x400')}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 group-hover:text-army-500/30 transition-colors">
                        <LayoutGrid className="w-12 h-12" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
                    <span className="px-2 py-1 text-[9px] font-semibold uppercase tracking-widest bg-black/80 backdrop-blur-md text-white border border-white/10 rounded-lg shadow-2xl">
                        {course.level}
                    </span>
                </div>

                <div className="absolute top-3 right-3 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ToggleSwitch
                        label="NEW"
                        active={course.isNew}
                        onClick={() => toggleStatus('isNew')}
                        disabled={updating}
                        activeColor="bg-army-500"
                    />
                    <ToggleSwitch
                        label="ACT"
                        active={course.isActive}
                        onClick={() => toggleStatus('isActive')}
                        disabled={updating}
                        activeColor="bg-emerald-500"
                    />
                </div>

                <div className="absolute inset-0 bg-army-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/online-course/edit/${course.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl text-[10px] font-bold hover:bg-army-400 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" /> Edit
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDelete}
                        className="p-2.5 bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-2 tracking-tight transition-colors group-hover:text-army-400">{course.title}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {course.description || "Segment documentation unavailable for this curriculum."}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            <Clock className="w-3 h-3 mr-1.5 text-army-500" />
                            {course.duration}
                        </div>
                        <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            <Layers className="w-3 h-3 mr-1.5 text-army-500" />
                            {course.totalModules} MODULES
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-white italic tracking-tighter">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                                (course.discountPrice > 0 && course.discountPrice < course.price) ? course.discountPrice : (course.price || 0)
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ProgressCard({ progress }: { progress: OnlineCourseProgressRecord }) {
    const totalSteps = progress.expand?.courseId?.totalSteps || 100;
    const completedSteps = progress.completedSteps?.length || 0;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-secondary/50 border border-white/5 rounded-2xl p-5 hover:border-army-500/30 transition-all shadow-xl space-y-5"
        >
            <div className="flex items-start justify-between">
                <div className="flex gap-4 items-center min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-army-500/10 border border-army-500/20 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5 text-army-400" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate tracking-tight">
                            {progress.expand?.userId?.name || "Anonymous User"}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate font-bold tracking-relaxed mt-1">
                            {progress.expand?.courseId?.title || "Course Repository"}
                        </p>
                    </div>
                </div>
                <div className="text-[10px] font-black text-white bg-army-500/20 border border-army-500/20 px-2 py-1 rounded-lg italic">
                    {percentage}%
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-army-500 h-full shadow-[0_0_15px_rgba(74,103,65,0.5)]"
                    />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-army-500" />
                        {completedSteps} / {totalSteps} COMPLETE
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="col-span-full py-32 flex flex-col items-center justify-center text-muted-foreground/30">
            <AlertCircle className="w-12 h-12 mb-6 opacity-10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] italic">{label}</span>
        </div>
    );
}

function ToggleSwitch({ label, active, onClick, disabled, activeColor = "bg-emerald-500" }: { label: string, active: boolean, onClick: () => void, disabled?: boolean, activeColor?: string }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2 px-2 py-1.5 bg-black/90 backdrop-blur-md rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group w-fit"
        >
            <span className="text-[8px] font-semibold text-white group-hover:text-white leading-none tracking-widest">{label}</span>
            <div className={cn(
                "w-6 h-3 rounded-full relative transition-colors duration-300 shrink-0",
                active ? activeColor : "bg-white/10"
            )}>
                <motion.div
                    animate={{ left: active ? 14 : 2 }}
                    className="absolute top-0.5 w-2 h-2 bg-white rounded-full shadow-lg"
                />
            </div>
        </button>
    );
}

import { useEffect, useState, useRef } from "react";
import { Search, Edit2, Trash2, Clock, Image as ImageIcon, Briefcase, Mail, AlertCircle, Tag, Plus, Upload, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { CourseMonitorService, MentorService, type CourseListRecord, type MentorRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type TabType = "course" | "mentor";

export function CourseMonitor() {
    const [activeTab, setActiveTab] = useState<TabType>("course");
    const [search, setSearch] = useState("");

    const [courses, setCourses] = useState<CourseListRecord[]>([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState(true);
    const [coursePage, setCoursePage] = useState(1);
    const [courseTotalPages, setCourseTotalPages] = useState(1);

    const [mentors, setMentors] = useState<MentorRecord[]>([]);
    const [isMentorsLoading, setIsMentorsLoading] = useState(true);
    const [mentorPage, setMentorPage] = useState(1);
    const [mentorTotalPages, setMentorTotalPages] = useState(1);

    // Modal states
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseListRecord | null>(null);
    const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
    const [editingMentor, setEditingMentor] = useState<MentorRecord | null>(null);

    const [allCourses, setAllCourses] = useState<CourseListRecord[]>([]);

    const { perPage } = useAdminSettings();

    const fetchCourses = async () => {
        setIsCoursesLoading(true);
        try {
            const filterString = search ? `title ~ "${search}"` : "";
            const result = await CourseMonitorService.getCourses(coursePage, perPage, "-created", filterString);
            setCourses(result.items);
            setCourseTotalPages(result.totalPages);
        } catch (error) {
            console.error("CourseMonitor: Error fetching courses:", error);
        } finally {
            setIsCoursesLoading(false);
        }
    };

    const fetchMentors = async () => {
        setIsMentorsLoading(true);
        try {
            const filterString = search ? `name ~ "${search}"` : "";
            const result = await MentorService.getMentors(mentorPage, perPage, "-created", filterString);
            setMentors(result.items);
            setMentorTotalPages(result.totalPages);
        } catch (error) {
            console.error("CourseMonitor: Error fetching mentors:", error);
        } finally {
            setIsMentorsLoading(false);
        }
    };

    const fetchAllCourses = async () => {
        try {
            const result = await CourseMonitorService.getCourses(1, 100, "title");
            setAllCourses(result.items);
        } catch (error) {
            console.error("Error fetching all courses:", error);
        }
    };

    useEffect(() => {
        fetchAllCourses();
    }, []);

    useEffect(() => {
        if (activeTab === "course") {
            fetchCourses();
        } else {
            fetchMentors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, search, coursePage, mentorPage, perPage]);

    const handleToggleCourseActive = async (course: CourseListRecord) => {
        try {
            await CourseMonitorService.updateCourse(course.id, { isActive: !course.isActive });
            setCourses(prev => prev.map(c => c.id === course.id ? { ...c, isActive: !course.isActive } : c));
        } catch (error) {
            console.error("Error toggling course active state:", error);
        }
    };

    const handleToggleMentorActive = async (mentor: MentorRecord) => {
        try {
            await MentorService.updateMentor(mentor.id, { isActive: !mentor.isActive });
            setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, isActive: !mentor.isActive } : m));
        } catch (error) {
            console.error("Error toggling mentor active state:", error);
        }
    };

    const deleteCourse = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this course?")) return;
        try {
            await CourseMonitorService.deleteCourse(id);
            fetchCourses();
            fetchAllCourses(); // Update list for mentor tags
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    };

    const deleteMentor = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this mentor?")) return;
        try {
            await MentorService.deleteMentor(id);
            fetchMentors();
        } catch (error) {
            console.error("Error deleting mentor:", error);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white tracking-tight">Course Monitor</h1>
                <button
                    onClick={() => {
                        if (activeTab === "course") {
                            setEditingCourse(null);
                            setIsCourseModalOpen(true);
                        } else {
                            setEditingMentor(null);
                            setIsMentorModalOpen(true);
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-xs tracking-widest uppercase font-semibold hover:bg-white/90 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" /> Add {activeTab === "course" ? "Course" : "Mentor"}
                </button>
            </div>

            <div className="bg-secondary border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors min-h-[500px]">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex bg-black/40 p-1.5 rounded-xl w-full sm:w-auto border border-white/5">
                        <button
                            onClick={() => { setActiveTab("course"); setSearch(""); setCoursePage(1); }}
                            className={cn(
                                "flex-1 sm:flex-none px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all text-center",
                                activeTab === "course"
                                    ? "bg-white/10 text-white"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            Courses
                        </button>
                        <button
                            onClick={() => { setActiveTab("mentor"); setSearch(""); setMentorPage(1); }}
                            className={cn(
                                "flex-1 sm:flex-none px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all text-center",
                                activeTab === "mentor"
                                    ? "bg-white/10 text-white"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            Mentors
                        </button>
                    </div>

                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder={"Search " + (activeTab === "course" ? "courses" : "mentors") + "..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 text-sm bg-black/40 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium placeholder:text-white/20"
                        />
                    </div>
                </div>

                <div className="p-6 flex-1 bg-black/20">
                    {activeTab === "course" && isCoursesLoading && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-white/40">
                            <Clock className="w-8 h-8 mb-4 animate-spin opacity-50" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Loading courses...</span>
                        </div>
                    )}
                    {activeTab === "course" && !isCoursesLoading && courses.length === 0 && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-white/40">
                            <AlertCircle className="w-8 h-8 mb-4 opacity-50" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">No courses found.</span>
                        </div>
                    )}
                    {activeTab === "course" && !isCoursesLoading && courses.length > 0 && (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AnimatePresence mode="popLayout">
                                {courses.map((course, i) => (
                                    <motion.div
                                        key={course.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4, ease: "circOut", delay: i * 0.05 }}
                                    >
                                        <CourseCard
                                            course={course}
                                            onEdit={() => { setEditingCourse(course); setIsCourseModalOpen(true); }}
                                            onDelete={() => deleteCourse(course.id)}
                                            onToggle={() => handleToggleCourseActive(course)}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === "mentor" && isMentorsLoading && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-white/40">
                            <Clock className="w-8 h-8 mb-4 animate-spin opacity-50" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Loading mentors...</span>
                        </div>
                    )}
                    {activeTab === "mentor" && !isMentorsLoading && mentors.length === 0 && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-white/40">
                            <AlertCircle className="w-8 h-8 mb-4 opacity-50" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">No mentors found.</span>
                        </div>
                    )}
                    {activeTab === "mentor" && !isMentorsLoading && mentors.length > 0 && (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AnimatePresence mode="popLayout">
                                {mentors.map((mentor, i) => (
                                    <motion.div
                                        key={mentor.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4, ease: "circOut", delay: i * 0.05 }}
                                    >
                                        <MentorCard
                                            mentor={mentor}
                                            onEdit={() => { setEditingMentor(mentor); setIsMentorModalOpen(true); }}
                                            onDelete={() => deleteMentor(mentor.id)}
                                            onToggle={() => handleToggleMentorActive(mentor)}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>

                <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                    {activeTab === "course" && courseTotalPages > 1 && (
                        <>
                            <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                                Page <span className="text-white">{coursePage}</span> of <span className="text-white">{courseTotalPages}</span>
                            </div>
                            <div className="flex flex-1 items-center justify-end gap-2">
                                <button
                                    onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                                    disabled={coursePage === 1}
                                    className="p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCoursePage(p => Math.min(courseTotalPages, p + 1))}
                                    disabled={coursePage === courseTotalPages}
                                    className="p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                    {activeTab === "mentor" && mentorTotalPages > 1 && (
                        <>
                            <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                                Page <span className="text-white">{mentorPage}</span> of <span className="text-white">{mentorTotalPages}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMentorPage(p => Math.max(1, p - 1))}
                                    disabled={mentorPage === 1}
                                    className="p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setMentorPage(p => Math.min(mentorTotalPages, p + 1))}
                                    disabled={mentorPage === mentorTotalPages}
                                    className="p-2 rounded-xl text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isCourseModalOpen && (
                    <CourseFormModal
                        isOpen={isCourseModalOpen}
                        onClose={() => setIsCourseModalOpen(false)}
                        onSuccess={() => { setIsCourseModalOpen(false); fetchCourses(); fetchAllCourses(); }}
                        editingCourse={editingCourse}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isMentorModalOpen && (
                    <MentorFormModal
                        isOpen={isMentorModalOpen}
                        onClose={() => setIsMentorModalOpen(false)}
                        onSuccess={() => { setIsMentorModalOpen(false); fetchMentors(); }}
                        editingMentor={editingMentor}
                        allCourses={allCourses}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Modal Components
function CourseFormModal({ onClose, onSuccess, editingCourse }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, editingCourse: CourseListRecord | null }) {
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: editingCourse?.title || "",
        description: editingCourse?.description || "",
        duration: editingCourse?.duration || "",
        price: editingCourse?.price?.toString() || "",
        tag: editingCourse?.tag || "",
        serviceType: editingCourse?.serviceType || "Course",
        isActive: editingCourse?.isActive ?? true
    });

    useEffect(() => {
        if (editingCourse?.image) {
            setImagePreview(CourseMonitorService.getFileUrl(editingCourse, editingCourse.image));
        }
    }, [editingCourse]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("duration", formData.duration);
            data.append("price", formData.price);
            data.append("tag", formData.tag);
            data.append("serviceType", formData.serviceType);
            data.append("isActive", formData.isActive.toString());

            if (fileInputRef.current?.files?.[0]) {
                data.append("image", fileInputRef.current.files[0]);
            }

            if (editingCourse) {
                await CourseMonitorService.updateCourse(editingCourse.id, data);
            } else {
                await CourseMonitorService.createCourse(data);
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving course:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-secondary sm:rounded-2xl w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl border-l sm:border border-white/10 flex flex-col"
            >
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">{editingCourse ? "Edit Course" : "Add New Course"}</h2>
                    <button onClick={onClose} className="p-1.5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-4 bg-black/20 hover:bg-black/30 transition-colors">
                                {imagePreview ? (
                                    <div className="relative w-full aspect-video bg-black/40 rounded-lg overflow-hidden mb-4 border border-white/10">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors shadow-sm backdrop-blur-sm"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center py-6 w-full text-white/40 hover:text-white transition-colors"
                                    >
                                        <Upload className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs font-semibold tracking-relaxed">Upload thumbnail image</span>
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setImagePreview(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold tracking-relaxed text-white/60">Course Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                    placeholder="Enter course title..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold tracking-relaxed text-white/60">Service Type</label>
                                    <select
                                        value={formData.serviceType}
                                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as "Course" | "Consultation" })}
                                        className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium appearance-none"
                                    >
                                        <option value="Course" className="bg-secondary">Course</option>
                                        <option value="Consultation" className="bg-secondary">Consultation</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold tracking-relaxed text-white/60">Duration</label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                        placeholder="e.g. 3 hours"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold tracking-relaxed text-white/60">Price (IDR)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold tracking-relaxed text-white/60">Category Tag</label>
                                    <input
                                        type="text"
                                        value={formData.tag}
                                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                        className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                        placeholder="e.g. SketchUp"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold tracking-relaxed text-white/60">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                    placeholder="Brief description of the course..."
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                                <StatusToggle isActive={formData.isActive} onToggle={() => setFormData({ ...formData, isActive: !formData.isActive })} />
                                <span className="text-xs font-semibold tracking-relaxed text-white/60">Active Status</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2.5 text-xs font-semibold tracking-relaxed text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center px-5 py-2.5 text-xs font-semibold tracking-relaxed text-black bg-white hover:bg-white/90 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingCourse ? "Update Course" : "Create Course"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
}

function MentorFormModal({ onClose, onSuccess, editingMentor, allCourses }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, editingMentor: MentorRecord | null, allCourses: CourseListRecord[] }) {
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: editingMentor?.name || "",
        specialization: editingMentor?.specialization || "",
        email: editingMentor?.email || "",
        tags: editingMentor?.tags || [] as string[],
        isActive: editingMentor?.isActive ?? true
    });

    useEffect(() => {
        if (editingMentor?.image) {
            setImagePreview(MentorService.getFileUrl(editingMentor, editingMentor.image));
        }
    }, [editingMentor]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("specialization", formData.specialization);
            data.append("email", formData.email);
            data.append("isActive", formData.isActive.toString());

            // Handle tags as array for PocketBase relation/list
            formData.tags.forEach(tagId => {
                data.append("tags", tagId);
            });

            if (fileInputRef.current?.files?.[0]) {
                data.append("image", fileInputRef.current.files[0]);
            }

            if (editingMentor) {
                await MentorService.updateMentor(editingMentor.id, data);
            } else {
                await MentorService.createMentor(data);
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving mentor:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCourseTag = (courseId: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(courseId)
                ? prev.tags.filter(id => id !== courseId)
                : [...prev.tags, courseId]
        }));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-secondary sm:rounded-2xl w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl border-l sm:border border-white/10 flex flex-col"
            >
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">{editingMentor ? "Edit Mentor" : "Add New Mentor"}</h2>
                    <button onClick={onClose} className="p-1.5 text-white/40 hover:bg-white/10 hover:text-white rounded-xl transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-black/40 border-2 border-white/10 shadow-sm flex items-center justify-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-white/20" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-sm"
                                >
                                    <Upload className="w-6 h-6" />
                                </button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setImagePreview(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <span className="text-xs font-semibold tracking-relaxed text-white/60">Profile Picture</span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold tracking-relaxed text-white/60">Full Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                placeholder="Enter full name..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold tracking-relaxed text-white/60">Email Address</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold tracking-relaxed text-white/60">Specialization</label>
                            <input
                                required
                                type="text"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                className="w-full px-4 py-2.5 text-sm border border-white/10 bg-black/40 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 focus:border-army-500 transition-all font-medium"
                                placeholder="e.g. Geotechnical Engineer"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold tracking-relaxed text-white/60 mb-2">Mentor Tags (Courses)</label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-black/20 rounded-xl border border-white/10 text-left">
                                {allCourses.map(course => (
                                    <label key={course.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent group">
                                        <input
                                            type="checkbox"
                                            checked={formData.tags.includes(course.id)}
                                            onChange={() => toggleCourseTag(course.id)}
                                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-army-500 focus:ring-army-500/50 transition-all cursor-pointer"
                                        />
                                        <span className="text-xs font-semibold text-white truncate">{course.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                            <StatusToggle isActive={formData.isActive} onToggle={() => setFormData({ ...formData, isActive: !formData.isActive })} />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Active Status</span>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2.5 text-xs font-semibold tracking-light text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center px-5 py-2.5 text-xs font-semibold tracking-light text-black bg-white hover:bg-white/90 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingMentor ? "Update Mentor" : "Create Mentor"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatusToggle({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                isActive ? "bg-army-500" : "bg-white/10"
            )}
        >
            <span
                className={cn(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm",
                    isActive ? "translate-x-4.5" : "translate-x-1"
                )}
            />
        </button>
    );
}

function CourseCard({ course, onEdit, onDelete, onToggle }: { course: CourseListRecord, onEdit: () => void, onDelete: () => void, onToggle: () => void }) {
    return (
        <div className="bg-secondary border border-white/5 rounded-2xl overflow-hidden shrink-0 group hover:border-army-500/50 transition-all flex flex-col relative">
            <div className="h-40 bg-black/40 flex items-center justify-center shrink-0 border-b border-white/5 relative overflow-hidden">
                {course.image ? (
                    <img src={CourseMonitorService.getFileUrl(course, course.image, '400x400')} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <ImageIcon className="w-8 h-8 text-white/20" />
                )}
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-bl from-black/80 via-black/40 to-transparent flex gap-1">
                    <button onClick={onEdit} className="p-1.5 bg-black/50 hover:bg-army-500 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/10">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete} className="p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/10">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2 items-center">
                    <span className="px-2 py-1 text-[9px] font-semibold uppercase tracking-widest bg-black/80 backdrop-blur-sm text-white rounded-md border border-white/10 shadow-sm">
                        {course.serviceType}
                    </span>
                    {course.tag && (
                        <span className="px-2 py-1 text-[9px] font-semibold uppercase tracking-widest bg-army-500/90 backdrop-blur-sm text-white rounded-md shadow-sm">
                            {course.tag}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="font-bold text-white leading-tight line-clamp-2">{course.title}</h3>
                </div>
                <p className="text-xs text-white/60 line-clamp-2 mb-4 flex-1">
                    {course.description || "No description provided."}
                </p>

                <div className="space-y-2 mb-4 mt-auto">
                    <div className="flex items-center text-[10px] font-semibold uppercase tracking-widest text-white/40">
                        <Clock className="w-3 h-3 mr-2" />
                        {course.duration || "-"}
                    </div>
                    <div className="flex items-center text-[10px] font-semibold uppercase tracking-widest text-white/40">
                        <Briefcase className="w-3 h-3 mr-2" />
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(course.price || 0)}
                    </div>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                        <StatusToggle isActive={course.isActive} onToggle={onToggle} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                            {course.isActive ? "Active" : "Hidden"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MentorCard({ mentor, onEdit, onDelete, onToggle }: { mentor: MentorRecord, onEdit: () => void, onDelete: () => void, onToggle: () => void }) {
    return (
        <div className="bg-secondary border border-white/5 rounded-2xl overflow-hidden shrink-0 group hover:border-army-500/50 transition-all flex flex-col p-5 relative">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={onEdit} className="p-1.5 bg-black/50 hover:bg-army-500 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/10">
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={onDelete} className="p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/10">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex justify-between items-start mb-4 pr-8">
                <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-black/40 flex items-center justify-center border border-white/10">
                        {mentor.image ?
                            <img src={MentorService.getFileUrl(mentor, mentor.image, '100x100')} alt={mentor.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            : <ImageIcon className="w-5 h-5 text-white/20" />
                        }
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-tight mb-0.5">{mentor.name}</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-light text-army-500">{mentor.specialization || "Specialization N/A"}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 mb-4 flex-1">
                <div className="flex items-center text-[10px] font-semibold tracking-light text-white/40">
                    <Mail className="w-3 h-3 mr-2" />
                    {mentor.email || "No email"}
                </div>
                {mentor.expand?.tags && mentor.expand.tags.length > 0 && (
                    <div className="flex items-start text-xs text-white/60 mt-1">
                        <Tag className="w-3.5 h-3.5 mr-2 opacity-40 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1.5">
                            {mentor.expand.tags.map(t => (
                                <span key={t.id} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-semibold tracking-light text-white/80">{t.title}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
                <div className="flex items-center gap-2">
                    <StatusToggle isActive={mentor.isActive} onToggle={onToggle} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                        {mentor.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>
        </div>
    );
}

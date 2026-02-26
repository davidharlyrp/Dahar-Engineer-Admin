import { useEffect, useState, useRef } from "react";
import { Search, Edit2, Trash2, Clock, Image as ImageIcon, Briefcase, Mail, AlertCircle, Tag, Plus, Upload, X } from "lucide-react";
import { CourseMonitorService, MentorService, type CourseListRecord, type MentorRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { cn } from "../lib/utils";

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Course Monitor</h1>
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
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" /> Add {activeTab === "course" ? "Course" : "Mentor"}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors min-h-[500px]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => { setActiveTab("course"); setSearch(""); setCoursePage(1); }}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center",
                                activeTab === "course"
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Courses
                        </button>
                        <button
                            onClick={() => { setActiveTab("mentor"); setSearch(""); setMentorPage(1); }}
                            className={cn(
                                "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center",
                                activeTab === "mentor"
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Mentors
                        </button>
                    </div>

                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="p-4 flex-1">
                    {activeTab === "course" && isCoursesLoading && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-slate-500">
                            <Clock className="w-8 h-8 mb-4 animate-spin opacity-20" />
                            <span>Loading courses...</span>
                        </div>
                    )}
                    {activeTab === "course" && !isCoursesLoading && courses.length === 0 && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-slate-500">
                            <AlertCircle className="w-8 h-8 mb-4 opacity-20" />
                            <span>No courses found.</span>
                        </div>
                    )}
                    {activeTab === "course" && !isCoursesLoading && courses.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {courses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    onEdit={() => { setEditingCourse(course); setIsCourseModalOpen(true); }}
                                    onDelete={() => deleteCourse(course.id)}
                                    onToggle={() => handleToggleCourseActive(course)}
                                />
                            ))}
                        </div>
                    )}

                    {activeTab === "mentor" && isMentorsLoading && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-slate-500">
                            <Clock className="w-8 h-8 mb-4 animate-spin opacity-20" />
                            <span>Loading mentors...</span>
                        </div>
                    )}
                    {activeTab === "mentor" && !isMentorsLoading && mentors.length === 0 && (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-slate-500">
                            <AlertCircle className="w-8 h-8 mb-4 opacity-20" />
                            <span>No mentors found.</span>
                        </div>
                    )}
                    {activeTab === "mentor" && !isMentorsLoading && mentors.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mentors.map(mentor => (
                                <MentorCard
                                    key={mentor.id}
                                    mentor={mentor}
                                    onEdit={() => { setEditingMentor(mentor); setIsMentorModalOpen(true); }}
                                    onDelete={() => deleteMentor(mentor.id)}
                                    onToggle={() => handleToggleMentorActive(mentor)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex items-center justify-center gap-2">
                    {activeTab === "course" && courseTotalPages > 1 && (
                        <>
                            <button
                                onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                                disabled={coursePage === 1}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-500 font-medium">Page {coursePage} of {courseTotalPages}</span>
                            <button
                                onClick={() => setCoursePage(p => Math.min(courseTotalPages, p + 1))}
                                disabled={coursePage === courseTotalPages}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </>
                    )}
                    {activeTab === "mentor" && mentorTotalPages > 1 && (
                        <>
                            <button
                                onClick={() => setMentorPage(p => Math.max(1, p - 1))}
                                disabled={mentorPage === 1}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-500 font-medium">Page {mentorPage} of {mentorTotalPages}</span>
                            <button
                                onClick={() => setMentorPage(p => Math.min(mentorTotalPages, p + 1))}
                                disabled={mentorPage === mentorTotalPages}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isCourseModalOpen && (
                <CourseFormModal
                    isOpen={isCourseModalOpen}
                    onClose={() => setIsCourseModalOpen(false)}
                    onSuccess={() => { setIsCourseModalOpen(false); fetchCourses(); fetchAllCourses(); }}
                    editingCourse={editingCourse}
                />
            )}

            {isMentorModalOpen && (
                <MentorFormModal
                    isOpen={isMentorModalOpen}
                    onClose={() => setIsMentorModalOpen(false)}
                    onSuccess={() => { setIsMentorModalOpen(false); fetchMentors(); }}
                    editingMentor={editingMentor}
                    allCourses={allCourses}
                />
            )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-xl font-bold dark:text-white">{editingCourse ? "Edit Course" : "Add New Course"}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        {/* Image Upload */}
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50 transition-colors">
                            {imagePreview ? (
                                <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden mb-4">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center py-6 w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                >
                                    <Upload className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-sm font-medium">Upload thumbnail image</span>
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                                placeholder="Enter course title..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Type</label>
                                <select
                                    value={formData.serviceType}
                                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as "Course" | "Consultation" })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
                                >
                                    <option value="Course">Course</option>
                                    <option value="Consultation">Consultation</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                                <input
                                    type="text"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                                    placeholder="e.g. 3 hours"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (IDR)</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category Tag</label>
                                <input
                                    type="text"
                                    value={formData.tag}
                                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                                    placeholder="e.g. SketchUp"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                                placeholder="Brief description of the course..."
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <StatusToggle isActive={formData.isActive} onToggle={() => setFormData({ ...formData, isActive: !formData.isActive })} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Status</span>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                        >
                            {loading ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-xl font-bold dark:text-white">{editingMentor ? "Edit Mentor" : "Add New Mentor"}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[1px]"
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
                        <span className="text-xs text-slate-500 font-medium tracking-tight">Profile Picture</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                            placeholder="Enter full name..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                            placeholder="email@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specialization</label>
                        <input
                            required
                            type="text"
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm placeholder-slate-400"
                            placeholder="e.g. Geotechnical Engineer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mentor Tags (Courses)</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 text-left">
                            {allCourses.map(course => (
                                <label key={course.id} className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
                                    <input
                                        type="checkbox"
                                        checked={formData.tags.includes(course.id)}
                                        onChange={() => toggleCourseTag(course.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950 transition-all cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{course.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <StatusToggle isActive={formData.isActive} onToggle={() => setFormData({ ...formData, isActive: !formData.isActive })} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Status</span>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                        >
                            {loading ? "Saving..." : editingMentor ? "Update Mentor" : "Create Mentor"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StatusToggle({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
                "relative inline-flex h-6 w-16 items-center rounded-full transition-colors",
                isActive ? "bg-slate-900 dark:bg-slate-200" : "bg-slate-200 dark:bg-slate-600"
            )}
        >
            <span
                className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                    isActive ? "translate-x-10" : "translate-x-1"
                )}
            />
        </button>
    );
}

function CourseCard({ course, onEdit, onDelete, onToggle }: { course: CourseListRecord, onEdit: () => void, onDelete: () => void, onToggle: () => void }) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0 group shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col">
            <div className="h-48 bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center shrink-0 border-b border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                {course.image ? (
                    <img src={CourseMonitorService.getFileUrl(course, course.image, '400x400')} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                )}
                <div className="absolute top-3 left-3 flex gap-1 items-center">
                    <span className="px-2 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm text-slate-800 rounded shadow-sm">
                        {course.serviceType}
                    </span>
                    {course.tag && (
                        <span className="px-2 py-1 text-xs font-semibold bg-slate-900/90 backdrop-blur-sm text-white rounded shadow-sm">
                            {course.tag}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                    {course.description || "No description provided."}
                </p>

                <div className="space-y-1.5 mb-5 mt-auto">
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 mr-2 opacity-60" />
                        {course.duration || "-"}
                    </div>
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                        <Briefcase className="w-3.5 h-3.5 mr-2 opacity-60" />
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(course.price || 0)}
                    </div>
                </div>

                <div className="flex gap-2 items-center border-t border-slate-100 dark:border-slate-700 pt-4">
                    <StatusToggle isActive={course.isActive} onToggle={onToggle} />
                    <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={onDelete} className="flex items-center justify-center px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function MentorCard({ mentor, onEdit, onDelete, onToggle }: { mentor: MentorRecord, onEdit: () => void, onDelete: () => void, onToggle: () => void }) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0 group shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col p-5">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                        {mentor.image ?
                            <img src={MentorService.getFileUrl(mentor, mentor.image, '100x100')} alt={mentor.name} className="w-full h-full object-cover" />
                            : <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-500" />
                        }
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-0.5">{mentor.name}</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{mentor.specialization || "Specialization N/A"}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 mb-4 flex-1">
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                    <Mail className="w-3.5 h-3.5 mr-2 opacity-60" />
                    {mentor.email || "No email"}
                </div>
                {mentor.expand?.tags && mentor.expand.tags.length > 0 && (
                    <div className="flex items-start text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <Tag className="w-3.5 h-3.5 mr-2 opacity-60 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                            {mentor.expand.tags.map(t => (
                                <span key={t.id} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">{t.title}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 items-center border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto">
                <StatusToggle isActive={mentor.isActive} onToggle={onToggle} />
                <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={onDelete} className="flex items-center justify-center px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

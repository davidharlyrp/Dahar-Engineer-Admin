import { useState, useEffect } from "react";
import { Search, X, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { OnlineCourseService, UserService, type OnlineCourseRecord, type UserRecord } from "../../services/api";
import { cn } from "../../lib/utils";

interface GiveAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function GiveAccessModal({ isOpen, onClose, onSuccess }: GiveAccessModalProps) {
    const [courses, setCourses] = useState<OnlineCourseRecord[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [userPage, setUserPage] = useState(1);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCourses();
            fetchUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        fetchUsers();
    }, [userSearch, userPage]);

    const fetchCourses = async () => {
        try {
            const result = await OnlineCourseService.getOnlineCourses(1, 100, "-created", "isActive = true");
            setCourses(result.items);
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const filter = userSearch ? `name ~ "${userSearch}" || email ~ "${userSearch}"` : "";
            const result = await UserService.getUsers(userPage, 20, "-created", filter);
            setUsers(result.items);
            setUserTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAllOnPage = () => {
        const pageUserIds = users.map(u => u.id);
        const allOnPageSelected = pageUserIds.every(id => selectedUserIds.includes(id));

        if (allOnPageSelected) {
            setSelectedUserIds(prev => prev.filter(id => !pageUserIds.includes(id)));
        } else {
            setSelectedUserIds(prev => [...new Set([...prev, ...pageUserIds])]);
        }
    };

    const handleGiveAccess = async () => {
        if (!selectedCourseId || selectedUserIds.length === 0) return;

        setSubmitting(true);
        try {
            const course = courses.find(c => c.id === selectedCourseId);
            if (!course) throw new Error("Course not found");

            await Promise.all(selectedUserIds.map(userId =>
                OnlineCourseService.createAccessRecord({
                    user_id: userId,
                    online_course_id: selectedCourseId,
                    course_name: course.title,
                    payment_status: "paid",
                    access_granted_at: new Date().toISOString(),
                    payment_amount: 0,
                    payment_currency: "IDR",
                    external_id: "GIVEN-ACCESS"
                })
            ));

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error giving access:", error);
            alert("Failed to give access to some users");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-secondary border border-white/10 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h2 className="text-sm font-bold text-white uppercase tracking-tight">Give Course Access</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md transition-colors">
                        <X className="w-4 h-4 text-white/40" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto">
                    {/* Course Selection */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-tight">Select Online Course</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-white/10 bg-black/40 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-army-500 transition-all font-medium"
                        >
                            <option value="">-- Choose a course --</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* User Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-tight">Select Users ({selectedUserIds.length} selected)</label>
                            <div className="relative w-48">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search user..."
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value);
                                        setUserPage(1);
                                    }}
                                    className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-white/10 bg-black/40 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-army-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="border border-white/10 rounded-lg overflow-hidden h-[300px] flex flex-col">
                            <div className="bg-white/[0.02] p-2 border-b border-white/5 flex items-center gap-2">
                                <button
                                    onClick={handleSelectAllOnPage}
                                    className="w-4 h-4 border border-white/10 rounded flex items-center justify-center transition-colors"
                                >
                                    {users.length > 0 && users.map(u => u.id).every(id => selectedUserIds.includes(id)) && <Check className="w-3 h-3 text-white" />}
                                </button>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-tight">Select All on Page</span>
                            </div>

                            <div className="overflow-y-auto flex-1 divide-y divide-white/5">
                                {loadingUsers ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                                    </div>
                                ) : users.length > 0 ? (
                                    users.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleUserSelection(user.id)}
                                            className="p-2 flex items-center gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                                        >
                                            <div className={cn(
                                                "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                                                selectedUserIds.includes(user.id)
                                                    ? "bg-army-500 border-army-500"
                                                    : "border-white/10"
                                            )}>
                                                {selectedUserIds.includes(user.id) && <Check className="w-3 h-3 text-black" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-white truncate leading-tight">{user.name || user.username}</p>
                                                <p className="text-[10px] text-white/40 truncate mt-0.5">{user.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[10px] text-white/40">No users found</div>
                                )}
                            </div>

                            <div className="p-2 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <span className="text-[10px] text-white/40 font-medium tracking-tight uppercase">Page {userPage} of {userTotalPages}</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={userPage === 1}
                                        onClick={() => setUserPage(p => Math.max(1, p - 1))}
                                        className="p-1 border border-white/10 bg-black/40 text-white/80 rounded hover:bg-white/5 disabled:opacity-30 transition-all font-medium"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                    </button>
                                    <button
                                        disabled={userPage === userTotalPages}
                                        onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                                        className="p-1 border border-white/10 bg-black/40 text-white/80 rounded hover:bg-white/5 disabled:opacity-30 transition-all font-medium"
                                    >
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 flex justify-end gap-2 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[10px] font-bold text-white/40 uppercase tracking-tight hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGiveAccess}
                        disabled={!selectedCourseId || selectedUserIds.length === 0 || submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-tight hover:opacity-90 disabled:opacity-30 transition-all"
                    >
                        {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                        Give Access ({selectedUserIds.length})
                    </button>
                </div>
            </div>
        </div>
    );
}

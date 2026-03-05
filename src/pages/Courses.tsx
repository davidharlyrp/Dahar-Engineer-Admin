import { useEffect, useState, useMemo } from "react";
import { Search, Calendar, Clock, LayoutGrid, List, CalendarDays, X, ChevronLeft, ChevronRight, AlertCircle, Edit2, User } from "lucide-react";
import { CourseService, type BookingRecord } from "../services/api";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Courses() {
    const [search, setSearch] = useState("");
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
    const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { perPage, autoRefresh, refreshInterval } = useAdminSettings();

    // Form state for modal
    const [editData, setEditData] = useState({
        session_date: "",
        session_time: "",
        booking_status: "" as BookingRecord['booking_status'],
        payment_status: "" as BookingRecord['payment_status']
    });

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const filterString = search ? `(course_title ~ "${search}" || full_name ~ "${search}")` : "";
            const result = await CourseService.getBookings(page, perPage, "-session_date", filterString);
            setBookings(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Courses: Error fetching bookings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        fetchBookings();
    }, [page, search, perPage]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchBookings, refreshInterval * 1000);
        return () => clearInterval(id);
    }, [autoRefresh, refreshInterval]);

    const openActionModal = (booking: BookingRecord) => {
        setSelectedBooking(booking);
        setEditData({
            session_date: booking.session_date ? booking.session_date.split(' ')[0] : "",
            session_time: booking.session_time || "",
            booking_status: booking.booking_status,
            payment_status: booking.payment_status
        });
    };

    const handleUpdate = async () => {
        if (!selectedBooking) return;
        setIsSubmitting(true);
        try {
            await CourseService.updateBooking(selectedBooking.id, {
                ...editData,
                session_date: editData.session_date ? `${editData.session_date} 00:00:00.000Z` : ""
            });
            await fetchBookings();
            setSelectedBooking(null);
        } catch (error) {
            console.error("Courses: Error updating booking:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.course_title?.toLowerCase().includes(search.toLowerCase()) ||
        b.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6 scrollbar-thin scrollbar-thumb-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white tracking-widest">Booking Management</h1>
                    <p className="text-xs font-semibold text-white/40 mt-1 tracking-widest uppercase">Consultation & course schedule overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-xl shadow-inner">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-white/10 shadow-sm text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'list' ? "bg-white/10 shadow-sm text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'calendar' ? "bg-white/10 shadow-sm text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                            title="Calendar View"
                        >
                            <CalendarDays className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-secondary/20 border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all min-h-[500px]">
                <div className="p-4 border-b border-white/5 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-black/20 border border-white/5 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-army-500 transition-all placeholder:text-white/10"
                        />
                    </div>
                </div>

                <div className="p-6 flex-1">
                    {isLoading ? (
                        <div className="h-full py-32 flex flex-col items-center justify-center text-white/40 animate-pulse">
                            <Clock className="w-12 h-12 mb-4 animate-spin opacity-20 text-army-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Syncing bookings...</span>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="h-full py-32 flex flex-col items-center justify-center text-white/40">
                            <AlertCircle className="w-16 h-16 mb-4 opacity-10" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Empty schedule</span>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredBookings.map((booking) => (
                                        <GridCard key={booking.id} booking={booking} onAction={() => openActionModal(booking)} />
                                    ))}
                                </div>
                            )}

                            {viewMode === 'list' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-[10px] font-bold text-white/40 bg-black/40 border-b border-white/5 uppercase tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Course</th>
                                                <th className="px-6 py-4">Client</th>
                                                <th className="px-6 py-4">Schedule</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-center">Payment</th>
                                                <th className="px-6 py-4 text-center">Paid Date</th>
                                                <th className="px-6 py-4 text-center">Amount</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-army-100 dark:divide-army-800">
                                            {filteredBookings.map((booking) => (
                                                <ListRow key={booking.id} booking={booking} onAction={() => openActionModal(booking)} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {viewMode === 'calendar' && (
                                <CalendarView bookings={filteredBookings} onAction={openActionModal} />
                            )}
                        </>
                    )}
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && viewMode !== 'calendar' && (
                    <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Page</span>
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                                <span className="text-xs font-bold text-army-400">
                                    {page.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[10px] font-bold text-white/20 mx-1">/</span>
                                <span className="text-[10px] font-bold text-white/40 tracking-widest">
                                    {totalPages.toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center justify-center min-w-[100px] px-6 py-2 text-xs font-bold uppercase tracking-widest text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all active:scale-95"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="inline-flex items-center justify-center min-w-[100px] px-6 py-2 text-xs font-bold uppercase tracking-widest text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all active:scale-95"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 bg-black/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Modify Booking</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Update session schedule & status</p>
                            </div>
                            <button onClick={() => setSelectedBooking(null)} className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Client Identity</label>
                                    <h3 className="text-lg font-bold text-white tracking-tight">{selectedBooking.full_name}</h3>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Course / Topic</label>
                                    <p className="text-sm font-semibold text-white/60 leading-relaxed">{selectedBooking.course_title}</p>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <a
                                        href={`https://wa.me/${selectedBooking.whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-army-500/10 border border-army-500/20 rounded-xl text-xs font-bold text-army-400 uppercase tracking-widest hover:bg-army-500/20 transition-all"
                                    >
                                        Message Whatsapp
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Session Date</label>
                                    <input
                                        type="date"
                                        value={editData.session_date}
                                        onChange={e => setEditData(prev => ({ ...prev, session_date: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none time-input-field"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Session Time</label>
                                    <input
                                        type="text"
                                        placeholder="09:00 - 11:00"
                                        value={editData.session_time}
                                        onChange={e => setEditData(prev => ({ ...prev, session_time: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none placeholder:text-white/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Booking Status</label>
                                    <select
                                        value={editData.booking_status}
                                        onChange={e => setEditData(prev => ({ ...prev, booking_status: e.target.value as BookingRecord['booking_status'] }))}
                                        className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        {['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'finished'].map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Payment Status</label>
                                    <select
                                        value={editData.payment_status}
                                        onChange={e => setEditData(prev => ({ ...prev, payment_status: e.target.value as BookingRecord['payment_status'] }))}
                                        className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm font-semibold text-white focus:ring-1 focus:ring-army-500 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        {['pending', 'paid', 'expired', 'failed'].map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/5 flex gap-3">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black bg-army-500 hover:bg-army-400 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-lg active:scale-95 gap-2"
                            >
                                {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function GridCard({ booking, onAction }: { booking: BookingRecord, onAction: () => void }) {
    return (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all flex flex-col group shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border",
                    booking.booking_status === 'confirmed' || booking.booking_status === 'finished' || booking.booking_status === 'completed'
                        ? 'bg-army-500/20 text-army-400 border-army-500/20'
                        : booking.booking_status === 'cancelled'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-white/5 text-white/40 border-white/10'
                )}>
                    {booking.booking_status}
                </span>
                <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border",
                    booking.payment_status === 'paid' ? 'bg-army-500/20 text-army-400 border-army-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                )}>
                    {booking.payment_status}
                </span>
            </div>

            <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2 group-hover:text-army-400 transition-colors tracking-tight">
                {booking.course_title}
            </h3>

            <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-3 h-3 text-white/40" />
                </div>
                <span className="text-sm font-semibold text-white/60 tracking-tight">{booking.full_name}</span>
            </div>

            <div className="mt-auto space-y-3 p-4 bg-black/40 rounded-xl border border-white/5">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Created
                    </span>
                    <span className="text-xs font-bold text-white/60 tabular-nums">
                        {booking.payment_date ? new Date(booking.payment_date).toLocaleDateString() : '—'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 text-army-400" />
                        Schedule
                    </span>
                    <span className="text-xs font-bold text-white tabular-nums">
                        {booking.session_date ? new Date(booking.session_date).toLocaleDateString() : 'TBD'}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-army-400" />
                        Session
                    </span>
                    <span className="text-xs font-bold text-white tracking-tight">
                        {booking.session_time || 'TBD'} <span className="text-white/20 mx-1">•</span> {booking.session_number}/{booking.total_sessions}
                    </span>
                </div>
                <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Amount</span>
                    <span className="text-sm font-black text-army-400">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.total_amount)}
                    </span>
                </div>
            </div>

            <button
                onClick={onAction}
                className="mt-4 w-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-army-500 hover:text-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
                <Edit2 className="w-3.5 h-3.5" /> Manage Booking
            </button>
        </div>
    );
}

function ListRow({ booking, onAction }: { booking: BookingRecord, onAction: () => void }) {
    return (
        <tr className="hover:bg-white/5 transition-colors group">
            <td className="px-6 py-4">
                <div className="font-bold text-white group-hover:text-army-400 transition-colors tracking-tight">{booking.course_title}</div>
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-0.5">{booking.course_type}</div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white/80 tabular-nums">
                    <User className="w-3.5 h-3.5 text-white/20" />
                    {booking.full_name}
                </div>
                <div className="text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest ml-5">{booking.whatsapp}</div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center text-[10px] font-bold text-white/60 uppercase tracking-tighter">
                        <Calendar className="w-3 h-3 mr-1.5 text-army-400" />
                        {booking.session_date ? new Date(booking.session_date).toLocaleDateString() : 'TBD'}
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <Clock className="w-3 h-3 mr-1.5 text-white/20" />
                        {booking.session_time || 'TBD'}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={cn(
                    "inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border",
                    booking.booking_status === 'confirmed' || booking.booking_status === 'finished' || booking.booking_status === 'completed'
                        ? 'bg-army-500/20 text-army-400 border-army-500/20'
                        : booking.booking_status === 'cancelled'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-white/5 text-white/40 border-white/10'
                )}>
                    {booking.booking_status}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase border",
                        booking.payment_status === 'paid' ? 'bg-army-500/20 text-army-400 border-army-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                    )}>
                        {booking.payment_status}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-center text-[10px] font-bold text-white/40 tabular-nums">
                    {booking.payment_date ? new Date(booking.payment_date).toLocaleDateString() : '—'}
                </div>
            </td>
            <td className="px-6 py-4 text-xs font-black text-army-400 text-center tabular-nums">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.total_amount)}
            </td>
            <td className="px-6 py-4 text-right">
                <button
                    onClick={onAction}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
}

function CalendarView({ bookings, onAction }: { bookings: BookingRecord[], onAction: (b: BookingRecord) => void }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Pad for start of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Days of the month
        for (let d = 1; d <= daysInCurrentMonth; d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    }, [currentDate]);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    return (
        <div className="flex flex-col h-full border border-white/5 rounded-2xl overflow-hidden bg-black/40 shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
                <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-white tracking-widest uppercase">
                        {currentDate.toLocaleString('default', { month: 'long' })}
                    </h3>
                    <span className="text-[10px] font-bold text-white/20 tracking-[0.2em]">{currentDate.getFullYear()}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/40 hover:text-white active:scale-95">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/40 hover:text-white active:scale-95">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-white/5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 bg-black/40">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-[#0a0a0a]">
                {daysInMonth.map((day, i) => {
                    const bookingsOnDay = day ? bookings.filter(b => {
                        if (!b.session_date) return false;
                        const bDate = new Date(b.session_date);
                        return bDate.getDate() === day.getDate() &&
                            bDate.getMonth() === day.getMonth() &&
                            bDate.getFullYear() === day.getFullYear();
                    }) : [];

                    const isToday = day?.toDateString() === new Date().toDateString();

                    return (
                        <div key={i} className={cn(
                            "min-h-[160px] p-2 border-r border-b border-white/5 transition-colors relative",
                            !day ? "bg-black/60" : "hover:bg-white/[0.02] bg-transparent"
                        )}>
                            {day && (
                                <>
                                    <div className="flex justify-between items-start mb-3 p-1">
                                        <span className={cn(
                                            "text-xs font-bold tabular-nums inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                                            isToday ? "bg-army-500 text-black shadow-lg shadow-army-500/20 scale-110" : "text-white/40"
                                        )}>
                                            {day.getDate()}
                                        </span>
                                        {bookingsOnDay.length > 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-army-500 shadow-sm shadow-army-500/50 animate-pulse" />
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        {bookingsOnDay.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => onAction(b)}
                                                className="w-full text-left p-2.5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/10 hover:border-white/20 transition-all group shadow-sm"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <Clock className="w-2.5 h-2.5 text-army-400" />
                                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{b.session_time || 'TBD'}</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-white group-hover:text-army-400 transition-colors line-clamp-2 leading-snug tracking-tight">
                                                    {b.course_title}
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                                                        <User className="w-2.5 h-2.5 text-white/20" />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-white/40 truncate tracking-tight">{b.full_name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

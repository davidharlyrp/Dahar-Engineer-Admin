import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Calendar, Clock, LayoutGrid, List, CalendarDays, X, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
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
            const result = await CourseService.getBookings(page, perPage, "-created", filterString);
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Course/Consultation Booking</h1>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'grid' ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'list' ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'calendar' ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <CalendarDays className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors min-h-[500px]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="p-4 flex-1">
                    {isLoading ? (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-slate-500">
                            <Clock className="w-8 h-8 mb-4 animate-spin opacity-20" />
                            <span>Loading bookings...</span>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="h-full py-24 flex flex-col items-center justify-center text-slate-500">
                            <AlertCircle className="w-8 h-8 mb-4 opacity-20" />
                            <span>No bookings found.</span>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredBookings.map((booking) => (
                                        <GridCard key={booking.id} booking={booking} onAction={() => openActionModal(booking)} />
                                    ))}
                                </div>
                            )}

                            {viewMode === 'list' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedule</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Date</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Update Booking</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[300px]">{selectedBooking.course_title}</p>
                            </div>
                            <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                <div className="pl-2 mt-1 flex items-center gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {selectedBooking.full_name}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Whatsapp</label>
                                <div className="pl-2 mt-1 flex items-center gap-2">
                                    <a href={`https://wa.me/${selectedBooking.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-xs underline text-slate-500 dark:text-slate-400">
                                        {selectedBooking.whatsapp}
                                    </a>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Topic Description</label>
                                <div className="pl-2 mt-1 flex items-center gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {selectedBooking.topic}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Date</label>
                                    <input
                                        type="date"
                                        value={editData.session_date}
                                        onChange={e => setEditData(prev => ({ ...prev, session_date: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Time</label>
                                    <input
                                        type="text"
                                        placeholder="09:00 - 11:00"
                                        value={editData.session_time}
                                        onChange={e => setEditData(prev => ({ ...prev, session_time: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Booking Status</label>
                                <select
                                    value={editData.booking_status}
                                    onChange={e => setEditData(prev => ({ ...prev, booking_status: e.target.value as BookingRecord['booking_status'] }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none"
                                >
                                    {['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'finished'].map(s => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Status</label>
                                <select
                                    value={editData.payment_status}
                                    onChange={e => setEditData(prev => ({ ...prev, payment_status: e.target.value as BookingRecord['payment_status'] }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none"
                                >
                                    {['pending', 'paid', 'expired', 'failed'].map(s => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 rounded-md hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center"
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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col group shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider",
                    booking.booking_status === 'confirmed' || booking.booking_status === 'finished' || booking.booking_status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : booking.booking_status === 'cancelled'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                )}>
                    {booking.booking_status}
                </span>
                <span className={cn(
                    "text-[10px] font-semibold tracking-wider",
                    booking.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                )}>
                    {booking.payment_status}
                </span>
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg leading-tight mb-1 line-clamp-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                {booking.course_title}
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{booking.full_name}</p>

            <div className="mt-auto space-y-2">
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" />
                    created: {booking.payment_date ? new Date(booking.payment_date).toLocaleDateString() : 'No date set'}
                </div>
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" />
                    {booking.session_date ? new Date(booking.session_date).toLocaleDateString() : 'No date set'}
                </div>
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" />
                    Session {booking.session_number} of {booking.total_sessions} ({booking.session_time || 'TBD'})
                </div>
                <div className="flex items-center text-xs font-medium text-slate-900 dark:text-slate-100">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.total_amount)}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button
                    onClick={onAction}
                    className="w-full px-3 py-2 text-sm font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white rounded transition-colors flex items-center justify-center gap-2"
                >
                    Action
                </button>
            </div>
        </div>
    );
}

function ListRow({ booking, onAction }: { booking: BookingRecord, onAction: () => void }) {
    return (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-none">
            <td className="px-4 py-4">
                <div className="font-medium text-slate-900 dark:text-slate-100">{booking.course_title}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-tight">{booking.course_type}</div>
            </td>
            <td className="px-4 py-4">
                <div className="text-sm text-slate-900 dark:text-slate-100">{booking.full_name}</div>
                <div className="text-[10px] text-slate-500">{booking.whatsapp}</div>
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3 h-3 mr-1.5 opacity-50" />
                    {booking.session_date ? new Date(booking.session_date).toLocaleDateString() : 'TBD'}
                </div>
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                    <Clock className="w-3 h-3 mr-1.5 opacity-50" />
                    {booking.session_time || 'TBD'}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-1">
                    <span className={cn(
                        "inline-flex self-start px-2 py-0.5 rounded-full text-[9px] font-semibold",
                        booking.booking_status === 'confirmed' || booking.booking_status === 'finished' || booking.booking_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    )}>
                        {booking.booking_status}
                    </span>
                    <span className={cn(
                        "text-[9px] font-semibold",
                        booking.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                    )}>
                        {booking.payment_status}
                    </span>
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3 h-3 mr-1.5 opacity-50" />
                    {booking.payment_date ? new Date(booking.payment_date).toLocaleDateString() : '-'}
                </div>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100 underline decoration-slate-200 underline-offset-4">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.total_amount)}
            </td>
            <td className="px-4 py-4 text-right">
                <button
                    onClick={onAction}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                    <Plus className="w-4 h-4" />
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
        <div className="flex flex-col h-full border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr flex-1">
                {daysInMonth.map((day, i) => {
                    const bookingsOnDay = day ? bookings.filter(b => {
                        if (!b.session_date) return false;
                        const bDate = new Date(b.session_date);
                        return bDate.getDate() === day.getDate() &&
                            bDate.getMonth() === day.getMonth() &&
                            bDate.getFullYear() === day.getFullYear();
                    }) : [];

                    return (
                        <div key={i} className={cn(
                            "min-h-[120px] p-2 border-r border-b border-slate-100 dark:border-slate-800 transition-colors",
                            !day ? "bg-slate-50/30 dark:bg-slate-900/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                        )}>
                            {day && (
                                <>
                                    <span className={cn(
                                        "text-xs font-medium mb-1 inline-block px-1.5 py-0.5 rounded-md",
                                        day.toDateString() === new Date().toDateString() ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" : "text-slate-400"
                                    )}>
                                        {day.getDate()}
                                    </span>
                                    <div className="space-y-1 mt-1">
                                        {bookingsOnDay.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => onAction(b)}
                                                className="w-full text-left p-1.5 text-[9px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm transition-all group"
                                            >
                                                <div className="text-[7px] opacity-60 flex items-center gap-1 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors uppercase tracking-tight">
                                                    <Clock className="w-2 h-2" />
                                                    {b.session_time || 'TBD'}
                                                </div>
                                                <div className="truncate leading-tight mt-0.5">{b.course_title}</div>
                                                <div className="truncate text-[8px] font-medium text-slate-400 mt-0.5">{b.full_name}</div>
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

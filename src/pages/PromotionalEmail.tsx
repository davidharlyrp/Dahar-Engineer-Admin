import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Send, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Loader2, Eye, ArrowLeft } from "lucide-react";
import { UserService, EmailService, BlogService, type UserRecord, type BlogRecord } from "../services/api";
import { cn } from "../lib/utils";
import { emailTemplates, type TemplateFields, type EmailTemplate } from "../lib/emailTemplates";

export function PromotionalEmail() {
    const [step, setStep] = useState(1);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // Template state
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(emailTemplates[0].id);
    const [templateFields, setTemplateFields] = useState<TemplateFields>(emailTemplates[0].defaultFields);
    const [emailSubject, setEmailSubject] = useState("");

    const [adminCredentials, setAdminCredentials] = useState({ email: "", password: "" });

    // Blog selection state
    const [blogs, setBlogs] = useState<BlogRecord[]>([]);
    const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
    const [selectedBlogId, setSelectedBlogId] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const perPage = 50;

    const selectedTemplate = useMemo(() => emailTemplates.find(t => t.id === selectedTemplateId)!, [selectedTemplateId]);

    // Live-rendered HTML
    const renderedHtml = useMemo(() => selectedTemplate.render(templateFields), [selectedTemplate, templateFields]);

    const fetchBlogs = useCallback(async () => {
        setIsLoadingBlogs(true);
        try {
            const res = await BlogService.getBlogs(1, 100, "-created", "is_active = true");
            setBlogs(res.items);
        } catch (error) {
            console.error("Failed to fetch blogs:", error);
        } finally {
            setIsLoadingBlogs(false);
        }
    }, []);

    useEffect(() => {
        if (selectedTemplateId === 'blog' && blogs.length === 0) {
            fetchBlogs();
        }
    }, [selectedTemplateId, blogs.length, fetchBlogs]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            let filter = "newsletter = true";
            if (search) {
                filter += ` && (name ~"${search}"|| email ~"${search}"|| display_name ~"${search}")`;
            }
            const res = await UserService.getUsers(page, perPage, "-created", filter);
            setUsers(res.items);
            setTotalPages(res.totalPages);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(userId)) newSelected.delete(userId);
        else newSelected.add(userId);
        setSelectedUserIds(newSelected);
        setSelectAll(false);
    };

    const handleSelectAll = () => {
        if (selectAll) setSelectedUserIds(new Set());
        else setSelectedUserIds(new Set(users.map(u => u.id)));
        setSelectAll(!selectAll);
    };

    const selectTemplate = (t: EmailTemplate) => {
        setSelectedTemplateId(t.id);
        setTemplateFields({ ...t.defaultFields });
    };

    const updateField = (key: keyof TemplateFields, value: string) => {
        setTemplateFields(prev => ({ ...prev, [key]: value }));
    };

    const handleBlogSelect = (blogId: string) => {
        setSelectedBlogId(blogId);
        if (!blogId) return;

        const blog = blogs.find(b => b.id === blogId);
        if (!blog) return;

        setEmailSubject(blog.title);
        setTemplateFields(prev => ({
            ...prev,
            heading: blog.title,
            subheading: blog.category || `Published on ${new Date(blog.published_date).toLocaleDateString()}`,
            bodyText: blog.excerpt || "Check out our latest article!",
            ctaUrl: `https://daharengineer.com/blog/${blog.page_name}`,
            ctaText: "Read More"
        }));
    };

    const handleSend = async () => {
        if (!emailSubject || !renderedHtml) return;
        setIsSending(true);
        try {
            const res = await EmailService.sendPromotionalEmail({
                userIds: Array.from(selectedUserIds),
                subject: emailSubject,
                body: renderedHtml,
                allUsers: selectAll && selectedUserIds.size === users.length,
                adminEmail: adminCredentials.email,
                adminPassword: adminCredentials.password,
            });
            setResult(res);
            setStep(4);
        } catch (error: any) {
            let message = "Failed to send emails. Please try again.";
            if (error.status === 404) message = "Backend endpoint not found. Please ensure the PocketBase JS hook is installed.";
            setResult({ success: false, message });
            setStep(4);
        } finally {
            setIsSending(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSelectedUserIds(new Set());
        setSelectAll(false);
        setEmailSubject("");
        setTemplateFields(emailTemplates[0].defaultFields);
        setSelectedTemplateId(emailTemplates[0].id);
        setSelectedBlogId("");
        setAdminCredentials({ email: "", password: "" });
        setResult(null);
    };

    return (
        <div className="w-full mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Promotional Email</h1>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 bg-secondary/20 p-4 rounded-xl border border-white/5 shadow-sm">
                <StepItem num={1} label="Recipients" active={step === 1} completed={step > 1} />
                <div className="h-px w-8 bg-white/5" />
                <StepItem num={2} label="Design" active={step === 2} completed={step > 2} />
                <div className="h-px w-8 bg-white/5" />
                <StepItem num={3} label="Confirm" active={step === 3} completed={step > 3} />
                <div className="h-px w-8 bg-white/5" />
                <StepItem num={4} label="Result" active={step === 4} completed={false} />
            </div>

            <div className="bg-secondary/20 border border-white/5 rounded-xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">

                {/* ─── Step 1: Recipients ─── */}
                {step === 1 && (
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text" placeholder="Search users..."
                                    value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-white/5 bg-secondary text-white rounded-md focus:ring-2 focus:ring-army-500 transition-all outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <span className="text-white/40">{selectedUserIds.size} selected</span>
                                <button onClick={handleSelectAll} className="text-white hover:underline">
                                    {selectAll ? "Deselect All" : "Select All Page"}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[600px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-white/40">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" /><span>Fetching users...</span>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-white/[0.02] text-white/40 border-b">
                                        <tr>
                                            <th className="px-6 py-3 w-10">
                                                <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                                                    className="rounded border-white/5 text-white focus:ring-army-500" />
                                            </th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map(user => (
                                            <tr key={user.id} className={cn("hover:bg-white/5 transition-colors cursor-pointer", selectedUserIds.has(user.id) && "bg-white/[0.02]")} onClick={() => toggleUser(user.id)}>
                                                <td className="px-6 py-4"><input type="checkbox" checked={selectedUserIds.has(user.id)} onChange={() => { }} className="rounded border-white/5 text-white" /></td>
                                                <td className="px-6 py-4 font-medium text-white">{user.name || user.display_name || "N/A"}</td>
                                                <td className="px-6 py-4 text-white/40">{user.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                            <button onClick={() => setStep(2)} disabled={selectedUserIds.size === 0} className="px-6 py-2 bg-white/5 text-white rounded-md font-medium hover:bg-black transition-colors disabled:opacity-50">
                                Next: Design Email
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Step 2: Design (Template + Fields + Live Preview) ─── */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col">
                        {/* Template Selector Bar */}
                        <div className="p-4 border-b border-white/5">
                            <p className="text-xs font-semibold text-white/40 mb-3">Choose Template</p>
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {emailTemplates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => selectTemplate(t)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 text-left transition-all whitespace-nowrap",
                                            selectedTemplateId === t.id
                                                ? "border-white/5 bg-white/[0.02] shadow-sm"
                                                : "border-white/5 hover:border-white/5"
                                        )}
                                    >
                                        <span className="text-2xl">{t.emoji}</span>
                                        <div>
                                            <div className="text-sm font-bold text-white">{t.name}</div>
                                            <div className="text-[11px] text-white/40">{t.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor + Preview Split */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left: Fields Editor */}
                            <div className="lg:w-[380px] w-full p-5 space-y-4 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-white/80">Customize Content</span>
                                </div>

                                {selectedTemplateId === 'blog' && (
                                    <div className="space-y-4 mb-6 p-4 bg-white/5/30 rounded-xl border border-white/5">
                                        <label className="block text-xs font-semibold text-white/40 mb-2 flex items-center gap-2">
                                            <Search className="w-3 h-3" /> Select Blog Post to Populate
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedBlogId}
                                                onChange={(e) => handleBlogSelect(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-white/5 bg-secondary text-white rounded-md focus:ring-2 focus:ring-army-500 outline-none transition-all appearance-none pr-10"
                                            >
                                                <option value="">-- Choose an article --</option>
                                                {blogs.map(b => (
                                                    <option key={b.id} value={b.id}>{b.title}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                {isLoadingBlogs ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40 rotate-90" />}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-white/40 italic">Picking a blog will automatically fill the fields below.</p>
                                    </div>
                                )}

                                <FieldInput label="Email Subject" value={emailSubject} onChange={setEmailSubject} placeholder="Enter the subject line..." />
                                <div className="h-px bg-white/5" />
                                <FieldInput label="Heading" value={templateFields.heading} onChange={v => updateField("heading", v)} />
                                <FieldInput label="Subheading" value={templateFields.subheading} onChange={v => updateField("subheading", v)} />
                                <FieldInput label="Body Text" value={templateFields.bodyText} onChange={v => updateField("bodyText", v)} multiline />
                                <div className="grid grid-cols-2 gap-3">
                                    <FieldInput label="Button Text" value={templateFields.ctaText} onChange={v => updateField("ctaText", v)} />
                                    <FieldInput label="Button URL" value={templateFields.ctaUrl} onChange={v => updateField("ctaUrl", v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-white/40 mb-1">Accent Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={templateFields.accentColor}
                                                onChange={e => updateField("accentColor", e.target.value)}
                                                className="w-8 h-8 rounded border border-white/5 cursor-pointer"
                                            />
                                            <span className="text-xs font-mono text-white/40">{templateFields.accentColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <FieldInput label="Footer Text" value={templateFields.footerText} onChange={v => updateField("footerText", v)} />
                            </div>

                            {/* Right: Live Preview */}
                            <div className="flex-1 flex flex-col bg-black/20 min-h-[400px]">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-secondary">
                                    <Eye className="w-4 h-4 text-white/40" />
                                    <span className="text-xs font-semibold text-white/40">Live Preview</span>
                                </div>
                                <div className="flex-1 p-4 overflow-auto">
                                    <iframe
                                        srcDoc={renderedHtml}
                                        title="Email Preview"
                                        className="w-full h-full min-h-[500px] bg-black/20 rounded-lg shadow-inner border border-white/5"
                                        sandbox=""
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="p-4 border-t border-white/5 flex items-center justify-between">
                            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-2 text-white/60 font-medium hover:text-white">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!emailSubject || !templateFields.heading}
                                className="px-6 py-2 bg-white/5 text-white rounded-md font-medium hover:bg-black transition-colors disabled:opacity-50"
                            >
                                Next: Confirm & Send
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Step 3: Confirm ─── */}
                {step === 3 && (
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Left: Summary & Auth */}
                        <div className="lg:w-[450px] w-full p-8 flex flex-col justify-center space-y-6 border-b lg:border-b-0 lg:border-r border-white/5">
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-white">Ready to send?</h2>
                                <p className="text-sm text-white/40">
                                    Sending to <span className="font-bold text-white">{selectedUserIds.size} users</span> from <span className="italic">no-reply@daharengineer.com</span>
                                </p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="text-xs font-semibold text-white/40 tracking-wider mb-1">Subject</div>
                                <div className="text-sm font-medium text-white mb-2">{emailSubject}</div>
                                <div className="text-xs font-semibold text-white/40 tracking-wider mb-1">Template</div>
                                <div className="text-sm text-white/60">{selectedTemplate.emoji} {selectedTemplate.name}</div>
                            </div>

                            {/* Admin Authorization */}
                            <div className="space-y-3">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    Admin Authorization
                                </div>
                                <input type="email" placeholder="Admin Email" value={adminCredentials.email}
                                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-white/5 bg-secondary text-white rounded-md focus:ring-2 focus:ring-army-500 outline-none" />
                                <input type="password" placeholder="Admin Password" value={adminCredentials.password}
                                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-white/5 bg-secondary text-white rounded-md focus:ring-2 focus:ring-army-500 outline-none" />
                                <p className="text-[10px] text-white/40">Used once to authorize this delivery.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setStep(2)} className="px-5 py-2 border border-white/5 rounded-md font-medium text-white/60 hover:bg-white/5">
                                    Back
                                </button>
                                <button onClick={handleSend} disabled={isSending || !adminCredentials.email || !adminCredentials.password}
                                    className="flex-1 px-6 py-2 bg-white/5 text-white rounded-md font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send Emails
                                </button>
                            </div>
                        </div>

                        {/* Right: Full HTML Preview */}
                        <div className="flex-1 flex flex-col bg-white/[0.02] min-h-[400px]">
                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-secondary">
                                <Eye className="w-4 h-4 text-white/40" />
                                <span className="text-xs font-semibold text-white/40 tracking-wider">Final Preview</span>
                            </div>
                            <div className="flex-1 p-4 overflow-auto">
                                <iframe srcDoc={renderedHtml} title="Final Email Preview" className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-inner border border-white/5" sandbox="" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Step 4: Result ─── */}
                {step === 4 && (
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500 scale-110",
                            result?.success ? "bg-army-500 text-white" : "bg-red-100 text-red-600"
                        )}>
                            {result?.success ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">
                                {result?.success ? "Email Sent Successfully!" : "Sending Failed"}
                            </h2>
                            <p className="text-white/40 max-w-sm mx-auto">
                                {result?.message || (result?.success ? "Your promotional campaign has been processed." : "Something went wrong.")}
                            </p>
                        </div>
                        <button onClick={reset} className="mt-6 px-8 py-2 bg-white/5 text-white rounded-md font-medium hover:bg-white/5 transition-colors">
                            Start New Campaign
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Reusable sub-components ──────────────────────────────

function FieldInput({ label, value, onChange, placeholder, multiline }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
    const cls = "w-full px-3 py-2 text-sm border border-white/5 bg-secondary text-white rounded-md focus:ring-2 focus:ring-army-500 outline-none transition-all";
    return (
        <div>
            <label className="block text-xs font-semibold text-white/40 mb-1">{label}</label>
            {multiline ? (
                <textarea rows={4} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cn(cls, "resize-none")} />
            ) : (
                <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
            )}
        </div>
    );
}

function StepItem({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) {
    return (
        <div className={cn("flex items-center gap-2 transition-all", active ? "opacity-100" : (completed ? "opacity-100" : "opacity-40"))}>
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                active ? "bg-white/5 text-white" : (completed ? "bg-army-500 text-white" : "bg-white/5 text-white/40")
            )}>
                {completed ? <CheckCircle2 className="w-4 h-4" /> : num}
            </div>
            <span className={cn("text-sm font-semibold", active ? "text-white" : "text-white/40")}>{label}</span>
        </div>
    );
}

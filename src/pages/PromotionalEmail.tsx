import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Send, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Loader2, Info, Eye, ArrowLeft } from "lucide-react";
import { UserService, EmailService, type UserRecord } from "../services/api";
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

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const perPage = 50;

    const selectedTemplate = useMemo(() => emailTemplates.find(t => t.id === selectedTemplateId)!, [selectedTemplateId]);

    // Live-rendered HTML
    const renderedHtml = useMemo(() => selectedTemplate.render(templateFields), [selectedTemplate, templateFields]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const filter = search ? `(name ~ "${search}" || email ~ "${search}" || display_name ~ "${search}")` : "";
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
        setAdminCredentials({ email: "", password: "" });
        setResult(null);
    };

    return (
        <div className="w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Promotional Email</h1>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <StepItem num={1} label="Recipients" active={step === 1} completed={step > 1} />
                <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
                <StepItem num={2} label="Design" active={step === 2} completed={step > 2} />
                <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
                <StepItem num={3} label="Confirm" active={step === 3} completed={step > 3} />
                <div className="h-px w-8 bg-slate-200 dark:bg-slate-700" />
                <StepItem num={4} label="Result" active={step === 4} completed={false} />
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">

                {/* ─── Step 1: Recipients ─── */}
                {step === 1 && (
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text" placeholder="Search users..."
                                    value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <span className="text-slate-500 dark:text-slate-400">{selectedUserIds.size} selected</span>
                                <button onClick={handleSelectAll} className="text-slate-900 dark:text-slate-100 hover:underline">
                                    {selectAll ? "Deselect All" : "Select All Page"}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[600px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" /><span>Fetching users...</span>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-3 w-10">
                                                <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                                                    className="rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-slate-900" />
                                            </th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {users.map(user => (
                                            <tr key={user.id} className={cn("hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer", selectedUserIds.has(user.id) && "bg-slate-50 dark:bg-slate-700/50")} onClick={() => toggleUser(user.id)}>
                                                <td className="px-6 py-4"><input type="checkbox" checked={selectedUserIds.has(user.id)} onChange={() => { }} className="rounded border-slate-300 dark:border-slate-600 text-slate-900" /></td>
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{user.name || user.display_name || "N/A"}</td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                            <button onClick={() => setStep(2)} disabled={selectedUserIds.size === 0} className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md font-medium hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50">
                                Next: Design Email
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Step 2: Design (Template + Fields + Live Preview) ─── */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col">
                        {/* Template Selector Bar */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Choose Template</p>
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {emailTemplates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => selectTemplate(t)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 text-left transition-all whitespace-nowrap",
                                            selectedTemplateId === t.id
                                                ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-700/50 shadow-sm"
                                                : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                                        )}
                                    >
                                        <span className="text-2xl">{t.emoji}</span>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.name}</div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor + Preview Split */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left: Fields Editor */}
                            <div className="lg:w-[380px] w-full p-5 space-y-4 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Customize Content</span>
                                </div>

                                <FieldInput label="Email Subject" value={emailSubject} onChange={setEmailSubject} placeholder="Enter the subject line..." />
                                <div className="h-px bg-slate-100 dark:bg-slate-700" />
                                <FieldInput label="Heading" value={templateFields.heading} onChange={v => updateField("heading", v)} />
                                <FieldInput label="Subheading" value={templateFields.subheading} onChange={v => updateField("subheading", v)} />
                                <FieldInput label="Body Text" value={templateFields.bodyText} onChange={v => updateField("bodyText", v)} multiline />
                                <div className="grid grid-cols-2 gap-3">
                                    <FieldInput label="Button Text" value={templateFields.ctaText} onChange={v => updateField("ctaText", v)} />
                                    <FieldInput label="Button URL" value={templateFields.ctaUrl} onChange={v => updateField("ctaUrl", v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Accent Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={templateFields.accentColor}
                                                onChange={e => updateField("accentColor", e.target.value)}
                                                className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                                            />
                                            <span className="text-xs font-mono text-slate-500">{templateFields.accentColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <FieldInput label="Footer Text" value={templateFields.footerText} onChange={v => updateField("footerText", v)} />
                            </div>

                            {/* Right: Live Preview */}
                            <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900/50 min-h-[400px]">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Preview</span>
                                </div>
                                <div className="flex-1 p-4 overflow-auto">
                                    <iframe
                                        srcDoc={renderedHtml}
                                        title="Email Preview"
                                        className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-inner border border-slate-200 dark:border-slate-700"
                                        sandbox=""
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!emailSubject || !templateFields.heading}
                                className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md font-medium hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50"
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
                        <div className="lg:w-[400px] w-full p-8 flex flex-col justify-center space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto lg:mx-0">
                                <Info className="w-7 h-7 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ready to send?</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Sending to <span className="font-bold text-slate-900 dark:text-slate-100">{selectedUserIds.size} users</span> from <span className="italic">no-reply@daharengineer.com</span>
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</div>
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{emailSubject}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Template</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">{selectedTemplate.emoji} {selectedTemplate.name}</div>
                            </div>

                            {/* Admin Authorization */}
                            <div className="space-y-3">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    Admin Authorization
                                </div>
                                <input type="email" placeholder="Admin Email" value={adminCredentials.email}
                                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none" />
                                <input type="password" placeholder="Admin Password" value={adminCredentials.password}
                                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none" />
                                <p className="text-[10px] text-slate-400">Used once to authorize this delivery.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setStep(2)} className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-md font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900">
                                    Back
                                </button>
                                <button onClick={handleSend} disabled={isSending || !adminCredentials.email || !adminCredentials.password}
                                    className="flex-1 px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md font-bold hover:bg-black dark:hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send Emails
                                </button>
                            </div>
                        </div>

                        {/* Right: Full HTML Preview */}
                        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900/50 min-h-[400px]">
                            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Final Preview</span>
                            </div>
                            <div className="flex-1 p-4 overflow-auto">
                                <iframe srcDoc={renderedHtml} title="Final Email Preview" className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-inner border border-slate-200 dark:border-slate-700" sandbox="" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Step 4: Result ─── */}
                {step === 4 && (
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500 scale-110",
                            result?.success ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"
                        )}>
                            {result?.success ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {result?.success ? "Email Sent Successfully!" : "Sending Failed"}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                {result?.message || (result?.success ? "Your promotional campaign has been processed." : "Something went wrong.")}
                            </p>
                        </div>
                        <button onClick={reset} className="mt-6 px-8 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
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
    const cls = "w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none transition-all";
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</label>
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
                active ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : (completed ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500")
            )}>
                {completed ? <CheckCircle2 className="w-4 h-4" /> : num}
            </div>
            <span className={cn("text-sm font-semibold", active ? "text-slate-900 dark:text-slate-100" : "text-slate-500")}>{label}</span>
        </div>
    );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft, Save, Loader2, Plus,
    Video as VideoIcon, FileText, Settings, Image as ImageIcon,
    Bold, Italic, Underline as UnderlineIcon, List as ListIcon,
    ListOrdered, Type,
    Heading1, Heading2, Sigma,
    Table as TableIcon, PlusSquare, Trash2,
    AlignLeft, AlignCenter, AlignRight,
    Link as LinkIcon, Upload, File as FileIcon
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImageExtension } from "../components/course/ResizableImageExtension";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Mathematics } from "../components/blog/MathematicsExtension";
import { Video } from "../components/course/VideoExtension";
import { FileAttachmentExtension } from "../components/course/FileAttachmentExtension";
import { OnlineCourseService, MentorService, type OnlineCourseRecord, type OnlineCourseModuleRecord, type OnlineCourseStepRecord, type MentorRecord } from "../services/api";
import { cn } from "../lib/utils";
import 'katex/dist/katex.min.css';

type EditorMode = "course" | "module" | "step";

export function OnlineCourseEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data State
    const [course, setCourse] = useState<OnlineCourseRecord | null>(null);
    const [modules, setModules] = useState<OnlineCourseModuleRecord[]>([]);
    const [steps, setSteps] = useState<Record<string, OnlineCourseStepRecord[]>>({}); // moduleId -> steps

    // Selection state
    const [selectedLevel, setSelectedLevel] = useState<EditorMode>("course");
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    const [mentors, setMentors] = useState<MentorRecord[]>([]);

    // Form State (Dynamic based on selection)
    const [formData, setFormData] = useState<any>({});

    // File Manager State
    const [isUploadingSidebar, setIsUploadingSidebar] = useState(false);
    const [isDraggingOverSidebar, setIsDraggingOverSidebar] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (id) {
            fetchCourseData();
        }
    }, [id]);

    const fetchCourseData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Fetch Course
            const courseData = await OnlineCourseService.getOnlineCourses(1, 1, "", `id = "${id}"`);
            if (courseData.items.length > 0) {
                setCourse(courseData.items[0]);
                setFormData(courseData.items[0]);

                // Fetch Modules
                const modulesData = await OnlineCourseService.getModules(id);
                setModules(modulesData);

                // Fetch Steps for all modules
                const stepsMap: Record<string, OnlineCourseStepRecord[]> = {};
                for (const module of modulesData) {
                    const moduleSteps = await OnlineCourseService.getSteps(module.id);
                    stepsMap[module.id] = moduleSteps;
                }
                setSteps(stepsMap);
            }
        } catch (error) {
            console.error("Error fetching course content:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMentors = async () => {
        try {
            const result = await MentorService.getMentors(1, 100, "name");
            setMentors(result.items);
        } catch (error) {
            console.error("Error fetching mentors:", error);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    // Tiptap Editor Setup
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            Heading.configure({ levels: [1, 2, 3] }),
            Underline,
            Link.configure({ openOnClick: false }),
            ResizableImageExtension,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#2563eb] dark:text-[#60a5fa] underline decoration-[#2563eb] dark:decoration-[#60a5fa] cursor-pointer font-medium',
                },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
            Placeholder.configure({ placeholder: 'Start building your lesson content...' }),
            BulletList,
            OrderedList,
            Mathematics,
            Video,
            FileAttachmentExtension,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: "",
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[500px] p-6 pb-32 editor-canvas',
            },
            handleDrop(view, event, _slice, _moved) {
                if (event.dataTransfer && event.dataTransfer.types.includes('application/json')) {
                    const data = event.dataTransfer.getData('application/json');
                    try {
                        const { url, name } = JSON.parse(data);
                        const { clientX, clientY } = event;
                        const pos = view.posAtCoords({ left: clientX, top: clientY });
                        if (pos) {
                            const ext = name.split('.').pop()?.toLowerCase();
                            if (['mp4', 'webm', 'ogg', 'mkv'].includes(ext as string)) {
                                editor?.chain().focus().insertContentAt(pos.pos, `<video src="${url}" controls="true"></video>`).run();
                            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext as string)) {
                                editor?.chain().focus().insertContentAt(pos.pos, `<img src="${url}" alt="${name}" />`).run();
                            } else {
                                editor?.chain().focus().insertContentAt(pos.pos, {
                                    type: 'fileAttachment',
                                    attrs: { href: url, fileName: name, fileSize: '' }
                                }).run();
                            }
                            event.preventDefault();
                            return true;
                        }
                    } catch (e) { }
                }
                return false;
            }
        },
    });

    const [, setUpdateCounter] = useState(0);
    useEffect(() => {
        if (editor) {
            const update = () => setUpdateCounter(c => c + 1);
            editor.on('transaction', update);
            return () => { editor.off('transaction', update); };
        }
    }, [editor]);

    // Handle Selection Change
    const handleSelectCourse = () => {
        if (selectedLevel === "step" && editor) {
            saveStepContent();
        }
        setSelectedLevel("course");
        setSelectedModuleId(null);
        setSelectedStepId(null);
        setFormData(course);
    };

    const handleSelectModule = (module: OnlineCourseModuleRecord) => {
        if (selectedLevel === "step" && editor) {
            saveStepContent();
        }
        setSelectedLevel("module");
        setSelectedModuleId(module.id);
        setSelectedStepId(null);
        setFormData(module);
    };

    const handleSelectStep = (step: OnlineCourseStepRecord) => {
        if (selectedLevel === "step" && editor) {
            saveStepContent();
        }
        setSelectedLevel("step");
        setSelectedStepId(step.id);
        setSelectedModuleId(step.moduleId);
        setFormData(step);
        if (editor) {
            editor.commands.setContent(step.content || "");
        }
    };

    const saveStepContent = async () => {
        if (selectedLevel === "step" && selectedStepId && editor) {
            const content = editor.getHTML();
            try {
                await OnlineCourseService.updateStep(selectedStepId, { content });
                // Update local state
                setSteps(prev => {
                    const newSteps = { ...prev };
                    const moduleSteps = [...(newSteps[selectedModuleId!] || [])];
                    const idx = moduleSteps.findIndex(s => s.id === selectedStepId);
                    if (idx !== -1) {
                        moduleSteps[idx] = { ...moduleSteps[idx], content };
                        newSteps[selectedModuleId!] = moduleSteps;
                    }
                    return newSteps;
                });
            } catch (err) {
                console.error("Failed to auto-save step content");
            }
        }
    };

    const getOriginalFilename = (filename: string) => {
        if (!filename) return "";
        const parts = filename.split('.');
        if (parts.length < 2) return filename;
        const ext = parts.pop();
        const namePart = parts.join('.');
        const pbSuffixRegex = /_[a-zA-Z0-9]{10}$/;
        if (pbSuffixRegex.test(namePart)) {
            return namePart.replace(pbSuffixRegex, '') + '.' + ext;
        }
        return filename;
    };

    const uploadFile = async (file: File) => {
        if (!selectedStepId || !selectedModuleId) return null;

        try {
            const formData = new FormData();

            // Append existing files to prevent PocketBase from overwriting them
            const currentStep = steps[selectedModuleId!]?.find(s => s.id === selectedStepId);
            if (currentStep?.files) {
                currentStep.files.forEach(filename => {
                    formData.append('files', filename);
                });
            }

            formData.append('files', file);
            const updated = await OnlineCourseService.updateStep(selectedStepId, formData);

            setSteps(prev => {
                const newSteps = { ...prev };
                const moduleSteps = [...(newSteps[selectedModuleId!] || [])];
                const idx = moduleSteps.findIndex(s => s.id === selectedStepId);
                if (idx !== -1) {
                    moduleSteps[idx] = updated;
                    newSteps[selectedModuleId!] = moduleSteps;
                }
                return newSteps;
            });

            const fileName = updated.files?.[updated.files.length - 1];
            if (!fileName) return null;

            return {
                url: OnlineCourseService.getFileUrl(updated, fileName),
                name: fileName
            };
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload file");
            return null;
        }
    };

    const handleSidebarDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOverSidebar(false);

        const files = Array.from(e.dataTransfer.files);
        if (!files.length) return;

        setIsUploadingSidebar(true);
        for (const file of files as File[]) {
            await uploadFile(file);
        }
        setIsUploadingSidebar(false);
    };

    const handleDeleteFile = async (filename: string) => {
        if (!selectedStepId || !selectedModuleId) return;
        const currentStep = steps[selectedModuleId].find(s => s.id === selectedStepId);
        if (!currentStep) return;

        try {
            const formData = new FormData();
            const newFiles = (currentStep.files || []).filter(f => f !== filename);
            if (newFiles.length === 0) {
                formData.append('files', '');
            } else {
                newFiles.forEach(f => formData.append('files', f));
            }

            const updated = await OnlineCourseService.updateStep(selectedStepId, formData);
            setSteps(prev => {
                const newSteps = { ...prev };
                const moduleSteps = [...(newSteps[selectedModuleId] || [])];
                const idx = moduleSteps.findIndex(s => s.id === selectedStepId);
                if (idx !== -1) {
                    moduleSteps[idx] = { ...moduleSteps[idx], files: updated.files };
                    newSteps[selectedModuleId] = moduleSteps;
                }
                return newSteps;
            });
        } catch (error) {
            console.error("Delete file error:", error);
            alert("Failed to delete file");
        }
    };

    const handleDragStartFromSidebar = (e: React.DragEvent, url: string, name: string) => {
        const cleanName = getOriginalFilename(name);
        e.dataTransfer.setData('application/json', JSON.stringify({ url, name: cleanName }));
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;
            const result = await uploadFile(file);
            if (result) {
                const cleanName = getOriginalFilename(file.name);
                editor.chain().focus().insertContent({ type: 'image', attrs: { src: result.url, alt: cleanName } }).run();
            }
        };
        input.click();
    };

    const handleVideoUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;
            const result = await uploadFile(file);
            if (result) {
                const cleanName = getOriginalFilename(file.name);
                (editor.chain().focus() as any).setVideo({ src: result.url, title: cleanName }).run();
            }
        };
        input.click();
    };

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        const { from, to } = editor.state.selection;
        if (from === to) {
            // If no text is selected, insert the URL as the text and link it
            editor.chain().focus().insertContent(`<a href="${url}">${url}</a> `).run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (selectedLevel === "course" && course) {
                const formDataToUpload = new FormData();
                if (formData.title !== undefined) formDataToUpload.append("title", formData.title);
                if (formData.description !== undefined) formDataToUpload.append("description", formData.description);
                if (formData.features !== undefined) formDataToUpload.append("features", formData.features);
                if (formData.deliverables !== undefined) formDataToUpload.append("deliverables", formData.deliverables);
                if (formData.status !== undefined) formDataToUpload.append("status", formData.status);
                if (formData.price !== undefined && !isNaN(formData.price)) formDataToUpload.append("price", String(formData.price));
                if (formData.discountPrice !== undefined && !isNaN(formData.discountPrice)) formDataToUpload.append("discountPrice", String(formData.discountPrice));
                if (formData.duration !== undefined) formDataToUpload.append("duration", formData.duration);
                if (formData.category !== undefined) formDataToUpload.append("category", formData.category);
                if (formData.instructor !== undefined) formDataToUpload.append("instructor", formData.instructor);
                if (formData.level !== undefined) formDataToUpload.append("level", formData.level);

                // Handle Thumbnail File
                if (formData.thumbnail instanceof File) {
                    formDataToUpload.append("thumbnail", formData.thumbnail);
                }

                const updatedCourse = await OnlineCourseService.updateOnlineCourse(course.id, formDataToUpload);
                setCourse(updatedCourse);
                setFormData(updatedCourse);
            } else if (selectedLevel === "module" && selectedModuleId) {
                // Whitelist only valid module fields
                const payload: Record<string, any> = {};
                if (formData.title !== undefined) payload.title = formData.title;
                if (formData.order !== undefined) payload.order = formData.order;
                if (formData.courseId !== undefined) payload.courseId = formData.courseId;
                const updatedModule = await OnlineCourseService.updateModule(selectedModuleId, payload);
                setModules(prev => prev.map(m => m.id === selectedModuleId ? updatedModule : m));
            } else if (selectedLevel === "step" && selectedStepId) {
                const content = editor?.getHTML() || "";

                // Whitelist ONLY valid step fields — never send system fields or 'files'
                const payload: Record<string, any> = {
                    content,
                };
                if (formData.title !== undefined) payload.title = formData.title;
                if (formData.moduleId !== undefined) payload.moduleId = formData.moduleId;
                if (formData.type !== undefined) payload.type = formData.type;
                if (formData.order !== undefined) payload.order = formData.order;

                console.log("Save payload keys:", Object.keys(payload));
                const updated = await OnlineCourseService.updateStep(selectedStepId, payload);

                setSteps(prev => {
                    const newSteps = { ...prev };
                    const moduleSteps = [...(newSteps[selectedModuleId!] || [])];
                    const idx = moduleSteps.findIndex(s => s.id === selectedStepId);
                    if (idx !== -1) {
                        moduleSteps[idx] = updated;
                        newSteps[selectedModuleId!] = moduleSteps;
                    }
                    return newSteps;
                });
            }
        } catch (err: any) {
            console.error("Save error:", err);
            console.error("Save error response:", err?.response);
            console.error("Save error data:", err?.data);
            alert("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const syncCourseCounters = async (updatedModules?: OnlineCourseModuleRecord[], updatedSteps?: Record<string, OnlineCourseStepRecord[]>) => {
        if (!id || !course) return;

        const currentModules = updatedModules || modules;
        const currentSteps = updatedSteps || steps;

        const totalModules = currentModules.length;
        let totalSteps = 0;
        Object.values(currentSteps).forEach(moduleSteps => {
            totalSteps += moduleSteps.length;
        });

        try {
            // Only update if counters actually changed
            if (course.totalModules === totalModules && course.totalSteps === totalSteps) return;

            const updatedCourse = await OnlineCourseService.updateOnlineCourse(id, {
                totalModules,
                totalSteps
            });
            setCourse(updatedCourse);
        } catch (err) {
            console.error("Error syncing course counters:", err);
        }
    };

    const addModule = async () => {
        if (!id) return;
        try {
            const newModule = await OnlineCourseService.createModule({
                courseId: id,
                title: "New Module",
                order: modules.length + 1
            });
            const newModules = [...modules, newModule];
            setModules(newModules);
            const newSteps = { ...steps, [newModule.id]: [] };
            setSteps(newSteps);
            handleSelectModule(newModule);
            syncCourseCounters(newModules, newSteps);
        } catch (err) {
            console.error("Error adding module:", err);
        }
    };

    const addStep = async (moduleId: string) => {
        try {
            const moduleSteps = steps[moduleId] || [];
            const newStep = await OnlineCourseService.createStep({
                moduleId,
                title: "New Lesson",
                type: "video",
                order: moduleSteps.length + 1,
                content: ""
            });
            const newSteps = {
                ...steps,
                [moduleId]: [...(steps[moduleId] || []), newStep]
            };
            setSteps(newSteps);
            handleSelectStep(newStep);
            syncCourseCounters(modules, newSteps);
        } catch (err) {
            console.error("Error adding step:", err);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!window.confirm("Are you sure you want to delete this module and all its lessons?")) return;

        try {
            // 1. Delete all steps first (cascading)
            const moduleSteps = steps[moduleId] || [];
            for (const step of moduleSteps) {
                await OnlineCourseService.deleteStep(step.id);
            }

            // 2. Delete the module
            await OnlineCourseService.deleteModule(moduleId);

            // 3. Update local state
            const newModules = modules.filter(m => m.id !== moduleId);
            setModules(newModules);
            const newSteps = { ...steps };
            delete newSteps[moduleId];
            setSteps(newSteps);

            // 4. Reset selection if needed
            if (selectedModuleId === moduleId) {
                handleSelectCourse();
            }

            // 5. Sync counters
            syncCourseCounters(newModules, newSteps);
        } catch (err) {
            console.error("Error deleting module:", err);
            alert("Failed to delete module");
        }
    };

    const handleDeleteStep = async (moduleId: string, stepId: string) => {
        if (!window.confirm("Are you sure you want to delete this lesson?")) return;

        try {
            await OnlineCourseService.deleteStep(stepId);

            // Update local state
            const newSteps = { ...steps };
            newSteps[moduleId] = (newSteps[moduleId] || []).filter(s => s.id !== stepId);
            setSteps(newSteps);

            // Reset selection if needed
            if (selectedStepId === stepId) {
                handleSelectModule(modules.find(m => m.id === moduleId)!);
            }

            // Sync counters
            syncCourseCounters(modules, newSteps);
        } catch (err) {
            console.error("Error deleting step:", err);
            alert("Failed to delete lesson");
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-20" />
                <span className="text-sm font-medium">Preparing Editor...</span>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top Navigation */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => navigate("/online-course")} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors shrink-0">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {course?.title} <span className="mx-2 text-slate-300">/</span>
                        <span className="text-slate-500 font-medium">Content Editor</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                <style>{`
                    .editor-canvas ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
                    .editor-canvas ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
                    .editor-canvas li { display: list-item !important; margin-bottom: 0.25rem !important; }
                    .editor-canvas h1, .editor-canvas h2, .editor-canvas h3 { margin-top: 1.5rem !important; margin-bottom: 1rem !important; font-weight: 700 !important; }
                    .editor-canvas p { margin-bottom: 1rem !important; line-height: 1.6 !important; }
                    .editor-canvas table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0; overflow: hidden; }
                    .editor-canvas table td, .editor-canvas table th { min-width: 1em; border: 1px solid #ced4da; padding: 3px 5px; vertical-align: top; box-sizing: border-box; position: relative; }
                    .editor-canvas table th { font-weight: bold; text-align: left; background-color: #f8f9fa; }
                    .editor-canvas .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(200, 200, 255, 0.4); pointer-events: none; }
                    .editor-canvas .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #adf; pointer-events: none; }
                    .editor-canvas video { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
                `}</style>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 transition-colors">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">Curriculum</span>
                        <button onClick={addModule} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Add Module">
                            <Plus className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {/* Course Metadata Link */}
                        <SidebarItem
                            label="Course Settings"
                            icon={Settings}
                            active={selectedLevel === "course"}
                            onClick={handleSelectCourse}
                        />

                        <div className="h-4" />

                        {modules.map((module, mIdx) => (
                            <div key={module.id} className="space-y-1">
                                <div className={cn(
                                    "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all cursor-pointer",
                                    selectedModuleId === module.id && selectedLevel === "module"
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                                )} onClick={() => handleSelectModule(module)}>
                                    <div className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-slate-200 dark:bg-slate-700 rounded text-slate-500">
                                        {mIdx + 1}
                                    </div>
                                    <span className="text-xs font-semibold truncate flex-1">{module.title}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addStep(module.id); }}
                                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                                            title="Add Lesson"
                                        >
                                            <Plus className="w-3.5 h-3.5 text-slate-500" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                                            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded transition-all"
                                            title="Delete Module"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="ml-7 border-l-2 border-slate-100 dark:border-slate-800 pl-2 space-y-1">
                                    {(steps[module.id] || []).map((step) => (
                                        <div
                                            key={step.id}
                                            onClick={() => handleSelectStep(step)}
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-1 rounded-md text-[11px] cursor-pointer transition-all",
                                                selectedStepId === step.id
                                                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                            )}
                                        >
                                            <div className="shrink-0">
                                                {step.type === "video" ? <VideoIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                            </div>
                                            <span className="truncate flex-1 font-medium">{step.title}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteStep(module.id, step.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded transition-all"
                                                title="Delete Lesson"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content / Editor */}
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
                    {selectedLevel === "step" && editor ? (
                        <div className="flex-1 flex flex-row overflow-hidden w-full relative">
                            {/* Editor Main Area */}
                            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 shadow-sm z-0">
                                {/* Editor Toolbar */}
                                <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center px-4 gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                                    <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-800">
                                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} title="H1" />
                                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={Heading2} title="H2" />
                                        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} icon={Type} title="Text" />
                                    </div>
                                    <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} title="Bold" />
                                        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} title="Italic" />
                                        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={UnderlineIcon} title="Underline" />
                                        <ToolbarButton onClick={setLink} active={editor.isActive('link')} icon={LinkIcon} title="Link" />
                                    </div>
                                    <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
                                        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
                                        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />
                                    </div>
                                    <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={ListIcon} />
                                        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={ListOrdered} />
                                    </div>
                                    <div className="flex items-center gap-0.5 px-2">
                                        <ToolbarButton
                                            onClick={handleImageUpload}
                                            active={false}
                                            icon={ImageIcon}
                                            title="Upload Image"
                                        />
                                        <ToolbarButton
                                            onClick={() => {
                                                const latex = prompt("Enter LaTeX formula (e.g. E=mc^2):", "\\sigma");
                                                if (latex) (editor.commands as any).setLatex(latex);
                                            }}
                                            active={false}
                                            icon={Sigma}
                                            title="Insert Equation"
                                        />
                                        <ToolbarButton
                                            onClick={handleVideoUpload}
                                            active={editor.isActive('video')}
                                            icon={VideoIcon}
                                            title="Upload Video"
                                        />
                                    </div>
                                    <div className="flex items-center gap-0.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                                        <ToolbarButton
                                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                                            active={editor.isActive('table')}
                                            icon={TableIcon}
                                            title="Insert Table"
                                        />
                                        {editor.isActive('table') && (
                                            <>
                                                <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} active={false} icon={PlusSquare} title="Add Column" />
                                                <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} active={false} icon={PlusSquare} title="Add Row" />
                                                <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} active={false} icon={Trash2} title="Delete Table" />
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6 md:p-12 transition-colors">
                                    <div className="max-w-4xl mx-auto space-y-6">
                                        {/* Step Metadata Header */}
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Lesson Title</label>
                                                <input
                                                    type="text"
                                                    value={formData.title || ""}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full text-lg font-bold bg-transparent border-none outline-none text-slate-900 dark:text-white p-0"
                                                    placeholder="Enter lesson title..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Type</label>
                                                    <select
                                                        value={formData.type || "video"}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border-none rounded-md px-2 py-1 outline-none text-slate-700 dark:text-slate-300 transition-colors"
                                                    >
                                                        <option value="video">Video Lesson</option>
                                                        <option value="text">Text / Reading</option>
                                                        <option value="quiz">Interactive Quiz</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Editor Canvas */}
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm min-h-[600px] overflow-hidden">
                                            <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/20">
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Lesson Content (HTML)</span>
                                            </div>
                                            <EditorContent editor={editor} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* File Manager Sidebar */}
                            <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col shrink-0">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shadow-sm z-10">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">File Manager</span>
                                </div>
                                <div
                                    className="flex-1 overflow-y-auto p-4 space-y-4 relative"
                                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOverSidebar(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingOverSidebar(false); }}
                                    onDrop={handleSidebarDrop}
                                >
                                    {isDraggingOverSidebar && (
                                        <div className="absolute inset-2 z-20 bg-blue-50/90 dark:bg-blue-900/90 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-sm">
                                            <p className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                                                <Upload className="w-5 h-5 animate-bounce" /> Drop files to upload
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <button
                                            className="w-full py-6 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer relative overflow-hidden group bg-white dark:bg-slate-800/50"
                                            disabled={isUploadingSidebar}
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.multiple = true;
                                                input.onchange = async (e: any) => {
                                                    const files = Array.from(e.target.files || []);
                                                    setIsUploadingSidebar(true);
                                                    for (const file of files as File[]) {
                                                        await uploadFile(file);
                                                    }
                                                    setIsUploadingSidebar(false);
                                                };
                                                input.click();
                                            }}
                                        >
                                            {isUploadingSidebar ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                                    <span className="text-[10px] font-semibold text-blue-500">Uploading...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center transition-colors">
                                                        <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Click or drag files here</span>
                                                        <span className="text-[10px] text-slate-400">Any file type supported (max. 200 MB per file)</span>
                                                    </div>
                                                </>
                                            )}
                                        </button>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Uploaded Files</h3>
                                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                                    {steps[selectedModuleId!]?.find(s => s.id === selectedStepId)?.files?.length || 0}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">Drag items directly into the text editor canvas to insert them.</p>

                                            <div className="space-y-2">
                                                {(steps[selectedModuleId!]?.find(s => s.id === selectedStepId)?.files || []).map((filename, idx) => {
                                                    const step = steps[selectedModuleId!]?.find(s => s.id === selectedStepId);
                                                    const url = step ? OnlineCourseService.getFileUrl(step, filename) : '';
                                                    return (
                                                        <div
                                                            key={idx}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                if ((e.target as HTMLElement).closest('button')) {
                                                                    e.preventDefault();
                                                                    return;
                                                                }
                                                                handleDragStartFromSidebar(e, url, filename);
                                                            }}
                                                            className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-500 hover:shadow-md transition-all group select-none relative"
                                                        >
                                                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                                                <FileIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 pr-8">
                                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" title={filename}>
                                                                    {getOriginalFilename(filename)}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Drag to insert
                                                                </p>
                                                            </div>
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    title="Delete file"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(filename); }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {!(steps[selectedModuleId!]?.find(s => s.id === selectedStepId)?.files?.length) && (
                                                    <div className="text-center py-8 text-slate-400 text-[11px] font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
                                                        No files uploaded yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto transition-colors">
                            <div className="max-w-6xl mx-auto w-full space-y-8 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {selectedLevel === "course" ? "Course Configuration" : "Module Settings"}
                                    </h2>
                                    <p className="text-sm text-slate-500">Manage high-level information and organization.</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Title</label>
                                        <input
                                            type="text"
                                            value={formData?.title || ""}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold focus:ring-1 focus:ring-slate-400 transition-all outline-none"
                                        />
                                    </div>

                                    {selectedLevel === "course" && (
                                        <>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Level</label>
                                                    <select
                                                        value={formData?.level || "beginner"}
                                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold outline-none"
                                                    >
                                                        <option value="beginner">Beginner</option>
                                                        <option value="intermediate">Intermediate</option>
                                                        <option value="advanced">Advanced</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Price (IDR)</label>
                                                    <input
                                                        type="number"
                                                        value={formData?.price ?? 0}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Discount Price (IDR)</label>
                                                    <input
                                                        type="number"
                                                        value={formData?.discountPrice ?? 0}
                                                        onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Duration</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 8 Hours"
                                                        value={formData?.duration || ""}
                                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Instructor</label>
                                                    <select
                                                        value={formData?.instructor || ""}
                                                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold outline-none"
                                                    >
                                                        <option value="">Select Instructor</option>
                                                        {mentors.map(mentor => (
                                                            <option key={mentor.id} value={mentor.id}>{mentor.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Thumbnail</label>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-40 h-24 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                        {formData.thumbnail ? (
                                                            <img
                                                                src={formData.thumbnail instanceof File ? URL.createObjectURL(formData.thumbnail) : OnlineCourseService.getFileUrl(course, formData.thumbnail)}
                                                                alt="Thumbnail Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="w-8 h-8 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <p className="text-[10px] text-slate-500">Recommended size: 1280x720px.</p>
                                                        <button
                                                            onClick={() => {
                                                                const input = document.createElement('input');
                                                                input.type = 'file';
                                                                input.accept = 'image/*';
                                                                input.onchange = (e: any) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        setFormData({ ...formData, thumbnail: file });
                                                                    }
                                                                };
                                                                input.click();
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                                        >
                                                            <Upload className="w-3.5 h-3.5" />
                                                            {formData.thumbnail ? "Change Image" : "Upload Image"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Description</label>
                                                <textarea
                                                    rows={4}
                                                    value={formData?.description || ""}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full px-3 h-32 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold focus:ring-1 focus:ring-slate-400 transition-all outline-none resize-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Features <span className="font-normal text-slate-500">(one per line, saved as dot-separated)</span></label>
                                                    <textarea
                                                        rows={4}
                                                        value={(formData?.features || "").replace(/\./g, "\n")}
                                                        onChange={(e) => setFormData({ ...formData, features: e.target.value.replace(/\n/g, ".") })}
                                                        placeholder={"Feature 1\nFeature 2\nFeature 3"}
                                                        className="w-full px-3 py-2 h-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold focus:ring-1 focus:ring-slate-400 transition-all outline-none resize-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Deliverables <span className="font-normal text-slate-500">(one per line, saved as dot-separated)</span></label>
                                                    <textarea
                                                        rows={4}
                                                        value={(formData?.deliverables || "").replace(/\./g, "\n")}
                                                        onChange={(e) => setFormData({ ...formData, deliverables: e.target.value.replace(/\n/g, ".") })}
                                                        placeholder={"Deliverable 1\nDeliverable 2\nDeliverable 3"}
                                                        className="w-full px-3 py-2 h-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold focus:ring-1 focus:ring-slate-400 transition-all outline-none resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedLevel === "module" && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Module Description</label>
                                            <textarea
                                                rows={4}
                                                value={formData?.description || ""}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold focus:ring-1 focus:ring-slate-400 transition-all outline-none resize-none"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-semibold shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                                        >
                                            {saving ? "Saving..." : "Apply Changes"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .editor-canvas h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; }
                .editor-canvas h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; }
                .editor-canvas h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
                .editor-canvas p { font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem; }
                .editor-canvas ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                .editor-canvas ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
                .editor-canvas a { color: #2563eb !important; text-decoration: underline !important; cursor: pointer !important; }
                .dark .editor-canvas a { color: #60a5fa !important; }
            `}</style>
        </div>
    );
}

function SidebarItem({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all transition-colors",
                active
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
}

function ToolbarButton({ onClick, active, icon: Icon, title }: { onClick: () => void, active: boolean, icon: any, title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn(
                "p-1.5 rounded-md transition-all active:scale-95",
                active
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            )}
        >
            <Icon className="w-3.5 h-3.5" />
        </button>
    );
}

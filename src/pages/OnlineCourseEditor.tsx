import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Save, Loader2, Plus,
    Video as VideoIcon, FileText, Settings, Image as ImageIcon,
    Bold, Italic, Underline as UnderlineIcon, List as ListIcon,
    ListOrdered, Type,
    Heading1, Heading2, Sigma,
    Table as TableIcon, Trash2,
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
            <div className="h-screen flex flex-col items-center justify-center text-army-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-20" />
                <span className="text-sm font-medium">Preparing Editor...</span>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-army-50 dark:bg-army-950 flex flex-col">
            {/* Top Navigation */}
            <div className="h-14 border-b border-white/5 bg-secondary backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={() => navigate("/online-course")}
                        className="p-2 hover:bg-white/5 rounded-lg transition-all active:scale-95 group"
                    >
                        <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                    </button>
                    <div className="h-6 w-px bg-white/10 shrink-0" />
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-sm font-semibold text-white truncate flex items-center gap-2">
                            <span className="text-army-400">Course Editor</span>
                            <span className="text-white/20 text-[10px] select-none">/</span>
                            <span className="text-white/60 font-medium truncate">{course?.title}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-[10px] font-medium text-white/40">
                        <div className="w-1.5 h-1.5 rounded-full bg-army-500 animate-pulse" />
                        Live Editing
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-army-500 hover:bg-army-400 disabled:bg-army-800/50 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:scale-100"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3 h-3" />}
                        {saving ? "Saving" : "Save"}
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
                    .editor-canvas table th { font-weight: bold; text-align: left; background-color: #333333; }
                    .editor-canvas th { color: #000; }
                    .editor-canvas .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(200, 200, 255, 0.4); pointer-events: none; }
                    .editor-canvas .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #adf; pointer-events: none; }
                    .editor-canvas video { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
                `}</style>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-72 border-r border-white/5 bg-secondary flex flex-col shrink-0">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Curriculum</span>
                        <button
                            onClick={addModule}
                            className="p-1 hover:bg-army-500/10 text-white/40 hover:text-army-400 rounded-md transition-all"
                            title="Add Module"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {/* Course Metadata Link */}
                        <SidebarItem
                            label="Course Settings"
                            icon={Settings}
                            active={selectedLevel === "course"}
                            onClick={handleSelectCourse}
                        />

                        <div className="h-2" />

                        <div className="px-2 mb-2">
                            <div className="h-px bg-white/5 w-full" />
                        </div>

                        {modules.map((module, mIdx) => (
                            <div key={module.id} className="space-y-1">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: mIdx * 0.05 }}
                                    className={cn(
                                        "group flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer border",
                                        selectedModuleId === module.id && selectedLevel === "module"
                                            ? "bg-army-500/10 border-army-500/20 text-white shadow-lg shadow-army-900/10"
                                            : "hover:bg-white/[0.03] border-transparent text-white/60 hover:text-white"
                                    )} onClick={() => handleSelectModule(module)}
                                >
                                    <div className={cn(
                                        "w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded flex-shrink-0 transition-colors",
                                        selectedModuleId === module.id && selectedLevel === "module"
                                            ? "bg-army-500 text-white shadow-sm shadow-army-500/50"
                                            : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60"
                                    )}>
                                        {mIdx + 1}
                                    </div>
                                    <span className="text-[11px] font-semibold flex-1 leading-none tracking-relaxed">{module.title}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addStep(module.id); }}
                                            className="p-1 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-army-400"
                                            title="Add Lesson"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                                            className="p-1 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-md transition-all"
                                            title="Delete Module"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>

                                <div className="ml-5 border-l border-white/5 pl-2 py-1 space-y-1">
                                    <AnimatePresence mode="popLayout">
                                        {(steps[module.id] || []).map((step, sIdx) => (
                                            <motion.div
                                                key={step.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ delay: (mIdx * 0.1) + (sIdx * 0.03) }}
                                                onClick={() => handleSelectStep(step)}
                                                className={cn(
                                                    "group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all border",
                                                    selectedStepId === step.id
                                                        ? "bg-white text-black border-transparent shadow-lg"
                                                        : "hover:bg-white/5 border-transparent text-white/40 hover:text-white/80"
                                                )}
                                            >
                                                <div className="shrink-0">
                                                    {step.type === "video" ? <VideoIcon className="w-3 h-3 text-army-400" /> : <FileText className="w-3 h-3 text-army-400" />}
                                                </div>
                                                <span className="truncate flex-1 font-semibold leading-none text-[10px] tracking-tight">{step.title}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteStep(module.id, step.id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-md transition-all"
                                                    title="Delete Lesson"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content / Editor */}
                <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {selectedLevel === "step" && editor ? (
                            <motion.div
                                key="step-editor"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3, ease: "circOut" }}
                                className="flex-1 flex flex-row overflow-hidden w-full relative"
                            >
                                {/* Editor Main Area */}
                                <div className="flex-1 flex flex-col min-w-0 bg-[#050505] z-0 px-4 pt-4">
                                    {/* Editor Toolbar */}
                                    <div className="h-11 border border-white/5 bg-white/[0.03] backdrop-blur-md flex items-center px-4 gap-1 overflow-x-auto no-scrollbar scroll-smooth rounded-full mb-4 shrink-0 shadow-lg">
                                        <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
                                            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} title="H1" />
                                            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={Heading2} title="H2" />
                                            <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} icon={Type} title="Text" />
                                        </div>
                                        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
                                            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} title="Bold" />
                                            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} title="Italic" />
                                            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={UnderlineIcon} title="Underline" />
                                            <ToolbarButton onClick={setLink} active={editor.isActive('link')} icon={LinkIcon} title="Link" />
                                        </div>
                                        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
                                            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
                                            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
                                            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />
                                        </div>
                                        <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
                                            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={ListIcon} />
                                            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={ListOrdered} />
                                        </div>
                                        <div className="flex items-center gap-0.5 px-2">
                                            <ToolbarButton onClick={handleImageUpload} active={false} icon={ImageIcon} title="Upload Image" />
                                            <ToolbarButton
                                                onClick={() => {
                                                    const latex = prompt("Enter LaTeX formula (e.g. E=mc^2):", "\\sigma");
                                                    if (latex) (editor.commands as any).setLatex(latex);
                                                }}
                                                active={false}
                                                icon={Sigma}
                                                title="Insert Equation"
                                            />
                                            <ToolbarButton onClick={handleVideoUpload} active={editor.isActive('video')} icon={VideoIcon} title="Upload Video" />
                                        </div>
                                        <div className="flex items-center gap-0.5 pl-2 border-l border-white/10">
                                            <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} active={editor.isActive('table')} icon={TableIcon} title="Insert Table" />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar">
                                        <div className="max-w-4xl mx-auto space-y-4">
                                            {/* Lesson Metadata Header */}
                                            <div className="bg-secondary/50 border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lesson Title</label>
                                                    <input
                                                        type="text"
                                                        value={formData.title || ""}
                                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                        className="w-full text-lg font-bold bg-transparent border-none outline-none text-white p-0 placeholder:text-white/10 tracking-tight"
                                                        placeholder="Enter lesson title..."
                                                    />
                                                </div>
                                                <div className="h-px bg-white/5 w-full" />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lesson Type</label>
                                                        <select
                                                            value={formData.type || "video"}
                                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                            className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[11px] font-semibold text-white outline-none hover:border-army-500/50 transition-all w-full appearance-none cursor-pointer"
                                                        >
                                                            <option value="video" className="bg-black">Video Lesson</option>
                                                            <option value="text" className="bg-black">Text / Reading</option>
                                                            <option value="quiz" className="bg-black">Interactive Quiz</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Editor Canvas */}
                                            <div className="bg-secondary/50 border border-white/5 rounded-2xl shadow-xl min-h-[600px] overflow-hidden group">
                                                <div className="px-5 py-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Content Editor</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-army-500 animate-pulse shadow-[0_0_8px_rgba(74,103,65,0.8)]" />
                                                        <span className="text-[9px] font-bold text-army-400 uppercase tracking-widest">Editor Active</span>
                                                    </div>
                                                </div>
                                                <div className="p-2">
                                                    <EditorContent editor={editor} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* File Manager Sidebar */}
                                <div className="w-80 border-l border-white/5 bg-black/40 flex flex-col shrink-0">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
                                        <span className="text-xs font-semibold text-white/60">Asset Manager</span>
                                        <div className="px-2 py-0.5 bg-army-500/10 rounded-md text-[10px] font-semibold text-army-400 border border-army-500/20">
                                            {steps[selectedModuleId!]?.find(s => s.id === selectedStepId)?.files?.length || 0} Assets
                                        </div>
                                    </div>
                                    <div
                                        className="flex-1 overflow-y-auto p-4 space-y-4 relative custom-scrollbar"
                                        onDragOver={(e) => { e.preventDefault(); setIsDraggingOverSidebar(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingOverSidebar(false); }}
                                        onDrop={handleSidebarDrop}
                                    >
                                        <AnimatePresence>
                                            {isDraggingOverSidebar && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-2 z-20 bg-army-900/40 border-2 border-dashed border-army-500 rounded-2xl flex items-center justify-center pointer-events-none backdrop-blur-md transition-all"
                                                >
                                                    <div className="text-center">
                                                        <Upload className="w-8 h-8 text-army-400 mx-auto mb-2 animate-bounce" />
                                                        <p className="text-army-400 font-semibold text-sm">Drop to Upload</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <button
                                            className="w-full py-8 px-4 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-white/40 hover:border-army-500/50 hover:text-army-400 hover:bg-army-500/5 transition-all cursor-pointer group bg-white/[0.02]"
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
                                                    <Loader2 className="w-6 h-6 animate-spin text-army-500" />
                                                    <span className="text-[10px] font-semibold text-army-500 uppercase tracking-widest">Processing...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-army-500/10 flex items-center justify-center transition-colors">
                                                        <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform text-white/20 group-hover:text-army-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs font-semibold block text-white/60 group-hover:text-white">Upload Assets</span>
                                                        <span className="text-[10px] text-white/20">Click or drag & drop</span>
                                                    </div>
                                                </>
                                            )}
                                        </button>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Attachments</h3>
                                                <span className="text-[9px] font-semibold text-white/10 uppercase italic">Drag to editor</span>
                                            </div>

                                            <div className="grid gap-2">
                                                {(steps[selectedModuleId!]?.find(s => s.id === selectedStepId)?.files || []).map((filename, idx) => {
                                                    const step = steps[selectedModuleId!]?.find(s => s.id === selectedStepId);
                                                    const url = step ? OnlineCourseService.getFileUrl(step, filename) : '';
                                                    return (
                                                        <motion.div
                                                            key={filename}
                                                            layoutId={filename}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            draggable
                                                            onDragStart={(e: any) => {
                                                                if (e.target.closest('button')) {
                                                                    e.preventDefault();
                                                                    return;
                                                                }
                                                                handleDragStartFromSidebar(e, url, filename);
                                                            }}
                                                            className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl cursor-grab active:cursor-grabbing hover:border-army-500/30 hover:bg-white/[0.05] transition-all group select-none relative"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 border border-white/5">
                                                                <FileIcon className="w-4 h-4 text-army-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 pr-6">
                                                                <p className="text-[11px] font-semibold text-white/80 truncate" title={getOriginalFilename(filename)}>
                                                                    {getOriginalFilename(filename)}
                                                                </p>
                                                            </div>
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                                <button
                                                                    title="Delete file"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(filename); }}
                                                                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}

                                                {!(steps[selectedModuleId!]?.find(s => s.id === selectedStepId)?.files?.length) && (
                                                    <div className="text-center py-10 px-4 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                                        <FileText className="w-6 h-6 text-white/10 mx-auto mb-2" />
                                                        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider leading-relaxed">No assets attached</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="settings-view"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3, ease: "circOut" }}
                                className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-7xl mx-auto w-full space-y-8">
                                    <div className="flex items-end justify-between border-b border-white/5 pb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-army-500 shadow-[0_0_8px_rgba(74,103,65,0.8)]" />
                                                <span className="text-[9px] font-bold text-army-400 uppercase tracking-widest leading-none">Settings</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-white tracking-tight">
                                                {selectedLevel === "course" ? "Configuration" : "Module Properties"}
                                            </h2>
                                        </div>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-1.5 bg-white text-black hover:bg-army-400 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {saving ? "..." : "Save Config"}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                                        <div className="lg:col-span-8 space-y-6">
                                            <div className="bg-secondary/50 border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Display Title</label>
                                                    <input
                                                        type="text"
                                                        value={formData?.title || ""}
                                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-[11px] font-semibold text-white focus:border-army-500/50 transition-all outline-none placeholder:text-white/20"
                                                        placeholder="Enter title..."
                                                    />
                                                </div>

                                                {selectedLevel === "course" && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Category</label>
                                                            <input
                                                                type="text"
                                                                value={formData?.category || ""}
                                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-[11px] font-semibold text-white outline-none focus:border-army-500/50 transition-all placeholder:text-white/20"
                                                                placeholder="e.g. Engineering"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Level</label>
                                                            <select
                                                                value={formData?.level || "beginner"}
                                                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-[11px] font-semibold text-white outline-none appearance-none cursor-pointer focus:border-army-500/50"
                                                            >
                                                                <option value="beginner" className="bg-black">Beginner</option>
                                                                <option value="intermediate" className="bg-black">Intermediate</option>
                                                                <option value="advanced" className="bg-black">Advanced</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedLevel === "course" && (
                                                <div className="bg-secondary/50 border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Instructor</label>
                                                            <select
                                                                value={formData?.instructor || ""}
                                                                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-[11px] font-semibold text-white outline-none appearance-none cursor-pointer focus:border-army-500/50"
                                                            >
                                                                <option value="" className="bg-black text-muted-foreground">Select Instructor</option>
                                                                {mentors.map(mentor => (
                                                                    <option key={mentor.id} value={mentor.id} className="bg-black">{mentor.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Est. Duration</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 8 Hours"
                                                                value={formData?.duration || ""}
                                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-[11px] font-semibold text-white outline-none transition-all focus:border-army-500/50 placeholder:text-white/20"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Standard Price</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">Rp</span>
                                                                <input
                                                                    type="number"
                                                                    value={formData?.price ?? 0}
                                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                                                                    className="w-full pl-9 pr-4 py-2.5 bg-black border border-white/10 rounded-xl text-[11px] font-bold text-white outline-none transition-all focus:border-army-500/50"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Discounted Price</label>
                                                            <div className="relative border border-army-500/20 rounded-xl overflow-hidden focus-within:border-army-500/50 transition-colors bg-army-500/5">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-army-400">Rp</span>
                                                                <input
                                                                    type="number"
                                                                    value={formData?.discountPrice ?? 0}
                                                                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                                                                    className="w-full pl-9 pr-4 py-2.5 bg-transparent text-[11px] font-bold text-army-400 outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 shadow-2xl">
                                                <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Short Overview</label>
                                                <textarea
                                                    rows={4}
                                                    value={formData?.description || ""}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-medium text-white/80 focus:border-army-500/50 transition-all outline-none resize-none leading-relaxed"
                                                    placeholder="Provide a detailed overview..."
                                                />
                                            </div>

                                            {selectedLevel === "course" && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 shadow-2xl">
                                                        <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Core Features</label>
                                                        <textarea
                                                            rows={6}
                                                            value={(formData?.features || "").replace(/\./g, "\n")}
                                                            onChange={(e) => setFormData({ ...formData, features: e.target.value.replace(/\n/g, ".") })}
                                                            placeholder={"Interactive Lessons\nSource Codes Included"}
                                                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-[11px] font-semibold text-white/80 transition-all outline-none resize-none"
                                                        />
                                                    </div>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 shadow-2xl">
                                                        <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Deliverables</label>
                                                        <textarea
                                                            rows={6}
                                                            value={(formData?.deliverables || "").replace(/\./g, "\n")}
                                                            onChange={(e) => setFormData({ ...formData, deliverables: e.target.value.replace(/\n/g, ".") })}
                                                            placeholder={"Certificate\nPractical Knowledge"}
                                                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-[11px] font-semibold text-white/80 transition-all outline-none resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="lg:col-span-4 space-y-6">
                                            {selectedLevel === "course" && (
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6 shadow-2xl sticky top-6">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block">Course Media</label>
                                                        <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video flex flex-col items-center justify-center transition-all hover:border-army-500/50">
                                                            {formData.thumbnail ? (
                                                                <img
                                                                    src={formData.thumbnail instanceof File ? URL.createObjectURL(formData.thumbnail) : OnlineCourseService.getFileUrl(course, formData.thumbnail)}
                                                                    alt="Thumbnail Preview"
                                                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="w-8 h-8 text-white/10" />
                                                            )}
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
                                                                className="relative z-10 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl text-[10px] font-semibold text-white uppercase tracking-widest hover:bg-army-500 transition-all shadow-2xl"
                                                            >
                                                                {formData.thumbnail ? "Change Cover" : "Upload Cover"}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-semibold text-white/30 uppercase">Status</span>
                                                            <div className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tight",
                                                                formData.status === "active" ? "bg-army-500/20 text-army-400" : "bg-white/5 text-white/20"
                                                            )}>
                                                                {formData.status || "draft"}
                                                            </div>
                                                        </div>
                                                        <select
                                                            value={formData.status || "draft"}
                                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-white outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
                                                        >
                                                            <option value="draft" className="bg-black">Draft Mode</option>
                                                            <option value="active" className="bg-black">Published</option>
                                                            <option value="maintenance" className="bg-black">Maintenance</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Premium Saving Overlay */}
                    <AnimatePresence>
                        {saving && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center"
                            >
                                <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-2 border-army-500/20" />
                                        <div className="absolute inset-0 w-12 h-12 rounded-full border-t-2 border-army-500 animate-spin" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-1">Applying Changes</h3>
                                        <p className="text-white/40 text-[10px] uppercase font-semibold tracking-widest">Synchronizing to database...</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .editor-canvas h1 { font-size: 1.25rem; font-weight: 900; margin-bottom: 0.75rem; color: white; letter-spacing: -0.025em; }
                .editor-canvas h2 { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.5rem; color: #a3a3a3; }
                .editor-canvas p { font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem; color: #d4d4d4; font-weight: 500; }
                .editor-canvas ul { list-style-type: none; padding-left: 0.5rem; margin-bottom: 1rem; }
                .editor-canvas ul li { position: relative; padding-left: 1.5rem; margin-bottom: 0.5rem; }
                .editor-canvas ul li::before { content: ""; position: absolute; left: 0; top: 0.6em; width: 6px; height: 6px; background: #6b8e23; border-radius: 2px; }
                .editor-canvas a { color: #6b8e23 !important; text-decoration: underline !important; cursor: pointer !important; font-weight: 700; transition: opacity 0.2s; }
                .editor-canvas a:hover { opacity: 0.8; }
                .editor-canvas img { border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05); margin: 1.5rem 0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
                .editor-canvas video { border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05); margin: 1.5rem 0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); width: 100%; aspect-ratio: 16/9; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
                .ProseMirror { outline: none !important; min-height: 400px; padding: 2rem; color: #d4d4d4; }
                .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #404040; pointer-events: none; height: 0; font-weight: 500; }
            `}</style>
        </div>
    );
}

function SidebarItem({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all border",
                active
                    ? "bg-army-500/10 border-army-500/20 text-white shadow-lg shadow-army-900/10"
                    : "text-white/40 border-transparent hover:bg-white/[0.03] hover:text-white/60"
            )}
        >
            <div className={cn(
                "w-5 h-5 flex items-center justify-center rounded-lg transition-colors",
                active ? "bg-army-500 text-white" : "bg-white/5 text-white/20"
            )}>
                <Icon className="w-3 h-3" />
            </div>
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
                "p-2 rounded-lg transition-all active:scale-90 group",
                active
                    ? "bg-army-500 text-white shadow-lg shadow-army-900/40"
                    : "text-white/30 hover:bg-white/5 hover:text-white/60"
            )}
        >
            <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
        </button>
    );
}

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import {
    Save, Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Image as ImageIcon, Type,
    Heading1, Heading2, Heading3, Loader2,
    ChevronLeft, Sigma, Info
} from "lucide-react";
import { BlogService, type BlogRecord } from "../../services/api";
import { cn } from "../../lib/utils";
import 'katex/dist/katex.min.css';
import { Mathematics } from "./MathematicsExtension";

interface BlogEditorOverlayProps {
    blog: BlogRecord | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function BlogEditorOverlay({ blog, onClose, onSuccess }: BlogEditorOverlayProps) {
    const [saving, setSaving] = useState(false);
    const [currentBlogId, setCurrentBlogId] = useState<string | null>(blog?.id || null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: blog?.title || "",
        page_name: blog?.page_name || "",
        excerpt: blog?.excerpt || "",
        author: blog?.author || "",
        author_title: blog?.author_title || "",
        published_date: blog?.published_date ? new Date(blog.published_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        read_time: blog?.read_time || "",
        category: blog?.category || "",
        tags_keyword: blog?.tags_keyword || "",
        is_active: blog?.is_active ?? true,
    });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Customizing heading below
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Image.configure({
                allowBase64: true,
            }).extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: '100%',
                            parseHTML: element => element.style.width,
                        },
                        align: {
                            default: 'center',
                            parseHTML: element => {
                                const margin = element.style.margin;
                                if (margin.includes('auto')) {
                                    if (margin === '0px auto' || margin === '0 auto') return 'center';
                                    return 'right';
                                }
                                return 'left';
                            },
                        },
                        alt: {
                            default: '',
                            parseHTML: element => element.getAttribute('alt'),
                        },
                    }
                },
                renderHTML({ HTMLAttributes }) {
                    const { width, align, alt, ...rest } = HTMLAttributes;
                    let margin = '0 auto 0 0';
                    if (align === 'center') margin = '0 auto';
                    else if (align === 'right') margin = '0 0 0 auto';

                    return ['img', mergeAttributes(rest, {
                        style: `width: ${width}; display: block; margin: ${margin};`,
                        alt: alt || '',
                    })]
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            Placeholder.configure({
                placeholder: 'Start writing your blog story here...',
            }),
            BulletList,
            OrderedList,
            Mathematics,
        ],
        content: blog?.content || "",
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none max-w-none min-h-[500px] p-8 pb-32 editor-canvas',
            },
        },
        onUpdate: () => {
            // Trigger a re-render to update toolbar state
            setUpdateCounter(c => c + 1);
        },
        onSelectionUpdate: () => {
            setUpdateCounter(c => c + 1);
        },
        onTransaction: () => {
            setUpdateCounter(c => c + 1);
        }
    });

    const [, setUpdateCounter] = useState(0);

    const handleSave = async () => {
        if (!editor) return;
        setSaving(true);
        try {
            const htmlContent = editor.getHTML();
            const data = new FormData();

            // Basic fields
            data.append("title", formData.title);
            data.append("page_name", formData.page_name);
            data.append("excerpt", formData.excerpt);
            data.append("content", htmlContent);
            data.append("author", formData.author);
            data.append("author_title", formData.author_title);
            data.append("published_date", formData.published_date);
            data.append("read_time", formData.read_time);
            data.append("category", formData.category);
            data.append("tags_keyword", formData.tags_keyword);
            data.append("is_active", String(formData.is_active));

            // Handle images sync (Remove deleted images from PocketBase)
            // 1. Find all image names currently in content
            const contentDoc = new DOMParser().parseFromString(htmlContent, 'text/html');
            const imagesInContent = Array.from(contentDoc.querySelectorAll('img'))
                .map(img => img.getAttribute('src'))
                .filter(src => src && src.includes('/api/files/'))
                .map(src => src!.split('/').pop()!.split('?')[0]);

            // 2. Identify images to keep from existing record
            // 2. Identify images to delete
            if (blog && blog.images) {
                const imagesToDelete = blog.images.filter((imgName: string) => !imagesInContent.includes(imgName));

                // PocketBase uses "fieldName-" to delete specific files in a multiple field
                if (imagesToDelete.length > 0) {
                    imagesToDelete.forEach(imgName => {
                        data.append("images-", imgName);
                    });
                }
            }

            // Legacy local upload loop removed since we now upload immediately

            if (currentBlogId) {
                await BlogService.updateBlog(currentBlogId, data);
            } else {
                const newRecord = await BlogService.createBlog(data);
                setCurrentBlogId(newRecord.id);
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving blog:", error);
            alert("Failed to save blog. Check console for details.");
        } finally {
            setSaving(false);
        }
    };

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;

            setIsUploadingImage(true);
            try {
                let targetId = currentBlogId;

                // If it's a new blog (no ID yet), create a draft first
                if (!targetId) {
                    const draftData = new FormData();
                    draftData.append("title", formData.title || "Untitled Draft");
                    draftData.append("is_active", "false");
                    draftData.append("content", editor.getHTML());
                    const draft = await BlogService.createBlog(draftData);
                    targetId = draft.id;
                    setCurrentBlogId(targetId);
                }

                // Upload image immediately to the record
                const uploadData = new FormData();
                uploadData.append("images", file);
                const updatedRecord = await BlogService.updateBlog(targetId, uploadData);

                // Get the last uploaded image filename
                const newImageName = updatedRecord.images[updatedRecord.images.length - 1];
                const imageUrl = BlogService.getFileUrl(updatedRecord, newImageName);

                // Insert into editor with the permanent URL
                editor.chain().focus().setImage({ src: imageUrl }).run();
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Failed to upload image to server.");
            } finally {
                setIsUploadingImage(false);
            }
        };
        input.click();
    };

    const addLatex = () => {
        const latex = prompt("Enter LaTeX formula (e.g. E=mc^2):", "\\sigma");
        if (latex && editor) {
            (editor.commands as any).setLatex(latex);
        }
    };

    if (!editor) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col font-outfit animate-in fade-in zoom-in duration-300">
            {/* Header / Toolbar Top */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate max-w-[300px]">
                            {blog ? `Editing: ${blog.title}` : "Create New Story"}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm">
                        <span className={cn("inline-block w-2 h-2 rounded-full", formData.is_active ? "bg-slate-500" : "bg-slate-400")}></span>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {formData.is_active ? "Live" : "Draft"}
                        </span>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                            className="ml-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                            Change
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium text-sm hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || isUploadingImage}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : isUploadingImage ? "Uploading..." : "Save Story"}
                    </button>
                </div>

                <style>{`
                    .editor-canvas ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
                    .editor-canvas ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
                    .editor-canvas li { display: list-item !important; margin-bottom: 0.25rem !important; }
                    .editor-canvas h1, .editor-canvas h2, .editor-canvas h3 { margin-top: 1.5rem !important; margin-bottom: 1rem !important; font-weight: 700 !important; }
                    .editor-canvas p { margin-bottom: 1rem !important; line-height: 1.6 !important; }
                    .editor-canvas img { transition: all 0.2s; cursor: pointer; }
                    .editor-canvas img:hover { ring: 2px solid #3b82f6; }
                `}</style>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Left - Metadata */}
                <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Metadata</h2>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-500 ml-1">Page Reference</label>
                                <input
                                    type="text"
                                    placeholder="e.g. blog-post-01"
                                    value={formData.page_name}
                                    onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-500 ml-1">Main Title</label>
                                <textarea
                                    rows={2}
                                    placeholder="Enter compelling title..."
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm resize-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-500 ml-1">Category</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Engineering, Tech..."
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-500 ml-1">Short Excerpt</label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief summary..."
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 pt-4 border-t border-slate-200 dark:border-slate-800">Author & Logistics</h2>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-500 ml-1">Author Name</label>
                                <input
                                    type="text"
                                    placeholder="Author Name"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-500 ml-1">Author Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Senior Engineer"
                                    value={formData.author_title}
                                    onChange={(e) => setFormData({ ...formData, author_title: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-500 ml-1">Date</label>
                                    <input
                                        type="date"
                                        value={formData.published_date}
                                        onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-500 ml-1">Read Time</label>
                                    <input
                                        type="text"
                                        placeholder="5 min"
                                        value={formData.read_time}
                                        onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                                        className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-500 ml-1">Keywords</label>
                                <input
                                    type="text"
                                    placeholder="Tags..."
                                    value={formData.tags_keyword}
                                    onChange={(e) => setFormData({ ...formData, tags_keyword: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-400 transition-all outline-none shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
                    <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-1 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-800">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                active={editor.isActive('heading', { level: 1 })}
                                icon={Heading1}
                                title="Heading 1"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                active={editor.isActive('heading', { level: 2 })}
                                icon={Heading2}
                                title="Heading 2"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                active={editor.isActive('heading', { level: 3 })}
                                icon={Heading3}
                                title="Heading 3"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setParagraph().run()}
                                active={editor.isActive('paragraph') && !editor.isActive('heading')}
                                icon={Type}
                                title="Paragraph"
                            />
                        </div>

                        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-800">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                active={editor.isActive('bold')}
                                icon={Bold}
                                title="Bold"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                active={editor.isActive('italic')}
                                icon={Italic}
                                title="Italic"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                active={editor.isActive('underline')}
                                icon={UnderlineIcon}
                                title="Underline"
                            />
                        </div>

                        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-800">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                active={editor.isActive('bulletList')}
                                icon={List}
                                title="Bullet List"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                active={editor.isActive('orderedList')}
                                icon={ListOrdered}
                                title="Ordered List"
                            />
                        </div>

                        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-800">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                active={editor.isActive({ textAlign: 'left' })}
                                icon={AlignLeft}
                                title="Align Left"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                active={editor.isActive({ textAlign: 'center' })}
                                icon={AlignCenter}
                                title="Align Center"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                active={editor.isActive({ textAlign: 'right' })}
                                icon={AlignRight}
                                title="Align Right"
                            />
                        </div>

                        <div className="flex items-center gap-0.5 pl-2">
                            <ToolbarButton
                                onClick={addImage}
                                icon={ImageIcon}
                                active={false}
                                title="Insert Image"
                            />
                            {editor.isActive('image') && (
                                <div className="flex items-center gap-1 ml-2 px-2 border-l border-slate-200 dark:border-slate-800 flex-shrink-0">
                                    <div className="flex items-center gap-1 px-1 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                                        <button
                                            onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%' }).run()}
                                            className={cn("text-[10px] font-bold px-1.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors", editor.getAttributes('image').width === '25%' ? "text-blue-600" : "text-slate-500")}
                                        >25%</button>
                                        <button
                                            onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()}
                                            className={cn("text-[10px] font-bold px-1.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors", editor.getAttributes('image').width === '50%' ? "text-blue-600" : "text-slate-500")}
                                        >50%</button>
                                        <button
                                            onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()}
                                            className={cn("text-[10px] font-bold px-1.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors", editor.getAttributes('image').width === '100%' ? "text-blue-600" : "text-slate-500")}
                                        >100%</button>
                                    </div>
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}
                                            className={cn("p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors", editor.getAttributes('image').align === 'left' ? "text-blue-600 bg-slate-100 dark:bg-slate-700" : "text-slate-500")}
                                            title="Align Left"
                                        ><AlignLeft className="w-3.5 h-3.5" /></button>
                                        <button
                                            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}
                                            className={cn("p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors", (editor.getAttributes('image').align === 'center' || !editor.getAttributes('image').align) ? "text-blue-600 bg-slate-100 dark:bg-slate-700" : "text-slate-500")}
                                            title="Align Center"
                                        ><AlignCenter className="w-3.5 h-3.5" /></button>
                                        <button
                                            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}
                                            className={cn("p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors", editor.getAttributes('image').align === 'right' ? "text-blue-600 bg-slate-100 dark:bg-slate-700" : "text-slate-500")}
                                            title="Align Right"
                                        ><AlignRight className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                                    <button
                                        onClick={() => {
                                            const alt = prompt("Enter Alt Text (SEO):", editor.getAttributes('image').alt || "");
                                            if (alt !== null) {
                                                editor.chain().focus().updateAttributes('image', { alt }).run();
                                            }
                                        }}
                                        className={cn("text-[10px] font-medium px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1", editor.getAttributes('image').alt ? "text-blue-600" : "text-slate-500")}
                                        title="Image Alt Text (SEO)"
                                    >
                                        <Info className="w-3 h-3" />
                                        <span>Alt</span>
                                    </button>
                                </div>
                            )}
                            <ToolbarButton
                                onClick={addLatex}
                                icon={Sigma}
                                active={false}
                                title="Insert Equation (LaTeX)"
                            />
                        </div>
                    </div>

                    {/* Editor Canvas */}
                    <div className="flex-1 overflow-y-auto bg-slate-100/30 dark:bg-slate-900/30 p-12">
                        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-[1000px] shadow-2xl rounded-sm border border-slate-200 dark:border-slate-800 relative">
                            {/* Word-like Ruler Simulation */}
                            <div className="absolute -top-6 left-0 right-0 flex px-8 h-6 items-end">
                                <div className="w-full border-b border-slate-300 dark:border-slate-700 flex justify-between text-[6px] font-bold text-slate-400">
                                    <span>0</span><span>|</span><span>|</span><span>|</span><span>1</span><span>|</span><span>|</span><span>|</span><span>2</span><span>|</span><span>|</span><span>|</span><span>3</span><span>|</span><span>|</span><span>|</span><span>4</span><span>|</span><span>|</span><span>|</span><span>5</span><span>|</span><span>|</span><span>|</span><span>6</span>
                                </div>
                            </div>

                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, active, icon: Icon, title }: { onClick: () => void, active: boolean, icon: any, title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn(
                "p-1.5 rounded-md transition-all active:scale-95 group relative",
                active
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? "scale-105" : "scale-100")} />
            {active && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-900 dark:bg-slate-200 rounded-full"></span>
            )}
        </button>
    );
}

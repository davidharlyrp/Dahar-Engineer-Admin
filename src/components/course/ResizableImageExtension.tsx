import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trash2 } from 'lucide-react';

export const ResizableImageExtension = Node.create({
    name: 'image', // Intercept standard image insertions
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: { default: null },
            alt: { default: null },
            width: { default: '70%' }, // Default width
        };
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes, { style: `width: ${HTMLAttributes.width}; display: block; margin: 0 auto;`, class: 'resizable-image' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageNodeView);
    },
});

const ResizableImageNodeView = (props: any) => {
    const { src, alt, width } = props.node.attrs;

    return (
        <NodeViewWrapper className="flex justify-center my-4 group relative w-full">
            <div className="relative inline-block group" style={{ width: width }}>
                <img src={src} alt={alt || ''} className="w-full h-auto block rounded-lg cursor-pointer" />

                {/* Delete Button */}
                <button
                    onClick={() => props.deleteNode()}
                    contentEditable={false}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
                    title="Remove Image"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                {/* Right Resize Handle */}
                <div
                    contentEditable={false}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-10 bg-slate-800 dark:bg-slate-200 rounded cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg border border-slate-700 dark:border-slate-300 z-10"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = e.currentTarget.parentElement?.offsetWidth || 0;
                        const containerWidth = e.currentTarget.parentElement?.parentElement?.offsetWidth || 1;

                        const onMouseMove = (moveEvent: MouseEvent) => {
                            // Multiply mouse delta by 2 because the image is centered
                            const newWidthPx = startWidth + (moveEvent.pageX - startX) * 2;
                            const newWidthPercent = Math.min(100, Math.max(10, (newWidthPx / containerWidth) * 100));
                            props.updateAttributes({ width: `${newWidthPercent}%` });
                        };

                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    }}
                >
                    <div className="w-0.5 h-5 bg-white dark:bg-slate-900 rounded-full"></div>
                </div>

                {/* Left Resize Handle (Optional, but good for symmetric resizing) */}
                <div
                    contentEditable={false}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-10 bg-slate-800 dark:bg-slate-200 rounded cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg border border-slate-700 dark:border-slate-300 z-10"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = e.currentTarget.parentElement?.offsetWidth || 0;
                        const containerWidth = e.currentTarget.parentElement?.parentElement?.offsetWidth || 1;

                        const onMouseMove = (moveEvent: MouseEvent) => {
                            // Negative delta for left side
                            const newWidthPx = startWidth - (moveEvent.pageX - startX) * 2;
                            const newWidthPercent = Math.min(100, Math.max(10, (newWidthPx / containerWidth) * 100));
                            props.updateAttributes({ width: `${newWidthPercent}%` });
                        };

                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    }}
                >
                    <div className="w-0.5 h-5 bg-white dark:bg-slate-900 rounded-full"></div>
                </div>
            </div>
        </NodeViewWrapper>
    );
};

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trash2 } from 'lucide-react';

export const Video = Node.create({
    name: 'video',
    group: 'block',
    atom: true, // Make it an atom so Tiptap treats it as a single unit
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: element => element.querySelector('source')?.getAttribute('src') || element.getAttribute('src'),
            },
            controls: {
                default: true,
                parseHTML: element => element.hasAttribute('controls'),
            },
            width: {
                default: '100%',
                parseHTML: element => element.style.width || element.getAttribute('width'),
            },
            style: {
                default: 'border-radius: 8px;',
                parseHTML: element => element.getAttribute('style'),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'video',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const { src, width, style, ...rest } = HTMLAttributes;
        return [
            'video',
            mergeAttributes(rest, {
                width: width || '100%',
                style: style || 'border-radius: 8px;',
            }),
            ['source', { src, type: 'video/mp4' }],
            'Your browser does not support the video tag.'
        ]
    },

    addCommands() {
        return {
            setVideo: (options: { src: string, width?: string }) => ({ commands }: any) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                })
            },
        } as any
    },

    addNodeView() {
        return ReactNodeViewRenderer(VideoNodeView);
    },
});

const VideoNodeView = (props: any) => {
    const { src, width, controls } = props.node.attrs;

    return (
        <NodeViewWrapper className="flex justify-center my-4 group relative w-full">
            <div className="relative inline-block w-full">
                <video
                    src={src}
                    controls={controls}
                    style={{ width: width || '100%', borderRadius: '8px' }}
                    className="w-full h-auto block"
                >
                    <source src={src} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Delete Button */}
                <button
                    onClick={() => props.deleteNode()}
                    contentEditable={false}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
                    title="Remove Video"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </NodeViewWrapper>
    );
};

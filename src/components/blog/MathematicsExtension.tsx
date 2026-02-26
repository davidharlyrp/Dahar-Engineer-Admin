import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'

const MathematicsComponent = ({ node, updateAttributes }: any) => {
    const latex = node.attrs.latex || '\\sigma';

    return (
        <NodeViewWrapper className="inline-block mathematics-node align-middle">
            <span
                className="cursor-pointer hover:ring-1 hover:ring-blue-500 rounded px-1 transition-all"
                onClick={() => {
                    const newLatex = prompt('Edit LaTeX:', latex)
                    if (newLatex !== null) updateAttributes({ latex: newLatex })
                }}
                title="Click to edit equation"
            >
                <InlineMath math={latex} />
            </span>
        </NodeViewWrapper>
    )
}

export const Mathematics = Node.create({
    name: 'mathematics',
    group: 'inline',
    inline: true,
    selectable: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: '\\sigma',
                parseHTML: element => element.getAttribute('data-latex'),
                renderHTML: attributes => {
                    return {
                        'data-latex': attributes.latex,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-latex]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'math-tex' })]
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathematicsComponent)
    },

    addCommands() {
        return {
            setLatex: (latex: string) => ({ commands }: any) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { latex },
                })
            },
        } as any
    },
})

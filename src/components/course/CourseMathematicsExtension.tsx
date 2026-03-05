import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

// Delimiters
const inputRuleInline = /\$([^\$]+)\$/
const inputRuleBlock = /\$\$([^\$]+)\$\$/

const MathematicsComponent = ({ node, updateAttributes }: any) => {
    const latex = node.attrs.latex || '\\sigma';
    const isBlock = node.attrs.displayMode === 'block';

    return (
        <NodeViewWrapper as="span" className={isBlock ? "block my-4 mathematics-node-block" : "inline-block mathematics-node align-middle"}>
            <span
                className="cursor-pointer hover:ring-1 hover:ring-blue-500 rounded px-1 transition-all"
                onClick={() => {
                    const newLatex = prompt('Edit LaTeX:', latex)
                    if (newLatex !== null) updateAttributes({ latex: newLatex })
                }}
                title="Click to edit equation"
            >
                {isBlock ? (
                    <div className="py-2 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                        <BlockMath math={latex} />
                    </div>
                ) : (
                    <InlineMath math={latex} />
                )}
            </span>
        </NodeViewWrapper>
    )
}

export const CourseMathematics = Node.create({
    name: 'courseMathematics',
    group: 'inline',
    inline: true,
    selectable: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: '\\sigma',
                parseHTML: element => element.getAttribute('data-latex') || element.innerText,
                renderHTML: attributes => ({ 'data-latex': attributes.latex }),
            },
            displayMode: {
                default: 'inline',
                parseHTML: element => element.getAttribute('data-display') || 'inline',
                renderHTML: attributes => ({ 'data-display': attributes.displayMode }),
            }
        }
    },

    parseHTML() {
        return [
            { tag: 'span[data-latex]' },
            { tag: 'div[data-latex]' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const isBlock = HTMLAttributes['data-display'] === 'block';
        return [isBlock ? 'div' : 'span', mergeAttributes(HTMLAttributes, { class: 'math-tex' })]
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathematicsComponent)
    },

    addInputRules() {
        return [
            nodeInputRule({
                find: inputRuleBlock,
                type: this.type,
                getAttributes: match => ({
                    latex: match[1],
                    displayMode: 'block',
                }),
            }),
            nodeInputRule({
                find: inputRuleInline,
                type: this.type,
                getAttributes: match => ({
                    latex: match[1],
                    displayMode: 'inline',
                }),
            }),
        ]
    },

    addCommands() {
        return {
            setLatex: (latex: string, displayMode: 'inline' | 'block' = 'inline') => ({ commands }: any) => {
                if (displayMode === 'inline') {
                    return commands.insertContent([
                        {
                            type: this.name,
                            attrs: { latex, displayMode },
                        },
                        {
                            type: 'text',
                            text: ' ',
                        }
                    ]).focus()
                }
                return commands.insertContent({
                    type: this.name,
                    attrs: { latex, displayMode },
                })
            },
        } as any
    },
})

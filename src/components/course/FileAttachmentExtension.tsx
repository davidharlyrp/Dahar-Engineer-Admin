import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

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

export const FileAttachmentExtension = Node.create({
    name: 'fileAttachment',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            href: {
                default: null,
            },
            fileName: {
                default: 'Download File',
            },
            fileSize: {
                default: '',
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="file-attachment"]',
                getAttrs: element => {
                    const anchor = (element as HTMLElement).querySelector('a');
                    return {
                        href: anchor?.getAttribute('href')?.split('?')[0] || null,
                        fileName: anchor?.getAttribute('download') || anchor?.innerText || 'Download File',
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'file-attachment', style: 'background: #252525; padding: 20px; border-left: 4px solid #a3b18a; margin: 20px 0;' }),
            ['p', { style: 'margin-top: 0;' }, ['strong', 'Download File:']],
            ['a', {
                href: `${HTMLAttributes.href}?download=1`,
                download: HTMLAttributes.fileName,
                class: 'download-button',
                style: 'display: inline-flex; align-items: center; background: #a3b18a; color: #111; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 4px; gap: 8px;'
            },
                ['span', getOriginalFilename(HTMLAttributes.fileName)]
            ]
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(FileAttachmentNodeView);
    },
});

const FileAttachmentNodeView = (props: any) => {
    const { href, fileName } = props.node.attrs;

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(href);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(`${href}?download=1`, '_blank');
        }
    };

    return (
        <NodeViewWrapper>
            <div data-type="file-attachment" style={{ background: '#252525', padding: '20px', borderLeft: '4px solid #a3b18a', margin: '20px 0' }}>
                <p style={{ marginTop: 0 }}><strong>Download File:</strong></p>
                <button
                    onClick={handleDownload}
                    className="download-button"
                    style={{ display: 'inline-flex', alignItems: 'center', background: '#a3b18a', color: '#111', padding: '10px 20px', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px', gap: '8px', border: 'none', cursor: 'pointer' }}>
                    <span>{getOriginalFilename(fileName)}</span>
                </button>
            </div>
        </NodeViewWrapper>
    );
};

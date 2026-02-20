'use client';

import { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Code, Eye } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  TinyMCE Rich Editor — WordPress-like experience
//  GPL licensed (free, no API key), dark skin for CODAPOS
//  Two tabs: Visual (WYSIWYG) and HTML (raw code)
// ═══════════════════════════════════════════════════════════════

interface TinyEditorProps {
    value: string;
    onChange: (content: string) => void;
    height?: number;
    placeholder?: string;
}

export default function TinyEditor({ value, onChange, height = 450, placeholder = 'Mulai menulis konten...' }: TinyEditorProps) {
    const editorRef = useRef<unknown>(null);
    const [mode, setMode] = useState<'visual' | 'html'>('visual');

    return (
        <div className="tiny-editor-wrapper">
            {/* Tab switcher: Visual / HTML */}
            <div className="flex border-b border-white/10 bg-[#0f0f1e]">
                <button
                    onClick={() => setMode('visual')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium transition-all ${mode === 'visual'
                        ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
                        : 'text-white/40 hover:text-white/60'
                        }`}
                >
                    <Eye className="w-3.5 h-3.5" /> Visual
                </button>
                <button
                    onClick={() => setMode('html')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium transition-all ${mode === 'html'
                        ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
                        : 'text-white/40 hover:text-white/60'
                        }`}
                >
                    <Code className="w-3.5 h-3.5" /> HTML
                </button>
            </div>

            {/* Visual Editor (TinyMCE) */}
            {mode === 'visual' && (
                <Editor
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    licenseKey="gpl"
                    onInit={(_evt, editor) => { editorRef.current = editor; }}
                    value={value}
                    onEditorChange={(content) => onChange(content)}
                    init={{
                        height,
                        placeholder,
                        menubar: 'file edit view insert format tools table',
                        plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'help', 'wordcount',
                            'emoticons',
                        ],
                        toolbar:
                            'undo redo | styles | bold italic underline strikethrough | ' +
                            'alignleft aligncenter alignright alignjustify | ' +
                            'bullist numlist outdent indent | ' +
                            'link image media table | blockquote hr | ' +
                            'forecolor backcolor removeformat | emoticons charmap | ' +
                            'fullscreen preview code | help',
                        toolbar_mode: 'sliding',
                        skin: 'oxide-dark',
                        content_css: 'dark',
                        content_style: `
                            body {
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                                font-size: 15px;
                                line-height: 1.7;
                                color: #e0e0e0;
                                background: #1a1a2e;
                                padding: 16px 24px;
                                max-width: 100%;
                            }
                            h1 { font-size: 28px; font-weight: 800; margin: 24px 0 12px; color: #fff; }
                            h2 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; color: #fff; }
                            h3 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; color: #fff; }
                            p { margin: 0 0 12px; }
                            a { color: #1DA1F2; }
                            blockquote { border-left: 3px solid #1DA1F2; padding-left: 16px; margin: 16px 0; color: #aaa; font-style: italic; }
                            img { max-width: 100%; height: auto; border-radius: 8px; }
                            table { border-collapse: collapse; width: 100%; }
                            table td, table th { border: 1px solid #333; padding: 8px 12px; }
                            table th { background: #252540; }
                            code { background: #252540; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
                            pre { background: #252540; padding: 16px; border-radius: 8px; overflow-x: auto; }
                        `,
                        image_advtab: true,
                        image_caption: true,
                        automatic_uploads: false,
                        file_picker_types: 'image',
                        promotion: false,
                        branding: false,
                        resize: true,
                        statusbar: true,
                        elementpath: true,
                        contextmenu: 'link image table',
                    }}
                />
            )}

            {/* HTML Code Editor */}
            {mode === 'html' && (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ height: height + 40 }}
                    className="w-full px-5 py-4 bg-[#1a1a2e] text-emerald-300 text-sm font-mono leading-relaxed resize-y focus:outline-none placeholder:text-white/15"
                    placeholder="<h2>Judul</h2>&#10;<p>Tulis konten HTML di sini...</p>"
                    spellCheck={false}
                />
            )}

            <style jsx global>{`
                .tiny-editor-wrapper {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .tiny-editor-wrapper .tox-tinymce {
                    border: none !important;
                    border-radius: 0 !important;
                }
                .tiny-editor-wrapper .tox .tox-toolbar__primary {
                    background: rgba(20, 20, 40, 0.95) !important;
                }
                .tiny-editor-wrapper .tox .tox-menubar {
                    background: rgba(15, 15, 30, 0.98) !important;
                }
                .tiny-editor-wrapper .tox .tox-statusbar {
                    background: rgba(15, 15, 30, 0.95) !important;
                    border-top: 1px solid rgba(255,255,255,0.05) !important;
                }
            `}</style>
        </div>
    );
}

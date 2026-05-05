import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { FontFamily } from '@tiptap/extension-font-family';
import { Image } from '@tiptap/extension-image';
import { CharacterCount } from '@tiptap/extension-character-count';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Type,
  RotateCcw,
  RotateCw,
  Table as TableIcon,
  Plus,
  Trash2,
  Link as LinkIcon,
  Highlighter,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  CheckSquare,
  Scissors,
  Copy,
  Clipboard,
  FileCode,
  Quote,
  Minus,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Eraser,
  Indent as IndentIcon,
  Outdent,
  Omega,
  FileDown,
  Scaling
} from 'lucide-react';

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions(): any {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes(): any {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: (attributes: any) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands(): any {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run();
      },
    };
  },
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  isSaving?: boolean;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title,
  className = ""
}: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-md transition-colors ${
      isActive 
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

const ModernRichTextEditor: React.FC<Props> = ({ value, onChange, placeholder, minHeight = '500px', isSaving = false }) => {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpecialChars, setShowSpecialChars] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder || 'Start typing your lesson note here...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Highlight,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setSourceValue(html);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL or paste base64 data');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertSpecialChar = (char: string) => {
    editor?.chain().focus().insertContent(char).run();
    setShowSpecialChars(false);
  };

  if (!editor) return null;

  const toggleSourceMode = () => {
    if (isSourceMode) {
      editor.commands.setContent(sourceValue);
    } else {
      setSourceValue(editor.getHTML());
    }
    setIsSourceMode(!isSourceMode);
  };

  const specialChars = ['π', 'Ω', 'μ', 'Σ', 'α', 'β', 'γ', 'δ', 'θ', 'λ', 'φ', 'ψ', '∞', '≈', '≠', '≤', '≥', '±', '×', '÷', '√', '∫', '€', '£', '¥', '©', '®', '™'];

  return (
    <div className={`border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all flex flex-col ${
      isFullscreen ? 'fixed inset-0 z-[100] m-0 rounded-0' : 'rounded-2xl shadow-xl'
    }`}>
      {/* MS Word Toolbar - 3 Rows for Maximum Power */}
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
        
        {/* Row 1: Application Controls & File Operations */}
        <div className="flex flex-wrap items-center gap-1 p-1 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300 dark:border-slate-700">
            <MenuButton onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </MenuButton>
            <MenuButton onClick={toggleSourceMode} isActive={isSourceMode} title="Source Code (HTML)">
              <FileCode size={16} />
            </MenuButton>
            <MenuButton onClick={() => window.print()} title="Print Document">
              <RotateCw size={16} className="rotate-90" />
            </MenuButton>
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-slate-300 dark:border-slate-700">
            <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
              <RotateCcw size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
              <RotateCw size={16} />
            </MenuButton>
          </div>

          <div className="flex items-center gap-1 px-2 border-r border-slate-300 dark:border-slate-700">
             <select 
              className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 p-1 rounded transition-colors w-28"
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
            >
              <option value="Inter">Inter (Sans)</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
            </select>
            <select 
              className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 p-1 rounded transition-colors w-16"
              onChange={(e) => (editor.commands as any).setFontSize(e.target.value)}
              value={editor.getAttributes('textStyle').fontSize || '16px'}
            >
              {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72].map(size => (
                <option key={size} value={`${size}px`}>{size}px</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-0.5 px-2">
             <MenuButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear All Formatting">
              <Eraser size={16} className="text-amber-500" />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="Normal Text">
               <Type size={16} />
            </MenuButton>
          </div>
        </div>

        {/* Row 2: Character & Paragraph Formatting */}
        <div className="flex flex-wrap items-center gap-1 p-1 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300 dark:border-slate-700">
            <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
              <Bold size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
              <Italic size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
              <UnderlineIcon size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
              <Type size={16} className="line-through" />
            </MenuButton>
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-slate-300 dark:border-slate-700">
             <input
              type="color"
              onInput={(e: any) => editor.chain().focus().setColor(e.target.value).run()}
              value={editor.getAttributes('textStyle').color || '#000000'}
              className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded overflow-hidden"
              title="Text Color"
            />
            <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
              <Highlighter size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript">
              <SubIcon size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript">
              <SuperIcon size={16} />
            </MenuButton>
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-slate-300 dark:border-slate-700">
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
              <AlignLeft size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
              <AlignCenter size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
              <AlignRight size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
              <AlignJustify size={16} />
            </MenuButton>
          </div>

          <div className="flex items-center gap-0.5 px-2">
            <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
              <List size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
              <ListOrdered size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Increase Indent">
               <IndentIcon size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Decrease Indent">
               <Outdent size={16} />
            </MenuButton>
          </div>
        </div>

        {/* Row 3: Insertions, Tables & Special Objects */}
        <div className="flex flex-wrap items-center gap-1 p-1">
          <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300 dark:border-slate-700">
            <MenuButton onClick={addImage} title="Insert Image">
              <ImageIcon size={16} />
            </MenuButton>
            <MenuButton onClick={setLink} isActive={editor.isActive('link')} title="Insert/Edit Link">
              <LinkIcon size={16} />
            </MenuButton>
            <div className="relative">
               <MenuButton onClick={() => setShowSpecialChars(!showSpecialChars)} title="Special Characters">
                <Omega size={16} />
              </MenuButton>
              {showSpecialChars && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl grid grid-cols-7 gap-1 z-50 w-48">
                  {specialChars.map(char => (
                    <button key={char} onClick={() => insertSpecialChar(char)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs font-bold">
                      {char}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 px-2 border-r border-slate-300 dark:border-slate-700">
            <MenuButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
              <TableIcon size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.isActive('table')} title="Add Column After">
               <Scaling size={16} className="rotate-90" />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.isActive('table')} title="Add Row After">
               <Scaling size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.isActive('table')} title="Delete Table">
               <Trash2 size={16} className="text-red-500" />
            </MenuButton>
          </div>

          <div className="flex items-center gap-0.5 px-2">
            <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Line (Separator)">
              <Minus size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
              <Quote size={16} />
            </MenuButton>
             <MenuButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Checklist / Task List">
              <CheckSquare size={16} />
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().insertContent('<div style="page-break-after: always; border-bottom: 2px dashed #ccc; padding: 10px 0; margin: 10px 0; text-align: center; color: #999; font-size: 10px; font-weight: bold; text-transform: uppercase;">Page Break</div>').run()} title="Insert Page Break (For Printing)">
               <FileDown size={16} />
            </MenuButton>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className={`flex-1 relative overflow-hidden bg-white dark:bg-slate-950 ${isFullscreen ? 'h-full' : 'min-h-[500px]'}`}>
        {isSourceMode ? (
          <textarea
            value={sourceValue}
            onChange={(e) => setSourceValue(e.target.value)}
            className="w-full h-full p-8 font-mono text-xs bg-slate-900 text-slate-300 outline-none resize-none absolute inset-0 custom-scrollbar"
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 md:p-12 custom-scrollbar bg-slate-100/30 dark:bg-slate-900/10">
            {/* Document "Sheet" look */}
            <div className="mx-auto max-w-4xl bg-white dark:bg-slate-950 shadow-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-16 min-h-full">
              <style dangerouslySetInnerHTML={{ __html: `
                .ProseMirror { outline: none; min-height: ${minHeight}; font-size: 16px; line-height: 1.6; }
                .ProseMirror p.is-editor-empty:first-child::before {
                  content: attr(data-placeholder);
                  float: left;
                  color: #adb5bd;
                  pointer-events: none;
                  height: 0;
                  font-style: italic;
                }
                .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1.5rem 0; overflow: hidden; }
                .ProseMirror td, .ProseMirror th { min-width: 1em; border: 1px solid #ced4da; padding: 10px 12px; vertical-align: top; box-sizing: border-box; position: relative; }
                .ProseMirror th { font-weight: bold; text-align: left; background-color: #f8f9fa; }
                .ProseMirror .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(200, 200, 255, 0.4); pointer-events: none; }
                .dark .ProseMirror td, .dark .ProseMirror th { border-color: #334155; }
                .dark .ProseMirror th { background-color: #1e293b; }
                
                .ProseMirror ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1rem; }
                .ProseMirror ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1rem; }
                .ProseMirror li { margin-bottom: 0.5rem; }
                .ProseMirror blockquote { border-left: 4px solid #3b82f6; padding-left: 1.5rem; font-style: italic; color: #475569; margin: 1.5rem 0; background: #f8fafc; padding-top: 1rem; padding-bottom: 1rem; }
                .dark .ProseMirror blockquote { border-left-color: #2563eb; color: #94a3b8; background: #0f172a; }
                .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 2rem 0; }
                .dark .ProseMirror hr { border-top-color: #334155; }
              `}} />
              <EditorContent editor={editor} className="prose prose-slate dark:prose-invert max-w-none" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-white dark:bg-slate-900 px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Scaling size={12} /> Microsoft Word Mode</span>
          <span className={`flex items-center gap-1.5 transition-all ${isSaving ? 'text-primary-600 animate-pulse' : 'text-green-600'}`}>
            <RotateCw size={12} className={isSaving ? 'animate-spin' : ''} />
            {isSaving ? 'Saving progress...' : 'All changes saved'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Words: {editor.storage.characterCount.words()}</span>
          <span>Characters: {editor.storage.characterCount.characters()}</span>
          <span className={isSourceMode ? 'text-primary-600' : ''}>HTML: {isSourceMode ? 'ACTIVE' : 'READY'}</span>
        </div>
      </div>
    </div>
  );
};

export default ModernRichTextEditor;

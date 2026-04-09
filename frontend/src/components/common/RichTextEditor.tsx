import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize editor settings
  useEffect(() => {
    // Ensure lists and paragraphs are created correctly
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }, []);

  // Sync value from parent (for external changes like clearing the form)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only update if value is different to avoid losing cursor position
      const safeValue = value || '';
      if (safeValue !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = safeValue;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const execCommand = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Restore selection if lost
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      document.execCommand(command, false, val);
      handleInput();
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title,
    active = false
  }: { 
    onClick: () => void; 
    icon: any; 
    title: string;
    active?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active 
          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden transition-all duration-300 relative ${
      isFocused 
        ? 'border-primary-500 ring-2 ring-primary-500/10 shadow-lg' 
        : 'border-slate-200 dark:border-slate-800 shadow-sm'
    }`}>
      {/* Add internal styles to fix Tailwind reset for lists in contentEditable */}
      <style dangerouslySetInnerHTML={{ __html: `
        .rte-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
        .rte-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
        .rte-content li { margin-bottom: 0.25rem !important; }
        .rte-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; font-style: italic; }
      `}} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-slate-200 dark:border-slate-800">
          <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
          <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
          <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
        </div>

        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-slate-200 dark:border-slate-800">
          <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
          <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
        </div>

        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-slate-200 dark:border-slate-800">
          <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
          <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
          <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => execCommand('removeFormat')} icon={Type} title="Clear Formatting" />
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[300px] bg-white dark:bg-slate-900">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          className="rte-content min-h-[300px] p-6 focus:outline-none prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base dark:text-slate-200 selection:bg-primary-100 dark:selection:bg-primary-900/40"
        />
        
        {/* Placeholder Style */}
        {(!value || value === '<br>' || value === '' || value === '<p><br></p>') && !isFocused && (
          <div className="absolute top-6 left-6 text-slate-400 pointer-events-none text-sm font-medium italic">
            {placeholder || 'Write your article here...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;

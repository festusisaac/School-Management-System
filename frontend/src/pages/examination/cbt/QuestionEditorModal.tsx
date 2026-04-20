import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, HelpCircle } from 'lucide-react';

interface QuestionEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    editingQuestion?: any;
}

export default function QuestionEditorModal({ isOpen, onClose, onSave, editingQuestion }: QuestionEditorModalProps) {
    const [content, setContent] = useState('');
    const [marks, setMarks] = useState(1);
    const [options, setOptions] = useState<any[]>([
        { content: '', isCorrect: true },
        { content: '', isCorrect: false }
    ]);

    useEffect(() => {
        if (editingQuestion) {
            setContent(editingQuestion.content);
            setMarks(editingQuestion.marks);
            setOptions(editingQuestion.options || []);
        } else {
            setContent('');
            setMarks(1);
            setOptions([
                { content: '', isCorrect: true },
                { content: '', isCorrect: false }
            ]);
        }
    }, [editingQuestion, isOpen]);

    if (!isOpen) return null;

    const handleAddOption = () => {
        if (options.length < 5) {
            setOptions([...options, { content: '', isCorrect: false }]);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            if (!newOptions.some(o => o.isCorrect)) {
                newOptions[0].isCorrect = true;
            }
            setOptions(newOptions);
        }
    };

    const handleSetCorrect = (index: number) => {
        setOptions(options.map((o, i) => ({ ...o, isCorrect: i === index })));
    };

    const handleOptionChange = (index: number, val: string) => {
        const newOptions = [...options];
        newOptions[index].content = val;
        setOptions(newOptions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ content, marks, options });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-gray-100 dark:border-gray-700">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                            <HelpCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {editingQuestion ? 'Edit Question' : 'New MCQ Question'}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Content Section */}
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5">Question Content</label>
                        <textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 p-4 min-h-[140px] text-sm dark:text-gray-200 transition-all outline-none"
                            placeholder="Type the question content..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5">Marks Weight</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={marks}
                                onChange={(e) => setMarks(parseInt(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 px-4 py-2.5 text-sm dark:text-gray-200 transition-all outline-none font-bold"
                            />
                        </div>
                    </div>

                    {/* Options Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-gray-50 dark:border-gray-700 pb-2">
                            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Options & Answer Key</label>
                            <button
                                type="button"
                                onClick={handleAddOption}
                                disabled={options.length >= 5}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Option
                            </button>
                        </div>

                        <div className="space-y-3">
                            {options.map((opt, index) => (
                                <div key={index} className="flex items-center gap-3 animate-in slide-in-from-left duration-200">
                                    <button
                                        type="button"
                                        onClick={() => handleSetCorrect(index)}
                                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all border-2 ${
                                            opt.isCorrect 
                                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400' 
                                                : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-300 hover:border-gray-300'
                                        }`}
                                        title={opt.isCorrect ? "Correct Answer" : "Mark as correct"}
                                    >
                                        {opt.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </button>
                                    <div className="flex-1 relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            value={opt.content}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder="Type option content..."
                                            className={`w-full pl-8 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm dark:text-gray-200 transition-all outline-none ${
                                                opt.isCorrect ? 'border-primary-500 bg-primary-50/20' : ''
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(index)}
                                            disabled={options.length <= 2}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm shadow-primary-500/20 transition-all active:scale-95"
                    >
                        {editingQuestion ? 'Update Question' : 'Save Question'}
                    </button>
                </div>
            </div>
        </div>
    );
}

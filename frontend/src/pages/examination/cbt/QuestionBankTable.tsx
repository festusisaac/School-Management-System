import React from 'react';
import { Trash2, Edit, ListTree, MoreVertical, Layers } from 'lucide-react';

interface QuestionBankTableProps {
    questions: any[];
    onEdit: (question: any) => void;
    onDelete: (id: string) => void;
}

export default function QuestionBankTable({ questions, onEdit, onDelete }: QuestionBankTableProps) {
    if (questions.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-gray-50/30 dark:bg-gray-900/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <ListTree className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-500 font-bold">No questions found</p>
                <p className="text-xs text-gray-400 mt-1">Start by adding a question manually or use the bulk upload tool.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Question Content</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Structure</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Weight</th>
                            <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {questions.map((q) => (
                            <tr key={q.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2 max-w-md">
                                        {q.content}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-primary-500" />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                            {q.options?.length || 0} Options
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
                                        {q.marks} Marks
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(q)}
                                            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg transition-all"
                                            title="Edit Question"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(q.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                                            title="Delete Question"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

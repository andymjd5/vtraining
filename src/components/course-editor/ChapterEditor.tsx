// src/components/course-editor/ChapterEditor.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react';
import { ChapterWithSections, SectionWithContent } from '../../types/course';
import SectionEditor from './SectionEditor';

interface ChapterEditorProps {
    chapter: ChapterWithSections;
    isActive: boolean;
    onChapterClick: (id: string) => void;
    onChapterUpdate: (chapter: ChapterWithSections) => void;
    onChapterDelete: (id: string) => void;
    onSectionClick: (chapterId: string, sectionId: string) => void;
    activeSection: string | null;
    onSectionUpdate: (chapterId: string, section: SectionWithContent) => void;
    onAddSection: (chapterId: string) => void;
    onSectionDelete: (chapterId: string, sectionId: string) => void;
    onDragStart: React.DragEventHandler<HTMLDivElement>;
    onDragOver: React.DragEventHandler<HTMLDivElement>;
    onDrop: React.DragEventHandler<HTMLDivElement>;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({
    chapter,
    isActive,
    onChapterClick,
    onChapterUpdate,
    onChapterDelete,
    onSectionClick,
    activeSection,
    onSectionUpdate,
    onAddSection,
    onSectionDelete,
    onDragStart,
    onDragOver,
    onDrop
}) => {
    const [expanded, setExpanded] = useState(isActive);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChapterUpdate({
            ...chapter,
            title: e.target.value
        });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChapterUpdate({
            ...chapter,
            description: e.target.value
        });
    };

    const handleExpandToggle = () => {
        setExpanded(!expanded);
        if (!expanded) {
            onChapterClick(chapter.id);
        }
    };

    return (
        <div
            className="border border-gray-200 rounded-lg shadow-sm bg-white mb-4"
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            data-chapter-id={chapter.id}
        >
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={handleExpandToggle}>
                <div className="flex items-center gap-3 flex-1">
                    <div className="cursor-move">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className={`flex items-center gap-2 ${isActive ? 'text-red-600 font-medium' : ''}`}>
                        {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        {isActive ? (
                            <input
                                type="text"
                                value={chapter.title}
                                onChange={handleTitleChange}
                                className="text-lg font-medium border-b border-gray-300 focus:border-red-500 focus:outline-none px-1 py-0.5"
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Titre du chapitre"
                            />
                        ) : (
                            <span className="text-lg font-medium">{chapter.title || "Chapitre sans titre"}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddSection(chapter.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        title="Ajouter une section"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chapitre ?')) {
                                onChapterDelete(chapter.id);
                            }
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full"
                        title="Supprimer ce chapitre"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isActive && expanded && (
                <div className="px-4 pb-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description du chapitre
                        </label>
                        <textarea
                            value={chapter.description || ''}
                            onChange={handleDescriptionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                            rows={2}
                            placeholder="Description du chapitre..."
                        />
                    </div>
                </div>
            )}

            {expanded && (
                <div className="ml-8 pl-4 border-l border-gray-200">
                    {chapter.sections && chapter.sections.length > 0 ? (
                        chapter.sections.map((section) => (
                            <SectionEditor
                                key={section.id}
                                section={section}
                                isActive={activeSection === section.id}
                                onSectionClick={() => onSectionClick(chapter.id, section.id)}
                                onSectionUpdate={(updatedSection) => onSectionUpdate(chapter.id, updatedSection)}
                                onSectionDelete={() => onSectionDelete(chapter.id, section.id)}
                                onDragStart={onDragStart}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                            />
                        ))
                    ) : (
                        <div className="py-4 text-center text-gray-500 italic text-sm">
                            Aucune section dans ce chapitre.
                            <button
                                className="ml-2 text-red-500 hover:underline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddSection(chapter.id);
                                }}
                            >
                                Ajouter une section
                            </button>
                        </div>
                    )}

                    {chapter.sections && chapter.sections.length > 0 && (
                        <div className="py-2 text-center">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddSection(chapter.id);
                                }}
                                className="text-sm text-red-500 hover:text-red-600 py-1 px-3 hover:bg-red-50 rounded inline-flex items-center gap-1"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Ajouter une nouvelle section
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChapterEditor;

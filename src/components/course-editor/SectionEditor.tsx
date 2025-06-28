// src/components/course-editor/SectionEditor.tsx
import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { SectionWithContent } from '../../types/course';

interface SectionEditorProps {
    section: SectionWithContent;
    isActive: boolean;
    onSectionClick: () => void;
    onSectionUpdate: (section: SectionWithContent) => void;
    onSectionDelete: () => void;
    onDragStart: React.DragEventHandler<HTMLDivElement>;
    onDragOver: React.DragEventHandler<HTMLDivElement>;
    onDrop: React.DragEventHandler<HTMLDivElement>;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
    section,
    isActive,
    onSectionClick,
    onSectionUpdate,
    onSectionDelete,
    onDragStart,
    onDragOver,
    onDrop
}) => {
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSectionUpdate({
            ...section,
            title: e.target.value
        });
    };

    return (
        <div
            className={`border border-gray-200 rounded-md mb-3 p-3 cursor-pointer ${isActive ? 'bg-red-50 border-red-200' : 'bg-white hover:bg-gray-50'
                }`}
            onClick={onSectionClick}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            data-section-id={section.id}
            data-chapter-id={section.chapterId}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                    <div className="cursor-move">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                    {isActive ? (
                        <input
                            type="text"
                            value={section.title}
                            onChange={handleTitleChange}
                            className={`flex-1 border-b ${isActive ? 'border-red-300' : 'border-gray-200'
                                } focus:border-red-500 focus:outline-none px-1 py-0.5`}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Titre de la section"
                        />
                    ) : (
                        <span className={`${isActive ? 'font-medium text-red-600' : 'text-gray-800'}`}>
                            {section.title || "Section sans titre"}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) {
                            onSectionDelete();
                        }
                    }}
                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Supprimer cette section"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            {isActive && (
                <div className="mt-2 text-xs text-gray-500">
                    {section.content?.length || 0} bloc(s) de contenu
                </div>
            )}
        </div>
    );
};

export default SectionEditor;

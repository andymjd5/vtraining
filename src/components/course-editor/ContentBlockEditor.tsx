// src/components/course-editor/ContentBlockEditor.tsx
import React, { useState } from 'react';
import {
    Trash2, GripVertical, Bold, Italic, List,
    AlignLeft, AlignCenter, AlignRight, Image as ImageIcon,
    FileVideo
} from 'lucide-react';
import { ContentBlock } from '../../types/course';

interface ContentBlockEditorProps {
    block: ContentBlock;
    isSelected: boolean;
    onBlockUpdate: (block: ContentBlock) => void;
    onBlockDelete: () => void;
    onBlockSelect: () => void;
    onDragStart: React.DragEventHandler<HTMLDivElement>;
    onDragOver: React.DragEventHandler<HTMLDivElement>;
    onDrop: React.DragEventHandler<HTMLDivElement>;
    onImageUpload: () => void;
    onVideoUpload: () => void;
}

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
    block,
    isSelected,
    onBlockUpdate,
    onBlockDelete,
    onBlockSelect,
    onDragStart,
    onDragOver,
    onDrop,
    onImageUpload,
    onVideoUpload
}) => {
    const [caption, setCaption] = useState(block.media?.caption || '');

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onBlockUpdate({
            ...block,
            content: e.target.value
        });
    };

    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCaption(e.target.value);
        if (block.media) {
            onBlockUpdate({
                ...block,
                media: {
                    ...block.media,
                    caption: e.target.value
                }
            });
        }
    };

    const toggleFormat = (formatType: string) => {
        const newFormatting = { ...(block.formatting || {}) };

        if (formatType === 'bold') {
            newFormatting.bold = !newFormatting.bold;
        } else if (formatType === 'italic') {
            newFormatting.italic = !newFormatting.italic;
        } else if (formatType === 'list') {
            newFormatting.list = !newFormatting.list;
        } else if (formatType === 'left' || formatType === 'center' || formatType === 'right') {
            newFormatting.alignment = formatType as 'left' | 'center' | 'right';
        }

        onBlockUpdate({
            ...block,
            formatting: newFormatting
        });
    };

    const changeMediaAlignment = (alignment: 'left' | 'center' | 'right') => {
        if (block.media) {
            onBlockUpdate({
                ...block,
                media: {
                    ...block.media,
                    alignment
                }
            });
        }
    };

    return (
        <div
            className={`group relative border rounded-lg p-3 mb-4 transition-colors ${isSelected ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            onClick={onBlockSelect}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            data-block-id={block.id}
        >
            {/* Poignée de déplacement */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            </div>

            {/* Bouton de suppression */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bloc de contenu ?')) {
                        onBlockDelete();
                    }
                }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
            >
                <Trash2 className="h-4 w-4" />
            </button>

            {/* Contenu du bloc */}
            {block.type === 'text' ? (
                <div>
                    {isSelected && (
                        <div className="flex gap-1 mb-2 py-1 px-2 bg-white border border-gray-200 rounded">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFormat('bold');
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${block.formatting?.bold ? 'bg-gray-200' : ''}`}
                                title="Gras"
                            >
                                <Bold className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFormat('italic');
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${block.formatting?.italic ? 'bg-gray-200' : ''}`}
                                title="Italique"
                            >
                                <Italic className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFormat('list');
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${block.formatting?.list ? 'bg-gray-200' : ''}`}
                                title="Liste"
                            >
                                <List className="h-4 w-4" />
                            </button>

                            <div className="border-l border-gray-300 mx-1"></div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFormat('left');
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${block.formatting?.alignment === 'left' ? 'bg-gray-200' : ''}`}
                                title="Aligné à gauche"
                            >
                                <AlignLeft className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFormat('center');
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${block.formatting?.alignment === 'center' ? 'bg-gray-200' : ''}`}
                                title="Centré"
                            >
                                <AlignCenter className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFormat('right');
                                }}
                                className={`p-1 rounded hover:bg-gray-100 ${block.formatting?.alignment === 'right' ? 'bg-gray-200' : ''}`}
                                title="Aligné à droite"
                            >
                                <AlignRight className="h-4 w-4" />
                            </button>

                            <div className="border-l border-gray-300 mx-1"></div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onImageUpload();
                                }}
                                className="p-1 rounded hover:bg-gray-100"
                                title="Ajouter une image"
                            >
                                <ImageIcon className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onVideoUpload();
                                }}
                                className="p-1 rounded hover:bg-gray-100"
                                title="Ajouter une vidéo"
                            >
                                <FileVideo className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <textarea
                        value={block.content}
                        onChange={handleContentChange}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Tapez votre contenu ici..."
                        className={`w-full min-h-[100px] p-3 border border-gray-200 rounded-lg resize-none ${block.formatting?.bold ? 'font-bold' : ''
                            } ${block.formatting?.italic ? 'italic' : ''
                            } ${block.formatting?.alignment === 'center'
                                ? 'text-center'
                                : block.formatting?.alignment === 'right'
                                    ? 'text-right'
                                    : 'text-left'
                            }`}
                        style={{
                            listStyleType: block.formatting?.list ? 'disc' : 'none',
                            paddingLeft: block.formatting?.list ? '2rem' : '0.75rem'
                        }}
                    />
                </div>
            ) : block.type === 'media' && block.media ? (
                <div className={`flex justify-${block.media.alignment}`}>
                    <div className="max-w-md">
                        {block.media.type === 'image' ? (
                            <img
                                src={block.media.url}
                                alt={block.media.caption || 'Image du cours'}
                                className="w-full h-auto rounded-lg shadow-sm"
                            />
                        ) : (
                            <video
                                src={block.media.url}
                                controls
                                className="w-full h-auto rounded-lg shadow-sm"
                            />
                        )}

                        {isSelected && (
                            <input
                                type="text"
                                value={caption}
                                onChange={handleCaptionChange}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Légende (optionnelle)"
                                className="w-full mt-2 p-2 text-sm border border-gray-200 rounded"
                            />
                        )}

                        {block.media.caption && !isSelected && (
                            <p className="text-sm text-gray-600 mt-1 text-center italic">
                                {block.media.caption}
                            </p>
                        )}

                        {/* Contrôles d'alignement des médias */}
                        {isSelected && (
                            <div className="flex justify-center gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        changeMediaAlignment('left');
                                    }}
                                    className={`p-1 rounded ${block.media.alignment === 'left' ? 'bg-gray-200' : 'hover:bg-gray-100'
                                        }`}
                                    title="Aligner à gauche"
                                >
                                    <AlignLeft className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        changeMediaAlignment('center');
                                    }}
                                    className={`p-1 rounded ${block.media.alignment === 'center' ? 'bg-gray-200' : 'hover:bg-gray-100'
                                        }`}
                                    title="Centrer"
                                >
                                    <AlignCenter className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        changeMediaAlignment('right');
                                    }}
                                    className={`p-1 rounded ${block.media.alignment === 'right' ? 'bg-gray-200' : 'hover:bg-gray-100'
                                        }`}
                                    title="Aligner à droite"
                                >
                                    <AlignRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-gray-500">
                    Type de contenu non pris en charge
                </div>
            )}
        </div>
    );
};

export default ContentBlockEditor;

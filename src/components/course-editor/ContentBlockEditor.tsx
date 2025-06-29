// src/components/course-editor/ContentBlockEditor.tsx
import React, { useState, useRef } from 'react';
import {
    Type, Image, Video, Volume2, FileText, Code, Link, Trash2, Move, Upload
} from 'lucide-react';
import { ContentBlock, MediaItem } from '../../types/course';
import MarkdownEditor from '../ui/MarkdownEditor';
import MarkdownPreview from '../ui/MarkdownPreview';
import { mediaService } from '../../services/mediaService';

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
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);    // Fonction pour changer le type de bloc
    const handleTypeChange = (newType: ContentBlock['type']) => {
        const updatedBlock: ContentBlock = {
            ...block,
            type: newType,
            content: newType === 'text' ? block.content : '',
            formatting: newType === 'text' ? block.formatting : undefined,
            media: newType === 'media' ? block.media : undefined
        };
        onBlockUpdate(updatedBlock);
    };

    // Fonction pour mettre à jour le contenu
    const handleContentUpdate = (content: string) => {
        onBlockUpdate({ ...block, content });
    };

    // Fonction pour mettre à jour le formatage (seulement pour le texte)
    const handleFormattingUpdate = (formatting: any) => {
        if (block.type === 'text') {
            onBlockUpdate({ ...block, formatting });
        }
    };

    // Fonction pour gérer l'upload de média
    const handleMediaUpload = async (file: File, mediaType: 'image' | 'video' | 'audio') => {
        setUploading(true);
        setUploadProgress(0);

        try {
            const uploadResult = await mediaService.uploadMedia(file, mediaType, (progress) => {
                setUploadProgress(progress);
            });

            const mediaItem: MediaItem = {
                id: uploadResult.id,
                type: mediaType,
                url: uploadResult.url,
                thumbnailUrl: uploadResult.thumbnailUrl,
                duration: uploadResult.duration,
                fileSize: file.size,
                mimeType: file.type,
                alignment: 'center'
            };            onBlockUpdate({
                ...block,
                type: 'media',
                media: mediaItem,
                content: '' // Vider le content car on utilise media
            });
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            alert('Erreur lors de l\'upload du fichier');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };    // Fonction pour mettre à jour les propriétés du média
    const handleMediaUpdate = (updatedMedia: Partial<MediaItem>) => {
        if (block.media) {
            onBlockUpdate({
                ...block,
                media: { ...block.media, ...updatedMedia }
            });
        }
    };

    // Rendu du sélecteur de type
    const renderTypeSelector = () => (
        <div className="flex flex-wrap gap-2 mb-4">
            <button
                type="button"
                onClick={() => handleTypeChange('text')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${block.type === 'text'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                <Type className="h-4 w-4" />
                Texte
            </button>
            <button
                type="button"
                onClick={() => handleTypeChange('media')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${block.type === 'media'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                <Image className="h-4 w-4" />
                Média
            </button>
            <button
                type="button"
                onClick={() => handleTypeChange('file')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${block.type === 'file'
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                <FileText className="h-4 w-4" />
                Fichier
            </button>
            <button
                type="button"
                onClick={() => handleTypeChange('code')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${block.type === 'code'
                        ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                <Code className="h-4 w-4" />
                Code
            </button>
            <button
                type="button"
                onClick={() => handleTypeChange('embed')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${block.type === 'embed'
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                <Link className="h-4 w-4" />
                Embed
            </button>
        </div>
    );

    // Rendu de l'éditeur de texte
    const renderTextEditor = () => (
        <div className="space-y-4">
            <MarkdownEditor
                value={block.content}
                onChange={handleContentUpdate}
                placeholder="Saisissez votre texte ici... (Markdown supporté)"
            />
        </div>
    );

    // Rendu de l'éditeur de média
    const renderMediaEditor = () => (
        <div className="space-y-4">
            {!block.media ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="space-y-4">
                        <p className="text-gray-600">Sélectionnez le type de média à ajouter</p>
                        <div className="flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                data-media-type="image"
                            >
                                <Image className="h-4 w-4" />
                                Image
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                data-media-type="video"
                            >
                                <Video className="h-4 w-4" />
                                Vidéo
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lng hover:bg-purple-600"
                                data-media-type="audio"
                            >
                                <Volume2 className="h-4 w-4" />
                                Audio
                            </button>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,audio/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                let mediaType: 'image' | 'video' | 'audio';
                                if (file.type.startsWith('image/')) mediaType = 'image';
                                else if (file.type.startsWith('video/')) mediaType = 'video';
                                else if (file.type.startsWith('audio/')) mediaType = 'audio';
                                else {
                                    alert('Type de fichier non supporté');
                                    return;
                                }
                                handleMediaUpload(file, mediaType);
                            }
                        }}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Prévisualisation du média */}
                    <div className="border rounded-lg p-4">
                        {block.media.type === 'image' && (
                            <img
                                src={block.media.url}
                                alt={block.media.caption || 'Image'}
                                className="max-w-full h-auto"
                                style={{ textAlign: block.media.alignment || 'center' }}
                            />
                        )}
                        {block.media.type === 'video' && (
                            <video
                                src={block.media.url}
                                controls
                                className="max-w-full h-auto"
                                style={{ textAlign: block.media.alignment || 'center' }}
                            />
                        )}
                        {block.media.type === 'audio' && (
                            <audio
                                src={block.media.url}
                                controls
                                className="w-full"
                            />
                        )}
                    </div>

                    {/* Contrôles du média */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Légende
                            </label>
                            <input
                                type="text"
                                value={block.media.caption || ''}
                                onChange={(e) => handleMediaUpdate({ caption: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Légende du média"
                            />
                        </div>

                        {block.media.type !== 'audio' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Alignement
                                </label>
                                <select
                                    value={block.media.alignment || 'center'}
                                    onChange={(e) => handleMediaUpdate({ alignment: e.target.value as 'left' | 'center' | 'right' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="left">Gauche</option>
                                    <option value="center">Centre</option>
                                    <option value="right">Droite</option>
                                </select>
                            </div>
                        )}
                    </div>                    {/* Bouton pour remplacer le média */}
                    <button
                        type="button"
                        onClick={() => onBlockUpdate({ ...block, media: undefined })}
                        className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        Remplacer le média
                    </button>
                </div>
            )}

            {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 text-blue-600 animate-spin" />
                        <div className="flex-1">
                            <p className="text-sm text-blue-800">Upload en cours...</p>
                            <div className="mt-2 bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Rendu de l'éditeur de fichier
    const renderFileEditor = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL ou chemin du fichier
                </label>
                <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleContentUpdate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com/fichier.pdf"
                />
            </div>
        </div>
    );

    // Rendu de l'éditeur de code
    const renderCodeEditor = () => (
        <div className="space-y-4">
            <textarea
                value={block.content}
                onChange={(e) => handleContentUpdate(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="// Votre code ici..."
            />
        </div>
    );

    // Rendu de l'éditeur d'embed
    const renderEmbedEditor = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code d'intégration (iframe, etc.)
                </label>
                <textarea
                    value={block.content}
                    onChange={(e) => handleContentUpdate(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="<iframe src='...' width='100%' height='400'></iframe>"
                />
            </div>
        </div>
    );    return (
        <div 
            className={`group relative border rounded-lg p-3 mb-4 transition-colors ${
                isSelected ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                <Move className="h-5 w-5 text-gray-400 cursor-move" />
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
            </button>            {/* Sélecteur de type et éditeur */}
            {isSelected ? (
                <div>
                    {/* Sélecteur de type */}
                    {renderTypeSelector()}

                    {/* Éditeur spécifique au type */}
                    {block.type === 'text' && renderTextEditor()}
                    {block.type === 'media' && renderMediaEditor()}
                    {block.type === 'file' && renderFileEditor()}
                    {block.type === 'code' && renderCodeEditor()}
                    {block.type === 'embed' && renderEmbedEditor()}
                </div>
            ) : (
                <div className="min-h-[60px] p-3 border border-gray-200 rounded-lg bg-white">
                    {block.type === 'text' && block.content.trim() ? (
                        <div className="prose prose-sm max-w-none">
                            <MarkdownPreview content={block.content} />
                        </div>
                    ) : block.type === 'media' && block.media ? (
                        <div className="text-center">
                            <span className="text-sm text-gray-600">
                                {block.media.type === 'image' ? '🖼️ Image' : 
                                 block.media.type === 'video' ? '🎥 Vidéo' : 
                                 '🎵 Audio'}
                                {block.media.caption && `: ${block.media.caption}`}
                            </span>
                        </div>
                    ) : (
                        <div className="text-gray-400 italic">
                            Cliquez pour éditer ce bloc de contenu...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContentBlockEditor;

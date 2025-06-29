// src/components/course-editor/CourseContentEditor.tsx
import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { ChapterWithSections, SectionWithContent, ContentBlock } from '../../types/course';
import ChapterEditor from './ChapterEditor';
import { uuidv4 } from '@firebase/util';
import { mediaService } from '../../services/mediaService';
import ContentBlockEditor from './ContentBlockEditor';

interface CourseContentEditorProps {
    chapters: ChapterWithSections[];
    onChaptersChange: (chapters: ChapterWithSections[]) => void;
    courseId: string;
}

const CourseContentEditor: React.FC<CourseContentEditorProps> = ({
    chapters,
    onChaptersChange,
    courseId
}) => {
    const [activeChapter, setActiveChapter] = useState<string | null>(
        chapters.length > 0 ? chapters[0].id : null
    );
    const [activeSection, setActiveSection] = useState<string | null>(
        chapters.length > 0 && chapters[0].sections.length > 0 ? chapters[0].sections[0].id : null
    );
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{
        type: 'chapter' | 'section' | 'block';
        id: string;
        sourceChapterId?: string;
        sourceSectionId?: string;
    } | null>(null);    // Références pour les uploads de médias
    const imageUploadRef = useRef<HTMLInputElement>(null);
    const videoUploadRef = useRef<HTMLInputElement>(null);
    const audioUploadRef = useRef<HTMLInputElement>(null);

    // Fonctions de gestion des chapitres
    const handleAddChapter = () => {
        const newChapterId = `ch-${uuidv4()}`;
        const newChapter: ChapterWithSections = {
            id: newChapterId,
            courseId,
            title: `Chapitre ${chapters.length + 1}`,
            description: '',
            order: chapters.length,
            sectionsOrder: [],
            sections: [],
            learningObjectives: [],
            estimatedTime: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const updatedChapters = [...chapters, newChapter];
        onChaptersChange(updatedChapters);
        setActiveChapter(newChapterId);
        setActiveSection(null);
    };

    const handleUpdateChapter = (updatedChapter: ChapterWithSections) => {
        const updatedChapters = chapters.map(chapter =>
            chapter.id === updatedChapter.id ? updatedChapter : chapter
        );
        onChaptersChange(updatedChapters);
    };

    const handleDeleteChapter = (chapterId: string) => {
        const updatedChapters = chapters.filter(chapter => chapter.id !== chapterId);

        // Si le chapitre actif est supprimé, définir un nouveau chapitre actif
        if (activeChapter === chapterId) {
            if (updatedChapters.length > 0) {
                setActiveChapter(updatedChapters[0].id);
                if (updatedChapters[0].sections.length > 0) {
                    setActiveSection(updatedChapters[0].sections[0].id);
                } else {
                    setActiveSection(null);
                }
            } else {
                setActiveChapter(null);
                setActiveSection(null);
            }
        }

        // Mettre à jour l'ordre des chapitres restants
        const reorderedChapters = updatedChapters.map((chapter, index) => ({
            ...chapter,
            order: index
        }));

        onChaptersChange(reorderedChapters);
    };

    // Fonctions de gestion des sections
    const handleAddSection = (chapterId: string) => {
        const chapter = chapters.find(ch => ch.id === chapterId);
        if (!chapter) return;

        const newSectionId = `sec-${uuidv4()}`;
        const newSection: SectionWithContent = {
            id: newSectionId,
            courseId,
            chapterId,
            title: `Section ${chapter.sections.length + 1}`,
            order: chapter.sections.length,
            contentBlocksOrder: [],
            content: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const updatedChapter = {
            ...chapter,
            sectionsOrder: [...chapter.sectionsOrder, newSectionId],
            sections: [...chapter.sections, newSection]
        };

        const updatedChapters = chapters.map(ch =>
            ch.id === chapterId ? updatedChapter : ch
        );
        onChaptersChange(updatedChapters);
        setActiveChapter(chapterId);
        setActiveSection(newSectionId);
    };

    const handleUpdateSection = (chapterId: string, updatedSection: SectionWithContent) => {
        const updatedChapters = chapters.map(chapter => {
            if (chapter.id !== chapterId) return chapter;

            const updatedSections = chapter.sections.map(section =>
                section.id === updatedSection.id ? updatedSection : section
            );

            return {
                ...chapter,
                sections: updatedSections
            };
        });

        onChaptersChange(updatedChapters);
    };

    const handleDeleteSection = (chapterId: string, sectionId: string) => {
        const updatedChapters = chapters.map(chapter => {
            if (chapter.id !== chapterId) return chapter;

            const updatedSections = chapter.sections.filter(section => section.id !== sectionId);
            const updatedSectionsOrder = chapter.sectionsOrder.filter(id => id !== sectionId);

            // Mettre à jour l'ordre des sections restantes
            const reorderedSections = updatedSections.map((section, index) => ({
                ...section,
                order: index
            }));

            return {
                ...chapter,
                sections: reorderedSections,
                sectionsOrder: updatedSectionsOrder
            };
        });

        // Si la section active est supprimée, définir une nouvelle section active
        if (activeSection === sectionId) {
            const chapter = updatedChapters.find(ch => ch.id === chapterId);
            if (chapter && chapter.sections.length > 0) {
                setActiveSection(chapter.sections[0].id);
            } else {
                setActiveSection(null);
            }
        }

        onChaptersChange(updatedChapters);
    };

    // Fonctions de gestion des blocs de contenu
    const handleAddContentBlock = (type: 'text') => {
        if (!activeChapter || !activeSection) return;

        const newBlockId = `blk-${uuidv4()}`;
        const newBlock: ContentBlock = {
            id: newBlockId,
            sectionId: activeSection,
            chapterId: activeChapter,
            courseId,
            type,
            content: '',
            order: getActiveSectionContent().length,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const updatedChapters = chapters.map(chapter => {
            if (chapter.id !== activeChapter) return chapter;

            const updatedSections = chapter.sections.map(section => {
                if (section.id !== activeSection) return section;

                const updatedContentBlocksOrder = [...section.contentBlocksOrder, newBlockId];
                const updatedContent = [...section.content, newBlock];

                return {
                    ...section,
                    contentBlocksOrder: updatedContentBlocksOrder,
                    content: updatedContent
                };
            });

            return {
                ...chapter,
                sections: updatedSections
            };
        });

        onChaptersChange(updatedChapters);
        setSelectedBlock(newBlockId);
    };

    const handleUpdateContentBlock = (blockId: string, updatedBlock: ContentBlock) => {
        if (!activeChapter || !activeSection) return;

        const updatedChapters = chapters.map(chapter => {
            if (chapter.id !== activeChapter) return chapter;

            const updatedSections = chapter.sections.map(section => {
                if (section.id !== activeSection) return section;

                const updatedContent = section.content.map(block =>
                    block.id === blockId ? updatedBlock : block
                );

                return {
                    ...section,
                    content: updatedContent
                };
            });

            return {
                ...chapter,
                sections: updatedSections
            };
        });

        onChaptersChange(updatedChapters);
    };

    const handleDeleteContentBlock = (blockId: string) => {
        if (!activeChapter || !activeSection) return;

        const updatedChapters = chapters.map(chapter => {
            if (chapter.id !== activeChapter) return chapter;

            const updatedSections = chapter.sections.map(section => {
                if (section.id !== activeSection) return section;

                const updatedContent = section.content.filter(block => block.id !== blockId);
                const updatedContentBlocksOrder = section.contentBlocksOrder.filter(id => id !== blockId);

                // Mettre à jour l'ordre des blocs restants
                const reorderedContent = updatedContent.map((block, index) => ({
                    ...block,
                    order: index
                }));

                return {
                    ...section,
                    content: reorderedContent,
                    contentBlocksOrder: updatedContentBlocksOrder
                };
            });

            return {
                ...chapter,
                sections: updatedSections
            };
        });

        // Si le bloc actif est supprimé, effacer la sélection
        if (selectedBlock === blockId) {
            setSelectedBlock(null);
        }

        onChaptersChange(updatedChapters);
    };    // Gestion des uploads de médias
    const handleMediaUpload = async (file: File, type: 'image' | 'video' | 'audio') => {
        if (!activeChapter || !activeSection || !file) return;

        try {
            // Upload du média via le service media
            const result = await mediaService.uploadMedia(
                file,
                type,
                (progress) => {
                    console.log(`Upload progress: ${progress}%`);
                }
            );            // Créer un nouveau bloc de contenu de type média
            const newBlockId = `blk-${uuidv4()}`;
            const newBlock: ContentBlock = {
                id: newBlockId,
                sectionId: activeSection,
                chapterId: activeChapter,
                courseId,
                type: 'media',
                content: '',
                order: getActiveSectionContent().length,
                media: {
                    id: result.id,
                    type,
                    url: result.url,
                    alignment: 'center',
                    thumbnailUrl: result.thumbnailUrl,
                    duration: result.duration,
                    fileSize: result.fileSize,
                    mimeType: result.mimeType,
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mettre à jour les chapitres avec le nouveau bloc
            const updatedChapters = chapters.map(chapter => {
                if (chapter.id !== activeChapter) return chapter;

                const updatedSections = chapter.sections.map(section => {
                    if (section.id !== activeSection) return section;

                    const updatedContentBlocksOrder = [...section.contentBlocksOrder, newBlockId];
                    const updatedContent = [...section.content, newBlock];

                    return {
                        ...section,
                        contentBlocksOrder: updatedContentBlocksOrder,
                        content: updatedContent
                    };
                });

                return {
                    ...chapter,
                    sections: updatedSections
                };
            });

            onChaptersChange(updatedChapters);
            setSelectedBlock(newBlockId);
        } catch (error) {
            console.error('Erreur lors de l\'upload du média:', error);
            alert('Une erreur est survenue lors de l\'upload du média.');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleMediaUpload(file, 'image');
        // Reset input
        if (e.target) e.target.value = '';
    }; const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleMediaUpload(file, 'video');
        // Reset input
        if (e.target) e.target.value = '';
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleMediaUpload(file, 'audio');
        // Reset input
        if (e.target) e.target.value = '';
    };

    // Fonctions pour le drag & drop
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const target = e.currentTarget;

        if (target.dataset.chapterId && !target.dataset.sectionId && !target.dataset.blockId) {
            setDragState({
                type: 'chapter',
                id: target.dataset.chapterId
            });
        } else if (target.dataset.chapterId && target.dataset.sectionId && !target.dataset.blockId) {
            setDragState({
                type: 'section',
                id: target.dataset.sectionId,
                sourceChapterId: target.dataset.chapterId
            });
        } else if (target.dataset.blockId) {
            setDragState({
                type: 'block',
                id: target.dataset.blockId,
                sourceChapterId: activeChapter!,
                sourceSectionId: activeSection!
            });
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!dragState) return;

        const target = e.currentTarget;

        if (dragState.type === 'chapter') {
            handleChapterReorder(dragState.id, target.dataset.chapterId);
        } else if (dragState.type === 'section') {
            handleSectionReorder(
                dragState.id,
                dragState.sourceChapterId!,
                target.dataset.sectionId,
                target.dataset.chapterId
            );
        } else if (dragState.type === 'block') {
            handleBlockReorder(
                dragState.id,
                dragState.sourceChapterId!,
                dragState.sourceSectionId!,
                target.dataset.blockId
            );
        }
        setDragState(null);
    };

    const handleChapterReorder = (draggedId: string, targetId: string | undefined) => {
        if (!targetId || draggedId === targetId) return;

        const draggedIndex = chapters.findIndex(ch => ch.id === draggedId);
        const targetIndex = chapters.findIndex(ch => ch.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const updatedChapters = [...chapters];
        const [draggedChapter] = updatedChapters.splice(draggedIndex, 1);
        updatedChapters.splice(targetIndex, 0, draggedChapter);

        // Mettre à jour l'ordre de tous les chapitres
        const reorderedChapters = updatedChapters.map((chapter, index) => ({
            ...chapter,
            order: index
        }));

        onChaptersChange(reorderedChapters);
    };

    const handleSectionReorder = (
        draggedId: string,
        sourceChapterId: string,
        targetId: string | undefined,
        targetChapterId: string | undefined
    ) => {
        if (!targetChapterId) return;

        const sourceChapterIndex = chapters.findIndex(ch => ch.id === sourceChapterId);
        let targetChapterIndex = chapters.findIndex(ch => ch.id === targetChapterId);

        if (sourceChapterIndex === -1 || targetChapterIndex === -1) return;

        const updatedChapters = [...chapters];
        const sourceChapter = { ...updatedChapters[sourceChapterIndex] };
        const draggedSectionIndex = sourceChapter.sections.findIndex(sec => sec.id === draggedId);

        if (draggedSectionIndex === -1) return;

        const [draggedSection] = sourceChapter.sections.splice(draggedSectionIndex, 1);
        sourceChapter.sectionsOrder = sourceChapter.sections.map(sec => sec.id);
        updatedChapters[sourceChapterIndex] = sourceChapter;

        // Déplacer vers un autre chapitre ou au sein du même chapitre
        if (sourceChapterId === targetChapterId) {
            // Même chapitre - réorganisation
            let targetIndex = -1;
            if (targetId) {
                targetIndex = sourceChapter.sections.findIndex(sec => sec.id === targetId);
            } else {
                targetIndex = sourceChapter.sections.length;
            }

            // Mise à jour du chapterId si déplacé vers un autre chapitre
            const updatedDraggedSection = {
                ...draggedSection,
                chapterId: targetChapterId
            };

            sourceChapter.sections.splice(targetIndex, 0, updatedDraggedSection);
            sourceChapter.sectionsOrder = sourceChapter.sections.map(sec => sec.id);

            // Mettre à jour l'ordre de toutes les sections
            sourceChapter.sections = sourceChapter.sections.map((section, index) => ({
                ...section,
                order: index
            }));

            updatedChapters[sourceChapterIndex] = sourceChapter;
        } else {
            // Chapitre différent
            const targetChapter = { ...updatedChapters[targetChapterIndex] };

            let targetIndex = -1;
            if (targetId) {
                targetIndex = targetChapter.sections.findIndex(sec => sec.id === targetId);
            } else {
                targetIndex = targetChapter.sections.length;
            }

            // Mise à jour du chapterId
            const updatedDraggedSection = {
                ...draggedSection,
                chapterId: targetChapterId
            };

            targetChapter.sections.splice(targetIndex, 0, updatedDraggedSection);
            targetChapter.sectionsOrder = targetChapter.sections.map(sec => sec.id);

            // Mettre à jour l'ordre de toutes les sections dans le chapitre cible
            targetChapter.sections = targetChapter.sections.map((section, index) => ({
                ...section,
                order: index
            }));

            updatedChapters[targetChapterIndex] = targetChapter;
        }

        onChaptersChange(updatedChapters);

        // Mise à jour des sélections actives
        setActiveChapter(targetChapterId);
        setActiveSection(draggedId);
    };

    const handleBlockReorder = (
        draggedId: string,
        sourceChapterId: string,
        sourceSectionId: string,
        targetId: string | undefined
    ) => {
        if (!activeChapter || !activeSection) return;

        const updatedChapters = [...chapters];
        const sourceChapterIndex = updatedChapters.findIndex(ch => ch.id === sourceChapterId);

        if (sourceChapterIndex === -1) return;

        const sourceChapter = { ...updatedChapters[sourceChapterIndex] };
        const sourceSectionIndex = sourceChapter.sections.findIndex(sec => sec.id === sourceSectionId);

        if (sourceSectionIndex === -1) return;

        const sourceSection = { ...sourceChapter.sections[sourceSectionIndex] };
        const draggedBlockIndex = sourceSection.content.findIndex(block => block.id === draggedId);

        if (draggedBlockIndex === -1) return;

        const [draggedBlock] = sourceSection.content.splice(draggedBlockIndex, 1);
        sourceSection.contentBlocksOrder = sourceSection.content.map(block => block.id);

        // Si on déplace vers un autre bloc, trouver sa position
        let targetIndex = -1;
        if (targetId) {
            targetIndex = sourceSection.content.findIndex(block => block.id === targetId);
        } else {
            targetIndex = sourceSection.content.length;
        }

        // Réinsérer le bloc à sa nouvelle position
        sourceSection.content.splice(targetIndex, 0, draggedBlock);
        sourceSection.contentBlocksOrder = sourceSection.content.map(block => block.id);

        // Mettre à jour l'ordre de tous les blocs
        sourceSection.content = sourceSection.content.map((block, index) => ({
            ...block,
            order: index
        }));

        sourceChapter.sections[sourceSectionIndex] = sourceSection;
        updatedChapters[sourceChapterIndex] = sourceChapter;

        onChaptersChange(updatedChapters);
    };

    const getActiveSectionContent = () => {
        if (!activeChapter || !activeSection) return [];

        const chapter = chapters.find(ch => ch.id === activeChapter);
        if (!chapter) return [];

        const section = chapter.sections.find(sec => sec.id === activeSection);
        return section ? section.content : [];
    };

    return (
        <div className="flex h-full">
            {/* Sidebar pour la navigation des chapitres et sections */}
            <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Structure du cours</h3>
                    <button
                        type="button"
                        onClick={handleAddChapter}
                        className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Chapitre
                    </button>
                </div>

                <div className="space-y-2">
                    {chapters.length === 0 ? (
                        <div className="text-center p-8 border border-gray-200 border-dashed rounded-lg">
                            <p className="text-gray-500 mb-4">Le cours n'a pas encore de chapitres</p>
                            <button
                                type="button"
                                onClick={handleAddChapter}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-2 mx-auto"
                            >
                                <Plus className="h-4 w-4" /> Créer un chapitre
                            </button>
                        </div>
                    ) : (
                        chapters.map((chapter) => (
                            <ChapterEditor
                                key={chapter.id}
                                chapter={chapter}
                                isActive={activeChapter === chapter.id}
                                onChapterClick={(id) => {
                                    setActiveChapter(id);
                                    // Sélectionner la première section si le chapitre en a
                                    const ch = chapters.find(c => c.id === id);
                                    if (ch && ch.sections.length > 0) {
                                        setActiveSection(ch.sections[0].id);
                                    } else {
                                        setActiveSection(null);
                                    }
                                }}
                                onChapterUpdate={handleUpdateChapter}
                                onChapterDelete={handleDeleteChapter}
                                onSectionClick={(chapterId, sectionId) => {
                                    setActiveChapter(chapterId);
                                    setActiveSection(sectionId);
                                }}
                                activeSection={activeSection}
                                onSectionUpdate={handleUpdateSection}
                                onAddSection={handleAddSection}
                                onSectionDelete={handleDeleteSection}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Zone d'édition du contenu */}
            <div className="w-2/3 p-4 overflow-y-auto">
                {!activeChapter && (
                    <div className="text-center p-8">
                        <p className="text-gray-500 mb-4">Sélectionnez ou créez un chapitre pour éditer le contenu</p>
                        <button
                            type="button"
                            onClick={handleAddChapter}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-2 mx-auto"
                        >
                            <Plus className="h-4 w-4" /> Créer un chapitre
                        </button>
                    </div>
                )}

                {activeChapter && !activeSection && (
                    <div className="text-center p-8">
                        <p className="text-gray-500 mb-4">Sélectionnez ou créez une section pour éditer le contenu</p>
                        <button
                            type="button"
                            onClick={() => handleAddSection(activeChapter)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-2 mx-auto"
                        >
                            <Plus className="h-4 w-4" /> Créer une section
                        </button>
                    </div>
                )}

                {activeChapter && activeSection && (
                    <div>
                        {/* En-tête de la section active */}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Contenu de la section</h2>

                            <div className="flex items-center gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => handleAddContentBlock('text')}
                                    className="px-3 py-1.5 border border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-md text-sm flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Bloc de texte
                                </button>

                                <button
                                    type="button"
                                    onClick={() => imageUploadRef.current?.click()}
                                    className="px-3 py-1.5 border border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-md text-sm flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Image
                                </button>                                <button
                                    type="button"
                                    onClick={() => videoUploadRef.current?.click()}
                                    className="px-3 py-1.5 border border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-md text-sm flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Vidéo
                                </button>

                                <button
                                    type="button"
                                    onClick={() => audioUploadRef.current?.click()}
                                    className="px-3 py-1.5 border border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-md text-sm flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Audio
                                </button>
                            </div>
                        </div>

                        {/* Liste des blocs de contenu */}
                        <div className="space-y-4">
                            {getActiveSectionContent().length === 0 ? (
                                <div className="text-center p-6 border border-gray-200 border-dashed rounded-lg">
                                    <p className="text-gray-500">Cette section n'a pas encore de contenu</p>
                                    <div className="mt-4 flex justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleAddContentBlock('text')}
                                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm flex items-center gap-1.5"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Ajouter du texte
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => imageUploadRef.current?.click()}
                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm flex items-center gap-1.5"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Ajouter une image
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                getActiveSectionContent().map((block) => (
                                    <div key={block.id}>
                                        {/* Wrapper pour le drag & drop */}
                                        <ContentBlockEditor
                                            block={block}
                                            isSelected={selectedBlock === block.id}
                                            onBlockUpdate={(updatedBlock) => handleUpdateContentBlock(block.id, updatedBlock)}
                                            onBlockDelete={() => handleDeleteContentBlock(block.id)}
                                            onBlockSelect={() => setSelectedBlock(block.id)}
                                            onDragStart={handleDragStart}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                            onImageUpload={() => imageUploadRef.current?.click()}
                                            onVideoUpload={() => videoUploadRef.current?.click()}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>            {/* Inputs cachés pour les uploads */}
            <input
                ref={imageUploadRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
            <input
                ref={videoUploadRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
            />
            <input
                ref={audioUploadRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
            />
        </div>
    );
};

export default CourseContentEditor;

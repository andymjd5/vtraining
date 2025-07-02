import React, { useEffect, useRef, useState } from 'react';
import { ContentBlock } from '../../types/course';
import MarkdownPreview from '../ui/MarkdownPreview';
import { FileText, Download, ExternalLink, CheckCircle, Play, Pause } from 'lucide-react';

interface ContentBlockViewerProps {
    block: ContentBlock;
    className?: string;
    isCompleted?: boolean;
    isActive?: boolean;
    onBlockEnter?: (blockId: string) => void;
    onBlockComplete?: (blockId: string) => void;
    onBlockExit?: () => void;
}

const ContentBlockViewer: React.FC<ContentBlockViewerProps> = ({
    block,
    className = '',
    isCompleted = false,
    isActive = false,
    onBlockEnter,
    onBlockComplete,
    onBlockExit
}) => {
    const [hasBeenViewed, setHasBeenViewed] = useState(false);
    const [viewStartTime, setViewStartTime] = useState<Date | null>(null);
    const [isInView, setIsInView] = useState(false);
    const blockRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // 👁️ Intersection Observer pour détecter quand le bloc entre dans la vue
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasBeenViewed) {
                    setIsInView(true);
                    setViewStartTime(new Date());
                    onBlockEnter?.(block.id);

                    // Marquer comme vu après 2 secondes pour les blocs texte
                    if (block.type === 'text') {
                        setTimeout(() => {
                            setHasBeenViewed(true);
                            onBlockComplete?.(block.id);
                        }, 2000);
                    }
                } else if (!entry.isIntersecting && isInView) {
                    setIsInView(false);
                    if (viewStartTime) {
                        const timeSpent = (new Date().getTime() - viewStartTime.getTime()) / 1000;
                        if (timeSpent >= 2) { // Au moins 2 secondes
                            setHasBeenViewed(true);
                            onBlockComplete?.(block.id);
                        }
                    }
                    onBlockExit?.();
                }
            },
            {
                threshold: 0.5, // 50% du bloc doit être visible
                rootMargin: '0px 0px -100px 0px' // Trigger un peu avant que le bloc soit complètement visible
            }
        );

        if (blockRef.current) {
            observer.observe(blockRef.current);
        }

        return () => {
            if (blockRef.current) {
                observer.unobserve(blockRef.current);
            }
        };
    }, [block.id, hasBeenViewed, isInView, viewStartTime, onBlockEnter, onBlockComplete, onBlockExit]);

    // 🎥 Gestionnaires pour les médias vidéo/audio
    const handleMediaPlay = () => {
        if (!hasBeenViewed) {
            onBlockEnter?.(block.id);
        }
    };

    const handleMediaEnded = () => {
        setHasBeenViewed(true);
        onBlockComplete?.(block.id);
    };

    const handleMediaProgress = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
        const media = e.currentTarget;
        const progress = media.currentTime / media.duration;

        // Marquer comme terminé si 80% du média a été visionné
        if (progress >= 0.8 && !hasBeenViewed) {
            setHasBeenViewed(true);
            onBlockComplete?.(block.id);
        }
    };

    // 📄 Gestionnaire pour les fichiers téléchargés
    const handleFileDownload = () => {
        setHasBeenViewed(true);
        onBlockComplete?.(block.id);
    };
    const renderContent = () => {
        switch (block.type) {
            case 'text':
                return (
                    <div className="prose prose-sm max-w-none">
                        <MarkdownPreview content={block.content} />
                    </div>
                );

            case 'media':
                if (!block.media) return null;

                const alignmentClass = block.media.alignment === 'left' ? 'text-left' :
                    block.media.alignment === 'right' ? 'text-right' : 'text-center';

                return (
                    <div className={`media-container ${alignmentClass}`}>
                        {block.media.type === 'image' && (
                            <div className="inline-block">
                                <img
                                    src={block.media.url}
                                    alt={block.media.caption || 'Image'}
                                    className="max-w-full h-auto rounded-lg shadow-sm"
                                />
                                {block.media.caption && (
                                    <p className="mt-2 text-sm text-gray-600 italic">
                                        {block.media.caption}
                                    </p>
                                )}
                            </div>
                        )}                        {block.media.type === 'video' && (
                            <div className="inline-block">
                                <video
                                    ref={videoRef}
                                    src={block.media.url}
                                    controls
                                    className="max-w-full h-auto rounded-lg shadow-sm"
                                    poster={block.media.thumbnailUrl}
                                    onPlay={handleMediaPlay}
                                    onEnded={handleMediaEnded}
                                    onTimeUpdate={handleMediaProgress}
                                />
                                {block.media.caption && (
                                    <p className="mt-2 text-sm text-gray-600 italic">
                                        {block.media.caption}
                                    </p>
                                )}
                                {block.media.duration && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Durée: {Math.floor(block.media.duration / 60)}:{(block.media.duration % 60).toString().padStart(2, '0')}
                                    </p>
                                )}
                            </div>
                        )}

                        {block.media.type === 'audio' && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <audio
                                    ref={audioRef}
                                    src={block.media.url}
                                    controls
                                    className="w-full"
                                    onPlay={handleMediaPlay}
                                    onEnded={handleMediaEnded}
                                    onTimeUpdate={handleMediaProgress}
                                />
                                {block.media.caption && (
                                    <p className="mt-2 text-sm text-gray-600 italic">
                                        {block.media.caption}
                                    </p>
                                )}
                                {block.media.duration && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Durée: {Math.floor(block.media.duration / 60)}:{(block.media.duration % 60).toString().padStart(2, '0')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'file':
                return (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-gray-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
                                    Fichier joint
                                </p>
                                <p className="text-xs text-gray-600">
                                    {block.content}
                                </p>
                            </div>                            <a
                                href={block.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleFileDownload}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                                <Download className="h-4 w-4" />
                                Télécharger
                            </a>
                        </div>
                    </div>
                );

            case 'code':
                return (
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100">
                            <code>{block.content}</code>
                        </pre>
                    </div>
                );

            case 'embed':
                return (
                    <div
                        className="embed-container"
                        dangerouslySetInnerHTML={{ __html: block.content }}
                    />
                );

            default:
                return (
                    <div className="text-gray-500 italic">
                        Type de contenu non supporté: {block.type}
                    </div>
                );
        }
    }; return (
        <div
            ref={blockRef}
            data-block-id={block.id}
            className={`content-block content-block-${block.type} ${className} relative ${isCompleted ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                } ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        >
            {/* Indicateur de progression */}
            {(isCompleted || hasBeenViewed) && (
                <div className="absolute top-2 right-2 z-10">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                </div>
            )}

            {/* Indicateur de bloc actif */}
            {isActive && !isCompleted && (
                <div className="absolute top-2 left-2 z-10">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <Play className="h-3 w-3 text-white" />
                    </div>
                </div>
            )}

            {renderContent()}
        </div>
    );
};

export default ContentBlockViewer;

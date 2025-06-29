import React from 'react';
import { ContentBlock } from '../../types/course';
import MarkdownPreview from './MarkdownPreview';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface ContentBlockViewerProps {
    block: ContentBlock;
    className?: string;
}

const ContentBlockViewer: React.FC<ContentBlockViewerProps> = ({ block, className = '' }) => {
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
                        )}
                        
                        {block.media.type === 'video' && (
                            <div className="inline-block">
                                <video 
                                    src={block.media.url} 
                                    controls 
                                    className="max-w-full h-auto rounded-lg shadow-sm"
                                    poster={block.media.thumbnailUrl}
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
                                    src={block.media.url} 
                                    controls 
                                    className="w-full"
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
                            </div>
                            <a
                                href={block.content}
                                target="_blank"
                                rel="noopener noreferrer"
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
    };

    return (
        <div className={`content-block content-block-${block.type} ${className}`}>
            {renderContent()}
        </div>
    );
};

export default ContentBlockViewer;

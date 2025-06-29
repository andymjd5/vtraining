import React, { useState } from 'react';
import {
    Bold, Italic, List, ListOrdered, Quote, Code, Link,
    Heading1, Heading2, Heading3, Eye, EyeOff, HelpCircle,
    Image as ImageIcon, Table, Minus
} from 'lucide-react';
import MarkdownPreview from './MarkdownPreview';
import MarkdownHelpModal from './MarkdownHelpModal';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder = "Tapez votre contenu en Markdown...",
    rows = 8,
    className = ''
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

    // Fonction pour insérer du texte à la position du curseur
    const insertText = (before: string, after: string = '', placeholder: string = 'texte') => {
        if (!textareaRef) return;

        const start = textareaRef.selectionStart;
        const end = textareaRef.selectionEnd;
        const selectedText = value.substring(start, end);
        const textToInsert = selectedText || placeholder;

        const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
        onChange(newText);

        // Remettre le focus et sélectionner le texte inséré
        setTimeout(() => {
            textareaRef.focus();
            const newStart = start + before.length;
            const newEnd = newStart + textToInsert.length;
            textareaRef.setSelectionRange(newStart, newEnd);
        }, 0);
    };

    // Fonction pour insérer du texte au début de ligne
    const insertLinePrefix = (prefix: string) => {
        if (!textareaRef) return;

        const start = textareaRef.selectionStart;
        const beforeCursor = value.substring(0, start);
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const lineEnd = value.indexOf('\n', start);
        const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;

        const currentLine = value.substring(lineStart, actualLineEnd);
        const newLine = prefix + currentLine;
        const newText = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);

        onChange(newText);

        setTimeout(() => {
            textareaRef.focus();
            textareaRef.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
        }, 0);
    };

    const markdownButtons = [
        { icon: Bold, action: () => insertText('**', '**', 'texte en gras'), title: 'Gras (Ctrl+B)' },
        { icon: Italic, action: () => insertText('*', '*', 'texte en italique'), title: 'Italique (Ctrl+I)' },
        { icon: Heading1, action: () => insertLinePrefix('# '), title: 'Titre 1' },
        { icon: Heading2, action: () => insertLinePrefix('## '), title: 'Titre 2' },
        { icon: Heading3, action: () => insertLinePrefix('### '), title: 'Titre 3' },
        { icon: List, action: () => insertLinePrefix('- '), title: 'Liste à puces' },
        { icon: ListOrdered, action: () => insertLinePrefix('1. '), title: 'Liste numérotée' },
        { icon: Quote, action: () => insertLinePrefix('> '), title: 'Citation' },
        { icon: Code, action: () => insertText('`', '`', 'code'), title: 'Code en ligne' },
        { icon: Link, action: () => insertText('[', '](url)', 'texte du lien'), title: 'Lien' },
        { icon: ImageIcon, action: () => insertText('![', '](url)', 'texte alternatif'), title: 'Image' },
        { icon: Table, action: () => insertText('\n| Colonne 1 | Colonne 2 |\n|-----------|----------|\n| Cellule 1 | Cellule 2 |\n'), title: 'Tableau' },
        { icon: Minus, action: () => insertText('\n---\n'), title: 'Ligne horizontale' },
    ];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault();
                insertText('**', '**', 'texte en gras');
            } else if (e.key === 'i') {
                e.preventDefault();
                insertText('*', '*', 'texte en italique');
            }
        }
    };

    return (
        <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
            {/* Barre d'outils */}
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-1 flex-wrap">
                    {markdownButtons.map((button, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={button.action}
                            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                            title={button.title}
                        >
                            <button.icon className="h-4 w-4 text-gray-600" />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">          <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                    title="Guide Markdown complet"
                >
                    <HelpCircle className="h-4 w-4 text-gray-600" />
                </button>
                    <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'
                            }`}
                        title={showPreview ? 'Masquer la prévisualisation' : 'Afficher la prévisualisation'}
                    >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>      </div>

            <div className={`flex ${showPreview ? 'divide-x divide-gray-200' : ''}`}>
                {/* Zone d'édition */}
                <div className={showPreview ? 'w-1/2' : 'w-full'}>
                    <textarea
                        ref={setTextareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={rows}
                        className="w-full p-3 border-none resize-none focus:outline-none font-mono text-sm"
                    />
                </div>

                {/* Zone de prévisualisation */}
                {showPreview && (
                    <div className="w-1/2 p-3 bg-gray-50 max-h-96 overflow-y-auto">
                        {value.trim() ? (
                            <MarkdownPreview content={value} />
                        ) : (
                            <div className="text-gray-400 italic">
                                Tapez du contenu pour voir la prévisualisation...
                            </div>
                        )}          </div>
                )}
            </div>

            {/* Modal d'aide Markdown */}
            <MarkdownHelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
        </div>
    );
};

export default MarkdownEditor;

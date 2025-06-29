import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface MarkdownHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MarkdownHelpModal: React.FC<MarkdownHelpModalProps> = ({
    isOpen,
    onClose
}) => {
    if (!isOpen) return null;

    const examples = [
        {
            category: "Formatage du texte",
            items: [
                { markdown: "**texte en gras**", result: <strong>texte en gras</strong> },
                { markdown: "*texte en italique*", result: <em>texte en italique</em> },
                { markdown: "~~texte barré~~", result: <del>texte barré</del> },
                { markdown: "`code en ligne`", result: <code className="bg-gray-200 px-1 rounded">code en ligne</code> },
            ]
        },
        {
            category: "Titres",
            items: [
                { markdown: "# Titre principal", result: <h1 className="text-2xl font-bold">Titre principal</h1> },
                { markdown: "## Sous-titre", result: <h2 className="text-xl font-semibold">Sous-titre</h2> },
                { markdown: "### Titre de section", result: <h3 className="text-lg font-medium">Titre de section</h3> },
            ]
        },
        {
            category: "Listes",
            items: [
                {
                    markdown: "- Élément 1\n- Élément 2\n- Élément 3",
                    result: (
                        <ul className="list-disc ml-4">
                            <li>Élément 1</li>
                            <li>Élément 2</li>
                            <li>Élément 3</li>
                        </ul>
                    )
                },
                {
                    markdown: "1. Premier\n2. Deuxième\n3. Troisième",
                    result: (
                        <ol className="list-decimal ml-4">
                            <li>Premier</li>
                            <li>Deuxième</li>
                            <li>Troisième</li>
                        </ol>
                    )
                },
            ]
        },
        {
            category: "Liens et images",
            items: [
                {
                    markdown: "[Texte du lien](https://example.com)",
                    result: <a href="#" className="text-blue-600 underline">Texte du lien</a>
                },
                {
                    markdown: "![Texte alternatif](url-image.jpg)",
                    result: <span className="text-gray-600 italic">🖼️ Image avec texte alternatif</span>
                },
            ]
        },
        {
            category: "Autres éléments",
            items: [
                {
                    markdown: "> Citation importante",
                    result: (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 p-2">
                            Citation importante
                        </blockquote>
                    )
                },
                {
                    markdown: "---",
                    result: <hr className="border-t border-gray-300 my-2" />
                },
                {
                    markdown: "```javascript\nconst hello = 'world';\n```",
                    result: (
                        <div className="bg-gray-100 p-2 rounded border">
                            <code>const hello = 'world';</code>
                        </div>
                    )
                },
            ]
        },
        {
            category: "Tableaux",
            items: [
                {
                    markdown: "| Colonne 1 | Colonne 2 |\n|-----------|----------|\n| Cellule 1 | Cellule 2 |",
                    result: (
                        <table className="border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr>
                                    <th className="border border-gray-300 p-1 bg-gray-100">Colonne 1</th>
                                    <th className="border border-gray-300 p-1 bg-gray-100">Colonne 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 p-1">Cellule 1</td>
                                    <td className="border border-gray-300 p-1">Cellule 2</td>
                                </tr>
                            </tbody>
                        </table>
                    )
                },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Guide Markdown</h2>
                            <p className="text-sm text-gray-600">Apprenez à formater votre contenu</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                    <div className="space-y-8">
                        {examples.map((category, categoryIndex) => (
                            <div key={categoryIndex}>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    {category.category}
                                </h3>

                                <div className="space-y-4">
                                    {category.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Markdown :</p>
                                                <code className="text-sm bg-white p-2 rounded border block whitespace-pre-wrap">
                                                    {item.markdown}
                                                </code>
                                            </div>
                                            <div className="p-3 bg-white">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Résultat :</p>
                                                <div className="text-sm">
                                                    {item.result}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tips */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">💡 Conseils</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Utilisez la prévisualisation pour voir le rendu en temps réel</li>
                            <li>• Laissez des lignes vides entre les paragraphes pour une meilleure lisibilité</li>
                            <li>• Les raccourcis Ctrl+B (gras) et Ctrl+I (italique) fonctionnent dans l'éditeur</li>
                            <li>• Vous pouvez combiner plusieurs formats (ex: ***gras et italique***)</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Markdown est un langage de balisage léger pour formater du texte
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkdownHelpModal;

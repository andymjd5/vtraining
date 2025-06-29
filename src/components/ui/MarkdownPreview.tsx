import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownPreviewProps {
    content: string;
    className?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className = '' }) => {
    return (
        <div className={`prose prose-sm max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{                    // Personnalisation des composants de rendu
                    code: ({ className: codeClassName, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(codeClassName || '');
                        const isInline = !props.node || props.node.tagName !== 'pre';
                        return !isInline && match ? (
                            <SyntaxHighlighter
                                style={oneLight as any}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                            </code>
                        );
                    },
                    // Personnalisation des liens
                    a: ({ children, href, ...props }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                            {...props}
                        >
                            {children}
                        </a>
                    ),
                    // Personnalisation des titres
                    h1: ({ children, ...props }) => (
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6" {...props}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5" {...props}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4" {...props}>
                            {children}
                        </h3>
                    ),
                    // Personnalisation des listes
                    ul: ({ children, ...props }) => (
                        <ul className="list-disc list-inside space-y-1 mb-4" {...props}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }) => (
                        <ol className="list-decimal list-inside space-y-1 mb-4" {...props}>
                            {children}
                        </ol>
                    ),
                    li: ({ children, ...props }) => (
                        <li className="text-gray-700" {...props}>
                            {children}
                        </li>
                    ),
                    // Personnalisation des paragraphes
                    p: ({ children, ...props }) => (
                        <p className="text-gray-700 mb-3 leading-relaxed" {...props}>
                            {children}
                        </p>
                    ),
                    // Personnalisation des citations
                    blockquote: ({ children, ...props }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 italic" {...props}>
                            {children}
                        </blockquote>
                    ),
                    // Personnalisation des tableaux
                    table: ({ children, ...props }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border-collapse border border-gray-300" {...props}>
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children, ...props }) => (
                        <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold" {...props}>
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }) => (
                        <td className="border border-gray-300 px-3 py-2" {...props}>
                            {children}
                        </td>
                    ),
                    // Personnalisation des lignes horizontales
                    hr: ({ ...props }) => (
                        <hr className="border-t border-gray-300 my-6" {...props} />
                    ),
                    // Personnalisation du texte fort et en italique
                    strong: ({ children, ...props }) => (
                        <strong className="font-semibold text-gray-900" {...props}>
                            {children}
                        </strong>
                    ),
                    em: ({ children, ...props }) => (
                        <em className="italic text-gray-700" {...props}>
                            {children}
                        </em>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownPreview;

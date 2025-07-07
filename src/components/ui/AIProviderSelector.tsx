// src/components/ui/AIProviderSelector.tsx
// Composant pour sélectionner le provider IA

import React from 'react';
import { getAvailableProviders, setAIProvider, type AIProvider } from '../../config/ai';
import { CheckCircle, XCircle, Settings } from 'lucide-react';

interface AIProviderSelectorProps {
    currentProvider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
    className?: string;
}

const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
    currentProvider,
    onProviderChange,
    className = ''
}) => {
    const providers = getAvailableProviders();

    const handleProviderChange = (provider: AIProvider) => {
        try {
            setAIProvider(provider);
            onProviderChange(provider);
        } catch (error) {
            console.error('Erreur lors du changement de provider:', error);
        }
    };

    return (
        <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-800">Provider IA</h4>
            </div>

            <div className="space-y-2">
                {providers.map(({ provider, name, configured }) => (
                    <label
                        key={provider}
                        className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${currentProvider === provider
                                ? 'border-indigo-300 bg-indigo-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            } ${!configured ? 'opacity-50' : ''}`}
                    >
                        <div className="flex items-center">
                            <input
                                type="radio"
                                name="aiProvider"
                                value={provider}
                                checked={currentProvider === provider}
                                onChange={() => handleProviderChange(provider)}
                                disabled={!configured}
                                className="mr-3 text-indigo-500 focus:ring-indigo-500"
                            />
                            <div>
                                <span className="font-medium text-gray-700">{name}</span>
                                {!configured && (
                                    <p className="text-xs text-gray-500">Clé API non configurée</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center">
                            {configured ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                            )}
                        </div>
                    </label>
                ))}
            </div>

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Pour configurer un provider, ajoutez la clé API correspondante dans votre fichier .env :
                </p>
                <ul className="mt-1 text-xs text-blue-600 space-y-1">
                    <li>• <code>VITE_DEEPSEEK_API_KEY</code> pour Deepseek</li>
                    <li>• <code>VITE_OPENAI_API_KEY</code> pour OpenAI</li>
                    <li>• <code>VITE_ANTHROPIC_API_KEY</code> pour Claude</li>
                    <li>• <code>VITE_GEMINI_API_KEY</code> pour Gemini</li>
                </ul>
            </div>
        </div>
    );
};

export default AIProviderSelector;

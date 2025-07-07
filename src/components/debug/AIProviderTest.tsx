// src/components/debug/AIProviderTest.tsx
// Composant de test pour les providers IA (à utiliser uniquement en développement)

import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { getAvailableProviders, type AIProvider } from '../../config/ai';
import AIProviderSelector from '../ui/AIProviderSelector';
import { Button } from '../ui/Button';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
    provider: AIProvider;
    status: 'pending' | 'success' | 'error';
    duration?: number;
    questions?: any[];
    error?: string;
}

const AIProviderTest: React.FC = () => {
    const [currentProvider, setCurrentProvider] = useState<AIProvider>(aiService.getCurrentProvider());
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<TestResult[]>([]);

    const testContent = `
Les variables en JavaScript sont des conteneurs pour stocker des données.
Il existe trois mots-clés pour déclarer des variables : var, let, et const.

- var : portée de fonction, peut être redéclarée
- let : portée de bloc, ne peut pas être redéclarée dans le même scope  
- const : portée de bloc, valeur constante
    `.trim();

    const runSingleTest = async (provider: AIProvider): Promise<TestResult> => {
        const start = Date.now();

        try {
            aiService.setProvider(provider);
            const questions = await aiService.generateQuizQuestions(testContent, 2, {
                difficulty: 'easy',
                language: 'français'
            });

            return {
                provider,
                status: 'success',
                duration: Date.now() - start,
                questions
            };
        } catch (error: any) {
            return {
                provider,
                status: 'error',
                duration: Date.now() - start,
                error: error.message
            };
        }
    };

    const runAllTests = async () => {
        setIsRunning(true);
        setResults([]);

        const providers = getAvailableProviders().filter(p => p.configured);

        // Initialiser les résultats avec le statut pending
        const initialResults = providers.map(p => ({
            provider: p.provider,
            status: 'pending' as const
        }));
        setResults(initialResults);

        // Exécuter les tests séquentiellement
        for (let i = 0; i < providers.length; i++) {
            const provider = providers[i].provider;
            const result = await runSingleTest(provider);

            setResults(prev => prev.map(r =>
                r.provider === provider ? result : r
            ));
        }

        // Remettre le provider original
        aiService.setProvider(currentProvider);
        setIsRunning(false);
    };

    const handleProviderChange = (provider: AIProvider) => {
        setCurrentProvider(provider);
        aiService.setProvider(provider);
    };

    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
        }
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return '-';
        return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">🧪 Test des Providers IA</h2>

            <div className="space-y-6">
                {/* Sélecteur de provider */}
                <AIProviderSelector
                    currentProvider={currentProvider}
                    onProviderChange={handleProviderChange}
                />

                {/* Bouton de test */}
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        onClick={runAllTests}
                        disabled={isRunning}
                        className="flex items-center gap-2"
                    >
                        <Play className="h-4 w-4" />
                        {isRunning ? 'Tests en cours...' : 'Tester tous les providers'}
                    </Button>
                </div>

                {/* Contenu de test */}
                <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Contenu de test :</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{testContent}</pre>
                </div>

                {/* Résultats */}
                {results.length > 0 && (
                    <div>
                        <h3 className="font-medium mb-3">Résultats des tests :</h3>
                        <div className="space-y-3">
                            {results.map((result) => (
                                <div
                                    key={result.provider}
                                    className="border border-gray-200 rounded-md p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(result.status)}
                                            <span className="font-medium">
                                                {getAvailableProviders().find(p => p.provider === result.provider)?.name}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {formatDuration(result.duration)}
                                        </span>
                                    </div>

                                    {result.status === 'error' && (
                                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                            Erreur: {result.error}
                                        </div>
                                    )}

                                    {result.status === 'success' && result.questions && (
                                        <div className="text-sm text-green-600">
                                            ✅ {result.questions.length} questions générées avec succès

                                            <div className="mt-2 space-y-2">
                                                {result.questions.map((q, i) => (
                                                    <div key={i} className="bg-green-50 p-2 rounded">
                                                        <div className="font-medium">{q.question}</div>
                                                        <div className="text-xs mt-1">
                                                            Réponse: {q.options[q.answer]}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Instructions :</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Configurez au moins une clé API dans votre fichier .env</li>
                        <li>• Utilisez ce composant uniquement en développement</li>
                        <li>• Les tests consomment des crédits d'API</li>
                        <li>• Chaque test génère 2 questions pour valider le fonctionnement</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AIProviderTest;

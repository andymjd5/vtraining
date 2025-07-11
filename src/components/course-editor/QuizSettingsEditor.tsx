// src/components/course-editor/QuizSettingsEditor.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Book, Save, Settings, GraduationCap, Clock, Target } from 'lucide-react';
import { QuizSettings } from '../../types/course';
import Switch from '../../components/ui/Switch';
import Slider from '../../components/ui/Slider';
import { quizService } from '../../services/quizService';
import { aiService } from '../../services/aiService';
import { getCurrentProviderConfig, type AIProvider } from '../../config/ai';
import AIProviderSelector from '../../components/ui/AIProviderSelector';

interface QuizSettingsEditorProps {
    chapterId: string;
    courseId: string;
    hasQuiz: boolean;
    quizSettings?: QuizSettings | null;
    onToggleQuiz: (enabled: boolean) => void;
    onSaveSettings: (settings: QuizSettings) => void;
}

const QuizSettingsEditor: React.FC<QuizSettingsEditorProps> = ({
    chapterId,
    courseId,
    hasQuiz,
    quizSettings,
    onToggleQuiz,
    onSaveSettings
}) => {// État local pour les paramètres du quiz
    const [settings, setSettings] = useState<QuizSettings>({
        passingScore: quizSettings?.passingScore || 60,
        timeLimit: quizSettings?.timeLimit || 15,
        questionCount: quizSettings?.questionCount || 5,
        isRandomized: quizSettings?.isRandomized ?? true,
        showFeedbackImmediately: quizSettings?.showFeedbackImmediately ?? false,
        attemptsAllowed: quizSettings?.attemptsAllowed || 3,
        generationMode: quizSettings?.generationMode || 'pool'
    });    // État pour gérer le chargement et les erreurs
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [currentAIProvider, setCurrentAIProvider] = useState<AIProvider>(aiService.getCurrentProvider());// Mise à jour des paramètres quand quizSettings change
    useEffect(() => {
        if (quizSettings) {
            setSettings({
                passingScore: quizSettings.passingScore || 60,
                timeLimit: quizSettings.timeLimit || 15,
                questionCount: quizSettings.questionCount || 5,
                isRandomized: quizSettings.isRandomized ?? true,
                showFeedbackImmediately: quizSettings.showFeedbackImmediately ?? false,
                attemptsAllowed: quizSettings.attemptsAllowed || 3,
                generationMode: quizSettings.generationMode || 'pool'
            });
        }
    }, [quizSettings]);

    // Gestionnaires d'événements
    const handleToggleQuiz = () => {
        onToggleQuiz(!hasQuiz);
    };

    const handleSaveSettings = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Simulation d'un délai de sauvegarde (à remplacer par un vrai appel API plus tard)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Appelle le callback du parent
            onSaveSettings(settings);

            setIsLoading(false);
        } catch (error: any) {
            console.error('Erreur lors de la sauvegarde des paramètres du quiz:', error);
            setError(error.message || "Une erreur est survenue lors de la sauvegarde");
            setIsLoading(false);
        }
    }; const handleChange = (field: keyof QuizSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    }; const handleGenerateQuestions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccessMessage(null);

            // Générer et sauvegarder la banque de questions
            await quizService.generateAndSaveQuizPool(chapterId, courseId, settings);

            // Afficher un message de succès
            setSuccessMessage('Banque de questions générée avec succès!');
            console.log('Banque de questions générée avec succès!');

            setIsLoading(false);
        } catch (error: any) {
            console.error('Erreur lors de la génération des questions:', error);
            setError(error.message || "Une erreur est survenue lors de la génération des questions");
            setIsLoading(false);
        }
    };

    const handleProviderChange = (provider: AIProvider) => {
        setCurrentAIProvider(provider);
        aiService.setProvider(provider);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-medium text-gray-800">Configuration du Quiz</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{hasQuiz ? 'Activé' : 'Désactivé'}</span>
                    <Switch
                        checked={hasQuiz}
                        onCheckedChange={handleToggleQuiz}
                        className={`${hasQuiz ? 'bg-indigo-500' : 'bg-gray-300'}`}
                    />
                </div>
            </div>

            {hasQuiz && (
                <>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center gap-1">
                                    <Target className="h-4 w-4 text-indigo-500" />
                                    <span>Score de réussite ({settings.passingScore}%)</span>
                                </div>
                                <span className="text-xs text-gray-500">Score minimum requis</span>
                            </label>
                            <Slider
                                min={40}
                                max={100}
                                step={5}
                                value={[settings.passingScore]}
                                onValueChange={(value) => handleChange('passingScore', value[0])}
                                className="text-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    <span>Limite de temps ({settings.timeLimit} min)</span>
                                </div>
                                <span className="text-xs text-gray-500">Durée du quiz</span>
                            </label>
                            <Slider
                                min={5}
                                max={60}
                                step={5}
                                value={[settings.timeLimit]}
                                onValueChange={(value) => handleChange('timeLimit', value[0])}
                                className="text-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center gap-1">
                                    <Book className="h-4 w-4 text-indigo-500" />
                                    <span>Nombre de questions ({settings.questionCount})</span>
                                </div>
                                <span className="text-xs text-gray-500">Questions par quiz</span>
                            </label>
                            <Slider
                                min={3}
                                max={20}
                                step={1}
                                value={[settings.questionCount]}
                                onValueChange={(value) => handleChange('questionCount', value[0])}
                                className="text-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center gap-1">
                                    <Settings className="h-4 w-4 text-indigo-500" />
                                    <span>Tentatives autorisées ({settings.attemptsAllowed})</span>
                                </div>
                                <span className="text-xs text-gray-500">Nombre d'essais</span>
                            </label>
                            <Slider
                                min={1}
                                max={10}
                                step={1}
                                value={[settings.attemptsAllowed]}
                                onValueChange={(value) => handleChange('attemptsAllowed', value[0])}
                                className="text-indigo-500"
                            />
                        </div>                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Mode de génération des questions
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="generationMode"
                                    value="pool"
                                    checked={settings.generationMode === 'pool'}
                                    onChange={(e) => handleChange('generationMode', e.target.value)}
                                    className="mt-1 text-indigo-500 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Mode Banque</span>
                                    <p className="text-xs text-gray-500">Génère une banque de questions en amont, puis pioche aléatoirement</p>
                                </div>
                            </label>

                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="generationMode"
                                    value="onTheFly"
                                    checked={settings.generationMode === 'onTheFly'}
                                    onChange={(e) => handleChange('generationMode', e.target.value)}
                                    className="mt-1 text-indigo-500 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Mode À la Volée</span>
                                    <p className="text-xs text-gray-500">Génère des questions uniques pour chaque tentative via IA</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.isRandomized}
                                onChange={(e) => handleChange('isRandomized', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Ordre des questions aléatoire</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.showFeedbackImmediately}
                                onChange={(e) => handleChange('showFeedbackImmediately', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Montrer le feedback immédiatement</span>                        </label>
                    </div>                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                            <p className="text-sm">Une erreur est survenue: {error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
                            <p className="text-sm">{successMessage}</p>
                        </div>
                    )}                    {settings.generationMode === 'pool' && (
                        <div className="border-t border-gray-200 pt-4">
                            {/* Sélecteur de provider IA */}
                            <AIProviderSelector
                                currentProvider={currentAIProvider}
                                onProviderChange={handleProviderChange}
                                className="mb-4"
                            />

                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Génération automatique de questions</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                    Utilisez l'IA pour générer automatiquement une banque de questions basée sur le contenu de ce chapitre.
                                    Provider actuel: <strong>{getCurrentProviderConfig().name}</strong>
                                </p><Button
                                    variant="outlined"
                                    onClick={handleGenerateQuestions}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                    disabled={isLoading}
                                >
                                    <Book className="h-4 w-4 mr-2" />
                                    Générer des questions avec l'IA
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <Button
                            variant="primary"
                            onClick={handleSaveSettings}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-1"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Sauvegarde en cours...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    <span>Enregistrer les paramètres</span>
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default QuizSettingsEditor;

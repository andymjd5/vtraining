// src/services/aiService.ts
// Service générique pour les interactions IA multi-provider

import {
    AI_CONFIG,
    getCurrentProviderConfig,
    getAIHeaders,
    getAIUrl,
    setAIProvider,
    isProviderConfigured,
    type AIProvider
} from '../config/ai';

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIResponse {
    content: string;
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
}

export class AIService {
    private static instance: AIService;

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Génère une réponse en utilisant le provider IA actuel
     */
    async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
        const config = getCurrentProviderConfig();

        if (!isProviderConfigured(AI_CONFIG.currentProvider)) {
            throw new Error(`Provider IA ${config.name} non configuré. Veuillez vérifier votre clé API.`);
        }

        try {
            const response = await this.makeRequest(messages, config);
            return {
                content: response,
                provider: AI_CONFIG.currentProvider,
                model: config.model
            };
        } catch (error) {
            console.error(`Erreur avec le provider ${config.name}:`, error);

            // Essayer les providers de fallback
            for (const fallbackProvider of AI_CONFIG.fallbackProviders) {
                if (fallbackProvider !== AI_CONFIG.currentProvider && isProviderConfigured(fallbackProvider)) {
                    try {
                        console.log(`Tentative avec le provider de fallback: ${fallbackProvider}`);
                        const originalProvider = AI_CONFIG.currentProvider;
                        setAIProvider(fallbackProvider);

                        const fallbackConfig = getCurrentProviderConfig();
                        const response = await this.makeRequest(messages, fallbackConfig);

                        // Remettre le provider original
                        setAIProvider(originalProvider);

                        return {
                            content: response,
                            provider: fallbackProvider,
                            model: fallbackConfig.model
                        };
                    } catch (fallbackError) {
                        console.error(`Erreur avec le provider de fallback ${fallbackProvider}:`, fallbackError);
                        continue;
                    }
                }
            }

            throw new Error(`Tous les providers IA ont échoué. Dernière erreur: ${error}`);
        }
    }

    /**
     * Effectue la requête HTTP vers le provider IA
     */
    private async makeRequest(messages: AIMessage[], config: any): Promise<string> {
        const url = getAIUrl();
        const headers = getAIHeaders();

        // Transformer la requête selon le format du provider
        const requestBody = config.requestTransformer
            ? config.requestTransformer(messages, config)
            : this.getDefaultRequestBody(messages, config);

        console.log(`Requête vers ${config.name}:`, { url, requestBody });

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        console.log(`Réponse de ${config.name}:`, responseData);

        // Transformer la réponse selon le format du provider
        return config.responseTransformer
            ? config.responseTransformer(responseData)
            : responseData.choices[0].message.content;
    }

    /**
     * Format de requête par défaut (compatible OpenAI)
     */
    private getDefaultRequestBody(messages: AIMessage[], config: any) {
        return {
            model: config.model,
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens
        };
    }

    /**
     * Génère des questions de quiz en utilisant l'IA
     */
    async generateQuizQuestions(
        content: string,
        questionCount: number,
        options: {
            difficulty?: 'easy' | 'medium' | 'hard';
            language?: string;
            customInstructions?: string;
        } = {}
    ): Promise<any[]> {
        const { difficulty = 'medium', language = 'français', customInstructions = '' } = options;

        const prompt = this.buildQuizPrompt(content, questionCount, difficulty, language, customInstructions);

        const messages: AIMessage[] = [
            {
                role: 'system',
                content: 'Tu es un expert en pédagogie et en création de questions éducatives.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await this.generateResponse(messages);

        try {
            // Essayer de parser le JSON de la réponse
            let jsonContent = response.content.trim();

            // Nettoyer la réponse si elle contient des blocs de code
            if (jsonContent.includes('```json')) {
                jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
            } else if (jsonContent.includes('```')) {
                jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
            }

            const questions = JSON.parse(jsonContent);

            if (!Array.isArray(questions)) {
                throw new Error('La réponse ne contient pas un tableau de questions');
            }

            return this.validateAndCleanQuestions(questions);
        } catch (parseError) {
            console.error('Erreur lors du parsing JSON:', parseError);
            console.error('Contenu de la réponse:', response.content);
            throw new Error(`Format de réponse IA invalide: ${parseError}`);
        }
    }

    /**
     * Construit le prompt pour la génération de questions
     */
    private buildQuizPrompt(
        content: string,
        questionCount: number,
        difficulty: string,
        language: string,
        customInstructions: string
    ): string {
        return `
À partir du contenu de cours suivant, génère exactement ${questionCount} questions à choix multiples en ${language}.

CONTENU DU COURS:
${content}

INSTRUCTIONS:
- Génère exactement ${questionCount} questions
- Niveau de difficulté: ${difficulty}
- Chaque question doit avoir exactement 4 options de réponse
- Une seule réponse correcte par question
- Questions pertinentes et pédagogiques
- Évite les questions trop évidentes ou piège
${customInstructions ? `- Instructions supplémentaires: ${customInstructions}` : ''}

RÉPONSE ATTENDUE:
Réponds UNIQUEMENT avec un tableau JSON valide dans ce format exact:
[
  {
    "question": "Texte de la question ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Explication de la réponse correcte",
    "difficulty": "${difficulty}"
  }
]

Important: 
- "answer" est l'index de la bonne réponse (0, 1, 2, ou 3)
- "difficulty" doit être "${difficulty}"
- Pas de texte supplémentaire, SEULEMENT le JSON
- Assure-toi que le JSON est valide et bien formaté
        `;
    }

    /**
     * Valide et nettoie les questions générées
     */
    private validateAndCleanQuestions(questions: any[]): any[] {
        return questions.map((q, index) => {
            if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
                throw new Error(`Question ${index + 1} invalide: structure incorrecte`);
            }

            if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
                throw new Error(`Question ${index + 1} invalide: index de réponse incorrect`);
            }

            return {
                question: q.question.trim(),
                options: q.options.map((opt: string) => opt.trim()),
                answer: q.answer,
                explanation: q.explanation?.trim() || '',
                difficulty: q.difficulty || 'medium'
            };
        });
    }

    /**
     * Change le provider IA utilisé
     */
    setProvider(provider: AIProvider): void {
        setAIProvider(provider);
    }

    /**
     * Obtient le provider actuel
     */
    getCurrentProvider(): AIProvider {
        return AI_CONFIG.currentProvider;
    }
}

// Export de l'instance singleton
export const aiService = AIService.getInstance();

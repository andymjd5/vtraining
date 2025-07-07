// src/config/ai.ts
// Configuration flexible multi-provider pour l'IA

// Types pour les providers IA
export type AIProvider = 'deepseek' | 'openai' | 'anthropic' | 'gemini';

export interface AIProviderConfig {
    name: string;
    apiUrl: string;
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    headers?: Record<string, string>;
    requestTransformer?: (messages: any[], config: any) => any;
    responseTransformer?: (response: any) => string;
}

// Configuration pour chaque provider IA
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
    deepseek: {
        name: 'Deepseek',
        apiUrl: 'https://api.deepseek.com/v1/chat/completions',
        apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 2000,
        requestTransformer: (messages, config) => ({
            model: config.model,
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens
        }),
        responseTransformer: (response) => response.choices[0].message.content
    },

    openai: {
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2000,
        requestTransformer: (messages, config) => ({
            model: config.model,
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens
        }),
        responseTransformer: (response) => response.choices[0].message.content
    },

    anthropic: {
        name: 'Anthropic Claude',
        apiUrl: 'https://api.anthropic.com/v1/messages',
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        model: 'claude-3-haiku-20240307',
        temperature: 0.7,
        maxTokens: 2000,
        headers: {
            'anthropic-version': '2023-06-01'
        },
        requestTransformer: (messages, config) => ({
            model: config.model,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: messages.map((msg: any) => ({
                role: msg.role,
                content: msg.content
            }))
        }),
        responseTransformer: (response) => response.content[0].text
    },

    gemini: {
        name: 'Google Gemini',
        apiUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 2000,
        requestTransformer: (messages, config) => ({
            contents: messages.map((msg: any) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })),
            generationConfig: {
                temperature: config.temperature,
                maxOutputTokens: config.maxTokens,
            }
        }),
        responseTransformer: (response) => response.candidates[0].content.parts[0].text
    }
};

// Configuration générale
export const AI_CONFIG = {
    // Provider actuel (peut être changé dynamiquement)
    currentProvider: (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'deepseek',

    // Paramètres par défaut pour la génération de questions
    questionGeneration: {
        defaultPoolSize: 15,
        poolMultiplier: 3, // Générer 3x plus de questions que demandé pour la banque
        maxRetries: 3,
        timeout: 30000 // 30 secondes
    },

    // Fallback providers en cas d'échec
    fallbackProviders: ['openai', 'deepseek', 'anthropic'] as AIProvider[]
};

// Fonction pour obtenir la configuration du provider actuel
export const getCurrentProviderConfig = (): AIProviderConfig => {
    return AI_PROVIDERS[AI_CONFIG.currentProvider];
};

// Fonction pour changer de provider
export const setAIProvider = (provider: AIProvider): void => {
    if (provider in AI_PROVIDERS) {
        AI_CONFIG.currentProvider = provider;
    } else {
        throw new Error(`Provider IA non supporté: ${provider}`);
    }
};

// Fonction pour vérifier si un provider est configuré
export const isProviderConfigured = (provider: AIProvider): boolean => {
    const config = AI_PROVIDERS[provider];
    return config.apiKey !== '' && config.apiKey !== undefined;
};

// Fonction pour vérifier si l'API IA actuelle est configurée
export const isAIConfigured = (): boolean => {
    return isProviderConfigured(AI_CONFIG.currentProvider);
};

// Fonction pour obtenir les headers d'authentification pour le provider actuel
export const getAIHeaders = (): Record<string, string> => {
    const config = getCurrentProviderConfig();

    let headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    // Authentification spécifique selon le provider
    switch (AI_CONFIG.currentProvider) {
        case 'deepseek':
        case 'openai':
            headers['Authorization'] = `Bearer ${config.apiKey}`;
            break;
        case 'anthropic':
            headers['x-api-key'] = config.apiKey;
            if (config.headers) {
                headers = { ...headers, ...config.headers };
            }
            break;
        case 'gemini':
            // Gemini utilise l'API key dans l'URL
            break;
    }

    return headers;
};

// Fonction pour obtenir l'URL complète avec la clé API (pour Gemini)
export const getAIUrl = (): string => {
    const config = getCurrentProviderConfig();

    if (AI_CONFIG.currentProvider === 'gemini') {
        return `${config.apiUrl}?key=${config.apiKey}`;
    }

    return config.apiUrl;
};

// Fonction pour obtenir la liste des providers disponibles
export const getAvailableProviders = (): { provider: AIProvider; name: string; configured: boolean }[] => {
    return Object.entries(AI_PROVIDERS).map(([key, config]) => ({
        provider: key as AIProvider,
        name: config.name,
        configured: isProviderConfigured(key as AIProvider)
    }));
};

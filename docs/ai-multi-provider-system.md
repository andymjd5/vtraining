# Système IA Multi-Provider - VTraining

## Vue d'ensemble

Le système VTraining inclut maintenant un système IA flexible qui permet de switcher facilement entre différents providers d'IA pour la génération automatique de questions de quiz.

## Providers Supportés

### 🚀 Deepseek (Recommandé)
- **Coût**: Très bas (~$0.14/million de tokens)
- **Performance**: Excellent pour la génération de questions éducatives
- **Site**: https://platform.deepseek.com/
- **Variable**: `VITE_DEEPSEEK_API_KEY`

### 🤖 OpenAI (ChatGPT)
- **Coût**: Moyen-élevé
- **Performance**: Excellent, très fiable
- **Site**: https://platform.openai.com/
- **Variable**: `VITE_OPENAI_API_KEY`

### 🧠 Anthropic (Claude)
- **Coût**: Moyen
- **Performance**: Excellent pour les tâches éducatives
- **Site**: https://console.anthropic.com/
- **Variable**: `VITE_ANTHROPIC_API_KEY`

### 💎 Google Gemini
- **Coût**: Quota gratuit généreux
- **Performance**: Bon
- **Site**: https://ai.google.dev/
- **Variable**: `VITE_GEMINI_API_KEY`

## Configuration

### 1. Choisir le Provider par Défaut
```bash
# Dans votre fichier .env
VITE_AI_PROVIDER=deepseek  # ou openai, anthropic, gemini
```

### 2. Configurer les Clés API
Il suffit de configurer **un seul provider** pour commencer :

```bash
# Exemple avec Deepseek
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
```

### 3. Système de Fallback
Le système essaiera automatiquement les autres providers configurés en cas d'échec du provider principal.

## Utilisation

### Interface Utilisateur
1. Ouvrez l'éditeur de chapitre
2. Activez le quiz pour un chapitre
3. Sélectionnez "Mode Banque" pour la génération
4. Choisissez votre provider IA dans le sélecteur
5. Cliquez sur "Générer des questions avec l'IA"

### Programmation
```typescript
import { aiService } from './services/aiService';

// Changer de provider
aiService.setProvider('openai');

// Générer des questions
const questions = await aiService.generateQuizQuestions(
  content, 
  5, 
  { difficulty: 'medium' }
);
```

## Architecture

### Fichiers Principaux

- **`src/config/ai.ts`**: Configuration des providers
- **`src/services/aiService.ts`**: Service principal IA
- **`src/components/ui/AIProviderSelector.tsx`**: Sélecteur d'interface
- **`src/services/quizService.ts`**: Intégration avec les quiz

### Flux de Données

1. **Configuration**: Les providers sont configurés dans `ai.ts`
2. **Sélection**: L'utilisateur choisit le provider via l'interface
3. **Génération**: Le service IA unifie les appels vers tous les providers
4. **Fallback**: En cas d'échec, basculement automatique vers d'autres providers
5. **Persistance**: Les questions générées sont sauvegardées dans Firestore

## Modes de Génération

### Mode Banque (Pool)
- Génère une grande banque de questions en amont
- Les étudiants reçoivent une sélection aléatoire
- Idéal pour les évaluations standardisées

### Mode À la Volée (On-the-Fly)
- Génère des questions uniques pour chaque tentative
- Plus de variété, questions dynamiques
- Consomme plus d'API calls

## Avantages du Système Multi-Provider

### ✅ Fiabilité
- Basculement automatique en cas de panne d'un provider
- Pas de point de défaillance unique

### ✅ Optimisation des Coûts
- Choisissez le provider le plus économique pour vos besoins
- Comparez facilement les performances/prix

### ✅ Flexibilité
- Changement de provider en temps réel
- Adaptation selon le type de contenu

### ✅ Performance
- Utilisation du meilleur provider selon le contexte
- Optimisation automatique des requêtes

## Gestion des Erreurs

Le système gère automatiquement :
- Erreurs de réseau
- Limites de taux (rate limiting)
- Clés API invalides
- Formats de réponse incorrects
- Timeouts

## Monitoring et Logs

```typescript
// Activer les logs de debug
// Dans .env
VITE_AI_DEBUG=true
```

Les logs incluent :
- Provider utilisé pour chaque requête
- Temps de réponse
- Nombre de tokens consommés
- Erreurs et fallbacks

## Sécurité

- 🔐 Clés API stockées uniquement côté client
- 🚫 Aucune clé API n'est commitée dans le code
- 🛡️ Variables d'environnement chiffrées en production
- 🔒 Validation des réponses IA avant utilisation

## Dépannage

### Provider non configuré
```
Erreur: Provider IA non configuré
Solution: Ajoutez la clé API correspondante dans .env
```

### Tous les providers échouent
```
Erreur: Tous les providers IA ont échoué
Solution: Vérifiez vos clés API et la connectivité réseau
```

### Questions mal formatées
```
Erreur: Format de réponse IA invalide
Solution: Le système réessaiera automatiquement
```

## Roadmap

### Prochaines Fonctionnalités
- [ ] Support d'autres providers (Cohere, Mistral)
- [ ] Cache intelligent des réponses
- [ ] Analytics d'utilisation par provider
- [ ] Optimisation automatique des prompts
- [ ] Support multi-langues avancé

### Améliorations Prévues
- [ ] Interface d'administration des providers
- [ ] Quotas et budgets par provider
- [ ] A/B testing automatique
- [ ] Métriques de qualité des questions

## Support

Pour toute question ou problème :
1. Consultez les logs dans la console du navigateur
2. Vérifiez la configuration de vos clés API
3. Testez avec un provider différent
4. Consultez la documentation des providers

---

*Système développé pour VTraining - Formation en ligne intelligente*

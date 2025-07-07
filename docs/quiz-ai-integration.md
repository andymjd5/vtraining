# Système de Quiz avec IA - Guide d'utilisation

## Vue d'ensemble

Le système de quiz VTraining a été amélioré avec une intégration IA (Deepseek) pour la génération automatique de questions. Il prend en charge deux modes distincts :

### 1. Mode Banque (Pool Mode)
- **Principe** : Génère une banque de questions en amont via l'IA
- **Avantages** : Performance rapide, questions pré-validées, cohérence
- **Utilisation** : Recommandé pour les cours avec contenu stable

### 2. Mode À la Volée (On-the-Fly Mode)  
- **Principe** : Génère des questions uniques pour chaque tentative
- **Avantages** : Questions toujours différentes, adaptation dynamique
- **Utilisation** : Recommandé pour éviter la mémorisation des réponses

## Configuration

### Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec :

```env
# Configuration API Deepseek (obligatoire pour l'IA)
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Autres variables Firebase (déjà configurées)
VITE_FIREBASE_API_KEY=...
```

### Obtenir une clé API Deepseek

1. Visitez [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. Créez un compte et générez une clé API
3. Ajoutez la clé dans votre fichier `.env`

## Utilisation

### Pour les Administrateurs

#### Configuration d'un Quiz

1. **Accédez à l'éditeur de cours**
2. **Sélectionnez un chapitre** 
3. **Activez le quiz** avec le toggle
4. **Configurez les paramètres** :
   - Score de réussite (40-100%)
   - Limite de temps (5-60 min)
   - Nombre de questions (3-20)
   - Nombre de tentatives (1-10)
   - Mode de génération (Banque/À la volée)

#### Génération de Questions (Mode Banque)

1. **Sélectionnez "Mode Banque"**
2. **Cliquez "Générer des questions avec l'IA"**
3. **Attendez la génération** (peut prendre 10-30 secondes)
4. **Les questions sont automatiquement sauvegardées**

La banque contiendra 3x plus de questions que le nombre configuré pour assurer la variété.

### Pour les Étudiants

#### Passer un Quiz

1. **Accédez au chapitre** avec un quiz activé
2. **Cliquez "Commencer le quiz"**
3. **Répondez aux questions** dans le temps imparti
4. **Consultez vos résultats** et recommencez si nécessaire

## Structure des Données

### QuizSettings
```typescript
interface QuizSettings {
  generationMode: 'pool' | 'onTheFly';
  passingScore: number;
  timeLimit: number;
  questionCount: number;
  isRandomized: boolean;
  showFeedbackImmediately: boolean;
  attemptsAllowed: number;
}
```

### QuizAttempt
```typescript
interface QuizAttempt {
  id: string;
  userId: string;
  chapterId: string;
  courseId: string;
  score: number;
  passed: boolean;
  questionsAsked: {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    selectedAnswerIndex?: number;
    isCorrect?: boolean;
    explanation?: string;
  }[];
  startedAt: any;
  completedAt?: any;
}
```

## Composants Principaux

### `QuizSettingsEditor`
- Configuration des paramètres de quiz
- Interface de génération IA
- Gestion des erreurs et succès

### `QuizView`
- Interface de passage de quiz
- Chronomètre et navigation
- Sauvegarde des résultats

### `quizService`
- Logique métier pour les quiz
- Intégration API Deepseek
- Gestion des modes banque/à la volée

## Fonctionnalités Avancées

### Génération Intelligente
- **Analyse du contenu** : L'IA analyse le contenu du chapitre
- **Questions pertinentes** : Génération basée sur les objectifs pédagogiques  
- **Niveaux de difficulté** : Questions easy/medium/hard
- **Explications** : Chaque question inclut une explication

### Gestion des Erreurs
- **Validation API** : Vérification de la configuration Deepseek
- **Fallback gracieux** : Messages d'erreur informatifs
- **Retry logic** : Tentatives automatiques en cas d'échec

### Performance
- **Cache intelligent** : Banque de questions en base
- **Génération asynchrone** : Interface non bloquante
- **Optimisation réseau** : Requêtes API optimisées

## Dépannage

### Erreurs Courantes

#### "Configuration API IA manquante"
- Vérifiez que `VITE_DEEPSEEK_API_KEY` est défini dans `.env`
- Redémarrez le serveur de développement

#### "Aucun contenu trouvé pour ce chapitre"
- Ajoutez du contenu texte dans les sections du chapitre
- Vérifiez que les blocs de contenu sont de type "text"

#### "Format de réponse IA invalide"
- L'API Deepseek peut parfois renvoyer du JSON mal formaté
- Le système tente de nettoyer automatiquement
- Réessayez la génération

### Logs de Débogage

Activez les logs dans la console du navigateur pour diagnostiquer :

```javascript
// Dans la console du navigateur
localStorage.setItem('debug', 'quiz:*');
```

## Limitations Actuelles

1. **Langue** : Génération optimisée pour le français
2. **Types de questions** : QCM uniquement (4 options)
3. **Contenu** : Analyse limitée au texte (pas d'images/vidéos)
4. **API Rate Limits** : Respecter les limites de l'API Deepseek

## Roadmap

### Prochaines Fonctionnalités
- [ ] Questions à réponse libre
- [ ] Génération depuis images/PDFs
- [ ] Analytics avancés des quiz
- [ ] Export des questions
- [ ] Templates de questions personnalisés

---

Pour toute question ou problème, consultez les logs du navigateur ou contactez l'équipe de développement.

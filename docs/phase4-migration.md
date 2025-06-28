# VTraining - Phase 4: Migration des données

Ce document décrit la phase 4 du projet VTraining, qui consiste à migrer les données des cours de l'ancienne structure imbriquée vers une nouvelle structure modulaire.

## Contexte

Dans les versions précédentes, les cours étaient stockés dans une structure imbriquée où un document de cours contenait des tableaux pour les chapitres, qui contenaient à leur tour des tableaux pour les sections, et ainsi de suite. Cette structure présentait des limitations en termes d'évolutivité et de performances.

La phase 4 introduit une structure de données normalisée avec des collections distinctes pour chaque type d'entité:
- `courses`: Métadonnées des cours
- `chapters`: Chapitres liés aux cours
- `sections`: Sections liées aux chapitres
- `content_blocks`: Blocs de contenu liés aux sections
- `instructors`: Profils des instructeurs liés aux cours

## Scripts de migration

### Script principal de migration

Le script `migrateCourses.mjs` effectue la migration des données:
- Lit tous les cours dans l'ancienne structure
- Extrait et crée des documents dans les nouvelles collections
- Établit les relations entre les entités
- Gère les erreurs et fournit des statistiques de migration

```bash
node scripts/migrateCourses.mjs
```

### Script de validation

Le script `validateMigration.mjs` permet de vérifier l'intégrité des données migrées:
- Vérifie que tous les cours ont été correctement migrés
- Valide les relations entre cours, chapitres, sections et blocs de contenu
- S'assure que les identifiants référencés existent
- Génère un rapport détaillé des problèmes éventuels

```bash
node scripts/validateMigration.mjs
```

### Scripts pour gérer les fichiers obsolètes

Les scripts suivants permettent d'identifier et de marquer les scripts qui utilisent l'ancienne structure et sont donc obsolètes:

```bash
node scripts/identifyObsoleteScripts.mjs
node scripts/markObsoleteScripts.mjs
```

## Scripts obsolètes

Les scripts suivants utilisent l'ancienne structure et ne sont plus compatibles avec la nouvelle architecture:

1. `initializeFirestoreCourses.mjs`: Initialise les cours avec l'ancienne structure imbriquée
2. `initializeFirestoreData.mjs`: Initialise diverses données avec l'ancienne structure
3. `src/scripts/createProgressTracking.js`: Crée des enregistrements de suivi de progression basés sur l'ancienne structure
4. `src/scripts/initializeFirebaseData.js`: Initialise diverses données Firebase avec l'ancienne structure

## Scripts mis à jour

Le script `createProgressTrackingV2.js` a été créé pour remplacer la version obsolète et est compatible avec la nouvelle structure de données modulaire.

## Changements dans le modèle de données

### Ancienne structure (imbriquée)

```
courses {
  id: string;
  title: string;
  ...
  chapters: [
    {
      id: string;
      title: string;
      ...
      sections: [
        {
          id: string;
          title: string;
          ...
          content: [
            {
              type: string;
              content: string;
              ...
            }
          ]
        }
      ]
    }
  ]
}
```

### Nouvelle structure (modulaire)

```
courses {
  id: string;
  title: string;
  chaptersOrder: string[];
  instructorId: string;
  ...
}

chapters {
  id: string;
  courseId: string;
  title: string;
  sectionsOrder: string[];
  ...
}

sections {
  id: string;
  chapterId: string;
  courseId: string;
  title: string;
  contentBlocksOrder: string[];
  ...
}

content_blocks {
  id: string;
  sectionId: string;
  chapterId: string;
  courseId: string;
  type: string;
  content: string;
  ...
}

instructors {
  id: string;
  name: string;
  ...
  courses: string[];
}
```

## Avantages de la nouvelle structure

1. **Performance améliorée** : Chargement indépendant des entités selon les besoins de l'interface
2. **Évolutivité** : Possibilité de charger partiellement un cours (par exemple, un chapitre à la fois)
3. **Flexibilité** : Modification et mise à jour des entités sans rechargement complet du cours
4. **Relations explicites** : Chaque entité contient des références explicites à ses parents
5. **Maintenance simplifiée** : Gestion plus facile des entités individuelles

## Impacts sur le code client

Le service `courseService.ts` a été mis à jour pour prendre en charge la nouvelle structure, avec des méthodes pour:
- Charger un cours avec sa structure complète
- Gérer les chapitres, sections et blocs de contenu individuellement
- Maintenir la cohérence des références entre les entités

## Prochaines étapes

1. Mettre à jour les interfaces utilisateur pour utiliser la nouvelle structure
2. Adapter les fonctionnalités de suivi de progression
3. Optimiser les requêtes pour tirer parti de la nouvelle structure
4. Mettre à jour les tests pour valider le comportement avec la nouvelle structure

# amirevent

Plateforme privée d'achat de billet événementiel pour association

## Aperçu du projet

Il s'agit d'une application Vue 3 + TypeScript + Vite utilisant l'API de composition. Le projet utilise Pinia pour la gestion d'état et Vue Router pour le routage.

**Tech Stack:**
- Vue 3.5+ avec la syntax `<script setup>` 
- TypeScript avec vérification stricte des types via vue-tsc
- TailwindCss pour le style et mise en forme
- Vite 7+ pour les outils de construction
- Pinia pour la gestion d'état
- Vue Router 4+ pour le routage
- Vitest pour les tests unitaires avec l'environnement 
- ESLint + Prettier pour la qualité du code
- 
- Supabase pour la gestion des données
- DeepSeek & Copilote pour certaines implémentations complexes

## Architecture

### Structure du répertoire
```
src/
├── assets/          # Static assets (CSS, images, etc.)
├── components/      # Composants Vue réutilisable
│   ├── __tests__/  # Tests unitaires de composants
│   └── icons/      # Composants d'icone
├── router/          # Configuration de Router Vue
├── stores/          # Pinia stores pour la gestion d'état
├── views/           # Composants pages
│   └── admin/      # Vues(composants) spécifiques à l'admin
├── App.vue          # Composant root
└── main.ts          # Point d'entrée de l'application
```


## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

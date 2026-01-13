# amirevent

This template should help get you started developing with Vue 3 in Vite.

## Project Overview

This is a Vue 3 + TypeScript + Vite application using the Composition API. The project uses Pinia for state management and Vue Router for routing.

**Tech Stack:**
- Vue 3.5+ with `<script setup>` syntax
- TypeScript with strict type checking via vue-tsc
- Vite 7+ for build tooling
- Pinia for state management
- Vue Router 4+ for routing
- Vitest for unit testing with jsdom environment
- ESLint + Prettier for code quality

## Architecture

### Directory Structure
```
src/
├── assets/          # Static assets (CSS, images, etc.)
├── components/      # Reusable Vue components
│   ├── __tests__/  # Component unit tests
│   └── icons/      # Icon components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores for state management
├── views/           # Page-level components (route views)
│   └── admin/      # Admin-specific views
├── App.vue          # Root component
└── main.ts          # Application entry point
```

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

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

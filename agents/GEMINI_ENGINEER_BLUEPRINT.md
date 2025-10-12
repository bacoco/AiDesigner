# Blueprint: The "Gemini Engineer" Super-Plugin

**Version:** 1.0
**Auteur:** Gemini
**Date:** 2025-10-12

## 1. Vision Générale

Ce document décrit l'architecture et le plan d'implémentation pour la création d'un "super-plugin" de développement nommé **"Gemini Engineer"**.

L'objectif est de créer un outil d'assistance au développement intégré, qui fusionne la **planification structurée de tâches** avec une **orchestration de développement et de test entièrement automatisée et dynamique**.

Le principe fondamental est de combiner la logique d'un moteur de gestion de projet existant avec un écosystème d'agents d'IA (méta-agents) qui pilotent l'écriture, la modification et la validation du code. La proposition de valeur unique de ce système est sa capacité à effectuer des **tests dynamiques et interactifs** dans un véritable navigateur via les outils Chrome, allant bien au-delà de l'analyse de code statique.

---

## 2. Composants de l'Architecture

Le super-plugin est composé de deux couches principales qui fonctionnent en symbiose.

### 2.1. La Fondation : Le Moteur de Tâches `compounding-engineering`

- **Source :** [https://github.com/EveryInc/every-marketplace](https://github.com/EveryInc/every-marketplace)
- **Rôle :** Le code du plugin `compounding-engineering` (situé dans le dépôt ci-dessus) sert de **moteur de planification**. Sa logique sera extraite et utilisée comme une bibliothèque d'outils de bas niveau. Ses responsabilités incluent la décomposition d'une idée de haut niveau en documents structurés (PRD, cycles) et en listes de tâches concrètes.

### 2.2. La Couche d'Orchestration : L'Écosystème de Méta-Agents

C'est le "cerveau" du super-plugin. Il est composé d'un ensemble de méta-agents, chacun défini par un fichier `.md` qui contient sa directive fondamentale. Ces agents utilisent les outils de la Fondation comme une partie de leur boîte à outils.

**Fichiers de Définition des Agents :**

- **`agents/meta-agent-architect.md` (L'Architecte / Le Développeur en Chef) :**
  - **Rôle :** Prend une demande de fonctionnalité, utilise le moteur de tâches pour la planifier, puis génère et supervise une équipe de sub-agents développeurs pour écrire le code.

- **`agents/meta-agent-quasar.md` (Le Quasar / L'Ingénieur QA) :**
  - **Rôle :** Reçoit le travail de l'Architecte, analyse ce qui a été fait, puis génère une suite de sub-agents testeurs pour valider la fonctionnalité sur toute la stack (backend, API, et surtout l'UI dans un vrai navigateur).

- **`agents/meta-agent-genesis.md` (Le Genesis / Le Bâtisseur) :**
  - **Rôle :** Spécialisé dans la création de nouveaux projets à partir de zéro, en configurant l'intégralité du squelette de l'application.

- **`agents/meta-agent-librarian.md` (Le Librarian / Le Documentaliste) :**
  - **Rôle :** Maintient la documentation du projet synchronisée avec le code, en générant automatiquement des diagrammes d'architecture, des références d'API, etc.

- **`agents/meta-agent-refactor.md` (Le Refactor / Le Mainteneur) :**
  - **Rôle :** Analyse le code pour identifier la dette technique (duplication, complexité) et orchestre sa résolution.

- **`agents/meta-agent-mcp-inspector.md` (L'Inspecteur / Le Superviseur des Outils) :**
  - **Rôle :** Agent fondamental dont la seule tâche est de fournir aux autres agents la liste de tous les outils disponibles, y compris les commandes exposées par le moteur `compounding-engineering`.

---

## 3. Workflow Intégré en Action

Voici un exemple concret du déroulement d'une tâche de développement.

**Demande Utilisateur :** `/architect "Ajouter un bouton 'like' sur les articles de blog"`

1.  **Planification (Architecte) :**
    - L'Architecte reçoit la demande.
    - Il invoque en interne la commande `/create-tasks` du moteur `compounding-engineering`.
    - Le moteur retourne une liste de tâches : `[Tâche 1: Modifier le schéma DB 'posts' pour ajouter 'likes_count']`, `[Tâche 2: Créer l'endpoint API 'POST /posts/{id}/like']`, `[Tâche 3: Ajouter le composant bouton 'Like' en React']`.

2.  **Développement (Architecte) :**
    - L'Architecte génère 3 sub-agents développeurs, un pour chaque tâche, avec des instructions précises.
    - Les sub-agents exécutent les modifications de code en parallèle ou en séquence selon les dépendances.

3.  **Validation (Quasar) :**
    - L'Architecte, ayant terminé, transmet son rapport de mission au Quasar.
    - Le Quasar génère des sub-agents testeurs :
      - Un testeur d'API qui appelle le nouvel endpoint `POST /posts/{id}/like`.
      - Un testeur d'UI qui, via les outils Chrome, navigue sur un article de blog, clique sur le nouveau bouton "Like", et vérifie que le compteur de likes s'incrémente visuellement et que la base de données a été mise à jour.

4.  **Rapport Final :**
    - Le Quasar consolide les résultats et présente un rapport final à l'utilisateur : "Fonctionnalité 'Like' implémentée et validée. Tous les tests sont au vert."

---

## 4. Plan d'Implémentation du Super-Plugin

Pour construire "Gemini Engineer", voici les étapes recommandées :

**Phase 1 : Analyse de la Fondation**

- Forker le dépôt `every-marketplace`.
- Isoler le code source du plugin `compounding-engineering`.
- Analyser en profondeur son `main.py` et son `manifest.json` pour extraire et lister toutes les commandes et fonctionnalités qu'il expose.

**Phase 2 : Intégration des Outils**

- Rendre les commandes de la Phase 1 accessibles en tant qu'outils pour notre écosystème d'agents. L'agent `MCP Inspector` doit être capable de les lister.

**Phase 3 : Création du Super-Plugin**

- Développer le point d'entrée principal du plugin "Gemini Engineer". Ce script agira comme un routeur, dirigeant les commandes de l'utilisateur soit vers le moteur `compounding-engineering` (pour la planification), soit vers nos méta-agents `Architecte` ou `Quasar` (pour l'exécution et la validation).

**Phase 4 : Développement Itératif**

- Commencer à utiliser le système pour se construire lui-même. Utiliser l'Architecte pour une tâche simple (ex: "Ajoute une commande `/help` à toi-même") et le faire valider par le Quasar, afin de déboguer et de raffiner la boucle d'orchestration.

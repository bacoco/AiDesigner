# Phaser 2D Game Module Prototype

This directory prototypes how the legacy **bmad-2d-phaser-game-dev** expansion pack could be packaged as a V6 module:

- `module.yaml` captures the manifest-style metadata V6 expects and mirrors the legacy `config.yaml` fields.
- `agents/` contains the three role definitions that ship with the expansion.
- `teams/` preserves the single team composition as a module-scoped asset.
- `workflows/tasks/` relocates the story and production markdown tasks under a workflow namespace.
- `templates/` maps planning and design templates into the module bundle.
- `assets/data/` holds reference documentation that needs to ship with the module.

Keeping the original markdown untouched demonstrates the migration path without breaking current expansion users.

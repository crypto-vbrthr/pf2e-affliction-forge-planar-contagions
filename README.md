# PF2E Affliction Forge: Planar Contagions

A bilingual DE/EN library add-on for **PF2E Affliction Forge 0.1.63+** containing 32 original extraplanar afflictions designed for authored creatures and Creature Forge matching.


## Part of the Forge Suite

**Affliction Forge: Planar Contagions** is part of the **Forge Suite**, a growing collection of Foundry VTT modules and add-ons built for the busy Game Master. The suite is designed to reduce preparation and bookkeeping, make common GM tasks easier, and add useful tools that help make running and playing campaigns smoother and more enjoyable.

An overview of the Forge Suite, its modules, add-ons, and shared documentation is available here:

**Forge Suite:** https://github.com/crypto-vbrthr/pf2e-forge-suite


## Highlights

- 32 original afflictions from level 0 to 20
- Planar diseases, creature poisons, and supernatural curses
- Celestial, fiend, fey, monitor, elemental, spirit, undead, aberration, construct, dragon, fungus, plant, ooze, beast, and humanoid coverage
- Canonical creature, family, habitat, theme, origin, and delivery semantic tags
- Strong `habitat:planar` and `origin:planar` coverage for Creature Forge selection
- Advanced stage mechanics including stubborn progression, virulent afflictions, healing restrictions, speech blocking, condition locks, concentration gates, persistent damage, and a level-20 death effect
- Natural and supernatural creature poisons do **not** use weapon injury-poison charges
- Foundry 14-safe managed world-compendium synchronization
- Read-only provider registration through the public Affliction Forge library API

## Creature Forge contract

Example tags:

```text
creature:fiend
habitat:planar
theme:corruption
origin:planar
delivery:aura
```

The pack is intended to provide a distinct extraplanar pool that Creature Forge can rank using creature identity, delivery method, theme, and planar origin.

## Installation

Install this module next to `pf2e-affliction-forge`, enable both modules, and start the world as a GM once. The add-on creates or synchronizes its managed world compendium and registers it as a read-only Affliction Forge library.

## Development tests

```bash
npm test
```

The tests locate Affliction Forge by its `module.json` id in a sibling folder. For a non-standard development layout, set `PF2E_AFFLICTION_FORGE_PATH` to the core module directory.

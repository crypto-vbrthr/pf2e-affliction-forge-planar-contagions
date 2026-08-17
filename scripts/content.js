const MODULE_ID = "pf2e-affliction-forge-planar-contagions";
const CONTENT_VERSION = "0.1.1";
const I18N_PREFIX = "PF2E_AFFLICTION_PLANAR.Content";

const token = (slug, key) => `@i18n:${I18N_PREFIX}.${slug}.${key}`;
const restrictions = ({ locks = [], healing = "none", damageTypes = [], blocked = [] } = {}) => ({ conditionLocks: locks.map(([slug, minimum]) => ({ slug, minimum })), healing, unhealableDamageTypes: [...damageTypes], blockedCapabilities: [...blocked] });
const duration = ([value, unit]) => ({ value, unit });
const condition = (slug, value = null) => value == null ? { type: "condition", slug } : { type: "condition", slug, value };
const damage = (formula, damageType, persistent = false) => ({ type: "damage", formula, damageType, ...(persistent ? { persistent: true } : {}) });
const death = (category = "death-effect") => ({ type: "death", category });

function effect(slug, stageNumber, components, nameKey = null) {
  if (!components.length) return null;
  return { schemaVersion: 2, id: `${MODULE_ID}.${slug}.stage-${stageNumber}`, name: token(slug, nameKey ?? `Stage${stageNumber}.Name`), duration: { value: -1, unit: "unlimited", expiry: null }, components, application: {}, metadata: { originModule: MODULE_ID, originFeature: "planar-contagions-stage" } };
}

function componentFromSpec(entry) {
  if (entry[0] === "condition") return condition(entry[1], entry[2]);
  if (entry[0] === "damage") return damage(entry[1], entry[2], false);
  if (entry[0] === "damagePersistent") return damage(entry[1], entry[2], true);
  if (entry[0] === "death") return death(entry[1]);
  throw new Error(`Unsupported Planar Contagions component type: ${entry[0]}`);
}

function makeStage(slug, stageNumber, stageSpec) {
  const [durationSpec, componentSpecs, options = {}] = stageSpec;
  const components = componentSpecs.map(componentFromSpec);
  const stageRestrictions = restrictions({ locks: options.locks ?? [], healing: options.healing ?? "none", blocked: options.blockSpeak ? ["speak"] : [] });
  const preActionGates = options.gate ? [{ id: `${slug}.stage-${stageNumber}.gate`, label: token(slug, `Stage${stageNumber}.Gate`), trigger: { actionKinds: ["spell-cast", "item-activation"], requiredTraits: ["concentrate"] }, check: { kind: "flat", dc: options.gate }, blockOnFailure: true }] : [];
  return { id: `stage-${stageNumber}`, number: stageNumber, name: token(slug, `Stage${stageNumber}.Name`), description: token(slug, `Stage${stageNumber}.Description`), duration: duration(durationSpec), expiryAction: options.expiry ?? "check", check: null, restrictions: stageRestrictions, effectPersistence: "stage", effectPersistenceDuration: null, effectComponentPersistence: [], effectComponentPersistenceDurations: [], effect: effect(slug, stageNumber, components), numericModifiers: [], periodicEffects: [], preActionGates, reactions: [] };
}

function makeDefinition(spec) {
  const themes = Object.entries(spec.tags).flatMap(([namespace, values]) => values.map((value) => `${namespace}:${value}`));
  const normalProgression = { criticalSuccess: { action: "stage-delta", delta: -2 }, success: { action: "stage-delta", delta: -1 }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } };
  const stubbornProgression = { criticalSuccess: { action: "stage-delta", delta: -1 }, success: { action: "stay" }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } };
  return { schemaVersion: 2, id: `${MODULE_ID}.${spec.slug}`, name: token(spec.slug, "Name"), description: token(spec.slug, "Description"), img: "icons/svg/poison.svg", afflictionType: spec.type, level: spec.level, rarity: spec.rarity, traits: [spec.type, ...(spec.virulent === true ? ["virulent"] : [])], themes, saveDefaults: { execution: "player", visibility: "public" }, identification: { initialState: spec.identification ?? "identified" }, delivery: { injuryPoison: false }, multipleExposure: "default", restrictions: restrictions({ locks: spec.locks ?? [], healing: spec.rootHealing ?? "none" }), checks: [{ id: "primary", label: token(spec.slug, "SaveLabel"), kind: "save", statistic: spec.stat, dcMode: "fixed", dc: spec.dc, policy: null }], initialCheck: { checkIds: ["primary"], combine: "single", outcomes: { criticalSuccess: { action: "reject" }, success: { action: "reject" }, failure: { action: "set-stage", stage: 1 }, criticalFailure: { action: "set-stage", stage: Math.min(2, spec.stages.length) } } }, onset: spec.onset ? duration(spec.onset) : null, maximumDuration: spec.maxDuration ? duration(spec.maxDuration) : null, defaultStageCheck: { checkIds: ["primary"], combine: "single", outcomes: spec.stubborn ? stubbornProgression : normalProgression }, progression: { belowStageOne: "recover", aboveMaximumStage: "clamp", virulent: spec.virulent === true }, stages: spec.stages.map((stage, index) => makeStage(spec.slug, index + 1, stage)), metadata: { originModule: MODULE_ID, originFeature: "planar-contagions-library", contentVersion: CONTENT_VERSION, contentLicense: "original-homebrew", creatureForgeReady: true } };
}

const SPECS = [
  {
    "slug": "spark-soul-fever",
    "level": 0,
    "dc": 14,
    "type": "disease",
    "rarity": "common",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "elemental"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "elemental"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "aura",
        "contact"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d4",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "dreamdew-toxin",
    "level": 0,
    "dc": 14,
    "type": "poison",
    "rarity": "common",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fey",
        "plant"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "toxin",
        "dream"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "contact",
        "ingested"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "ash-vein-sickness",
    "level": 1,
    "dc": 15,
    "type": "disease",
    "rarity": "common",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "elemental",
        "humanoid"
      ],
      "habitat": [
        "planar",
        "volcanic"
      ],
      "theme": [
        "disease",
        "elemental",
        "blood"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "fire"
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "fire"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ]
    ],
    "onset": [
      1,
      "hours"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "gloamcap-dust",
    "level": 1,
    "dc": 15,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fungus",
        "fey"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "toxin",
        "fungal",
        "spores",
        "shadow"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "axiom-tremor",
    "level": 2,
    "dc": 16,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "monitor",
        "construct"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "ability",
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 5
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "silverweb-venom",
    "level": 2,
    "dc": 16,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "beast"
      ],
      "family": [
        "spider",
        "arachnid"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "planar",
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "cinderlung",
    "level": 3,
    "dc": 18,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "elemental"
      ],
      "habitat": [
        "planar",
        "volcanic"
      ],
      "theme": [
        "disease",
        "elemental"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "breath",
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "fire"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "fire"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "whispering-halo",
    "level": 3,
    "dc": 18,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "celestial"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "spirit"
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {
          "gate": 5
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "infernal-soot-fever",
    "level": 4,
    "dc": 19,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fiend"
      ],
      "family": [
        "bat"
      ],
      "habitat": [
        "planar",
        "volcanic"
      ],
      "theme": [
        "disease",
        "corruption",
        "elemental"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "inhaled",
        "breath"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "fire"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "fire"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "ether-wasp-venom",
    "level": 4,
    "dc": 19,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "spirit",
        "beast"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "necrotic"
      ],
      "origin": [
        "planar",
        "occult"
      ],
      "delivery": [
        "sting"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "damage",
            "1d4",
            "spirit"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "spirit"
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "abyssal-ichor-toxin",
    "level": 5,
    "dc": 20,
    "type": "poison",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fiend",
        "ooze"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "toxin",
        "corruption",
        "mutation"
      ],
      "origin": [
        "planar",
        "magical"
      ],
      "delivery": [
        "contact",
        "injury"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "moonpath-curse",
    "level": 5,
    "dc": 20,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fey"
      ],
      "family": [
        "canine"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "dream",
        "mental"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 5
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "astral-leech-rot",
    "level": 6,
    "dc": 22,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration"
      ],
      "family": [
        "parasite",
        "worm"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "parasite",
        "blood"
      ],
      "origin": [
        "planar",
        "occult"
      ],
      "delivery": [
        "bite",
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "lightning-marrow",
    "level": 6,
    "dc": 22,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "elemental"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "elemental"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "locks": [
            [
              "clumsy",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "gravewind-pall",
    "level": 7,
    "dc": 23,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "spirit",
        "undead"
      ],
      "family": [
        "bird"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "shadow",
        "necrotic"
      ],
      "origin": [
        "planar",
        "undead"
      ],
      "delivery": [
        "aura",
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "prism-serpent-venom",
    "level": 7,
    "dc": 23,
    "type": "poison",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "dragon",
        "beast"
      ],
      "family": [
        "snake",
        "reptile"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "elemental"
      ],
      "origin": [
        "planar",
        "arcane"
      ],
      "delivery": [
        "bite"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "fire"
          ],
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "clock-soul-fracture",
    "level": 8,
    "dc": 24,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "construct",
        "monitor"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "planar",
        "arcane"
      ],
      "delivery": [
        "ability",
        "contact"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "gate": 7,
          "locks": [
            [
              "slowed",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "star-mold-infection",
    "level": 8,
    "dc": 24,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fungus",
        "aberration"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "fungal",
        "spores",
        "mutation"
      ],
      "origin": [
        "planar",
        "occult"
      ],
      "delivery": [
        "inhaled",
        "contact"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "hellglass-venom",
    "level": 9,
    "dc": 26,
    "type": "poison",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fiend",
        "beast"
      ],
      "family": [
        "reptile"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "corruption"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "bite",
        "spit"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "radiant-scar",
    "level": 9,
    "dc": 26,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "celestial"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "elemental"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "spirit"
          ],
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "spirit"
          ],
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "dreaming-gate-fever",
    "level": 10,
    "dc": 27,
    "type": "disease",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fey",
        "humanoid"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "dream",
        "mental"
      ],
      "origin": [
        "planar",
        "occult"
      ],
      "delivery": [
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 7
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "void-reef-toxin",
    "level": 10,
    "dc": 27,
    "type": "poison",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration",
        "beast"
      ],
      "family": [
        "fish",
        "shark"
      ],
      "habitat": [
        "planar",
        "aquatic"
      ],
      "theme": [
        "poison",
        "toxin",
        "necrotic"
      ],
      "origin": [
        "planar",
        "occult"
      ],
      "delivery": [
        "sting",
        "bite"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "soul-tithe-brand",
    "level": 11,
    "dc": 28,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fiend"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "corruption",
        "blood"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "contact",
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "locks": [
            [
              "drained",
              1
            ]
          ],
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "quicksilver-time-rot",
    "level": 12,
    "dc": 30,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "monitor",
        "construct"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "mutation",
        "mental"
      ],
      "origin": [
        "planar",
        "arcane"
      ],
      "delivery": [
        "aura",
        "contact"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "elemental-concordance",
    "level": 13,
    "dc": 31,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "elemental",
        "dragon"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "elemental"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "breath",
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "fire"
          ],
          [
            "damage",
            "2d6",
            "cold"
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "electricity"
          ],
          [
            "damage",
            "2d6",
            "acid"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "fire"
          ],
          [
            "damage",
            "3d6",
            "cold"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 9
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "shadow-passage-rot",
    "level": 14,
    "dc": 32,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "spirit",
        "undead"
      ],
      "family": [
        "bat"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "shadow",
        "necrotic",
        "corruption"
      ],
      "origin": [
        "planar",
        "undead"
      ],
      "delivery": [
        "contact",
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "blockSpeak": true,
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "chaos-bloom-toxin",
    "level": 15,
    "dc": 34,
    "type": "poison",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration",
        "plant",
        "fungus"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "toxin",
        "mutation",
        "fungal",
        "spores"
      ],
      "origin": [
        "planar",
        "occult"
      ],
      "delivery": [
        "inhaled",
        "contact"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "damagePersistent",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "fate-chain",
    "level": 16,
    "dc": 35,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "monitor"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "mental",
        "corruption"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "ability",
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 11,
          "locks": [
            [
              "stupefied",
              1
            ],
            [
              "slowed",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "phoenix-ash-fever",
    "level": 17,
    "dc": 36,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "elemental",
        "dragon"
      ],
      "family": [
        "bird"
      ],
      "habitat": [
        "planar",
        "volcanic"
      ],
      "theme": [
        "disease",
        "elemental",
        "blood"
      ],
      "origin": [
        "planar",
        "primal"
      ],
      "delivery": [
        "breath",
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "fire"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "fire"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "fire"
          ],
          [
            "damagePersistent",
            "2d6",
            "fire"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "crown-of-broken-oaths",
    "level": 18,
    "dc": 38,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fiend",
        "celestial",
        "humanoid"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "corruption",
        "mental"
      ],
      "origin": [
        "planar",
        "divine"
      ],
      "delivery": [
        "ability",
        "contact"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "locks": [
            [
              "stupefied",
              1
            ]
          ],
          "healing": "affliction-damage"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "astral-worm-colony",
    "level": 19,
    "dc": 39,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration"
      ],
      "family": [
        "worm",
        "parasite"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "parasite",
        "mutation",
        "blood"
      ],
      "origin": [
        "planar",
        "occult"
      ],
      "delivery": [
        "bite",
        "contact"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "spirit"
          ],
          [
            "damagePersistent",
            "2d6",
            "bleed"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "healing": "all"
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "planar-unmaking",
    "level": 20,
    "dc": 40,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "monitor",
        "aberration",
        "spirit"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "corruption",
        "mutation",
        "mental"
      ],
      "origin": [
        "planar",
        "magical"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {
          "gate": 11
        }
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "8d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "locks": [
            [
              "stupefied",
              1
            ],
            [
              "drained",
              1
            ]
          ],
          "healing": "all"
        }
      ],
      [
        [
          1,
          "hours"
        ],
        [
          [
            "death",
            "death-effect"
          ],
          [
            "damage",
            "10d6",
            "spirit"
          ]
        ],
        {
          "blockSpeak": true,
          "healing": "all"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  }
];

export const PLANAR_CONTAGIONS_MODULE_ID = MODULE_ID;
export const PLANAR_CONTAGIONS_CONTENT_VERSION = CONTENT_VERSION;
export const PLANAR_CONTAGIONS_DEFINITIONS = Object.freeze(SPECS.map(makeDefinition));
export function createPlanarContagionsDefinitions() { return PLANAR_CONTAGIONS_DEFINITIONS.map((definition) => structuredClone(definition)); }

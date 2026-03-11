# 3D Scene and Models

## Scene Setup

`GameTable.tsx` assembles the 3D scene inside an r3f `<Canvas>`:

- **Renderer**: ACESFilmicToneMapping, exposure 1.2, PCFShadowMap, DPR [1,2]
- **Camera**: FOV 60, animated intro via gsap (3.5s arc from above to table level)
- **Fog**: exponential, density 0.022, black
- **Post-processing**: Vignette only (Bloom removed for perf)
- **Shadows**: ContactShadows (replaced AccumulativeShadows for perf)

## Models (GLTF, loaded from `public/models/`)

| Model | File | Component |
|---|---|---|
| Table | `blackjack_table/scene.glb` | `BlackjackTable.tsx` |
| Whiskey glass | `glass_whisky_test/scene.gltf` | `WhiskeyGlass.tsx` |
| Colt 1911 | `colt_m1911/scene.gltf` | `Colt1911.tsx` |
| Fedora hat | `karol_wojtyas_hat/scene.gltf` | `FedoraHat.tsx` |
| Card deck | `52-card_deck/scene.gltf` | `CardDeck.tsx` |

## Procedural 3D Objects

- **DealtCard** (`models/DealtCard.tsx`): Canvas-textured planes, cached at module level. Lerp animation from deck to target position.
- **ChipTray** (`models/ChipTray.tsx`): Cylinder geometry chips with canvas face textures. Dynamic stacks from `breakdownChips(total)` formula.
- **BetChips**: Same chip geometry, positioned at betting circle during active rounds.

## Lighting (`Lighting.tsx`)

- Warm spotlight (0,8,0), color `#fff5e0`, intensity 30, penumbra 0.5, casts shadow
- Hemisphere light, intensity 1.4
- Two point lights for fill (left and right)

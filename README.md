# EnergySpace

Simulador espacial 3D con HUD futurista, minimapa y mecánicas arcade (combate, combustible, portal cuántico y órbitas).

## Estructura modular

```text
src/
  main.js
  style.css
  modules/
    config/
      gameConfig.js
    core/
      three.js
    setup/
      setupScene.js
      buildWorld.js
    state/
      createGameState.js
    systems/
      setupInput.js
      updateGame.js
    ui/
      setupHud.js
```

## Scripts

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: compila para producción.
- `npm run preview`: previsualiza el build.

import { HUD_SELECTORS } from '../config/gameConfig.js';

export function setupHud() {
  const elements = {
    fuelLevel: document.querySelector(HUD_SELECTORS.fuelLevel),
    fuelText: document.querySelector(HUD_SELECTORS.fuelText),
    miniMap: document.querySelector(HUD_SELECTORS.miniMap),
    commandPanel: document.querySelector(HUD_SELECTORS.commandPanel),
    toggleDock: document.querySelector(HUD_SELECTORS.toggleDock),
    dockContent: document.querySelector(HUD_SELECTORS.dockContent),
    widgetToggle: document.querySelector(HUD_SELECTORS.widgetToggle),
    widgetContainer: document.querySelector(HUD_SELECTORS.widgetContainer),
    pauseIndicator: document.querySelector(HUD_SELECTORS.pauseIndicator),
  };

  elements.toggleDock?.addEventListener('click', () => {
    elements.commandPanel?.classList.toggle('collapsed');
    const collapsed = elements.commandPanel?.classList.contains('collapsed');

    if (elements.dockContent) {
      elements.dockContent.style.display = collapsed ? 'none' : 'block';
    }

    if (elements.toggleDock) {
      elements.toggleDock.textContent = collapsed ? 'Abrir Dock' : '—';
    }
  });


  const setPaused = (isPaused) => {
    elements.commandPanel?.classList.toggle('paused', isPaused);

    if (elements.pauseIndicator) {
      elements.pauseIndicator.setAttribute('aria-hidden', String(!isPaused));
    }
  };

  elements.widgetToggle?.addEventListener('click', () => {
    elements.widgetContainer?.classList.toggle('active');

    if (elements.widgetToggle && elements.widgetContainer) {
      elements.widgetToggle.textContent = elements.widgetContainer.classList.contains('active')
        ? '▼'
        : '▲';
    }
  });

  return {
    ...elements,
    setPaused,
  };
}

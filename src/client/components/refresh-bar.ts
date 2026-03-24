export const RefreshBar = {
  render(): string {
    return `
      <div class="refresh-bar">
        <span>Actualiza en <span class="countdown" id="countdown">30</span>s</span>
        <button class="refresh-btn" id="refreshNow">↻ AHORA</button>
      </div>
    `;
  },
};

import $ from 'jquery';

export const StatusBar = {
  render(msg: string, type: 'loading' | 'ok' | 'error' | '' = ''): void {
    $('#statusBar').html(
      `<span class="status-dot ${type}"></span><span>${msg}</span>`
    );
  },

  renderContainer(): string {
    return '<div id="statusBar" class="status-bar"></div>';
  },
};

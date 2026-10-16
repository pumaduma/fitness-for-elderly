/* ============================================================
   modal.js — accessible dialog helper (shared by the N-body
   story modal and the class-booking modal).
   Features: focus trap-lite (focus moves in, returns on close),
   Esc closes, backdrop click closes, aria-modal semantics.
   ============================================================ */
let modalCount = 0;

export function createModal({ title, contentHTML, footerHTML = '' } = {}) {
  modalCount += 1;
  const id = `ffe-modal-${modalCount}`;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="modal__header">
        <h2 class="modal__title" id="${id}-title"></h2>
        <button type="button" class="modal__close" data-close aria-label=""></button>
      </div>
      <div class="modal__body"></div>
      ${footerHTML ? `<div class="modal__foot">${footerHTML}</div>` : ''}
    </div>`;

  const dialog = overlay.querySelector('.modal');
  const closeBtn = overlay.querySelector('[data-close]');
  closeBtn.textContent = '✕';
  let lastFocused = null;

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    overlay.dispatchEvent(new CustomEvent('ffe:modalclosed'));
  }

  function open(opts = {}) {
    lastFocused = document.activeElement;
    if (opts.title != null) overlay.querySelector('.modal__title').textContent = opts.title;
    if (opts.contentHTML != null) overlay.querySelector('.modal__body').innerHTML = opts.contentHTML;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    overlay.dispatchEvent(new CustomEvent('ffe:modalopened'));
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      // Keep Tab cycling inside the dialog.
      const focusables = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  document.body.appendChild(overlay);
  return { overlay, dialog, open, close };
}

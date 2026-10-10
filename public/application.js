const form = document.querySelector('#application-form');
const message = document.querySelector('#form-message');

form.elements.fecha_nacimiento.max = new Date().toISOString().slice(0, 10);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando…';
  message.hidden = true;

  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const result = await response.json();
    if (!response.ok) throw new Error((result.details || [result.error]).join(' '));
    form.reset();
    message.textContent = result.message;
    message.className = 'notice notice-success';
    message.hidden = false;
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    message.textContent = error.message || 'No se pudo enviar la solicitud. Intenta nuevamente.';
    message.className = 'notice notice-error';
    message.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Enviar solicitud <span aria-hidden="true">→</span>';
  }
});

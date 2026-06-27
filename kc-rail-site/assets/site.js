
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const form = document.querySelector('#support-form');
  if (!form) return;

  const textarea = form.querySelector('textarea[name="comments"]');
  const wordCount = document.querySelector('#word-count');
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('button[type="submit"]');
  const maxWords = Number(textarea?.dataset.maxWords || 256);

  function countWords(value) {
    const words = value.trim().match(/\S+/g);
    return words ? words.length : 0;
  }

  function updateWordCount() {
    const count = countWords(textarea.value);
    wordCount.textContent = `${count} / ${maxWords} words`;
    wordCount.style.color = count > maxWords ? '#9b1c1c' : '';
    return count;
  }

  if (textarea) textarea.addEventListener('input', updateWordCount);
  updateWordCount();

  function setStatus(message, type) {
    status.textContent = message;
    status.className = `form-status ${type || ''}`.trim();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('', '');

    const words = updateWordCount();
    if (words > maxWords) {
      setStatus(`Please shorten your comments to ${maxWords} words or fewer.`, 'error');
      textarea.focus();
      return;
    }
    if (!form.checkValidity()) {
      setStatus('Please complete the required fields with valid information.', 'error');
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    submit.disabled = true;
    setStatus('Submitting...', '');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin'
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Submission failed.');
      form.reset();
      updateWordCount();
      setStatus('Thank you. Your support has been recorded.', 'success');
    } catch (error) {
      setStatus(error.message || 'Unable to submit right now. Please try again later.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();

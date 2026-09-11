document.getElementById('cookieReset')?.addEventListener('click', () => {
  localStorage.removeItem('hhbar_cookie_consent');
  document.getElementById('cookieReset').textContent = 'Выбор сброшен';
});

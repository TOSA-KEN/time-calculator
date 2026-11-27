'use strict';

const el = id => document.getElementById(id);
const pad = number => String(number).padStart(2, '0');
const format = value => value.slice(0, 2) + ':' + value.slice(2);
const maxHour = 47;
let digits = '';

function render(message = '') {
  el('input').textContent = format(digits.padEnd(4, '-'));
  el('output').textContent = '--:--';
  el('hint').textContent = message || 'テンキーで時刻を4桁入力';
  el('hint').classList.toggle('error', Boolean(message));
  if (digits.length !== 4) return;

  const end = Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2)) + 40;
  el('output').textContent = pad(Math.floor(end / 60)) + ':' + pad(end % 60);
  if (!message) el('hint').textContent = '入店時刻から40分後';
}

function enter(key) {
  const next = (digits.length === 4 ? '' : digits) + key;
  if (next.length > 4) {
    render('残り1桁は数字を1つ入力してください');
    return;
  }
  if (Number(next[0]) > Math.floor(maxHour / 10) || Number(next.slice(0, 2)) > maxHour) {
    render('時は00〜47で入力してください');
    return;
  }
  if (Number(next[2]) > 5) {
    render('分は00〜59で入力してください');
    return;
  }
  digits = next;
  render();
}

function backspace() {
  digits = digits.slice(0, -1);
  render();
}

el('keys').addEventListener('click', event => {
  const key = event.target.closest('button');
  if (!key) return;
  if (key.id === 'back') backspace();
  else enter(key.dataset.digit);
});
el('clear').addEventListener('click', () => {
  digits = '';
  render();
});
el('now').addEventListener('click', () => {
  const now = new Date();
  digits = pad(now.getHours()) + pad(now.getMinutes());
  render();
});

if ('serviceWorker' in navigator) {
  const worker = new URL('./sw.js', location.href).href;
  function showOfflineReady() {
    if (navigator.serviceWorker.controller?.scriptURL !== worker) return;
    el('status').textContent = 'オフライン利用可';
    navigator.serviceWorker.removeEventListener('controllerchange', showOfflineReady);
  }
  navigator.serviceWorker.addEventListener('controllerchange', showOfflineReady);
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then(showOfflineReady)
    .catch(() => { el('status').textContent = 'オフライン準備未完了'; });
}

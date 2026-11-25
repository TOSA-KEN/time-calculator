'use strict';

const times = [
  { button: document.querySelector('#start'), digits: '', replace: false },
  { button: document.querySelector('#end'), digits: '', replace: false },
];
const hint = document.querySelector('#hint');
const result = document.querySelector('#minutes');
const detail = document.querySelector('#detail');
let active = 0;

function toMinutes(digits) {
  if (digits.length !== 4 || Number(digits.slice(2)) > 59) return null;
  return Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2));
}

function durationBetween(start, end) {
  if (end >= start) return end - start;
  if (end >= 1440) return null;
  const days = Math.ceil((start - end) / 1440);
  return end + days * 1440 - start;
}

function render() {
  const [start, end] = times.map(({ button, digits }, index) => {
    const display = digits.padEnd(4, '-');
    button.querySelector('strong').textContent = display.slice(0, 2) + ':' + display.slice(2);
    button.setAttribute('aria-pressed', String(index === active));
    button.removeAttribute('aria-invalid');
    return toMinutes(digits);
  });

  const invalid = times.find(({ digits }) => digits.length === 4 && toMinutes(digits) === null);
  const duration = start === null || end === null ? null : durationBetween(start, end);
  const reversed = start !== null && end !== null && duration === null;
  const error = Boolean(invalid || reversed);

  if (invalid) invalid.button.setAttribute('aria-invalid', 'true');
  if (reversed) times[1].button.setAttribute('aria-invalid', 'true');
  hint.classList.toggle('error', error);
  hint.textContent = invalid ? '分は00〜59で入力してください'
    : reversed ? '終了時刻は開始時刻以降を入力してください'
      : 'テンキーで時刻を4桁入力';
  result.textContent = duration ?? '—';
  detail.textContent = duration === null ? '' : Math.floor(duration / 60) + '時間 ' + duration % 60 + '分';
}

function finishEntry() {
  times[active].replace = true;
  if (active === 0 && !times[1].digits) active = 1;
}

function enter(digits) {
  const field = times[active];
  if (field.replace || field.digits.length === 4) field.digits = '';
  field.replace = false;
  field.digits = (field.digits + digits).slice(0, 4);
  if (toMinutes(field.digits) !== null) finishEntry();
  render();
}

function backspace() {
  const field = times[active];
  field.digits = field.digits.slice(0, -1);
  field.replace = false;
  render();
}

times.forEach((field, index) => {
  field.button.addEventListener('click', () => {
    active = index;
    render();
  });
});
document.querySelectorAll('[data-digit]').forEach(button => {
  button.addEventListener('click', () => enter(button.dataset.digit));
});
document.querySelector('#double-zero').addEventListener('click', () => enter('00'));
document.querySelector('#back').addEventListener('click', backspace);
document.querySelector('#now').addEventListener('click', () => {
  const now = new Date();
  times[active].digits = [now.getHours(), now.getMinutes()]
    .map(value => String(value).padStart(2, '0')).join('');
  finishEntry();
  render();
});
document.querySelector('#clear').addEventListener('click', () => {
  for (const field of times) {
    field.digits = '';
    field.replace = false;
  }
  active = 0;
  render();
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (/^[0-9]$/.test(event.key)) enter(event.key);
  else if (event.key === 'Backspace') backspace();
  else return;
  event.preventDefault();
});

render();
const offline = document.querySelector('#offline');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(() => { offline.textContent = 'オフライン利用可'; })
    .catch(() => { offline.textContent = 'オフラインの準備ができませんでした'; });
}

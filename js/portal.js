// Portal: i18n + sekmeler + 3B model + süreç + çizimler + durum.
import { initViewer } from './model.js';

// ---- i18n ----
const DIL = (() => {
  try { const d = localStorage.getItem('vestiyer-dil'); if (d) return d; } catch (e) {}
  const n = ((navigator.language || 'tr') + '').slice(0, 2).toLowerCase();
  return ['tr', 'en', 'fr'].includes(n) ? n : 'tr';
})();
const I18N = window.VESTIYER_I18N
  ? window.VESTIYER_I18N[DIL]
  : await (await fetch(`i18n/${DIL}.json`)).json();
const t = k => I18N[k] ?? k;
document.documentElement.lang = DIL;
document.querySelectorAll('[data-i]').forEach(el => { el.textContent = t(el.dataset.i); });
document.querySelectorAll('[data-i-html]').forEach(el => { el.innerHTML = t(el.dataset.iHtml); });
document.querySelectorAll('#dil-secici button').forEach(b => {
  b.classList.toggle('aktif', b.dataset.dil === DIL);
  b.addEventListener('click', () => {
    if (b.dataset.dil === DIL) return;
    try { localStorage.setItem('vestiyer-dil', b.dataset.dil); } catch (e) {}
    location.reload();
  });
});
// aktif dilin doküman grubunu üste al
const dokGrup = { tr: 'dok-tr', en: 'dok-en', fr: 'dok-fr' }[DIL];
const gBaslik = document.getElementById(dokGrup);
if (gBaslik && gBaslik.previousElementSibling && gBaslik.previousElementSibling.classList.contains('alt') === false) {
  const liste = gBaslik.nextElementSibling;
  const anne = gBaslik.parentElement;
  const ilkGrup = anne.querySelector('.grup-baslik');
  if (ilkGrup !== gBaslik) { anne.insertBefore(gBaslik, ilkGrup); anne.insertBefore(liste, gBaslik.nextElementSibling); }
}

// ---- sekmeler ----
const sekmeler = document.querySelectorAll('#sekmeler button');
sekmeler.forEach(b => b.addEventListener('click', () => {
  sekmeler.forEach(x => x.classList.toggle('aktif', x === b));
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('acik-tab', t.id === 'tab-' + b.dataset.tab));
  if (b.dataset.tab === 'model' && api) api.resize();
}));

// ---- 3B model ----
let api = null;
const durumEl = document.getElementById('model-durum');
initViewer(document.getElementById('viewer'), durumEl, I18N).then(a => {
  api = a;
  if (!api) return;
  const btnIc = document.getElementById('btn-ic');
  const btnDis = document.getElementById('btn-dis');
  const btnCephe = document.getElementById('btn-cephe');
  const btnKapi = document.getElementById('btn-kapi');
  const btnD3 = document.getElementById('btn-d3');
  const presetGrup = document.getElementById('preset-grup');
  const presetBtnlar = presetGrup.querySelectorAll('button');
  btnIc.onclick = () => { api.setMode('ic'); btnIc.classList.add('aktif'); btnDis.classList.remove('aktif');
    btnCephe.hidden = true; btnKapi.hidden = false; btnD3.hidden = false; presetGrup.hidden = false; };
  btnDis.onclick = () => { api.setMode('dis'); btnDis.classList.add('aktif'); btnIc.classList.remove('aktif');
    btnCephe.hidden = false; btnKapi.hidden = true; btnD3.hidden = false; presetGrup.hidden = true;
    durumEl.textContent = t('model.disDurum'); };
  btnCephe.onclick = () => {
    const sonra = api.toggleFacade();
    btnD3.hidden = !sonra;
    durumEl.textContent = sonra ? t('model.sonra') : t('model.oncem');
  };
  btnKapi.onclick = () => api.toggleDoorV();
  btnD3.onclick = () => api.toggleDoorK1();
  presetBtnlar.forEach(b => b.onclick = () => {
    api.setPreset(b.dataset.preset);
    btnIc.classList.add('aktif'); btnDis.classList.remove('aktif');
    btnCephe.hidden = true; btnKapi.hidden = false; btnD3.hidden = false;
    presetBtnlar.forEach(x => x.classList.toggle('aktif', x === b));
    durumEl.textContent = { k1: t('model.presetK1'), ayna: t('model.presetAyna'), kus: t('model.presetKus') }[b.dataset.preset];
  });
});

// ---- süreç adımları ----
const FAZLAR = I18N.fazlar;
const adimlarEl = document.getElementById('adimlar');
const KEY = 'vestiyer-surec';
const durumlar = JSON.parse(localStorage.getItem(KEY) || '[]');
function ilerlemeGuncelle() {
  const kutular = [...document.querySelectorAll('#adimlar input')];
  const n = kutular.filter(k => k.checked).length;
  document.getElementById('ilerleme-cubuk').style.width = (n / FAZLAR.length * 100) + '%';
  // Özet kartları: ilk işaretsiz adım = sıradaki adım
  const ilk = kutular.findIndex(k => !k.checked);
  const simdiEl = document.getElementById('ozet-simdi');
  const sonrakiEl = document.getElementById('ozet-sonraki');
  if (!simdiEl || !sonrakiEl) return;
  if (ilk === -1) {
    simdiEl.textContent = t('ozetDin.tamamHepsi');
    sonrakiEl.textContent = t('ozetDin.kalanYok');
  } else if (ilk === 0) {
    simdiEl.textContent = t('ozetDin.baslamadi');
    sonrakiEl.textContent = `${FAZLAR[0][0]} — ${FAZLAR[0][1]}: ${FAZLAR[0][2]}`;
  } else {
    simdiEl.textContent = t('ozetDin.tamamlandi').replace('{b}', FAZLAR[ilk - 1][1]).replace('{a}', FAZLAR[ilk - 1][0]);
    sonrakiEl.textContent = `${FAZLAR[ilk][0]} — ${FAZLAR[ilk][1]}: ${FAZLAR[ilk][2]}`;
  }
}
FAZLAR.forEach(([ay, baslik, aciklama], i) => {
  const li = document.createElement('li');
  const cb = document.createElement('input');
  cb.type = 'checkbox'; cb.checked = !!durumlar[i];
  cb.setAttribute('aria-label', baslik);
  li.classList.toggle('tamam', cb.checked);
  cb.addEventListener('change', () => {
    durumlar[i] = cb.checked;
    localStorage.setItem(KEY, JSON.stringify(durumlar));
    li.classList.toggle('tamam', cb.checked);
    ilerlemeGuncelle();
  });
  li.append(cb);
  const ayEl = document.createElement('div'); ayEl.className = 'ay'; ayEl.textContent = ay;
  const ic = document.createElement('div'); ic.className = 'icerik';
  ic.innerHTML = `<b></b><span></span>`;
  ic.querySelector('b').textContent = baslik;
  ic.querySelector('span').textContent = aciklama;
  li.append(ayEl, ic);
  adimlarEl.append(li);
});
ilerlemeGuncelle();

// ---- çizim görüntüleyici ----
const cizimIframe = document.getElementById('cizim-goster');
const cizimBtnlar = document.querySelectorAll('.cizim-bar button');
function cizimAc(sayfa, btn) {
  const cizimPdf = { tr: 'Shop_Drawings_Vestiyer_TR.pdf', en: 'Shop_Drawings_EN.pdf', fr: 'Plans_Fabrication_FR.pdf' }[DIL];
  cizimIframe.src = `docs/${cizimPdf}#page=${sayfa}&zoom=page-width`;
  cizimBtnlar.forEach(x => x.classList.toggle('aktif', x === btn));
}
cizimBtnlar.forEach(b => b.addEventListener('click', () => cizimAc(b.dataset.sayfa, b)));
cizimAc(1, cizimBtnlar[0]);

// ---- durum ----
fetch('data/status.json').then(r => r.json()).then(d => {
  const ol = document.getElementById('durum-liste');
  d.entries.forEach(e => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="m"></span><span class="t"></span><div class="o"></div>`;
    li.querySelector('.m').textContent = e.milestone;
    li.querySelector('.t').textContent = e.date;
    li.querySelector('.o').textContent = (DIL === 'en' && e.ozet_en) || (DIL === 'fr' && e.ozet_fr) || e.ozet;
    ol.append(li);
  });
}).catch(() => {
  document.getElementById('durum-liste').innerHTML = '<li>' + t('durum.hata') + '</li>';
});

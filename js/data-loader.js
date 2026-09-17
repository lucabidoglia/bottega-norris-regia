/*
 * BNStore — caricamento dati locali via IndexedDB.
 *
 * L'app viene pubblicata con dati demo (inventati) incorporati nei tag
 * <script id="raw"/"ferie"/"ds" type="application/json"> di ogni pagina.
 * Questo file permette di sostituirli, SOLO SUL BROWSER DI CHI LO USA, con
 * i dati reali: nulla viene inviato in rete, tutto resta nel profilo del
 * browser locale (IndexedDB), finché non lo cancelli con "Ripristina demo".
 *
 * Flusso: l'utente sceglie un file JSON -> viene validato e salvato in
 * IndexedDB -> la pagina si ricarica -> prima che lo script principale
 * (shell.js / analitica.js) legga i tag <script>, applyOverride() ne
 * sostituisce il contenuto con quello salvato.
 */
const BNStore = (() => {
  const DB_NAME = 'bn-regia-data';
  const STORE = 'overrides';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function get(key) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const rq = tx.objectStore(STORE).get(key);
        rq.onsuccess = () => resolve(rq.result || null);
        rq.onerror = () => reject(rq.error);
      });
    } catch (e) {
      console.warn('BNStore.get fallita, uso i dati demo:', e);
      return null;
    }
  }

  async function set(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function clear() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function hasAny() {
    for (const k of ['raw', 'ferie', 'ds']) {
      if (await get(k)) return true;
    }
    return false;
  }

  // Se in IndexedDB c'e' un override per dbKey, sostituisce il contenuto
  // del <script id="scriptId"> con quello (prima che lo script principale
  // lo legga). Ritorna true se ha applicato un override.
  async function applyOverride(scriptId, dbKey) {
    const val = await get(dbKey);
    const el = document.getElementById(scriptId);
    if (val && el) {
      el.textContent = val;
      return true;
    }
    return false;
  }

  // Collega un pulsante + input[type=file] al salvataggio in IndexedDB.
  // Ricarica la pagina al termine cosi' i dati caricati vengono applicati.
  function wireFileInput(btnId, inputId, dbKey, validate) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        alert('File non valido: non è un JSON leggibile.\n' + err.message);
        return;
      }
      if (validate) {
        const problem = validate(parsed);
        if (problem) {
          alert('File non valido per "' + dbKey + '": ' + problem);
          return;
        }
      }
      await set(dbKey, text);
      location.reload();
    });
  }

  // Collega un pulsante "ripristina demo": svuota tutti gli override.
  function wireReset(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!confirm('Ripristinare i dati demo? I dati caricati localmente in questo browser verranno rimossi (nessun file esterno viene toccato).')) return;
      await clear();
      location.reload();
    });
  }

  // Mostra un indicatore quando l'app sta usando dati caricati (non demo).
  async function markIfOverridden(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (await hasAny()) {
      el.textContent = 'dati locali caricati';
      el.classList.add('bn-loaded');
    } else {
      el.textContent = 'dati demo';
    }
  }

  return { get, set, clear, hasAny, applyOverride, wireFileInput, wireReset, markIfOverridden };
})();

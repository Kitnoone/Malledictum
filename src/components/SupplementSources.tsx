import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BOOKS, type SupplementId } from '../data/supplements';

type Target = { source: SupplementId; page: number; title?: string; text?: string };
const EVENT = 'imperium:open-supplement';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('imperium-local-books', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('books');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readBook(source: SupplementId): Promise<Blob | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('books').objectStore('books').get(source);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
async function saveBook(source: SupplementId, file: File) {
  if (!new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()).startsWith('%PDF-')) throw new Error('Выберите PDF-файл.');
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').put(file, source);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Не удалось сохранить книгу. Проверьте свободное место в браузере.'));
      tx.onabort = () => reject(new Error('Браузер отменил сохранение книги.'));
    });
  } finally { db.close(); }
}
export function SupplementSourceButton({ source, page, title, text }: Target) {
  return <button type="button" className="source-badge supplement-source" onClick={() => window.dispatchEvent(new CustomEvent<Target>(EVENT, { detail: { source, page, title, text } }))}>{BOOKS[source].short} · стр. {page}</button>;
}
export function LocalBookLibrary() {
  return <details className="local-book-library"><summary>Книги и PDF-источники</summary><p>Карточки доступны сразу. Подключите свой PDF для просмотра оригинальных страниц. Файл сохраняется только в этом браузере на этом устройстве.</p><div>{(Object.keys(BOOKS) as SupplementId[]).map(source => <SupplementSourceButton key={source} source={source} page={1} title={BOOKS[source].title} />)}</div></details>;
}
export function SupplementSourceDialog() {
  const [target, setTarget] = useState<Target | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const open = (event: Event) => { setUrl(null); setMessage(''); setTarget((event as CustomEvent<Target>).detail); };
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);
  useEffect(() => {
    if (!target) return;
    let cancelled = false; let objectUrl: string | null = null;
    readBook(target.source).then(blob => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(() => { if (!cancelled) setMessage('Хранилище книг недоступно в этом браузере.'); });
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setTarget(null); };
    window.addEventListener('keydown', escape);
    document.body.classList.add('supplement-dialog-open');
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); window.removeEventListener('keydown', escape); document.body.classList.remove('supplement-dialog-open'); };
  }, [target]);
  if (!target) return null;
  return createPortal(<div className="supplement-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setTarget(null); }}>
    <section className="supplement-pdf-dialog" role="dialog" aria-modal="true" aria-labelledby="supplement-source-title">
      <header><div><small>{BOOKS[target.source].title}</small><h2 id="supplement-source-title">{target.title ?? 'Источник'} · стр. {target.page}</h2></div><button type="button" autoFocus aria-label="Закрыть источник" onClick={() => setTarget(null)}>×</button></header>
      <div className="local-pdf-tools"><p>{url ? 'PDF подключён на этом устройстве.' : 'Подключите свой экземпляр книги, чтобы открыть оригинальную страницу.'}</p><button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'Сохранение…' : url ? 'Заменить PDF' : 'Подключить PDF'}</button>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={async event => {
          const file = event.target.files?.[0]; if (!file) return;
          const current = target; setBusy(true); setMessage('');
          try { await saveBook(current.source, file); setTarget({ ...current }); }
          catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось сохранить PDF.'); }
          finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
        }} />
      </div>
      {message && <p className="source-status" role="status">{message}</p>}
      {url ? <><a className="text-button pdf-new-tab" href={`${url}#page=${target.page}`} target="_blank" rel="noreferrer">Открыть PDF в отдельной вкладке ↗</a><iframe title={`${BOOKS[target.source].title}, страница ${target.page}`} src={`${url}#page=${target.page}`} /></> : <article className="supplement-source-excerpt"><p>PDF хранится локально. Подключайте книгу, указанную в заголовке; нумерация соответствует страницам PDF.</p>{target.text && <><h3>Карточка на русском</h3><p>{target.text}</p></>}</article>}
    </section>
  </div>, document.body);
}

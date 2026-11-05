import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BESTIARY, BOOKS, type BestiaryEntry } from '../data/supplements';
import { CHARACTERISTICS } from '../data/rules';
import { LocalBookLibrary, SupplementSourceButton } from './SupplementSources';

export function Bestiary() {
  const [query, setQuery] = useState('');
  const [faction, setFaction] = useState('all');
  const [role, setRole] = useState('all');
  const [source, setSource] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => { try { const saved: unknown = JSON.parse(localStorage.getItem('im-bestiary-favorites') ?? '[]'); return Array.isArray(saved) ? saved.filter((v): v is string => typeof v === 'string') : []; } catch { return []; } });
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е');
    return BESTIARY.filter(entry => (source === 'all' || entry.source === source) && (faction === 'all' || entry.faction === faction) && (role === 'all' || entry.role === role) && (!onlyFavorites || favorites.includes(entry.id)) && (!q || `${entry.name} ${entry.originalName} ${entry.faction} ${entry.skills} ${entry.traits.map(t => `${t.name} ${t.text}`).join(' ')} ${entry.attacks.map(a => `${a.name} ${a.traits}`).join(' ')}`.toLocaleLowerCase('ru').replace(/ё/g, 'е').includes(q)));
  }, [query, faction, role, source, favorites, onlyFavorites]);
  const selected = BESTIARY.find(entry => entry.id === selectedId);
  const toggleFavorite = (entry: BestiaryEntry) => {
    const next = favorites.includes(entry.id) ? favorites.filter(id => id !== entry.id) : [...favorites, entry.id];
    setFavorites(next);
    try { localStorage.setItem('im-bestiary-favorites', JSON.stringify(next)); }
    catch { setNotice('Избранное доступно до закрытия страницы: браузер не разрешил сохранение.'); }
  };
  return <div className="chapter-page bestiary-page rules-database-page">
    <header className="chapter-heading"><div><p>V · Bestiary</p><h2>Бестиарий</h2></div><p>{BESTIARY.length} карточек · на русском</p></header>
    <LocalBookLibrary />
    {notice && <p role="status">{notice}</p>}
    <div className="bestiary-tools">
      <label>Поиск<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Имя, атака, особенность…" /></label>
      <label>Книга<select value={source} onChange={event => setSource(event.target.value)}><option value="all">Все книги</option><option value="adversary">Противники Махария</option><option value="mechanicus">Механикус</option></select></label>
      <label>Фракция<select value={faction} onChange={event => setFaction(event.target.value)}><option value="all">Все фракции</option>{[...new Set(BESTIARY.map(entry => entry.faction))].sort((a, b) => a.localeCompare(b, 'ru')).map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Роль<select value={role} onChange={event => setRole(event.target.value)}><option value="all">Все роли</option>{['Рядовой', 'Элита', 'Лидер', 'Чемпион', 'Техника'].map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="bestiary-results"><span role="status">Найдено: {filtered.length}</span><button type="button" className="text-button" aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(value => !value)}>{onlyFavorites ? '★ Только избранное' : '☆ Избранное'}</button><button type="button" className="text-button" onClick={() => { setQuery(''); setSource('all'); setFaction('all'); setRole('all'); setOnlyFavorites(false); }}>Сбросить фильтры</button></div>
    {filtered.length === 0 && <p className="empty-note">Карточки не найдены. Измените запрос или сбросьте фильтры.</p>}
    <div className="bestiary-grid">{filtered.map(entry => <article key={entry.id} className={`bestiary-card role-${entry.role === 'Чемпион' ? 'champion' : 'standard'}`}>
      <div className="bestiary-card-top"><span>{entry.faction} · {entry.role}</span><button type="button" className="bestiary-favorite" aria-label={`${favorites.includes(entry.id) ? 'Убрать из избранного' : 'В избранное'}: ${entry.name}`} aria-pressed={favorites.includes(entry.id)} onClick={() => toggleFavorite(entry)}>{favorites.includes(entry.id) ? '★' : '☆'}</button></div>
      <button type="button" className="bestiary-card-open" onClick={() => setSelectedId(entry.id)}><h3>{entry.name}</h3><small>{entry.vehicle ? 'Техника' : entry.size} · {BOOKS[entry.source].short}</small><dl>{entry.vehicle ? <><div><dt>Броня</dt><dd>{(entry.stats as string[][])[0]?.[1]}</dd></div><div><dt>Скорость</dt><dd>{(entry.stats as string[][])[1]?.[1]}</dd></div></> : <><div><dt>Броня</dt><dd>{entry.stats[0]}</dd></div><div><dt>Раны</dt><dd>{entry.stats[1]}</dd></div><div><dt>Инициатива</dt><dd>{entry.stats[3]}</dd></div></>}</dl><span className="bestiary-open-label">Открыть карточку →</span></button>
    </article>)}</div>
    {selected && <BestiaryDetail key={selected.id} entry={selected} onClose={() => setSelectedId(null)} />}
  </div>;
}

function BestiaryDetail({ entry, onClose }: { entry: BestiaryEntry; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add('bestiary-dialog-open');
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.body.classList.contains('supplement-dialog-open')) onCloseRef.current(); };
    window.addEventListener('keydown', escape);
    return () => { document.body.classList.remove('bestiary-dialog-open'); window.removeEventListener('keydown', escape); previous?.focus(); };
  }, []);
  const [currentWounds, setCurrentWounds] = useState(Number(entry.stats[1]) || 0);
  const [damage, setDamage] = useState('1');
  const stats = entry.vehicle ? entry.stats as string[][] : ['Броня', 'Раны', 'Критические раны', 'Инициатива', 'Скорость', entry.resolveLabel].map((label, i) => [label, entry.stats[i] as string]);
  return createPortal(<div className="bestiary-detail-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="bestiary-detail" role="dialog" aria-modal="true" aria-labelledby="bestiary-detail-title">
      <header><div><small>{entry.faction} · {entry.role}</small><h2 id="bestiary-detail-title">{entry.name}</h2></div><button type="button" autoFocus aria-label="Закрыть карточку" onClick={onClose}>×</button></header>
      <div className="bestiary-detail-scroll">
        <SupplementSourceButton source={entry.source} page={entry.page} title={entry.name} text={entry.traits.map(t => `${t.name}: ${t.text}`).join('\n\n')} />
        <p className="bestiary-original">{entry.originalName}</p>
        {!entry.vehicle && <dl className="bestiary-characteristics">{CHARACTERISTICS.map((characteristic, i) => <div key={characteristic.id}><dt title={characteristic.name}>{characteristic.short}</dt><dd>{entry.characteristics[i]}</dd></div>)}</dl>}
        <dl className="bestiary-combat-stats">{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        {entry.resolveLabel === 'Показатель встречи' && !entry.vehicle && <p className="bestiary-note">В этой книге последняя графа подписана «Показатель встречи». Число сохранено из оригинала.</p>}
        {!entry.vehicle && <div className="bestiary-wound-tracker"><strong>Раны во встрече: {currentWounds} / {entry.stats[1]}</strong><label>Урон<input type="number" min="0" value={damage} onChange={event => setDamage(event.target.value)} /></label><button type="button" onClick={() => setCurrentWounds(value => Math.max(0, value - Math.max(0, Number(damage) || 0)))}>Нанести урон</button><button type="button" onClick={() => setCurrentWounds(Number(entry.stats[1]) || 0)}>Сбросить</button><small>Только эта открытая карточка. Урон вводится после вычета брони.</small></div>}
        {entry.skills && <section className="bestiary-rule"><h3>Умения</h3><p>{entry.skills}</p></section>}
        <section className="bestiary-rule"><h3>Атаки</h3><p className="bestiary-note">Урон оружия Боя уже включает бонус Силы. Выберите подходящий набор оружия для встречи.</p>{entry.attacks.map((attack, i) => <article className="bestiary-attack" key={`${attack.name}-${i}`}><h4>{attack.name}</h4><dl><div><dt>Проверка</dt><dd>{attack.test}</dd></div><div><dt>Урон</dt><dd>{attack.damage}</dd></div><div><dt>Дальность</dt><dd>{attack.range}</dd></div></dl>{attack.traits && <p>{attack.traits}</p>}{attack.text && <p>{attack.text}</p>}</article>)}</section>
        <section className="bestiary-rule"><h3>Особенности</h3>{entry.traits.map((trait, i) => <article key={`${trait.name}-${i}`}><h4>{trait.name}</h4><p>{trait.text}</p></article>)}</section>
      </div>
    </section>
  </div>, document.body);
}

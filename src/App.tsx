"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATALOG,
  CHARACTERISTICS,
  ORIGINS,
  ROLES,
  RULEBOOK,
  RULE_DATA_COUNTS,
  SERVICES,
  SKILL_ADVANCE_COSTS,
  SKILLS,
  TALENTS,
  characteristicAdvanceCost,
  type CatalogItem,
  type CatalogKind,
  type CharacteristicId,
  type Talent,
} from "./data/rules";

type TabId = "sheet" | "advance" | "inventory" | "reference";
type PurchaseKind = "talent" | "skill" | "specialization" | "characteristic";

type Purchase = {
  id: string;
  kind: PurchaseKind;
  targetId: string;
  label: string;
  cost: number;
};

type InventoryEntry = { itemId: string; quantity: number };
type CharacteristicState = Record<CharacteristicId, { starting: number; advances: number }>;

type AppState = {
  identity: {
    name: string;
    origin: string;
    service: string;
    role: string;
    patron: string;
    age: string;
    eyes: string;
    hair: string;
    height: string;
    weight: string;
    handedness: string;
    distinguishingFeatures: string;
  };
  characteristics: CharacteristicState;
  skillRanks: Record<string, number>;
  specializationRanks: Record<string, number>;
  talents: string[];
  inventory: InventoryEntry[];
  totalXp: number;
  purchases: Purchase[];
  fateCurrent: number;
  fateTotal: number;
  woundsCurrent: number;
  corruption: number;
  criticalWounds: string;
  influence: string;
  contacts: string;
  goals: string;
  connections: string;
  prophecy: string;
  notes: string;
  solars: number;
  otherCurrencies: string;
  psychicPowers: string;
  warpCharge: number;
  activeConditions: string[];
};

const STORAGE_KEY = "imperium-maledictum-dataslate-v2";

const tabs: { id: TabId; label: string; index: string }[] = [
  { id: "sheet", label: "Лист персонажа", index: "I" },
  { id: "advance", label: "Развитие", index: "II" },
  { id: "inventory", label: "Инвентарь", index: "III" },
  { id: "reference", label: "Ширма", index: "IV" },
];

const defaultCharacteristics = Object.fromEntries(
  CHARACTERISTICS.map((characteristic) => [characteristic.id, { starting: 30, advances: 0 }]),
) as CharacteristicState;

const defaultState: AppState = {
  identity: {
    name: "Новый агент",
    origin: ORIGINS[0],
    service: SERVICES[0],
    role: ROLES[0],
    patron: "",
    age: "",
    eyes: "",
    hair: "",
    height: "",
    weight: "",
    handedness: "Правая",
    distinguishingFeatures: "",
  },
  characteristics: defaultCharacteristics,
  skillRanks: {},
  specializationRanks: {},
  talents: [],
  inventory: [],
  totalXp: 500,
  purchases: [],
  fateCurrent: 3,
  fateTotal: 3,
  woundsCurrent: 0,
  corruption: 0,
  criticalWounds: "",
  influence: "",
  contacts: "",
  goals: "",
  connections: "",
  prophecy: "",
  notes: "",
  solars: 0,
  otherCurrencies: "",
  psychicPowers: "",
  warpCharge: 0,
  activeConditions: [],
};

const actionReference = [
  ["Прицеливание", "Действие", "Следующий выстрел: дальность +1 шаг и выбор зоны без штрафа.", 207],
  ["Атака", "Действие", "Ближняя, стрелковая атака или бросок гранаты.", 207],
  ["Натиск", "Действие", "Движение к врагу и атака в ближнем бою с преимуществом.", 207],
  ["Защита", "Действие", "Защитить союзника в непосредственной близости или удерживать зону.", 207],
  ["Выход из боя", "Действие", "Покинуть схватку без свободной атаки противника.", 207],
  ["Уклонение", "Действие", "Преимущество на следующую защитную проверку Боя или Уклонения.", 208],
  ["Паника", "Действие + движение", "Выйти из сражения ценой 1 превосходства.", 208],
  ["Захват", "Действие", "Встречная проверка; цель получает Обездвиживание (Малое).", 208],
  ["Помощь", "Действие", "Дать соратнику преимущество в следующей проверке.", 208],
  ["Засада", "Действие", "Проверка Скрытности; успешная атака из засады критическая.", 208],
  ["Импровизация", "Действие", "Описать ведущему действие, которого нет в перечне.", 209],
  ["Сотворение психосилы", "Действие", "Применить известную психосилу по правилам главы VI.", 209],
  ["Контроль", "Действие", "Назвать условие и подготовленное действие.", 209],
  ["Перезарядка", "Действие", "Восстановить возможность стрелять опустевшим оружием.", 209],
  ["Отступление", "Действие", "Подготовить согласованный отход всей группы.", 209],
  ["Бег", "Действие", "Переместиться в соседнюю зону; вместе с движением — на две зоны.", 209],
  ["Поиск", "Действие", "Проверка Бдительности или другого подходящего умения.", 209],
  ["Перехват инициативы", "Действие", "Не действовать сейчас и стать первым в следующем раунде.", 209],
  ["Толчок", "Действие", "Встречная проверка Атлетики, чтобы оттолкнуть цель.", 209],
  ["В укрытие!", "Действие", "Получить +2 / +4 / +6 брони от лёгкого / среднего / надёжного укрытия.", 210],
  ["Точечная атака", "Действие", "Атака с помехой в выбранную зону попадания.", 210],
  ["Использование предмета или элемента", "Действие", "Задействовать сложный предмет или элемент окружения.", 210],
] as const;

const conditionReference = [
  ["Горение", "Малое: 1к5 урона; серьёзное: 1к10 урона в начале хода. Броня не помогает."],
  ["Кровотечение", "Малое: 1 урон; серьёзное: 3 урона в конце хода. Броня не помогает."],
  ["Слепота", "Связанные со зрением проверки успешны только на 01–05; помеха Бою и Уклонению."],
  ["Глухота", "Связанные со слухом проверки успешны только на 01–05."],
  ["Усталость", "Малая: все проверки с помехой; серьёзная: сложность всех проверок −30."],
  ["Страх", "Малый и серьёзный уровни меняют проверки и поведение перед источником страха."],
  ["Беспомощность", "Нельзя двигаться и действовать; ближние атаки автоматически критические."],
  ["Перегрузка", "Помеха всем проверкам Ловкости; скорость падает на один шаг."],
  ["Отравление", "Малое мешает Силе и Выносливости; серьёзное сбивает с ног и делает беспомощным."],
  ["Сбит с ног", "Движение ползком; помеха Бою; атаки вблизи получают преимущество."],
  ["Обездвиживание", "Нельзя двигаться; серьёзный уровень делает персонажа беспомощным."],
  ["Оглушение", "Малое: действие или движение; серьёзное также даёт помеху всем проверкам."],
  ["Без сознания", "Персонаж роняет предметы, сбит с ног и становится беспомощным."],
] as const;

const kindLabels: Record<CatalogKind | "all", string> = {
  all: "Всё",
  melee: "Холодное оружие",
  ranged: "Стрелковое оружие",
  ammunition: "Боеприпасы",
  explosive: "Взрывчатка",
  "weapon-upgrade": "Улучшения",
  armor: "Броня",
  clothing: "Носимое",
  tool: "Инструменты",
  augmetic: "Аугметика",
};

function Seal({ children }: { children: React.ReactNode }) {
  return <span className="wax-seal" aria-hidden="true"><span>{children}</span></span>;
}

function SourceBadge({ page }: { page: number }) {
  return <span className="source-badge" title={`${RULEBOOK.title}, версия ${RULEBOOK.translationVersion}`}>Книга · стр. {page}</span>;
}

function Field({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="form-field"><span>{label}</span><input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextAreaField({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="form-field textarea-field"><span>{label}</span><textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function CatalogStats({ item }: { item: CatalogItem }) {
  return (
    <div className="catalog-stats">
      {Object.entries(item.stats).map(([key, value]) => <span key={key}><small>{key}</small><b>{value}</b></span>)}
      <span><small>Вес</small><b>{item.weight}</b></span><span><small>Цена</small><b>{item.price}</b></span>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("sheet");
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [talentQuery, setTalentQuery] = useState("");
  const [specializationQuery, setSpecializationQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogKind, setCatalogKind] = useState<CatalogKind | "all">("all");
  const [creationMode, setCreationMode] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AppState>;
        setState((current) => ({
          ...current, ...parsed,
          identity: { ...current.identity, ...parsed.identity },
          characteristics: { ...current.characteristics, ...parsed.characteristics },
          skillRanks: parsed.skillRanks ?? current.skillRanks,
          specializationRanks: parsed.specializationRanks ?? current.specializationRanks,
          talents: parsed.talents ?? current.talents,
          inventory: parsed.inventory ?? current.inventory,
          purchases: parsed.purchases ?? current.purchases,
          activeConditions: parsed.activeConditions ?? current.activeConditions,
        }));
      }
    } catch {
      // Повреждённое локальное сохранение не должно блокировать запуск приложения.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const characteristicValues = useMemo(() => Object.fromEntries(
    CHARACTERISTICS.map((characteristic) => {
      const row = state.characteristics[characteristic.id];
      return [characteristic.id, Math.max(1, row.starting + row.advances)];
    }),
  ) as Record<CharacteristicId, number>, [state.characteristics]);

  const bonus = (id: CharacteristicId) => Math.floor(characteristicValues[id] / 10);
  const maxWounds = bonus("strength") + bonus("willpower") + (2 * bonus("toughness"));
  const maxCriticalWounds = bonus("toughness");
  const initiative = bonus("perception") + bonus("agility");
  const hasTalent = (id: string) => state.talents.includes(id);
  const backpackBonus = state.inventory.some((entry) => entry.itemId === "backpack") ? 4 : 0;
  const carryCapacity = (hasTalent("porter") ? (2 * bonus("strength")) + bonus("toughness") : bonus("strength") + bonus("toughness")) + backpackBonus;
  const immobilizedWeightThreshold = 2 * (bonus("strength") + bonus("toughness"));
  const warpThreshold = bonus("willpower") * (hasTalent("sanctioned-psyker") ? 2 : 1);
  const spentXp = state.purchases.reduce((sum, purchase) => sum + purchase.cost, 0);
  const availableXp = state.totalXp - spentXp;

  const inventoryWithItems = useMemo(() => state.inventory.map((entry) => ({ ...entry, item: CATALOG.find((item) => item.id === entry.itemId) }))
    .filter((entry): entry is InventoryEntry & { item: CatalogItem } => Boolean(entry.item)), [state.inventory]);
  const carriedWeight = inventoryWithItems.reduce((sum, entry) => sum + (entry.item.weightValue * entry.quantity), 0);
  const ownedTalents = state.talents.map((id) => TALENTS.find((talent) => talent.id === id)).filter((talent): talent is Talent => Boolean(talent));

  const filteredTalents = useMemo(() => {
    const query = talentQuery.trim().toLocaleLowerCase("ru");
    return TALENTS.filter((talent) => !query || `${talent.name} ${talent.requirements} ${talent.choice ?? ""}`.toLocaleLowerCase("ru").includes(query));
  }, [talentQuery]);

  const allSpecializations = useMemo(() => SKILLS.flatMap((skill) => skill.specializations.map((specialization) => ({ ...specialization, key: `${skill.id}:${specialization.id}`, skill }))), []);
  const filteredSpecializations = useMemo(() => {
    const query = specializationQuery.trim().toLocaleLowerCase("ru");
    return allSpecializations.filter((entry) => !query || `${entry.skill.name} ${entry.name} ${entry.requirements ?? ""}`.toLocaleLowerCase("ru").includes(query));
  }, [allSpecializations, specializationQuery]);

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLocaleLowerCase("ru");
    return CATALOG.filter((item) => {
      const matchesKind = catalogKind === "all" || item.kind === catalogKind;
      const haystack = `${item.name} ${item.category} ${item.traits ?? ""} ${Object.values(item.stats).join(" ")}`.toLocaleLowerCase("ru");
      return matchesKind && (!query || haystack.includes(query));
    });
  }, [catalogKind, catalogQuery]);

  const setIdentity = (key: keyof AppState["identity"], value: string) => setState((current) => ({ ...current, identity: { ...current.identity, [key]: value } }));
  const setTextState = (key: keyof AppState, value: string | number) => setState((current) => ({ ...current, [key]: value }));

  const buySkill = (skillId: string) => {
    const skill = SKILLS.find((entry) => entry.id === skillId);
    if (!skill) return;
    const rank = state.skillRanks[skillId] ?? 0;
    const cost = SKILL_ADVANCE_COSTS[rank];
    if (cost === undefined || availableXp < cost) return;
    setState((current) => ({
      ...current,
      skillRanks: { ...current.skillRanks, [skillId]: rank + 1 },
      purchases: [...current.purchases, { id: `${Date.now()}-${skillId}`, kind: "skill", targetId: skillId, label: `${skill.name}: улучшение ${rank + 1}`, cost }],
    }));
  };

  const buySpecialization = (key: string) => {
    const entry = allSpecializations.find((specialization) => specialization.key === key);
    if (!entry) return;
    const rank = state.specializationRanks[key] ?? 0;
    const cost = SKILL_ADVANCE_COSTS[rank];
    if (cost === undefined || availableXp < cost) return;
    setState((current) => ({
      ...current,
      specializationRanks: { ...current.specializationRanks, [key]: rank + 1 },
      purchases: [...current.purchases, { id: `${Date.now()}-${key}`, kind: "specialization", targetId: key, label: `${entry.skill.name} (${entry.name}): улучшение ${rank + 1}`, cost }],
    }));
  };

  const buyCharacteristic = (id: CharacteristicId) => {
    const characteristic = CHARACTERISTICS.find((entry) => entry.id === id);
    const newValue = characteristicValues[id] + 1;
    const cost = characteristicAdvanceCost(newValue);
    if (!characteristic || cost === null || availableXp < cost) return;
    setState((current) => ({
      ...current,
      characteristics: { ...current.characteristics, [id]: { ...current.characteristics[id], advances: current.characteristics[id].advances + 1 } },
      purchases: [...current.purchases, { id: `${Date.now()}-${id}`, kind: "characteristic", targetId: id, label: `${characteristic.name}: ${newValue}`, cost }],
    }));
  };

  const talentBlocker = (talentEntry: Talent): string | null => {
    if (!creationMode && talentEntry.creationOnly) return "Только при создании";
    if (!talentEntry.repeatable && hasTalent(talentEntry.id)) return "Уже приобретён";
    if (talentEntry.id === "psyker" && hasTalent("blank")) return "Несовместим с «Пустым»";
    if (talentEntry.id === "blank" && hasTalent("psyker")) return "Несовместим с «Псайкером»";
    if (!creationMode) {
      if (["psychic-flow", "psychic-curse", "sanctioned-psyker", "death-to-the-witch"].includes(talentEntry.id) && !hasTalent("psyker")) return "Нужен «Псайкер»";
      if (["akimbo", "paired-blades"].includes(talentEntry.id) && !hasTalent("ambidexterity")) return "Нужна «Амбидекстрия»";
      if (availableXp < talentEntry.xpCost) return "Недостаточно ОО";
    }
    return null;
  };

  const buyTalent = (talentEntry: Talent) => {
    if (talentBlocker(talentEntry)) return;
    const cost = creationMode ? 0 : talentEntry.xpCost;
    setState((current) => ({
      ...current,
      talents: [...current.talents, talentEntry.id],
      purchases: cost === 0 ? current.purchases : [...current.purchases, { id: `${Date.now()}-${talentEntry.id}`, kind: "talent", targetId: talentEntry.id, label: `Талант: ${talentEntry.name}`, cost }],
    }));
  };

  const removeTalent = (talentId: string) => setState((current) => {
    const talents = [...current.talents];
    const talentIndex = talents.lastIndexOf(talentId);
    if (talentIndex >= 0) talents.splice(talentIndex, 1);
    const purchases = [...current.purchases];
    let purchaseIndex = -1;
    for (let index = purchases.length - 1; index >= 0; index -= 1) {
      if (purchases[index].kind === "talent" && purchases[index].targetId === talentId) {
        purchaseIndex = index;
        break;
      }
    }
    if (purchaseIndex >= 0) purchases.splice(purchaseIndex, 1);
    return { ...current, talents, purchases };
  });

  const undoLastPurchase = () => setState((current) => {
    const purchase = current.purchases.at(-1);
    if (!purchase) return current;
    const next = { ...current, purchases: current.purchases.slice(0, -1) };
    if (purchase.kind === "talent") {
      const talents = [...current.talents];
      const index = talents.lastIndexOf(purchase.targetId);
      if (index >= 0) talents.splice(index, 1);
      next.talents = talents;
    } else if (purchase.kind === "skill") {
      next.skillRanks = { ...current.skillRanks, [purchase.targetId]: Math.max(0, (current.skillRanks[purchase.targetId] ?? 1) - 1) };
    } else if (purchase.kind === "specialization") {
      next.specializationRanks = { ...current.specializationRanks, [purchase.targetId]: Math.max(0, (current.specializationRanks[purchase.targetId] ?? 1) - 1) };
    } else {
      const id = purchase.targetId as CharacteristicId;
      next.characteristics = { ...current.characteristics, [id]: { ...current.characteristics[id], advances: Math.max(0, current.characteristics[id].advances - 1) } };
    }
    return next;
  });

  const addInventoryItem = (itemId: string) => setState((current) => {
    const existing = current.inventory.find((entry) => entry.itemId === itemId);
    return { ...current, inventory: existing ? current.inventory.map((entry) => entry.itemId === itemId ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current.inventory, { itemId, quantity: 1 }] };
  });

  const changeInventoryQuantity = (itemId: string, delta: number) => setState((current) => ({
    ...current,
    inventory: current.inventory.map((entry) => entry.itemId === itemId ? { ...entry, quantity: entry.quantity + delta } : entry).filter((entry) => entry.quantity > 0),
  }));

  const toggleCondition = (condition: string) => setState((current) => ({
    ...current,
    activeConditions: current.activeConditions.includes(condition) ? current.activeConditions.filter((entry) => entry !== condition) : [...current.activeConditions, condition],
  }));

  return (
    <main className="site-stage">
      <div className="ambient-grain" />
      <section className="dataslate" aria-label="Интерактивный лист персонажа Imperium Maledictum">
        <aside className="ornate-rail" aria-hidden="true">
          <div className="rail-art" /><div className="rail-plaque"><span>ORDO DATA</span><strong>ДОСЬЕ АГЕНТА</strong></div><span className="rail-lamp top" /><span className="rail-lamp bottom" />
        </aside>

        <div className="slate-shell">
          <header className="masthead">
            <div className="authority-mark"><span className="skull">☠</span><span className="wings left" /><span className="wings right" /></div>
            <div className="masthead-copy"><p className="eyebrow">Автономный реестр · перевод 1.01 · локальное сохранение</p><h1>Имперский датаслейт</h1><p className="document-id">Единая база персонажа, развития и арсенала · источник каждой записи указан</p></div>
            <div className="status-stamp"><small>База правил</small><strong>СВЕРЕНА</strong><span>{RULE_DATA_COUNTS.talents} талантов · {RULE_DATA_COUNTS.skills} умений</span></div>
          </header>

          <nav className="chapter-tabs" aria-label="Разделы датаслейта">
            {tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined}><span>{tab.index}</span>{tab.label}</button>)}
          </nav>

          <div className="content-frame">
            <span className="corner-ornament tl" aria-hidden="true" /><span className="corner-ornament tr" aria-hidden="true" /><span className="corner-ornament bl" aria-hidden="true" /><span className="corner-ornament br" aria-hidden="true" />

            {activeTab === "sheet" && (
              <div className="chapter-page sheet-page">
                <header className="chapter-heading"><div><p>I · Лист персонажа</p><h2>{state.identity.name || "Новый агент"}</h2></div><p>Поля повторяют официальный двухстраничный бланк на стр. 363–364. Производные значения считаются автоматически.</p></header>

                <article className="identity-card ruled-panel editable-identity">
                  <div className="portrait-frame"><div className="portrait-monogram">{(state.identity.name || "НА").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><span className="portrait-index">FORM 363</span></div>
                  <div className="identity-form">
                    <Field label="Имя" value={state.identity.name} onChange={(value) => setIdentity("name", value)} />
                    <label className="form-field"><span>Происхождение</span><select value={state.identity.origin} onChange={(event) => setIdentity("origin", event.target.value)}>{ORIGINS.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
                    <label className="form-field"><span>Служба</span><select value={state.identity.service} onChange={(event) => setIdentity("service", event.target.value)}>{SERVICES.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
                    <label className="form-field"><span>Роль</span><select value={state.identity.role} onChange={(event) => setIdentity("role", event.target.value)}>{ROLES.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
                    <Field label="Покровитель" value={state.identity.patron} onChange={(value) => setIdentity("patron", value)} placeholder="Имя или титул" />
                  </div><Seal>IM</Seal>
                </article>

                <div className="sheet-spread">
                  <section className="sheet-main-column">
                    <article className="ruled-panel">
                      <div className="panel-heading"><div><span>Начальное · улучшения · текущее</span><h3>Характеристики</h3></div><SourceBadge page={50} /></div>
                      <div className="characteristic-edit-grid">
                        {CHARACTERISTICS.map((characteristic) => {
                          const row = state.characteristics[characteristic.id];
                          return <div className="characteristic-editor" key={characteristic.id}><span>{characteristic.short}</span><strong>{characteristicValues[characteristic.id]}</strong><small>{characteristic.name}</small><label>Нач. <input type="number" min={1} max={100} value={row.starting} onChange={(event) => setState((current) => ({ ...current, characteristics: { ...current.characteristics, [characteristic.id]: { ...row, starting: Number(event.target.value) || 0 } } }))} /></label><em>+{row.advances}</em></div>;
                        })}
                      </div>
                    </article>

                    <article className="ruled-panel skills-register">
                      <div className="panel-heading"><div><span>Полный перечень</span><h3>Умения и специализации</h3></div><SourceBadge page={93} /></div>
                      <div className="registry-head"><span>Умение</span><span>Хар.</span><span>Ул.</span><span>Итог</span></div>
                      {SKILLS.map((skill) => {
                        const rank = state.skillRanks[skill.id] ?? 0;
                        const specializations = skill.specializations.filter((entry) => (state.specializationRanks[`${skill.id}:${entry.id}`] ?? 0) > 0);
                        const characteristic = CHARACTERISTICS.find((entry) => entry.id === skill.characteristic)!;
                        return <div className="registry-row" key={skill.id}><div><strong>{skill.name}{skill.special ? " · особое" : ""}</strong>{specializations.length > 0 && <small>{specializations.map((entry) => { const specializationRank = state.specializationRanks[`${skill.id}:${entry.id}`] ?? 0; return `${entry.name}: ${characteristicValues[skill.characteristic] + (rank * 5) + (specializationRank * 5)}`; }).join(" · ")}</small>}</div><span>{characteristic.short}</span><span>{rank} / 4</span><b>{characteristicValues[skill.characteristic] + (rank * 5)}</b></div>;
                      })}
                    </article>
                  </section>

                  <aside className="sheet-side-column">
                    <article className="dark-panel derived-panel">
                      <div className="panel-heading inverted"><div><span>По формулам книги</span><h3>Производные</h3></div><SourceBadge page={88} /></div>
                      <div className="derived-grid"><span><small>Макс. раны</small><b>{maxWounds}</b></span><span><small>Крит. раны</small><b>{maxCriticalWounds}</b></span><span><small>Инициатива</small><b>{initiative}</b></span><span><small>Предел веса</small><b>{carryCapacity}</b></span><span><small>Варп-порог</small><b>{hasTalent("psyker") ? warpThreshold : "—"}</b></span><span><small>Вес сейчас</small><b className={carriedWeight > carryCapacity ? "danger-text" : ""}>{carriedWeight}</b></span></div>
                    </article>

                    <article className="ruled-panel compact-form-panel">
                      <div className="panel-heading compact"><div><span>Текущее состояние</span><h3>Раны, судьба и порча</h3></div></div>
                      <div className="number-fields"><label><span>Раны</span><input type="number" min={0} value={state.woundsCurrent} onChange={(event) => setTextState("woundsCurrent", Number(event.target.value) || 0)} /><small>/ {maxWounds}</small></label><label><span>Судьба</span><input type="number" min={0} value={state.fateCurrent} onChange={(event) => setTextState("fateCurrent", Number(event.target.value) || 0)} /><small>/</small><input type="number" min={0} value={state.fateTotal} onChange={(event) => setTextState("fateTotal", Number(event.target.value) || 0)} /></label><label><span>Порча</span><input type="number" min={0} value={state.corruption} onChange={(event) => setTextState("corruption", Number(event.target.value) || 0)} /></label><label><span>Варп-заряд</span><input type="number" min={0} value={state.warpCharge} onChange={(event) => setTextState("warpCharge", Number(event.target.value) || 0)} /></label></div>
                      <TextAreaField label="Критические раны" value={state.criticalWounds} onChange={(value) => setTextState("criticalWounds", value)} />
                    </article>

                    <article className="ruled-panel appearance-panel">
                      <div className="panel-heading compact"><div><span>Подробности</span><h3>Описание персонажа</h3></div></div>
                      <div className="mini-field-grid"><Field label="Возраст" value={state.identity.age} onChange={(value) => setIdentity("age", value)} /><Field label="Глаза" value={state.identity.eyes} onChange={(value) => setIdentity("eyes", value)} /><Field label="Волосы" value={state.identity.hair} onChange={(value) => setIdentity("hair", value)} /><Field label="Рост" value={state.identity.height} onChange={(value) => setIdentity("height", value)} /><Field label="Вес" value={state.identity.weight} onChange={(value) => setIdentity("weight", value)} /><label className="form-field"><span>Ведущая рука</span><select value={state.identity.handedness} onChange={(event) => setIdentity("handedness", event.target.value)}><option>Правая</option><option>Левая</option></select></label></div>
                      <TextAreaField label="Отличительные черты" value={state.identity.distinguishingFeatures} onChange={(value) => setIdentity("distinguishingFeatures", value)} />
                    </article>
                  </aside>
                </div>

                <div className="sheet-bottom-grid">
                  <article className="ruled-panel owned-list"><div className="panel-heading"><div><span>{ownedTalents.length} записей</span><h3>Таланты</h3></div><button className="text-button" type="button" onClick={() => setActiveTab("advance")}>Добавить в развитии</button></div>{ownedTalents.length === 0 ? <p className="empty-note">Таланты пока не выбраны.</p> : ownedTalents.map((talentEntry, index) => <div className="owned-row" key={`${talentEntry.id}-${index}`}><span>✦</span><div><strong>{talentEntry.name}</strong><small>{talentEntry.requirements} · стр. {talentEntry.page}</small></div><button type="button" onClick={() => removeTalent(talentEntry.id)} aria-label={`Убрать ${talentEntry.name}`}>×</button></div>)}</article>
                  <article className="ruled-panel owned-list"><div className="panel-heading"><div><span>{inventoryWithItems.length} наименований · вес {carriedWeight}</span><h3>Оружие и снаряжение</h3></div><button className="text-button" type="button" onClick={() => setActiveTab("inventory")}>Открыть каталог</button></div>{inventoryWithItems.length === 0 ? <p className="empty-note">Инвентарь пока пуст.</p> : inventoryWithItems.slice(0, 10).map((entry) => <div className="owned-row" key={entry.itemId}><span>{entry.quantity}×</span><div><strong>{entry.item.name}</strong><small>{kindLabels[entry.item.kind]} · вес {entry.item.weight} · стр. {entry.item.page}</small></div></div>)}</article>
                  <article className="ruled-panel notes-panel"><div className="panel-heading compact"><div><span>Официальные поля</span><h3>Связи и записи</h3></div></div><TextAreaField label="Цели" value={state.goals} onChange={(value) => setTextState("goals", value)} /><TextAreaField label="Связи" value={state.connections} onChange={(value) => setTextState("connections", value)} /><TextAreaField label="Влияние на службы" value={state.influence} onChange={(value) => setTextState("influence", value)} /><TextAreaField label="Контакты" value={state.contacts} onChange={(value) => setTextState("contacts", value)} /><TextAreaField label="Пророчество" value={state.prophecy} onChange={(value) => setTextState("prophecy", value)} /><TextAreaField label="Психосилы" value={state.psychicPowers} onChange={(value) => setTextState("psychicPowers", value)} /><TextAreaField label="Заметки" value={state.notes} onChange={(value) => setTextState("notes", value)} /><div className="currency-row"><label><span>Соляры</span><input type="number" min={0} value={state.solars} onChange={(event) => setTextState("solars", Number(event.target.value) || 0)} /></label><Field label="Прочие валюты" value={state.otherCurrencies} onChange={(value) => setTextState("otherCurrencies", value)} /></div></article>
                </div>
              </div>
            )}

            {activeTab === "advance" && (
              <div className="chapter-page advance-page rules-database-page">
                <header className="chapter-heading"><div><p>II · Развитие персонажа</p><h2>Опыт и приобретения</h2></div><p>Стоимость берётся из таблиц на стр. 90. Покупки сразу меняют лист персонажа и сохраняются в журнале.</p></header>
                <section className="xp-ledger dark-panel"><label><small>Получено опыта</small><input type="number" min={0} value={state.totalXp} onChange={(event) => setTextState("totalXp", Number(event.target.value) || 0)} /></label><span className="ledger-divider">−</span><div><small>Потрачено</small><strong>{spentXp}</strong></div><span className="ledger-divider">=</span><div className="available-xp"><small>Доступно</small><strong className={availableXp < 0 ? "danger-text" : ""}>{availableXp}</strong></div><SourceBadge page={90} /></section>

                <div className="mode-strip"><div><strong>Режим создания персонажа</strong><small>Стартовые таланты службы и роли добавляются без траты опыта и могут игнорировать обычные требования.</small></div><button type="button" className={creationMode ? "on" : ""} aria-pressed={creationMode} onClick={() => setCreationMode((value) => !value)}><i />{creationMode ? "Включён" : "Выключен"}</button></div>

                <div className="advance-catalog-grid">
                  <article className="ruled-panel advancement-list"><div className="panel-heading"><div><span>+1 к показателю</span><h3>Характеристики</h3></div></div>{CHARACTERISTICS.map((characteristic) => { const nextValue = characteristicValues[characteristic.id] + 1; const cost = characteristicAdvanceCost(nextValue); return <div className="purchase-row" key={characteristic.id}><div><strong>{characteristic.name}</strong><small>{characteristicValues[characteristic.id]} → {nextValue}</small></div><span>{cost === null ? "Предел" : `${cost} ОО`}</span><button type="button" disabled={cost === null || availableXp < cost} onClick={() => buyCharacteristic(characteristic.id)}>Купить</button></div>; })}</article>
                  <article className="ruled-panel advancement-list"><div className="panel-heading"><div><span>+5 за ступень</span><h3>Умения</h3></div><SourceBadge page={90} /></div>{SKILLS.map((skill) => { const rank = state.skillRanks[skill.id] ?? 0; const cost = SKILL_ADVANCE_COSTS[rank]; return <div className="purchase-row" key={skill.id}><div><strong>{skill.name}</strong><small>{rank}/4 · итог {characteristicValues[skill.characteristic] + rank * 5}</small></div><span>{cost === undefined ? "Макс." : `${cost} ОО`}</span><button type="button" disabled={cost === undefined || availableXp < cost} onClick={() => buySkill(skill.id)}>Купить</button></div>; })}</article>
                </div>

                <article className="ruled-panel directory-panel">
                  <div className="directory-heading"><div><span>Полный справочник</span><h3>Специализации · {RULE_DATA_COUNTS.specializations}</h3></div><input type="search" value={specializationQuery} onChange={(event) => setSpecializationQuery(event.target.value)} placeholder="Поиск по умению или специализации…" /></div>
                  <div className="directory-list specialization-directory">{filteredSpecializations.map((entry) => { const rank = state.specializationRanks[entry.key] ?? 0; const cost = SKILL_ADVANCE_COSTS[rank]; return <div className="directory-row" key={entry.key}><div><span>{entry.skill.name}</span><strong>{entry.name}</strong><small>{entry.requirements ?? "Официальная специализация без особых требований."}</small></div><SourceBadge page={entry.skill.page} /><b>{rank}/4</b><button type="button" disabled={cost === undefined || availableXp < cost} onClick={() => buySpecialization(entry.key)}>{cost === undefined ? "Максимум" : `${cost} ОО`}</button></div>; })}</div>
                </article>

                <article className="ruled-panel directory-panel">
                  <div className="directory-heading"><div><span>Все записи указателя</span><h3>Таланты · {RULE_DATA_COUNTS.talents}</h3></div><input type="search" value={talentQuery} onChange={(event) => setTalentQuery(event.target.value)} placeholder="Название, требование или вариант…" /></div>
                  <p className="directory-disclaimer">Текст требований перенесён в базу; источник указан на каждой карточке. Проверки сюжетных и составных требований остаются за ведущим.</p>
                  <div className="directory-list talent-directory">{filteredTalents.map((talentEntry) => { const blocker = talentBlocker(talentEntry); const count = state.talents.filter((id) => id === talentEntry.id).length; return <div className="directory-row talent-catalog-row" key={talentEntry.id}><div><span>{talentEntry.choice ? `Выбор: ${talentEntry.choice}` : "Талант"}</span><strong>{talentEntry.name}{count > 0 ? ` ×${count}` : ""}</strong><small>{talentEntry.requirements}</small></div><SourceBadge page={talentEntry.page} /><b>{creationMode ? "0 ОО" : "100 ОО"}</b><button type="button" disabled={Boolean(blocker)} title={blocker ?? "Требования следует сверить с текущим персонажем"} onClick={() => buyTalent(talentEntry)}>{blocker ?? (creationMode ? "Добавить" : "Купить")}</button></div>; })}</div>
                </article>

                <article className="experience-log"><div className="log-title"><span>ЖУРНАЛ РАЗВИТИЯ</span><b>{state.purchases.length} записей</b><button type="button" disabled={state.purchases.length === 0} onClick={undoLastPurchase}>Отменить последнюю</button></div>{state.purchases.length === 0 ? <p className="empty-note">Покупок за опыт пока нет.</p> : [...state.purchases].reverse().slice(0, 12).map((purchase) => <div key={purchase.id}><time>{purchase.kind}</time><p>{purchase.label}</p><strong>−{purchase.cost} ОО</strong></div>)}</article>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="chapter-page inventory-page rules-database-page">
                <header className="chapter-heading"><div><p>III · Арсенал</p><h2>Каталог и инвентарь</h2></div><p>{RULE_DATA_COUNTS.catalogItems} позиций из таблиц главы V: оружие, боеприпасы, взрывчатка, броня, носимое снаряжение, инструменты и аугметика.</p></header>
                <section className="inventory-summary dark-panel"><div><small>Позиций в инвентаре</small><strong>{state.inventory.reduce((sum, entry) => sum + entry.quantity, 0)}</strong></div><div><small>Текущий вес</small><strong className={carriedWeight > carryCapacity ? "danger-text" : ""}>{carriedWeight}</strong></div><div><small>Предел веса</small><strong>{carryCapacity}</strong></div><div><small>Состояние</small><strong>{carriedWeight > immobilizedWeightThreshold ? "Обездвижен" : carriedWeight > carryCapacity ? "Перегрузка" : "Норма"}</strong></div></section>

                <article className="ruled-panel manifest-panel"><div className="panel-heading"><div><span>Синхронизирован с листом</span><h3>Имущество персонажа</h3></div><SourceBadge page={122} /></div>{inventoryWithItems.length === 0 ? <p className="empty-note">Найдите предмет в каталоге и нажмите «Добавить».</p> : inventoryWithItems.map((entry) => <div className="manifest-row interactive" key={entry.itemId}><div><strong>{entry.item.name}</strong><small>{entry.item.category} · вес {entry.item.weight} · стр. {entry.item.page}</small></div><span>{entry.quantity} шт.</span><button type="button" onClick={() => changeInventoryQuantity(entry.itemId, -1)}>−</button><button type="button" onClick={() => changeInventoryQuantity(entry.itemId, 1)}>+</button></div>)}</article>

                <div className="catalog-toolbar"><input type="search" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Поиск по названию, свойству или специализации…" /><div className="filter-chips">{(Object.keys(kindLabels) as Array<CatalogKind | "all">).map((kind) => <button type="button" key={kind} className={catalogKind === kind ? "active" : ""} onClick={() => setCatalogKind(kind)}>{kindLabels[kind]}</button>)}</div></div>
                <div className="item-catalog-grid">{filteredCatalog.map((item) => <article className="catalog-card" key={item.id}><div className="catalog-card-top"><div><span>{item.category}</span><h3>{item.name}</h3></div><SourceBadge page={item.page} /></div><CatalogStats item={item} /><p>{item.traits || "Особые свойства в таблице не указаны."}</p><footer><span>{item.availability}</span><button type="button" onClick={() => addInventoryItem(item.id)}>Добавить</button></footer></article>)}</div>
              </div>
            )}

            {activeTab === "reference" && (
              <div className="chapter-page reference-page rules-database-page">
                <header className="chapter-heading"><div><p>IV · Контекстная ширма</p><h2>Действия и состояния</h2></div><p>Кликайте состояния персонажа: активные эффекты поднимаются наверх. Полные правила находятся на указанных страницах.</p></header>
                <article className="ruled-panel condition-reference"><div className="panel-heading"><div><span>Приложение IV</span><h3>Состояния персонажа</h3></div><SourceBadge page={356} /></div><div className="condition-reference-grid">{[...conditionReference].sort((a, b) => Number(state.activeConditions.includes(b[0])) - Number(state.activeConditions.includes(a[0]))).map(([name, effect]) => { const active = state.activeConditions.includes(name); return <button type="button" key={name} className={active ? "condition-card active" : "condition-card"} aria-pressed={active} onClick={() => toggleCondition(name)}><span>{active ? "АКТИВНО" : "СОСТОЯНИЕ"}</span><strong>{name}</strong><small>{effect}</small></button>; })}</div></article>
                <article className="ruled-panel actions-reference"><div className="panel-heading"><div><span>Глава VII</span><h3>Действия в бою</h3></div><SourceBadge page={207} /></div><div className="action-reference-grid">{actionReference.map(([name, kind, detail, page], index) => <article className="reference-action-card" key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{kind}</small><h3>{name}</h3><p>{detail}</p></div><SourceBadge page={page} /></article>)}</div></article>
                <aside className="rules-inset"><Seal>!</Seal><div><strong>Порядок хода</strong><p>В свой ход персонаж получает движение и одно действие; до начала следующего хода обычно доступна одна реакция. Свободные действия зависят от ситуации, талантов и снаряжения.</p></div></aside>
              </div>
            )}
          </div>

          <footer className="dataslate-footer"><span>IMPERIUM MALEDICTUM · ПЕРЕВОД 1.01</span><p>{hydrated ? "Данные сохранены на этом устройстве." : "Загрузка локальной записи…"}</p><span>СТР. {tabs.findIndex((tab) => tab.id === activeTab) + 1} / 4</span></footer>
        </div>
      </section>
    </main>
  );
}

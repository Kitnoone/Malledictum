"use client";

import { useMemo, useState } from "react";

type TabId = "dossier" | "combat" | "arsenal" | "advance";

const characteristics = [
  ["Бой", "ББ", 46],
  ["Стрельба", "ДБ", 52],
  ["Сила", "СИЛ", 39],
  ["Выносливость", "ВЫН", 43],
  ["Ловкость", "ЛОВ", 41],
  ["Интеллект", "ИНТ", 36],
  ["Восприятие", "ВОС", 48],
  ["Сила воли", "СВ", 44],
  ["Товарищество", "ТОВ", 31],
] as const;

const skills = [
  { name: "Бдительность", base: "ВОС", advances: 2, value: 58 },
  { name: "Рефлексы", base: "ЛОВ", advances: 1, value: 46 },
  { name: "Стойкость", base: "ВЫН", advances: 2, value: 53 },
  { name: "Ориентирование", base: "ИНТ", advances: 1, value: 41 },
  { name: "Взаимопонимание", base: "ТОВ", advances: 0, value: 31 },
  { name: "Техника", base: "ИНТ", advances: 2, value: 46 },
];

const talents = [
  ["Непоколебимый", "Один раз за сцену игнорируйте помеху от Страха."],
  ["Меткий стрелок", "Прицеливание сохраняется после осторожного движения."],
  ["Полевая медицина", "Медика можно применять без полноценного набора."],
] as const;

const tabs: { id: TabId; label: string; index: string }[] = [
  { id: "dossier", label: "Досье агента", index: "I" },
  { id: "combat", label: "Боевой устав", index: "II" },
  { id: "arsenal", label: "Арсенал", index: "III" },
  { id: "advance", label: "Развитие", index: "IV" },
];

function PipRow({ value, max = 4 }: { value: number; max?: number }) {
  return (
    <span className="pip-row" aria-label={`${value} из ${max} улучшений`}>
      {Array.from({ length: max }, (_, index) => (
        <i key={index} className={index < value ? "filled" : ""} />
      ))}
    </span>
  );
}

function Seal({ children }: { children: React.ReactNode }) {
  return (
    <span className="wax-seal" aria-hidden="true">
      <span>{children}</span>
    </span>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dossier");
  const [conditions, setConditions] = useState({
    engaged: true,
    cover: false,
    darkness: false,
    restrained: false,
  });
  const [ammo, setAmmo] = useState(17);
  const [spentXp, setSpentXp] = useState(650);
  const totalXp = 1000;
  const availableXp = totalXp - spentXp;

  const actions = useMemo(
    () => [
      {
        name: "Атака",
        kind: "Действие",
        detail: ammo > 0 ? "Стрельба 52 · урон 6 + КУ" : "Магазин пуст",
        available: ammo > 0 && !conditions.restrained,
      },
      {
        name: "Выход из боя",
        kind: "Действие",
        detail: "Покинуть схватку без свободной атаки",
        available: conditions.engaged && !conditions.restrained,
      },
      {
        name: "Уклонение",
        kind: "Действие",
        detail: "Преимущество на следующую защиту",
        available: !conditions.restrained,
      },
      {
        name: "В укрытие!",
        kind: "Действие",
        detail: conditions.cover ? "Вы уже используете укрытие" : "+2 / +4 / +6 брони",
        available: !conditions.cover && !conditions.restrained,
      },
      {
        name: "Перезарядка",
        kind: "Действие",
        detail: `${ammo}/30 патронов в магазине`,
        available: ammo < 30 && !conditions.restrained,
      },
      {
        name: "Натиск",
        kind: "Движение + действие",
        detail: "Преимущество в ближнем бою",
        available: !conditions.engaged && !conditions.restrained,
      },
    ],
    [ammo, conditions],
  );

  const toggleCondition = (key: keyof typeof conditions) => {
    setConditions((current) => ({ ...current, [key]: !current[key] }));
  };

  const buyAdvance = (cost: number) => {
    if (availableXp >= cost) setSpentXp((value) => value + cost);
  };

  return (
    <main className="site-stage">
      <div className="ambient-grain" />
      <section className="dataslate" aria-label="Интерактивный лист персонажа Imperium Maledictum">
        <aside className="ornate-rail" aria-hidden="true">
          <div className="rail-art" />
          <div className="rail-plaque">
            <span>ORDO DATA</span>
            <strong>ДОСЬЕ АГЕНТА</strong>
          </div>
          <span className="rail-lamp top" />
          <span className="rail-lamp bottom" />
        </aside>

        <div className="slate-shell">
          <header className="masthead">
            <div className="authority-mark">
              <span className="skull">☠</span>
              <span className="wings left" />
              <span className="wings right" />
            </div>
            <div className="masthead-copy">
              <p className="eyebrow">Сегментум Обскурус · сектор Махарий · уровень допуска IV</p>
              <h1>Имперский датаслейт</h1>
              <p className="document-id">Идентификатор записи: IM–17–A/443 · печать покровителя подтверждена</p>
            </div>
            <div className="status-stamp">
              <small>Статус</small>
              <strong>ДЕЙСТВУЮЩИЙ</strong>
              <span>Проверено 240.М41</span>
            </div>
          </header>

          <nav className="chapter-tabs" aria-label="Разделы датаслейта">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <span>{tab.index}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="content-frame">
            <span className="corner-ornament tl" aria-hidden="true" />
            <span className="corner-ornament tr" aria-hidden="true" />
            <span className="corner-ornament bl" aria-hidden="true" />
            <span className="corner-ornament br" aria-hidden="true" />

            {activeTab === "dossier" && (
              <div className="page-grid dossier-page">
                <section className="primary-column">
                  <article className="identity-card ruled-panel">
                    <div className="portrait-frame">
                      <div className="portrait-monogram">ГБ</div>
                      <span className="portrait-index">AGT 017</span>
                    </div>
                    <div className="identity-copy">
                      <p className="section-kicker">Доверенное лицо покровителя</p>
                      <h2>Грил Барбас</h2>
                      <div className="identity-lines">
                        <p><b>Происхождение:</b> мир-фабрика Джеспус Прайм</p>
                        <p><b>Служба:</b> Адептус Администратум</p>
                        <p><b>Роль:</b> силовик · курьер особых грузов</p>
                      </div>
                    </div>
                    <Seal>IM</Seal>
                  </article>

                  <article className="ruled-panel characteristic-panel">
                    <div className="panel-heading">
                      <div><span>Основной профиль</span><h3>Характеристики</h3></div>
                      <p>Итоговые значения с учётом улучшений</p>
                    </div>
                    <div className="characteristic-grid">
                      {characteristics.map(([name, short, value]) => (
                        <div className="characteristic" key={short}>
                          <span>{short}</span>
                          <strong>{value}</strong>
                          <small>{name}</small>
                        </div>
                      ))}
                    </div>
                  </article>

                  <div className="split-panels">
                    <article className="ruled-panel skills-panel">
                      <div className="panel-heading compact">
                        <div><span>Подготовка</span><h3>Умения</h3></div>
                      </div>
                      <div className="table-head"><span>Умение</span><span>Улучшения</span><span>Итог</span></div>
                      {skills.map((skill) => (
                        <div className="skill-row" key={skill.name}>
                          <div><strong>{skill.name}</strong><small>{skill.base}</small></div>
                          <PipRow value={skill.advances} />
                          <b>{skill.value}</b>
                        </div>
                      ))}
                    </article>

                    <article className="ruled-panel armor-panel">
                      <div className="panel-heading compact">
                        <div><span>Защита</span><h3>Броня по зонам</h3></div>
                      </div>
                      <div className="body-map" aria-label="Броня по зонам тела">
                        <div className="body-node head"><span>Голова</span><b>2</b></div>
                        <div className="body-node arm left"><span>Л. рука</span><b>3</b></div>
                        <div className="body-node torso"><span>Тело</span><b>4</b></div>
                        <div className="body-node arm right"><span>П. рука</span><b>3</b></div>
                        <div className="body-node leg left"><span>Л. нога</span><b>3</b></div>
                        <div className="body-node leg right"><span>П. нога</span><b>3</b></div>
                      </div>
                      <p className="armor-note">Панцирная куртка · укреплённые поножи</p>
                    </article>
                  </div>
                </section>

                <aside className="context-column">
                  <article className="vitals-card dark-panel">
                    <div className="panel-heading inverted compact">
                      <div><span>Текущее состояние</span><h3>Жизненные показатели</h3></div>
                    </div>
                    <div className="vital-grid">
                      <div className="vital wide"><span>Раны</span><strong>8 <small>/ 12</small></strong><i><b style={{ width: "67%" }} /></i></div>
                      <div className="vital"><span>Критические</span><strong>0 <small>/ 4</small></strong></div>
                      <div className="vital"><span>Судьба</span><strong>2 <small>/ 3</small></strong></div>
                      <div className="vital"><span>Решимость</span><strong>2</strong></div>
                      <div className="vital"><span>Порча</span><strong>1</strong></div>
                    </div>
                    <div className="derived-strip">
                      <span><small>Инициатива</small><b>8</b></span>
                      <span><small>Скорость</small><b>Обычная</b></span>
                      <span><small>Превосходство</small><b>2</b></span>
                    </div>
                  </article>

                  <article className="ruled-panel condition-panel">
                    <div className="panel-heading compact">
                      <div><span>Обстановка</span><h3>Активные обстоятельства</h3></div>
                    </div>
                    <div className="condition-list">
                      <span className="condition warning">Ранен</span>
                      {conditions.engaged && <span className="condition danger">В схватке</span>}
                      {conditions.cover && <span className="condition neutral">В укрытии</span>}
                      {conditions.darkness && <span className="condition danger">Темнота</span>}
                      {conditions.restrained && <span className="condition danger">Обездвижен</span>}
                      {!conditions.darkness && <span className="condition neutral">Средняя видимость</span>}
                    </div>
                    <p className="context-note">Подсказки ниже уже учитывают состояние агента и выбранное оружие.</p>
                  </article>

                  <article className="ruled-panel quick-actions">
                    <div className="panel-heading compact">
                      <div><span>Доступно сейчас</span><h3>Быстрые действия</h3></div>
                      <button className="text-button" onClick={() => setActiveTab("combat")}>Все действия</button>
                    </div>
                    {actions.filter((action) => action.available).slice(0, 4).map((action, index) => (
                      <button className="action-row" key={action.name} type="button">
                        <span className="action-index">0{index + 1}</span>
                        <span><strong>{action.name}</strong><small>{action.detail}</small></span>
                        <i>›</i>
                      </button>
                    ))}
                  </article>

                  <article className="talent-ribbon">
                    <span className="ribbon-mark">✦</span>
                    <div><small>Напоминание таланта</small><strong>Непоколебимый</strong><p>Можно игнорировать помеху от Страха один раз за сцену.</p></div>
                  </article>
                </aside>
              </div>
            )}

            {activeTab === "combat" && (
              <div className="chapter-page combat-page">
                <header className="chapter-heading">
                  <div><p>II · Полевой протокол</p><h2>Боевой устав</h2></div>
                  <p>Датаслейт показывает только применимые действия и поясняет, почему остальные временно недоступны.</p>
                </header>

                <section className="situation-console dark-panel">
                  <div><span className="console-light" /><p><small>Состояние сцены</small><strong>Переключите обстоятельства</strong></p></div>
                  <div className="toggle-row">
                    {([
                      ["engaged", "В схватке"],
                      ["cover", "В укрытии"],
                      ["darkness", "Темнота"],
                      ["restrained", "Обездвижен"],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={conditions[key] ? "on" : ""}
                        onClick={() => toggleCondition(key)}
                        aria-pressed={conditions[key]}
                      >
                        <i />{label}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="action-grid">
                  {actions.map((action, index) => (
                    <article className={`action-card ${action.available ? "available" : "locked"}`} key={action.name}>
                      <div className="card-number">{String(index + 1).padStart(2, "0")}</div>
                      <div className="action-card-copy">
                        <span>{action.kind}</span>
                        <h3>{action.name}</h3>
                        <p>{action.detail}</p>
                      </div>
                      <div className="availability-mark">{action.available ? "ДОСТУПНО" : "НЕДОСТУПНО"}</div>
                    </article>
                  ))}
                </div>

                <aside className="rules-inset">
                  <Seal>!</Seal>
                  <div><strong>Порядок хода</strong><p>В свой ход агент получает движение и одно действие. До начала следующего хода доступна одна реакция, если иное не сказано в таланте или снаряжении.</p></div>
                </aside>
              </div>
            )}

            {activeTab === "arsenal" && (
              <div className="chapter-page arsenal-page">
                <header className="chapter-heading">
                  <div><p>III · Учёт имущества</p><h2>Арсенал агента</h2></div>
                  <p>Оружие, защита и расходуемое имущество собраны в карточках, похожих на инвентарные ордера Муниторума.</p>
                </header>
                <div className="loadout-grid">
                  <article className="weapon-card primary-weapon">
                    <div className="weapon-topline"><span>ОСНОВНОЕ ОРУЖИЕ</span><b>INV/44–L</b></div>
                    <h3>Лазкарабин «Сухой зуб»</h3>
                    <p className="weapon-tags"><span>Дальняя</span><span>Двуручное</span><span>Безотказное</span></p>
                    <div className="weapon-stats"><span><small>Проверка</small><b>Стрельба 52</b></span><span><small>Урон</small><b>6 + КУ</b></span><span><small>Дистанция</small><b>Дальняя</b></span></div>
                    <div className="ammo-control">
                      <button type="button" onClick={() => setAmmo((value) => Math.max(0, value - 1))} aria-label="Потратить один патрон">−</button>
                      <div><small>Боезапас</small><strong>{ammo}<span>/30</span></strong><i><b style={{ width: `${(ammo / 30) * 100}%` }} /></i></div>
                      <button type="button" onClick={() => setAmmo(30)} aria-label="Перезарядить оружие">↻</button>
                    </div>
                  </article>

                  <article className="weapon-card">
                    <div className="weapon-topline"><span>ЗАПАСНОЕ ОРУЖИЕ</span><b>INV/19–C</b></div>
                    <h3>Стаб-револьвер</h3>
                    <p className="weapon-tags"><span>Средняя</span><span>Удобное</span><span>Громкое</span></p>
                    <div className="weapon-stats"><span><small>Проверка</small><b>Стрельба 52</b></span><span><small>Урон</small><b>6 + КУ</b></span><span><small>Магазин</small><b>6 / 6</b></span></div>
                  </article>

                  <article className="weapon-card">
                    <div className="weapon-topline"><span>ХОЛОДНОЕ ОРУЖИЕ</span><b>INV/08–B</b></div>
                    <h3>Мономолекулярный нож</h3>
                    <p className="weapon-tags"><span>Незаметное</span><span>Метательное</span></p>
                    <div className="weapon-stats"><span><small>Проверка</small><b>Бой 46</b></span><span><small>Урон</small><b>4 + разн. КУ</b></span><span><small>Вес</small><b>1</b></span></div>
                  </article>

                  <article className="inventory-manifest ruled-panel">
                    <div className="panel-heading compact"><div><span>Манифест</span><h3>Прочее имущество</h3></div><b>Вес 11 / 18</b></div>
                    {["Медикаэ-набор", "Респиратор", "Светосфера", "Когитаторный ключ", "2 запасных магазина"].map((item, index) => (
                      <div className="manifest-row" key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong><small>{index === 0 ? "Используемое" : "Снаряжение"}</small></div>
                    ))}
                  </article>
                </div>
              </div>
            )}

            {activeTab === "advance" && (
              <div className="chapter-page advance-page">
                <header className="chapter-heading">
                  <div><p>IV · Запись заслуг</p><h2>Развитие</h2></div>
                  <p>Каждая покупка проверяется по требованиям и заносится в журнал. Свободный опыт пересчитывается сразу.</p>
                </header>
                <section className="xp-ledger dark-panel">
                  <div><small>Получено опыта</small><strong>{totalXp}</strong></div>
                  <span className="ledger-divider">−</span>
                  <div><small>Потрачено</small><strong>{spentXp}</strong></div>
                  <span className="ledger-divider">=</span>
                  <div className="available-xp"><small>Доступно</small><strong>{availableXp}</strong></div>
                </section>

                <div className="advance-grid">
                  <article className="ruled-panel purchase-panel">
                    <div className="panel-heading"><div><span>Разрешённые приобретения</span><h3>Улучшения</h3></div><p>Цена следующей ступени</p></div>
                    {[
                      ["Стрельба", "Третье улучшение · итог 57", 150],
                      ["Бдительность", "Третье улучшение · итог 63", 150],
                      ["Характеристика: Бой", "Новое значение 47", 80],
                      ["Талант: Железная челюсть", "Требования выполнены", 100],
                    ].map(([name, detail, cost]) => (
                      <div className="purchase-row" key={String(name)}>
                        <div><strong>{name}</strong><small>{detail}</small></div>
                        <span>{cost} ОО</span>
                        <button type="button" disabled={availableXp < Number(cost)} onClick={() => buyAdvance(Number(cost))}>Приобрести</button>
                      </div>
                    ))}
                  </article>

                  <article className="ruled-panel talent-panel">
                    <div className="panel-heading"><div><span>Выучено</span><h3>Таланты</h3></div></div>
                    {talents.map(([name, detail]) => (
                      <div className="talent-entry" key={name}><span>✦</span><div><strong>{name}</strong><p>{detail}</p></div></div>
                    ))}
                  </article>
                </div>

                <article className="experience-log">
                  <div className="log-title"><span>ЖУРНАЛ ЗАСЛУГ</span><b>Последние записи</b></div>
                  <div><time>240.816.М41</time><p>Завершение задания «Узы крови»</p><strong>+200 ОО</strong></div>
                  <div><time>240.803.М41</time><p>Краткосрочная цель: вернуть почтовый груз</p><strong>+50 ОО</strong></div>
                  <div><time>240.771.М41</time><p>Улучшение Стойкости II</p><strong>−100 ОО</strong></div>
                </article>
              </div>
            )}
          </div>

          <footer className="dataslate-footer">
            <span>АДЕПТУС АДМИНИСТРАТУМ · ФОРМА 77/М</span>
            <p>Мысль порождает ересь. Учёт порождает порядок.</p>
            <span>СТР. {tabs.findIndex((tab) => tab.id === activeTab) + 1} / 4</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

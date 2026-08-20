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
  type Skill,
  type Talent,
} from "./data/rules";
import { SKILL_RULE_TEXT, type SkillRuleText } from "./data/skillRules";

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

type OwnedSpecialization = {
  id: string;
  name: string;
  rank: number;
  value: number;
};

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

const tabs: { id: TabId; label: string; mobileLabel: string; index: string }[] = [
  { id: "sheet", label: "Лист персонажа", mobileLabel: "Персонаж", index: "I" },
  { id: "advance", label: "Развитие", mobileLabel: "Развитие", index: "II" },
  { id: "inventory", label: "Инвентарь", mobileLabel: "Инвентарь", index: "III" },
  { id: "reference", label: "Ширма", mobileLabel: "Ширма", index: "IV" },
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
  ["Прицеливание", "Действие", "Один точный выстрел стоит сотни пуль, пролетевших мимо. Тратя действие, вы тщательно целитесь, и в своём следующем ходу дальность поражения вашего оружия вырастет на шаг (средняя станет дальней, дальняя – сверхдальней), а вы сможете выбрать зону попадания (см. стр. 211) безо всяких штрафов. Это преимущество пропадёт после того как вы выстрелите или если совершите движение до выстрела. Прицеливание нельзя сочетать со стрельбой короткими и длинными очередями.", 207],
  ["Атака", "Действие", "В галактике, полной еретиков, ксеносов и прочей нечисти, не обойтись без насилия. Удар цепным мечом, выстрел из лазпистолета, бросок гранаты – это всё атаки. Чтобы поразить цель, потребуется проверка – подробнее см. раздел «Совершение атаки» на стр. 211.", 207],
  ["Натиск", "Действие", "Вы бросаетесь на врага, полагаясь на свою массу и силу удара. Совершая натиск, вы можете преодолеть расстояние, что позволяет ваша скорость, и провести атаку в ближнем бою. Эта атака получает преимущество. Вы не можете объявлять натиск по врагам, что находятся в одной с вами зоне. До начала своего следующего хода вы получаете помеху в проверках Боя и Рефлексов, предпринятых, чтобы защитить себя. Если вы совершаете натиск верхом на скакуне или мотоцикле, вы используете его, а не свою скорость, но всё так же совершаете атаку. Помеху в проверках Боя и Рефлексов, предпринятых, чтобы защитить себя, получаете и вы и скакун.", 207],
  ["Защита", "Действие", "Вы делаете всё возможное, чтобы защитить своего товарища или территорию. Предпринимая это действие, выберите союзника в непосредственной близости от себя, которого будете защищать. До начала вашего следующего хода любые атаки по выбранному соратнику вместо него приходятся в вас (атакам в ближнем бою противостоите вы, урон получаете тоже вы; стрелковые атаки попадают в вас). На защищаемого всё ещё действуют свойства местности, психосилы и эффекты, что действуют на эту зону. Если одного персонажа защищает сразу несколько других, игроки могут выбрать, кто становится целью атаки. Также вы можете применять это действие, чтобы защитить целую зону, в которой находитесь. При этом вы не даёте врагу войти в неё, перекрывая путь – например, встаёте на страже дверей между двумя помещениями или занимаете круговую оборону. Скажите ведущему, какую зону вы хотите защищать, а он решит, возможно ли это. Любые существа, пытающиеся войти в эту зону, должны потратить действие на встречную проверку Атлетики (Мощи) против вашей Атлетики (Мощи). Если у вас есть щит или соратник, готовый применить Защиту, чтобы помочь вам, ваша проверка получает преимущество. Проиграв, существо не может войти в зону, а победив – оттесняет вас и получает возможность войти. Когда вы защищаете зону, враги в соседних зонах могут атаковать вас в ближнем бою, а вы – обороняться от этих атак по общим правилам.", 207],
  ["Выход из боя", "Действие", "То, что другие называют трусостью, вы считаете здравым смыслом. Когда вы атакуете существо в непосредственной близости от вас (или атакованы таким существом), вы находитесь в схватке с ним. Если вы попытаетесь убежать, противник сможет немедленно атаковать вас, потратив реакцию. Это действие позволяет вам осторожно отступить, не забывая о собственной защите. Вы выходите за пределы непосредственной близости от цели и отныне не находитесь с ней в схватке. Выход из боя не позволяет противнику нанести свободную атаку.", 207],
  ["Уклонение", "Действие", "Некоторые люди говорят, что лучшая защита – это нападение. Скорее всего, такие люди уже получили удар ножом и погибли. Применяя это действие, вы тратите ход на то, чтобы не получить урона. До начала вашего следующего хода вы получаете преимущество на следующую проверку Боя или Рефлексов (Уклонения), которую совершаете, чтобы защитить себя. Кроме того, до начала вашего следующего хода вы может совершить проверки Рефлексов (Уклонения), чтобы избегать стрелковых атак, сделанных против вас врагами, о которых вы знаете. Это не тратит вашу реакцию.", 208],
  ["Паника", "Действие + движение", "Порой свирепость битвы достигает таких пределов, что боец не выдерживает. Страшась смерти, он решает бежать. В начале своего хода вы должны заявить, что собираетесь впасть в панику. Вы тратите на это действие и движение. Вы больше не участвуете в сражении и не можете предпринимать действий. Вы пропадаете из порядка инициативы, а превосходство падает на 1. Помните, что вместо паники, отряд может совершить Отступление (см. стр. 209).", 208],
  ["Захват", "Действие", "Иногда лучше взять врага живым или придержать друга, чем дать резне продолжаться. Вместо того, чтобы пытаться наносить урон, вы можете потратить действие, чтобы схватить существо в непосредственной близости от себя. Для этого вам нужно будет пройти встречную проверку Атлетики (Мощи) или Боя (Кулачного боя) против Атлетики (Мощи), Боя (Кулачного боя) или Рефлексов (Уклонения) противника. Если вы победите, цель получит состояние Обездвиживание (Малое). Вы можете прекратить захват в любой миг. В свой ход существо может потратить действие на новую встречную проверку, чтобы освободиться. Вы можете потратить действие, чтобы продолжать удерживать цель – проверки не требуются. Но если вы предпринимаете какое-то другое действие или получаете рану, цель может тут же потратить реакцию, чтобы попытаться освободиться, как описано выше. При том она не получает помеху за состояние Обездвиживание (Малое). При стрельбе по сцепившимся в захвате вы можете использовать необязательные правила со стр. 314. На захват влияет размер существа. Если один участник на ступень больше другого, он получает преимущество в проверке. Если один участник на две ступени больше другого, он получает преимущество в проверке, а его противник – помеху. Если вы пытаетесь взять в захват цель на две или больше ступеней больше себя, вы можете ухватить её лишь за одну конечность или часть тела. Цель не будет обездвижена, но получит штраф. Начиная захват, сообщите ведущему, за что вы пытаетесь удерживать врага. Руки (или хвост): цель получает помеху в атаках, использующих эту конечность. Ноги: скорость цели падает на один шаг.", 208],
  ["Помощь", "Действие", "Бороться с враждебной галактикой в одиночку – верная и быстрая смерть. Совершая это действие, вы помогаете соратнику, что приносит ему преимущество в следующей проверке. Подробнее см. раздел «Помощь» на стр. 189.", 208],
  ["Засада", "Действие", "Когда округу прочёсывают отряды зачистки, стоит проявить лучшую часть доблести – благоразумие – и не вступать в бой. Устраивая засаду, вы предпринимаете проверку Скрытности и прячетесь на местности, если та способна вас скрыть. Запишите, сколько успехов вы набрали, поскольку, чтобы найти вас, врагу нужно будет набрать больше успехов в проверке Бдительности. Чтобы устроить засаду, в зоне должны быть полезные для этого свойства, что скроют ваши передвижения – например, Укрытие или Марево. Когда вы сидите в засаде, ваша скорость падает до медленной – вы можете перемещаться в пределах зоны за движение, а чтобы попасть в соседнюю, вам потребуется Бег. Если персонаж сидит в засаде, то враг сможет атаковать его только, если победит во встречной проверке Бдительности против Скрытности. Также, чтобы найти спрятавшегося персонажа можно применять Поиск. Персонаж больше не будет считаться находящимся в засаде, если совершит действие, что выдаст его местоположение – например, атакует врага громким оружием. Любая успешная атака из засады (она же неожиданная атака) наносит врагу критическое попадание (см. стр. 215).", 208],
  ["Импровизация", "Действие", "Перечень действий, что вы сейчас читаете, не исчерпывающий. Если у вас есть идея, не пытайтесь подобрать к ней подходящее действие, а импровизируйте – скажите ведущему, что хотите сделать, а он оценит, возможно ли это, и требует ли проверок.", 209],
  ["Сотворение психосилы", "Действие", "Вы открываете свой разум сверхъестественным силам Варпа и пытаетесь подчинить их своей воле. Совершая это действие, вы пробуете сотворить психосилу – см. правила на стр. 158.", 209],
  ["Контроль", "Действие", "В хаосе битвы жизненно важно знать, когда и как стоит действовать. Вы заявляете, при каких условиях будете действовать – вы должны назвать условие и какое действие вы предпримете, когда оно выполнится. Например, «Когда бандит заглянет за угол, я выстрелю в него из лазпистолета» или «Как только Кэлли бросит фраг-гранату, я побегу». Если в этом ходу условие, выполнение которого вы контролировали, не выполнилось, вы можете совершить другое действие, но в конце порядка инициативы.", 209],
  ["Перезарядка", "Действие", "В бою важная каждая пуля, а пустой магазин означает смерть. Когда у вашего оружия кончаются боеприпасы, вы должны совершить это действие, чтобы вернуть возможность стрелять.", 209],
  ["Отступление", "Действие", "Иногда тактическое отступление бывает более разумным решением, чем мученическая смерть. Если вы чувствуете, что чаша весов клонится не на вашу сторону, вы можете отступить вместе с союзниками. Объявляя отступление, вы завершаете свой ход – подразумевается, что он тратится на все меры, необходимые для безопасного отхода. В начале хода каждого из ваших соратников, ведущий спрашивает, готов ли он отступать. Если готов, он присоединяется к вам в подготовке скоординированного отступления. Если согласны все ваши соратники, группа выходит из боя. Ведущий может «промотать» время до того мига, когда вы все окажетесь в безопасном месте, либо (если враг очень упорный) начать отыгрыш погони. Поскольку вы отступаете с боем, вы и ваши соратники получаете +Х успехов в проверках, связанных с уходом от врага в ходе погони. Х равен вашему уровню превосходства. Если кто-то из ваших соратников отказывается отступать, вы и ваши соратники можете передумать и продолжить бой, либо всё же отойти, предоставив товарища своей судьбе. Так или иначе, разлад внутри отряда понижает превосходство на 2.", 209],
  ["Бег", "Действие", "Иногда вам нужно добраться до врагов как можно быстрее (или аналогично удалиться от них). Это действие позволяет вам переместиться в соседнюю зону (любую точку в пределах средней дистанции). В сочетании с движением это позволяет персонажу попасть в точку, что находится в двух зонах от него.", 209],
  ["Поиск", "Действие", "Когда вам нужно что-то найти – врага, предмет или что-то иное – вы применяете это действие, чтобы потратить время на осмотр окружения и поиск улик или пропавших врагов. Ведущий просит предпринять проверку Бдительности (Зрения) и задаёт ей сложность. По решению ведущего, вы также можете использовать поиск, чтобы получить представление о своём окружении. Это может позволить вам уловить почти неощутимые возмущения в Имматериуме или заметить опасность. В таких случаях вы бросаете проверки Бдительности (Психическое чутьё), Чутья (Окружение) или иные подходящие.", 209],
  ["Перехват инициативы", "Действие", "Быть первым – это быть лучшим. Порой стоит немного выждать, чтобы ударить первым в нужный миг. Перехватывая инициативу, вы не делаете ничего в этом ходу, но в начале следующего раунда будете действовать первым. Вы попадаете на первое место в порядке инициативы и остаётесь там, пока кто-нибудь ещё не применит это действие, чтобы опередить вас, или пока порядок инициативы не изменит какой-то иной эффект.", 209],
  ["Толчок", "Действие", "Порой вам нужно пространство, чтобы дать себе передышку. Применяя это действие, вы пытаетесь оттолкнуть врагов прочь. Вы можете толкать существ, что находятся в непосредственной близости от вас. Предпримите встречную проверку Атлетики (Мощи) против Атлетики (Мощи) или Рефлексов (Уклонения) цели. В случае победы, цель сдвигается на количество метров, равное разнице в количестве успехов, а вы выходите из схватки с ней. Если вы победили на три или больше успеха, вы можете вытолкнуть цель в соседнюю зону.", 209],
  ["В укрытие!", "Действие", "Занимая укрытие, вы полагаетесь на то, что оно защитит вас от вражеского огня. Если вы входите в зону, обладающую свойством Укрытие, вы можете использовать это действие, чтобы воспользоваться преимуществами укрытия. Лёгкое укрытие даёт +2 очка брони против стрелковых атак, среднее – уже +4, а надёжное обеспечивает +6. Умелые стрелки могут подстрелить вас даже в укрытии, если прибегнут к точечным атакам.", 210],
  ["Точечная атака", "Действие", "Многие воины сорок первого тысячелетия носят разномастные и неполные доспехи, а потому стрельба по незащищённым бронёй частям тела – быстрый путь к победе. Применяя точечную атаку, вы выбираете зону поражения у определённого врага. Скажите ведущему, кого и куда вы атакуете, после чего совершите стрелковую атаку или атаку в ближнем бою. Эта атака бросается с помехой. В случае успеха вы наносите урон в выбранную зону попадания (число на кости единиц не играет роли). Если цель прячется в укрытии, вы можете использовать точечную атаку, чтобы игнорировать очки брони, которые даёт укрытие. Как правило, сидящий в укрытии противник показывает оттуда только голову и руки, чтобы осматривать местности и вести огонь, но ведущий может постановить, что видимы и другие зоны поражения (что может быть обусловлено ситуацией, положением цели и типом укрытия).", 210],
  ["Использование предмета или элемента", "Действие", "Обычно вам не нужно тратить действия на то, чтобы обнаружить оружие, достать предмет из сумки, переключить рычаг или открыть дверь. Но некоторые задачи – например, использование элементов – требует больше времени или усилий, а потому ведущий может потребовать от героя использовать это действие.", 210],
] as const;

const conditionReference = [
  ["Горение", "Вы объяты пламенем. Горение (Малое): вы получаете 1к5 единиц урона в начале своего хода. От этого не спасает броня. Горение (Серьёзное): вы получаете 1к10 единиц урона в начале своего хода. От этого не спасает броня. Когда вы горите, вы автоматически проваливаете все проверки Скрытности. Если не указано обратного, вы можете снять это состояние, упав на землю (будет считаться, что вы Сбиты с ног), потратив действие и успешно пройдя среднюю (+0) проверку Атлетики.", 356],
  ["Кровотечение", "Вы теряете кровь. Кровотечение (Малое): вы получаете одно очко урона в конце вашего хода. От этого не спасает броня. Кровотечение (Серьёзное): вы получаете три очка урона в конце вашего хода. От этого не спасает броня. Если из-за Кровотечения вы потеряете все свои раны, то получите критическую рану по общим правилам. Если это произойдёт, вы больше не будете получать урон от Кровотечения, но ваши раны нельзя будет восстановить, пока Кровотечение не остановят. Если Кровотечение началось не из-за критической раны, его можно остановить средней (+0) проверкой Медики или при помощи инструментов хирургеона (см. стр. 145).", 356],
  ["Слепота", "Вы ничего не видите. Проверки, связанные со зрением (например, Бдительность (Зрение) или Стрельба), будут успешны, только если на костях выпадет 01-05. Вы получаете помеху на все проверки Боя и Уклонения (Рефлексов). Если не указано обратного, Слепота проходит через 1к10 раундов. Способов прекратить Глухоту или Слепоту раньше обычного почти не существует, но если речь идёт о соответствующих аугметических органах чувств, то они могут вернуться в строй благодаря действию, потраченному на обновление цикла их работы.", 356],
  ["Глухота", "Вы ничего не слышите. Проверки, связанные со слухом (например, Бдительность (Слух)), будут успешны, только если на костях выпадет 01-05. Если не указано обратного, Глухота проходит через 1к10 раундов. Способов прекратить Глухоту или Слепоту раньше обычного почти не существует, но если речь идёт о соответствующих аугметических органах чувств, то они могут вернуться в строй благодаря действию, потраченному на обновление цикла их работы.", 356],
  ["Усталость", "Вы вымотаны, истощены и крайне нуждаетесь в отдыхе. Усталость (Малая): все ваши проверки бросаются с помехой. Усталость (Серьёзная): сложность всех ваших проверок возрастает до очень сложной (-30). Если вы уже имеете Усталость (Серьёзную), и получаете Усталость ещё раз, вы сможете действовать ещё количество минут, равное вашему бонусу Выносливости, после чего упадёте Без сознания. Если не указано обратного, вы можете снять Усталость, отдохнув шесть часов.", 356],
  ["Страх", "Вы объяты страхом. Страх (Малый): страх обостряет чувства – вы получаете преимущество в проверках Бдительности и Чутья. Тем не менее, вы получаете помеху во всех проверках, связанных с противостоянием источнику вашего страха. Страх (Серьёзный): вы испытываете ужас. Вы должны бежать прочь от источника вашего страха самым быстрым из возможных способов. Останавливаться вы можете лишь, чтобы открыть дверь или сделать что-то ещё, что поможет вам выбраться из текущей ситуации. Если не указано обратного, в конце каждого раунда вы можете предпринять среднюю (+0) проверку Дисциплины (Страх), чтобы снять это состояние.", 357],
  ["Беспомощность", "Вы не можете двигаться и предпринимать действия. Вы не можете защитить себя. Атаки в ближнем бою автоматически наносят вам критическое попадание (см. стр. 215).", 357],
  ["Перегрузка", "Вы получаете помеху на все проверки Ловкости, а ваша скорость падает на один шаг.", 357],
  ["Отравление", "Вы чувствуете себя дурно. Отравление (Малое): вы получаете помеху в проверках Силы и Выносливости. Предельное количество успехов, что вы можете набрать в любой проверке, не может превышать ваш бонус Выносливости. Отравление (Серьёзное): вы сбиты с ног и беспомощны. Если длительность Отравления не указана, оно продолжается 1к5 часов. Как правило, Отравление можно вылечить средней (+0) проверкой Медики и применением инструментов хирургеона (см. стр. 145). Особенно опасные яды могут потребовать трудной (-10) проверки. Самые смертоносные вещества требуют очень сложной (-30) проверки, а когда срок их действия подходит к концу, обычно к концу подходит и жизнь жертвы.", 357],
  ["Сбит с ног", "Сбитые с ног могут двигаться только ползком (стр. 202), если не потратят движение на то, чтобы встать. Вы получаете помеху на проверки Боя. Если атакующее вас существо находится от вас в непосредственной близости, оно атакует с преимуществом. Если атакующее вас существо находится от вас не в непосредственной близости, его атака бросается с помехой.", 357],
  ["Обездвиживание", "Вы не можете двигаться. Обездвиживание (Малое): вы не можете совершать движение. Вы получаете помеху в проверках, связанных с передвижением – в том числе, Атлетики, Ловкости рук, Боя, Рефлексов и Стрельбы. Обездвиживание (Серьёзное): вы становитесь Беспомощным. Чтобы сбросить это состояние, требуется уместная проверка – например, Ловкости рук (Взлом замков).", 357],
  ["Оглушение", "Вы ошеломлены и дезориентированы. Оглушение (Малое): вы можете совершать движение или действие, но только что-то одно. Оглушение (Серьёзное): также вы получаете помеху на все проверки. Если длительность Оглушения не указана, оно продолжается 1к5 раундов. Если соратник потратит действие на то, чтобы привести вас в чувство, вы можете предпринять среднюю (+0) проверку Стойкости (Боль), чтобы сбросить это состояние.", 357],
  ["Без сознания", "Вы валитесь Без сознания. Вы немедленно роняете то, что держите, считаетесь Сбитым с ног и становитесь Беспомощным. Любой, кто находится в непосредственной близости и имеет оружие без свойства Бесполезное, может убить вас безо всяких проверок.", 357],
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

function SkillReferenceDialog({
  skill,
  rules,
  baseValue,
  characteristicShort,
  ownedSpecializations,
  onClose,
}: {
  skill: Skill;
  rules: SkillRuleText;
  baseValue: number;
  characteristicShort: string;
  ownedSpecializations: OwnedSpecialization[];
  onClose: () => void;
}) {
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<string | null>(null);

  const selectedSpecialization = ownedSpecializations.find((entry) => entry.id === selectedSpecializationId) ?? null;
  const selectedSpecializationDefinition = selectedSpecialization
    ? skill.specializations.find((entry) => entry.id === selectedSpecialization.id)
    : null;
  const selectedRules = selectedSpecialization ? rules.specializations[selectedSpecialization.id] : null;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.classList.add("dialog-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("dialog-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="skill-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="skill-dialog" role="dialog" aria-modal="true" aria-labelledby="skill-dialog-title">
        <header className="skill-dialog-header">
          <div>
            <small>Справка по умению · {characteristicShort}</small>
            <h2 id="skill-dialog-title">{skill.name}</h2>
          </div>
          <SourceBadge page={rules.page} />
          <button className="skill-dialog-close" type="button" onClick={onClose} autoFocus aria-label="Закрыть окно">×</button>
        </header>

        <div className="skill-dialog-scroll">
          <section className="book-rule-block">
            <span>Текст книги</span>
            <p>{rules.description}</p>
            {!selectedSpecialization && rules.opposedBy && (
              <div className="opposed-check">
                <small>Встречная проверка{rules.opposedPage ? ` · стр. ${rules.opposedPage}` : ""}</small>
                <strong>{rules.opposedBy}</strong>
              </div>
            )}
          </section>

          <section className="skill-choice-section" aria-labelledby="skill-choice-title">
            <div className="skill-dialog-section-heading">
              <div>
                <small>{ownedSpecializations.length > 0 ? "Доступны изученные специализации" : "Изученных специализаций нет"}</small>
                <h3 id="skill-choice-title">Выберите подходящий случай</h3>
              </div>
            </div>
            <div className="skill-choice-list">
              <button type="button" className={selectedSpecializationId === null ? "skill-choice active" : "skill-choice"} aria-pressed={selectedSpecializationId === null} onClick={() => setSelectedSpecializationId(null)}>
                <span><small>Базовое умение</small><strong>{skill.name}</strong></span><b>{baseValue}</b>
              </button>
              {ownedSpecializations.map((entry) => (
                <button type="button" key={entry.id} className={selectedSpecializationId === entry.id ? "skill-choice active" : "skill-choice"} aria-pressed={selectedSpecializationId === entry.id} onClick={() => setSelectedSpecializationId(entry.id)}>
                  <span><small>Специализация · {entry.rank}/4</small><strong>{entry.name}</strong></span><b>{entry.value}</b>
                </button>
              ))}
            </div>
          </section>

          {selectedRules && selectedSpecializationDefinition && (
            <section className="book-rule-block specialization-rule-block">
              <span>{skill.name} ({selectedSpecializationDefinition.name})</span>
              <p>{selectedRules.description}</p>
              {selectedRules.opposedBy && (
                <div className="opposed-check">
                  <small>Встречная проверка{selectedRules.opposedPage ? ` · стр. ${selectedRules.opposedPage}` : ""}</small>
                  <strong>{selectedRules.opposedBy}</strong>
                </div>
              )}
            </section>
          )}
        </div>
      </section>
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
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

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
    return allSpecializations.filter((entry) => {
      const description = SKILL_RULE_TEXT[entry.skill.id]?.specializations[entry.id]?.description ?? "";
      return !query || `${entry.skill.name} ${entry.name} ${description}`.toLocaleLowerCase("ru").includes(query);
    });
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

  const openTab = (tabId: TabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeTabInfo = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const selectedSkill = selectedSkillId ? SKILLS.find((skill) => skill.id === selectedSkillId) ?? null : null;
  const selectedSkillRules = selectedSkill ? SKILL_RULE_TEXT[selectedSkill.id] : null;
  const selectedSkillRank = selectedSkill ? state.skillRanks[selectedSkill.id] ?? 0 : 0;
  const selectedSkillBaseValue = selectedSkill ? characteristicValues[selectedSkill.characteristic] + (selectedSkillRank * 5) : 0;
  const selectedSkillCharacteristic = selectedSkill ? CHARACTERISTICS.find((entry) => entry.id === selectedSkill.characteristic) ?? null : null;
  const selectedSkillSpecializations: OwnedSpecialization[] = selectedSkill
    ? selectedSkill.specializations.flatMap((specialization) => {
      const rank = state.specializationRanks[`${selectedSkill.id}:${specialization.id}`] ?? 0;
      return rank > 0 ? [{ id: specialization.id, name: specialization.name, rank, value: selectedSkillBaseValue + (rank * 5) }] : [];
    })
    : [];

  return (
    <main className="site-stage">
      <div className="ambient-grain" />
      <section className="dataslate" aria-label="Интерактивный лист персонажа Imperium Maledictum">
        <aside className="ornate-rail" aria-hidden="true">
          <div className="rail-art" /><div className="rail-plaque"><span>ORDO DATA</span><strong>ДОСЬЕ АГЕНТА</strong></div><span className="rail-lamp top" /><span className="rail-lamp bottom" />
        </aside>

        <div className="slate-shell">
          <header className="mobile-command-bar">
            <span className="mobile-brand-mark" aria-hidden="true">IM</span>
            <div className="mobile-command-title"><small>Имперский датаслейт</small><strong>{activeTabInfo.mobileLabel}</strong></div>
            <div className={hydrated ? "mobile-save-state ready" : "mobile-save-state"} aria-live="polite"><i /><span>{hydrated ? "Сохранено" : "Загрузка"}</span></div>
          </header>

          <header className="masthead">
            <div className="authority-mark"><span className="skull">☠</span><span className="wings left" /><span className="wings right" /></div>
            <div className="masthead-copy"><p className="eyebrow">Автономный реестр · перевод 1.01 · локальное сохранение</p><h1>Имперский датаслейт</h1><p className="document-id">Единая база персонажа, развития и арсенала · источник каждой записи указан</p></div>
            <div className="status-stamp"><small>База правил</small><strong>СВЕРЕНА</strong><span>{RULE_DATA_COUNTS.talents} талантов · {RULE_DATA_COUNTS.skills} умений</span></div>
          </header>

          <nav className="chapter-tabs" aria-label="Разделы датаслейта">
            {tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => openTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined}><span className="tab-index">{tab.index}</span><span className="tab-label tab-label-desktop">{tab.label}</span><span className="tab-label tab-label-mobile">{tab.mobileLabel}</span></button>)}
          </nav>

          <div className="content-frame">
            <span className="corner-ornament tl" aria-hidden="true" /><span className="corner-ornament tr" aria-hidden="true" /><span className="corner-ornament bl" aria-hidden="true" /><span className="corner-ornament br" aria-hidden="true" />

            {activeTab === "sheet" && (
              <div className="chapter-page sheet-page">
                <header className="chapter-heading"><div><p>I · Лист персонажа</p><h2>{state.identity.name || "Новый агент"}</h2></div><p>Поля повторяют официальный двухстраничный бланк на стр. 363–364. Производные значения считаются автоматически.</p></header>

                <section className="mobile-vitals-strip" aria-label="Краткое состояние персонажа">
                  <div><small>Раны</small><strong>{state.woundsCurrent}<em>/ {maxWounds}</em></strong></div>
                  <div><small>Судьба</small><strong>{state.fateCurrent}<em>/ {state.fateTotal}</em></strong></div>
                  <div><small>Опыт</small><strong>{availableXp}</strong></div>
                  <div><small>Вес</small><strong className={carriedWeight > carryCapacity ? "danger-text" : ""}>{carriedWeight}<em>/ {carryCapacity}</em></strong></div>
                </section>

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
                        return <button type="button" className="registry-row skill-reference-row" key={skill.id} aria-haspopup="dialog" onClick={() => setSelectedSkillId(skill.id)}><div><strong>{skill.name}{skill.special ? " · особое" : ""}</strong>{specializations.length > 0 ? <small>{specializations.map((entry) => { const specializationRank = state.specializationRanks[`${skill.id}:${entry.id}`] ?? 0; return `${entry.name}: ${characteristicValues[skill.characteristic] + (rank * 5) + (specializationRank * 5)}`; }).join(" · ")}</small> : <small>Нажмите, чтобы открыть описание</small>}</div><span>{characteristic.short}</span><span>{rank} / 4</span><b>{characteristicValues[skill.characteristic] + (rank * 5)}</b></button>;
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
                  <article className="ruled-panel owned-list"><div className="panel-heading"><div><span>{ownedTalents.length} записей</span><h3>Таланты</h3></div><button className="text-button" type="button" onClick={() => openTab("advance")}>Добавить в развитии</button></div>{ownedTalents.length === 0 ? <p className="empty-note">Таланты пока не выбраны.</p> : ownedTalents.map((talentEntry, index) => <div className="owned-row" key={`${talentEntry.id}-${index}`}><span>✦</span><div><strong>{talentEntry.name}</strong><small>{talentEntry.requirements} · стр. {talentEntry.page}</small></div><button type="button" onClick={() => removeTalent(talentEntry.id)} aria-label={`Убрать ${talentEntry.name}`}>×</button></div>)}</article>
                  <article className="ruled-panel owned-list"><div className="panel-heading"><div><span>{inventoryWithItems.length} наименований · вес {carriedWeight}</span><h3>Оружие и снаряжение</h3></div><button className="text-button" type="button" onClick={() => openTab("inventory")}>Открыть каталог</button></div>{inventoryWithItems.length === 0 ? <p className="empty-note">Инвентарь пока пуст.</p> : inventoryWithItems.slice(0, 10).map((entry) => <div className="owned-row" key={entry.itemId}><span>{entry.quantity}×</span><div><strong>{entry.item.name}</strong><small>{kindLabels[entry.item.kind]} · вес {entry.item.weight} · стр. {entry.item.page}</small></div></div>)}</article>
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
                  <div className="directory-list specialization-directory">{filteredSpecializations.map((entry) => { const rank = state.specializationRanks[entry.key] ?? 0; const cost = SKILL_ADVANCE_COSTS[rank]; const ruleText = SKILL_RULE_TEXT[entry.skill.id]?.specializations[entry.id]?.description; return <div className="directory-row" key={entry.key}><div><span>{entry.skill.name}</span><strong>{entry.name}{entry.special ? " · Особое" : ""}</strong><small>{ruleText}</small></div><SourceBadge page={entry.skill.page} /><b>{rank}/4</b><button type="button" disabled={cost === undefined || availableXp < cost} onClick={() => buySpecialization(entry.key)}>{cost === undefined ? "Максимум" : `${cost} ОО`}</button></div>; })}</div>
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
                <header className="chapter-heading"><div><p>IV · Контекстная ширма</p><h2>Действия и состояния</h2></div><p>Кликайте состояния персонажа: активные эффекты поднимаются наверх. Действия раскрываются нажатием; текст перенесён из указанных страниц книги.</p></header>
                <article className="ruled-panel condition-reference"><div className="panel-heading"><div><span>Приложение IV</span><h3>Состояния персонажа</h3></div><SourceBadge page={356} /></div><div className="condition-reference-grid">{[...conditionReference].sort((a, b) => Number(state.activeConditions.includes(b[0])) - Number(state.activeConditions.includes(a[0]))).map(([name, effect, page]) => { const active = state.activeConditions.includes(name); return <button type="button" key={name} className={active ? "condition-card active" : "condition-card"} aria-pressed={active} onClick={() => toggleCondition(name)}><span>{active ? "АКТИВНО" : "СОСТОЯНИЕ"}</span><strong>{name}</strong><small>{effect}</small><SourceBadge page={page} /></button>; })}</div></article>
                <article className="ruled-panel actions-reference"><div className="panel-heading"><div><span>Глава VII</span><h3>Действия в бою</h3></div><SourceBadge page={207} /></div><div className="action-reference-grid">{actionReference.map(([name, kind, detail, page], index) => <details className="reference-action-card" key={name}><summary><span>{String(index + 1).padStart(2, "0")}</span><div><small>{kind}</small><h3>{name}</h3></div><i aria-hidden="true">⌄</i></summary><div className="reference-action-rule"><p>{detail}</p><SourceBadge page={page} /></div></details>)}</div></article>
                <aside className="rules-inset"><Seal>!</Seal><div><strong>Порядок хода</strong><p>В свой ход вы можете совершить движение и предпринять действие. Разные мелочи не требуют тратить на них действие – например, открыть дверь, сделать несколько шагов в пределах своей зоны, выхватить оружие. Ведущий определяет, потребует заявленное вами обычного или свободного действия. Общее правило – если вам нужно бросать проверку, значит на это нужно потратить обычное действие. Реакцию вы применяете в чужой ход. Если правила, таланты или снаряжение не указывают обратного, вы можете применять только одну реакцию до начала своего следующего хода.</p></div><SourceBadge page={199} /></aside>
              </div>
            )}
          </div>

          <footer className="dataslate-footer"><span>IMPERIUM MALEDICTUM · ПЕРЕВОД 1.01</span><p>{hydrated ? "Данные сохранены на этом устройстве." : "Загрузка локальной записи…"}</p><span>СТР. {tabs.findIndex((tab) => tab.id === activeTab) + 1} / 4</span></footer>
        </div>
      </section>
      {selectedSkill && selectedSkillRules && selectedSkillCharacteristic && (
        <SkillReferenceDialog
          key={selectedSkill.id}
          skill={selectedSkill}
          rules={selectedSkillRules}
          baseValue={selectedSkillBaseValue}
          characteristicShort={selectedSkillCharacteristic.short}
          ownedSpecializations={selectedSkillSpecializations}
          onClose={() => setSelectedSkillId(null)}
        />
      )}
    </main>
  );
}

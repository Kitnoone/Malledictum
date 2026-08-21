"use client";

import { useId } from "react";
import type { CatalogItem } from "../data/rules";

type WeaponBlueprintProps = {
  item: CatalogItem;
  installedUpgrades?: string[];
};

const hash = (value: string) => {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return Math.abs(result >>> 0);
};

function RangedDrawing({ item, seed }: { item: CatalogItem; seed: number }) {
  const heavy = item.stats["Специализация"]?.includes("Тяжёлое") || item.traits?.includes("Тяжёлое");
  const pistol = item.stats["Специализация"]?.includes("Пистолет");
  const launcher = /пуск|ракет|гранат/i.test(`${item.category} ${item.name}`);
  const energy = /лаз|плазм|мельт|иголь/i.test(`${item.category} ${item.name}`);
  const flame = /огнем|инферно/i.test(`${item.category} ${item.name}`);
  const bolt = /болт/i.test(`${item.category} ${item.name}`);
  const bodyStart = pistol ? 158 : 112;
  const bodyEnd = pistol ? 502 : 568;
  const top = 176 + (seed % 13);
  const bottom = 292 + (seed % 19);
  const barrelEnd = heavy ? 792 : pistol ? 626 : 752;
  const stockStart = pistol ? 138 : 54;
  const magazineX = 330 + (seed % 80);

  return (
    <g className="bp-stroke">
      {!pistol && (
        <path d={`M${bodyStart} ${top + 18} L${stockStart + 54} ${top + 8} L${stockStart} ${top + 58} L${stockStart + 12} ${bottom - 8} L${bodyStart} ${bottom - 20}`} />
      )}
      <path d={`M${bodyStart} ${top} L${bodyEnd - 58} ${top} L${bodyEnd} ${top + 26} L${bodyEnd} ${bottom - 16} L${bodyEnd - 36} ${bottom} L${bodyStart + 16} ${bottom} L${bodyStart} ${bottom - 24} Z`} />
      <path d={`M${bodyEnd - 6} ${top + 34} L${barrelEnd} ${top + 38} L${barrelEnd} ${top + 75} L${bodyEnd - 6} ${top + 78}`} />
      <path d={`M${barrelEnd} ${top + 45} L${barrelEnd + 45 + (seed % 24)} ${top + 45} L${barrelEnd + 45 + (seed % 24)} ${top + 69} L${barrelEnd} ${top + 69}`} />
      <path d={`M${bodyStart + 84} ${bottom} L${bodyStart + 106} ${bottom + 22} L${bodyStart + 94} ${bottom + 103} L${bodyStart + 48} ${bottom + 103} L${bodyStart + 57} ${bottom + 18} Z`} />
      <path d={`M${magazineX} ${bottom} L${magazineX + 68} ${bottom} L${magazineX + 55} ${bottom + 92 + (seed % 28)} L${magazineX + 10} ${bottom + 82} Z`} />
      <rect x={bodyStart + 72} y={top + 25} width={128 + (seed % 48)} height={57} rx="6" />
      <circle cx={bodyStart + 42} cy={top + 47} r={18 + (seed % 5)} />
      <circle cx={bodyStart + 42} cy={top + 47} r="6" />
      <path d={`M${bodyStart + 103} ${top + 102} Q${bodyStart + 135} ${top + 136} ${bodyStart + 173} ${top + 102}`} />
      {Array.from({ length: 5 + (seed % 4) }, (_, index) => (
        <line key={index} x1={bodyEnd - 165 + index * 18} y1={top + 12} x2={bodyEnd - 165 + index * 18} y2={bottom - 14} />
      ))}
      {energy && (
        <g>
          <rect x={bodyEnd - 232} y={top - 25} width="150" height="42" rx="9" />
          <path d={`M${bodyEnd - 210} ${top - 4} Q${bodyEnd - 184} ${top - 34} ${bodyEnd - 158} ${top - 4} T${bodyEnd - 106} ${top - 4}`} />
          <circle cx={bodyEnd - 62} cy={top + 66} r="13" />
        </g>
      )}
      {bolt && <path d={`M${bodyEnd - 126} ${top + 85} h32 l16 24 -16 24 h-32 l-16 -24 z`} />}
      {launcher && <rect x={bodyEnd - 26} y={top + 18} width={168} height={86} rx="39" />}
      {flame && <path d={`M${bodyEnd - 120} ${bottom + 4} C${bodyEnd - 80} ${bottom + 70}, ${bodyEnd + 20} ${bottom + 68}, ${bodyEnd + 56} ${top + 102}`} />}
      {heavy && (
        <g>
          <line x1={bodyEnd - 20} y1={bottom} x2={bodyEnd - 74} y2={bottom + 118} />
          <line x1={bodyEnd + 10} y1={bottom} x2={bodyEnd + 68} y2={bottom + 118} />
          <line x1={bodyEnd - 98} y1={bottom + 118} x2={bodyEnd - 48} y2={bottom + 118} />
          <line x1={bodyEnd + 44} y1={bottom + 118} x2={bodyEnd + 94} y2={bottom + 118} />
        </g>
      )}
      <g className="bp-detail-view" transform="translate(105 456)">
        <path d={`M0 33 L${230 + (seed % 70)} 9 L${480 + (seed % 70)} 30 L${230 + (seed % 70)} 52 Z`} />
        <circle cx={92 + (seed % 38)} cy="31" r="13" />
        <line x1="0" y1="76" x2="590" y2="76" />
        <line x1="0" y1="69" x2="0" y2="83" />
        <line x1="590" y1="69" x2="590" y2="83" />
      </g>
    </g>
  );
}

function MeleeDrawing({ item, seed }: { item: CatalogItem; seed: number }) {
  const name = item.name.toLocaleLowerCase("ru");
  const axe = name.includes("топор");
  const hammer = /молот|булав/.test(name);
  const staff = /посох|двуручное/.test(name);
  const whip = /хлыст|цеп$/.test(name);
  const fist = /кулак|кастет|безоруж/.test(name);
  const chain = /цепн|эвисцератор/.test(name);
  const short = /нож/.test(name);
  const x = 168 + (seed % 85);

  if (fist) {
    return (
      <g className="bp-stroke">
        <path d="M210 325 L188 212 Q190 174 226 176 L244 253 L250 148 Q252 116 284 119 L288 245 L305 128 Q312 98 341 107 L333 248 L359 148 Q371 121 398 134 L370 272 L407 201 Q426 180 449 199 L395 337 Q377 386 326 401 L249 391 Q219 377 210 325 Z" />
        <path d="M229 328 Q310 282 395 304" />
        <rect x="187" y="340" width="213" height="91" rx="19" />
        {Array.from({ length: 7 }, (_, index) => <line key={index} x1={206 + index * 28} y1="354" x2={198 + index * 31} y2="418" />)}
        <circle cx={294 + (seed % 28)} cy="379" r="29" />
        <path d="M535 190 h210 l42 44 -42 44 h-210 l-42-44 z" />
        <path d="M575 217 h130 M575 250 h130" />
      </g>
    );
  }

  if (whip) {
    return (
      <g className="bp-stroke">
        <rect x="95" y="292" width="238" height="64" rx="20" />
        {Array.from({ length: 6 }, (_, index) => <line key={index} x1={124 + index * 35} y1="298" x2={106 + index * 39} y2="350" />)}
        <path d="M333 324 C446 248 398 124 522 126 C663 128 614 286 739 276 C818 270 827 187 778 159" />
        <path d="M778 159 l-13 35 M778 159 l31 20" />
        <circle cx="333" cy="324" r="14" />
        <path d="M150 455 C310 415 497 493 680 445" />
        {Array.from({ length: 9 }, (_, index) => <circle key={index} cx={180 + index * 58} cy={446 + ((index % 2) * 12)} r="9" />)}
      </g>
    );
  }

  const top = short ? 92 : 48;
  const tip = short ? 320 : 690;
  return (
    <g className="bp-stroke" transform={`rotate(${(seed % 9) - 4} 450 300)`}>
      <rect x={x} y="287" width={short ? 170 : 230} height="54" rx="15" />
      {Array.from({ length: 6 }, (_, index) => <line key={index} x1={x + 25 + index * 29} y1="291" x2={x + 8 + index * 32} y2="336" />)}
      <path d={`M${x + (short ? 166 : 226)} 275 L${x + (short ? 166 : 226)} 353 L${x + (short ? 218 : 293)} 339 L${x + (short ? 218 : 293)} 289 Z`} />
      {axe ? (
        <g>
          <line x1={x + 253} y1="313" x2={tip} y2="313" />
          <path d={`M${tip - 92} 308 Q${tip - 78} 122 ${tip + 72} ${top + 84} L${tip + 50} 312 Z`} />
          <path d={`M${tip - 86} 318 Q${tip - 64} 472 ${tip + 43} 471 L${tip + 50} 318 Z`} />
        </g>
      ) : hammer ? (
        <g>
          <line x1={x + 253} y1="313" x2={tip - 82} y2="313" />
          <path d={`M${tip - 110} 196 L${tip + 75} 196 L${tip + 100} 248 L${tip + 82} 379 L${tip - 112} 379 L${tip - 138} 248 Z`} />
          <rect x={tip - 75} y="224" width="104" height="126" rx="9" />
        </g>
      ) : staff ? (
        <g>
          <line x1={x + 253} y1="313" x2={tip} y2="313" />
          <path d={`M${tip - 25} 313 l46 -80 l46 80 l-46 80 z`} />
          <circle cx={tip + 21} cy="313" r="21" />
        </g>
      ) : (
        <g>
          <path d={`M${x + (short ? 208 : 283)} 289 L${tip - 26} ${top + 46} L${tip + 28} ${top} L${tip - 1} 313 L${tip + 28} ${582 - top} L${tip - 26} ${536 - top} L${x + (short ? 208 : 283)} 339 Z`} />
          <line x1={x + (short ? 227 : 302)} y1="314" x2={tip - 14} y2={top + 72} />
          {chain && Array.from({ length: short ? 6 : 13 }, (_, index) => (
            <path key={index} d={`M${x + 254 + index * 27} ${306 - index * 7} l12 -9 l12 11 l-12 10 z`} />
          ))}
        </g>
      )}
      <g transform="translate(140 460)">
        <line x1="0" y1="36" x2="610" y2="36" />
        <path d="M18 12 h132 l24 24 -24 24 h-132 l-18-24 z" />
        <path d="M232 8 l275 28 -275 28 42-28 z" />
        <line x1="0" y1="82" x2="610" y2="82" />
        <line x1="0" y1="75" x2="0" y2="89" />
        <line x1="610" y1="75" x2="610" y2="89" />
      </g>
    </g>
  );
}

export function WeaponBlueprint({ item, installedUpgrades = [] }: WeaponBlueprintProps) {
  const seed = hash(item.id);
  const patternId = `grid-${useId().replace(/:/g, "")}`;
  const serial = `${item.kind === "melee" ? "M" : "R"}-${String(seed).slice(0, 3)}-${String(seed).slice(-4)}`;

  return (
    <figure className="weapon-blueprint" aria-label={`Технический чертёж: ${item.name}`}>
      <svg viewBox="0 0 900 620" role="img">
        <defs>
          <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" className="bp-grid-minor" />
          </pattern>
        </defs>
        <rect width="900" height="620" className="bp-background" />
        <rect width="900" height="620" fill={`url(#${patternId})`} />
        <path d="M0 120H900 M0 240H900 M0 360H900 M0 480H900 M180 0V620 M360 0V620 M540 0V620 M720 0V620" className="bp-grid-major" />
        <path d="M24 24H876V596H24Z" className="bp-frame" />
        {item.kind === "melee" ? <MeleeDrawing item={item} seed={seed} /> : <RangedDrawing item={item} seed={seed} />}
        <g className="bp-callout">
          <path d="M42 86H282" /><path d="M618 86H858" /><path d="M42 546H282" /><path d="M618 546H858" />
          <text x="42" y="74">ОРДО-ТЕХНИЧЕСКИЙ АРХИВ</text>
          <text x="858" y="74" textAnchor="end">СХЕМА {serial}</text>
          <text x="42" y="570">МАСШТАБ: УСЛОВНЫЙ</text>
          <text x="858" y="570" textAnchor="end">ДОПУСК: {String((seed % 89) + 10).padStart(2, "0")}</text>
        </g>
      </svg>
      <figcaption>
        <span><small>Схема {serial}</small><strong>{item.name}</strong></span>
        <span><small>Модификации</small><strong>{installedUpgrades.length || "Нет"}</strong></span>
      </figcaption>
    </figure>
  );
}

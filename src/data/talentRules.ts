import talentSource from "./talents-raw.txt?raw";
import { TALENTS } from "./rules";

const HEADING_ALIASES: Record<string, string> = {
  piety: "НАБОЖНОСТЬ (ИМПЕРСКИЙ КУЛЬТ)",
};

const STOP_MARKERS = [
  "ТАБЛИЦА ЗАНЯТИЙ ЧЕСТНЫХ ТРУЖЕНИКОВ",
  "ИМПЕРСКИЕ СВЯТЫЕ",
  "УМЕНИЯ И ТАЛАНТЫ",
];

const TALENT_STOP_MARKERS: Record<string, string> = {
  "flanking-fire": "Хотя некоторые удобные совпадения или необъ-",
};

function normalizeHeading(value: string) {
  return value
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("ru");
}

function cleanTalentText(value: string, talentId: string) {
  let text = value.split("\f", 1)[0];
  const talentStopMarker = TALENT_STOP_MARKERS[talentId];
  if (talentStopMarker) {
    const markerIndex = text.indexOf(talentStopMarker);
    if (markerIndex >= 0) text = text.slice(0, markerIndex);
  }
  for (const marker of STOP_MARKERS) {
    const markerIndex = text.indexOf(marker);
    if (markerIndex >= 0) text = text.slice(0, markerIndex);
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\d{3}$/.test(line) && line !== "IV" && line !== "IV ТАЛАНТЫ");

  let result = "";
  for (const line of lines) {
    const bulletLine = line.replace(/^0\s+/, "• ");
    if (!result) {
      result = bulletLine;
      continue;
    }
    if (/[-‐‑‒–—]$/.test(result) && /^[а-яё]/.test(bulletLine)) {
      result = `${result.slice(0, -1)}${bulletLine}`;
    } else {
      result += `\n${bulletLine}`;
    }
  }
  return result.trim();
}

function buildTalentRules() {
  const lines = talentSource.split(/\r?\n/);
  const headingByTalent = TALENTS.map((talent) => ({
    id: talent.id,
    heading: normalizeHeading(HEADING_ALIASES[talent.id] ?? talent.name),
  })).sort((a, b) => b.heading.length - a.heading.length);

  const starts: Array<{ id: string; line: number; length: number }> = [];
  const claimedLines = new Set<number>();

  for (const talent of headingByTalent) {
    for (let index = 0; index < lines.length; index += 1) {
      for (let length = 1; length <= 3 && index + length <= lines.length; length += 1) {
        if (Array.from({ length }, (_, offset) => claimedLines.has(index + offset)).some(Boolean)) continue;
        const candidate = normalizeHeading(lines.slice(index, index + length).join(" "));
        if (candidate !== talent.heading) continue;
        starts.push({ id: talent.id, line: index, length });
        for (let offset = 0; offset < length; offset += 1) claimedLines.add(index + offset);
        index = lines.length;
        break;
      }
    }
  }

  starts.sort((a, b) => a.line - b.line);
  return Object.fromEntries(starts.map((start, index) => {
    const nextLine = starts[index + 1]?.line ?? lines.length;
    return [start.id, cleanTalentText(lines.slice(start.line + start.length, nextLine).join("\n"), start.id)];
  })) as Record<string, string>;
}

export const TALENT_RULE_TEXT = buildTalentRules();

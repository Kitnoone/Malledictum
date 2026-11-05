import equipment from './supplementEquipment.json';
import bestiary from './bestiary.json';
import { CATALOG as CORE_CATALOG, TALENTS as CORE_TALENTS, SKILLS as CORE_SKILLS, type CatalogItem, type Talent, type Skill } from './rules';
import { SKILL_RULE_TEXT as CORE_SKILL_TEXT, type SkillRuleText } from './skillRules';
import { MECHANICUS_SPECIALIZATIONS, MECHANICUS_TALENTS } from './mechanicusRules';

export type SupplementId = 'adversary' | 'requisition' | 'mechanicus';
export const BOOKS: Record<SupplementId, { title: string; short: string; pages: number }> = {
  adversary: { title: 'Махарийский справочник противников', short: 'Противники Махария', pages: 160 },
  requisition: { title: 'Арсеналы Махария', short: 'Арсеналы Махария', pages: 127 },
  mechanicus: { title: 'Адептус Механикус', short: 'Механикус', pages: 160 },
};
export type BestiaryAttack = { name: string; test: string; damage: string; range: string; traits: string; text: string };
export type BestiaryEntry = {
  id: string; name: string; originalName: string; source: SupplementId; page: number;
  faction: string; role: string; size: string; vehicle: boolean; characteristics: number[];
  stats: string[] | string[][]; resolveLabel: string; skills: string;
  traits: { name: string; text: string }[]; attacks: BestiaryAttack[];
};
export const BESTIARY = bestiary as BestiaryEntry[];
export const SUPPLEMENT_EQUIPMENT = equipment as CatalogItem[];
export const CATALOG: CatalogItem[] = [...CORE_CATALOG, ...SUPPLEMENT_EQUIPMENT];
export const WEAPON_UPGRADES = CATALOG.filter(item => item.kind === 'weapon-upgrade');
export const TALENTS: Talent[] = [...CORE_TALENTS, ...MECHANICUS_TALENTS];
export const SKILLS: Skill[] = CORE_SKILLS.map(skill => ({ ...skill, specializations: [...skill.specializations, ...MECHANICUS_SPECIALIZATIONS.filter(entry => entry.skillId === skill.id).map(entry => ({ id: entry.id, name: entry.name, special: Boolean(entry.requirements), requirements: entry.requirements }))] }));
export const SKILL_RULE_TEXT: Record<string, SkillRuleText> = Object.fromEntries(Object.entries(CORE_SKILL_TEXT).map(([id, rule]) => [id, { ...rule, specializations: { ...rule.specializations, ...Object.fromEntries(MECHANICUS_SPECIALIZATIONS.filter(entry => entry.skillId === id).map(entry => [entry.id, { description: entry.description, page: entry.page, source: 'mechanicus' }])) } }]));

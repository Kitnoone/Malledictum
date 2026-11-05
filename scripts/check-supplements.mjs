import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
const bestiary = read('bestiary');
const equipment = read('supplementEquipment');
const books = { adversary: 160, requisition: 127, mechanicus: 160 };
assert.equal(bestiary.length, 137);
assert.equal(equipment.length, 338);
for (const list of [bestiary, equipment]) {
  assert.equal(new Set(list.map(entry => entry.id)).size, list.length, 'Duplicate content IDs would corrupt saved references');
  for (const entry of list) {
    assert.ok(entry.name.trim() && /[А-Яа-я]/.test(entry.name), `Missing Russian name: ${entry.id}`);
    assert.ok(entry.page >= 1 && entry.page <= books[entry.source], `Invalid PDF source: ${entry.id}`);
  }
}
for (const entry of bestiary) {
  assert.equal(entry.stats.length, 6, `Incomplete combat profile: ${entry.id}`);
  if (!entry.vehicle) {
    assert.equal(entry.characteristics.length, 9, `Incomplete characteristics: ${entry.id}`);
    assert.ok(entry.characteristics.every(value => Number.isFinite(value) && value >= 0));
  }
  assert.ok(entry.attacks.length > 0, `No attack profiles: ${entry.id}`);
  assert.ok(entry.traits.length > 0, `No traits: ${entry.id}`);
  for (const attack of entry.attacks) {
    assert.ok(attack.name && attack.test && attack.damage && attack.range, `Incomplete attack: ${entry.id}`);
    assert.ok(!/[A-Za-z]{3,}/.test(`${attack.test} ${attack.damage} ${attack.traits}`), `Untranslated rules: ${entry.id}`);
  }
}
for (const item of equipment) {
  assert.ok(item.description.trim(), `No equipment rules: ${item.id}`);
  assert.ok(item.weightValue >= 0 && Number.isFinite(item.weightValue), `Invalid weight: ${item.id}`);
  if (item.weight === 'Не указан') assert.equal(item.weightValue, 0);
  if (item.kind === 'armor') assert.ok(item.stats['ОБ'] && item.stats['Зоны'], `Armour will not appear correctly on the sheet: ${item.id}`);
}
// Representative reference values checked against the supplied PDFs.
assert.deepEqual(bestiary.find(entry => entry.id === 'adversary-26-space-marine').characteristics, [70, 70, 90, 90, 60, 60, 50, 70, 60]);
assert.equal(equipment.find(entry => entry.originalName === 'Arc Rifle').stats['Урон'], '12');
assert.equal(equipment.find(entry => entry.originalName === 'Omnispex').kind, 'tool');
assert.equal(equipment.find(entry => entry.originalName === 'Rapid Tracking Optics').kind, 'weapon-upgrade');
console.log('PASS: supplement integrity, Russian rules, source pages, stable IDs, armour integration and reference profiles.');

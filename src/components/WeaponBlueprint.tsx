import type { CatalogItem } from "../data/rules";

type WeaponBlueprintProps = {
  item: CatalogItem;
  installedUpgrades?: string[];
};

export function WeaponBlueprint({ item, installedUpgrades = [] }: WeaponBlueprintProps) {
  return (
    <figure className="weapon-blueprint" aria-label={`Технический чертёж: ${item.name}`}>
      <img
        src={`./weapon-icons/${item.id}.png`}
        alt={`Чертёж оружия «${item.name}»`}
        draggable={false}
      />
      <figcaption>
        <span><small>{item.category}</small><strong>{item.name}</strong></span>
        <span><small>Модификации</small><strong>{installedUpgrades.length || "Нет"}</strong></span>
      </figcaption>
    </figure>
  );
}

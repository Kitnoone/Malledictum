import type { CatalogItem } from "../data/rules";

type WeaponBlueprintProps = {
  item: CatalogItem;
  installedUpgrades?: string[];
};

export function WeaponBlueprint({ item, installedUpgrades = [] }: WeaponBlueprintProps) {
  const imageExtension = item.kind === "ranged" ? "webp" : "png";

  return (
    <figure className="weapon-blueprint" aria-label={`Технический чертёж: ${item.name}`}>
      <img
        src={`./weapon-icons/${item.id}.${imageExtension}`}
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

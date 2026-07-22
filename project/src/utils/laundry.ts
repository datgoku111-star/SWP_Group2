export function translateService(name: string, desc: string | undefined, isVN: boolean) {
  const cleanName = name.replace("Laundry - ", "").trim();
  if (isVN) return { name: cleanName, desc };

  const translations: Record<string, { name: string; desc: string }> = {
    "Áo thun": { name: "T-shirt", desc: "Wash and fold short/long sleeve T-shirt" },
    "Áo sơ mi": { name: "Shirt", desc: "Wash and iron shirt" },
    "Quần âu": { name: "Pants", desc: "Wash and press pants" },
    "Quần kaki": { name: "Kaki Pants", desc: "Wash and iron kaki pants" },
    "Áo vest": { name: "Suit Jacket", desc: "Dry clean premium suit jacket" },
    "Giặt sơ mi": { name: "Shirt", desc: "Wash and iron shirt" },
    "Giặt quần tây": { name: "Pants", desc: "Wash and press pants" },
    "Giặt hấp vest": { name: "Suit Jacket", desc: "Dry clean premium suit jacket" },
    "Laundry - Shirt": { name: "Shirt", desc: "Wash and iron shirt" },
    "Laundry - Pants": { name: "Pants", desc: "Wash and press pants" },
    "Laundry - Suit": { name: "Suit Jacket", desc: "Dry clean premium suit jacket" }
  };

  const matched = translations[cleanName] || translations[name];
  if (matched) return matched;
  return { name: cleanName, desc: desc || "" };
}

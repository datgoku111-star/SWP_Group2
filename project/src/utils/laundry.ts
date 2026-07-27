export function translateService(name: string, desc: string | undefined, isVN: boolean) {
  const cleanName = name.replace("Laundry - ", "").trim();

  const vnTranslations: Record<string, { name: string; desc: string }> = {
    "Banh Mi": { name: "Bánh Mì", desc: "Bánh mì kẹp thịt Việt Nam truyền thống" },
    "Club Sandwich": { name: "Bánh Mì Sandwich Club", desc: "Sandwich kẹp 3 tầng với thịt nguội, trứng, phô mai" },
    "Com Tam": { name: "Cơm Tấm Sườn Bì Chả", desc: "Cơm tấm truyền thống phục vụ với sườn nướng, bì chả" },
    "Pho Bo": { name: "Phở Bò Đặc Biệt", desc: "Phở bò truyền thống Việt Nam với bò viên, nạm chín" },
    "Steak & Fries": { name: "Bò Bít Tết & Khoai Tây Chiên", desc: "Thịt thăn bò áp chảo hảo hạng dùng kèm khoai tây chiên" },
    "Ca Phe Sua Da": { name: "Cà Phê Sữa Đá", desc: "Cà phê pha phin truyền thống với sữa đặc và đá" },
    "Fresh Juice": { name: "Nước Ép Trái Cây Tươi", desc: "Nước ép cam, dưa hấu hoặc dứa nguyên chất" },
    "Beer Tiger": { name: "Bia Tiger Lon", desc: "Bia Tiger ướp lạnh sảng khoái" },
    "Wine House Red": { name: "Rượu Vang Đỏ Ly", desc: "Rượu vang đỏ hảo hạng phục vụ theo ly" }
  };

  const enTranslations: Record<string, { name: string; desc: string }> = {
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
    "Laundry - Suit": { name: "Suit Jacket", desc: "Dry clean premium suit jacket" },
    "Phở Bò Kobe Đặc Biệt": { name: "Special Kobe Beef Pho", desc: "Traditional Vietnamese beef noodle soup with Kobe beef" },
    "Nước Cam Tươi Nguyên Chất": { name: "Fresh Orange Juice", desc: "100% natural freshly squeezed orange juice" }
  };

  if (isVN) {
    const matched = vnTranslations[cleanName] || vnTranslations[name];
    if (matched) return matched;
    return { name: cleanName, desc: desc || "" };
  } else {
    const matched = enTranslations[cleanName] || enTranslations[name];
    if (matched) return matched;
    return { name: cleanName, desc: desc || "" };
  }
}

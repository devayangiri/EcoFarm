/**
 * Centralized Public Image Asset Configuration
 * Local, optimized image assets served from /public/images
 */

export interface ImageAsset {
  src: string;
  alt: string;
}

export const IMAGE_ASSETS = {
  hero: {
    agriculture: {
      src: "/images/hero-agriculture.jpg",
      alt: "Farmer inspecting vibrant green crops at sunrise",
    },
    aquaculture: {
      src: "/images/hero-aquaculture.jpg",
      alt: "Freshwater aquaculture fish farming aeration and ponds",
    },
  },
  showcase: {
    agriculture: {
      src: "/images/showcase-agriculture.jpg",
      alt: "Modern agricultural harvesting and crop production",
    },
    aquaculture: {
      src: "/images/showcase-aquaculture.jpg",
      alt: "Inland aquaculture fish cultivation and harvest nets",
    },
  },
  categories: {
    grains: {
      src: "/images/category-grains.jpg",
      alt: "Wholesale grains and cereal harvest",
      title: "Grains and Cereals",
      desc: "Paddy, wheat, maize and millets",
      href: "/marketplace?category=GRAINS",
    },
    vegetables: {
      src: "/images/category-vegetables.jpg",
      alt: "Fresh harvest vegetables and produce",
      title: "Vegetables",
      desc: "Potatoes, onions, tomatoes and greens",
      href: "/marketplace?category=VEGETABLES",
    },
    fruits: {
      src: "/images/category-fruits.jpg",
      alt: "Fresh commercial orchard fruits",
      title: "Fruits",
      desc: "Mangoes, bananas, citrus and apples",
      href: "/marketplace?category=FRUITS",
    },
    seeds: {
      src: "/images/category-seeds.jpg",
      alt: "Certified agricultural seeds and grains",
      title: "Certified Seeds",
      desc: "Hybrid seeds and planting stock",
      href: "/marketplace?category=SEEDS",
    },
    fish: {
      src: "/images/category-fish.jpg",
      alt: "Freshwater fish and aquaculture harvest",
      title: "Fish and Aquaculture",
      desc: "Rohu, Catla, Prawns and Pangasius",
      href: "/marketplace?sector=AQUACULTURE",
    },
    machinery: {
      src: "/images/category-machinery.jpg",
      alt: "Agricultural machinery and modern farm equipment",
      title: "Machinery and Rentals",
      desc: "Tractors, harvesters and sprayers",
      href: "/services?category=MACHINERY_RENTAL",
    },
    inputs: {
      src: "/images/category-inputs.jpg",
      alt: "Agricultural inputs and bio-fertilizers",
      title: "Agricultural Inputs",
      desc: "Organic fertilizers, feed and nutrients",
      href: "/marketplace?category=INPUTS",
    },
    logistics: {
      src: "/images/category-logistics.jpg",
      alt: "Cold storage warehouse and logistics facility",
      title: "Logistics and Storage",
      desc: "Cold storage, warehouses and freight",
      href: "/services?category=COLD_STORAGE",
    },
  },
  fallbacks: {
    agriculture: {
      src: "/images/fallback-agriculture.jpg",
      alt: "Agricultural crop sample representation",
    },
    aquaculture: {
      src: "/images/fallback-aquaculture.jpg",
      alt: "Aquaculture harvest sample representation",
    },
  },
} as const;

/**
 * Returns an appropriate fallback image for a product based on sector and category
 */
export function getProductFallbackImage(
  sector?: string,
  category?: string
): ImageAsset {
  if (sector === "AQUACULTURE") {
    return IMAGE_ASSETS.fallbacks.aquaculture;
  }
  const cat = category?.toLowerCase() || "";
  if (cat.includes("grain") || cat.includes("paddy") || cat.includes("wheat")) {
    return IMAGE_ASSETS.categories.grains;
  }
  if (cat.includes("veg") || cat.includes("potato") || cat.includes("onion")) {
    return IMAGE_ASSETS.categories.vegetables;
  }
  if (cat.includes("fruit")) {
    return IMAGE_ASSETS.categories.fruits;
  }
  if (cat.includes("seed")) {
    return IMAGE_ASSETS.categories.seeds;
  }
  return IMAGE_ASSETS.fallbacks.agriculture;
}

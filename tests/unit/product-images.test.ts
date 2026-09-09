import { describe, it, expect } from "vitest";
import { ProductImageInputSchema, CreateProductSchema } from "@/lib/validators/product.schema";

describe("Product Image Gallery Validation", () => {
  it("should accept compressed base64 data URLs from photo gallery", () => {
    const validDataUrl = {
      url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      altText: "Farm Rice Harvest",
      isPrimary: true,
      sortOrder: 0,
    };

    const result = ProductImageInputSchema.safeParse(validDataUrl);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe(validDataUrl.url);
      expect(result.data.isPrimary).toBe(true);
    }
  });

  it("should accept PNG and WEBP data URLs from device gallery", () => {
    const pngImage = {
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      isPrimary: false,
    };
    const webpImage = {
      url: "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
      isPrimary: false,
    };

    expect(ProductImageInputSchema.safeParse(pngImage).success).toBe(true);
    expect(ProductImageInputSchema.safeParse(webpImage).success).toBe(true);
  });

  it("should continue to accept standard HTTP and HTTPS web URLs", () => {
    const httpsImage = {
      url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
      altText: "Unsplash Paddy",
      isPrimary: true,
    };
    const httpImage = {
      url: "http://example.com/fish.jpg",
      isPrimary: false,
    };

    expect(ProductImageInputSchema.safeParse(httpsImage).success).toBe(true);
    expect(ProductImageInputSchema.safeParse(httpImage).success).toBe(true);
  });

  it("should reject non-image strings and invalid protocols", () => {
    const invalidInputs = [
      { url: "javascript:alert(1)" },
      { url: "ftp://storage.com/image.jpg" },
      { url: "not-a-valid-url-or-data" },
      { url: "data:text/plain;base64,SGVsbG8=" },
    ];

    for (const input of invalidInputs) {
      const result = ProductImageInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    }
  });

  it("should validate full CreateProductSchema with multiple gallery images", () => {
    const productPayload = {
      title: "Organic Gobindobhog Rice",
      description: "Aromatic premium Gobindobhog paddy freshly harvested from Purba Bardhaman fields.",
      sector: "AGRICULTURE",
      category: "Cereals & Grains",
      variety: "Gobindobhog",
      pricePerUnit: 4800,
      unit: "QUINTAL",
      minimumOrderQuantity: 2,
      availableStock: 50,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      images: [
        {
          url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
          altText: "Cover photo",
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABBA...",
          altText: "Harvest photo 2",
          isPrimary: false,
          sortOrder: 1,
        },
      ],
    };

    const result = CreateProductSchema.safeParse(productPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images).toHaveLength(2);
      expect(result.data.images?.[0].isPrimary).toBe(true);
      expect(result.data.images?.[1].isPrimary).toBe(false);
    }
  });

  it("should reject more than 8 images in CreateProductSchema", () => {
    const images = Array.from({ length: 9 }, (_, i) => ({
      url: `data:image/jpeg;base64,image_${i}`,
      isPrimary: i === 0,
    }));

    const productPayload = {
      title: "Fresh Rohu Fish",
      description: "Freshly harvested pond rohu fish from certified aquaculture farm.",
      sector: "AQUACULTURE",
      category: "Freshwater Fish",
      pricePerUnit: 180,
      unit: "KG",
      minimumOrderQuantity: 10,
      availableStock: 200,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      images,
    };

    const result = CreateProductSchema.safeParse(productPayload);
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { generateIntelligentFallback } from "@/lib/ai-fallback";

describe("EcoFarm AI - Intelligent Fallback Knowledge Base", () => {
  it("should respond to greeting queries", () => {
    const res = generateIntelligentFallback("hello");
    expect(res).toBeDefined();
    expect(res).toContain("Welcome to EcoFarm AI");
  });

  it("should provide detailed paddy yellow leaf diagnosis", () => {
    const res = generateIntelligentFallback("What are the common causes of yellow leaves in paddy?");
    expect(res).toBeDefined();
    expect(res).toContain("Nitrogen (N) Deficiency");
    expect(res).toContain("Zinc (Zn) Deficiency");
  });

  it("should provide aquaculture water quality guidance", () => {
    const res = generateIntelligentFallback("How can I improve fish pond water quality?");
    expect(res).toBeDefined();
    expect(res).toContain("Dissolved Oxygen (DO)");
    expect(res).toContain("Water pH");
  });

  it("should provide bulk buyer procurement guidance", () => {
    const res = generateIntelligentFallback("How can I find bulk buyers?");
    expect(res).toBeDefined();
    expect(res).toContain("Marketplace");
  });

  it("should provide MOQ explanation", () => {
    const res = generateIntelligentFallback("How does MOQ work?");
    expect(res).toBeDefined();
    expect(res).toContain("Minimum Order Quantity");
  });

  it("should provide demand forecasting advice", () => {
    const res = generateIntelligentFallback("How can demand forecasting help farmers?");
    expect(res).toBeDefined();
    expect(res).toContain("Demand forecasting");
  });

  it("should provide route optimization advice", () => {
    const res = generateIntelligentFallback("What can route optimization improve?");
    expect(res).toBeDefined();
    expect(res).toContain("Route Optimization");
  });
});

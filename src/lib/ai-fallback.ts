/**
 * Expert agricultural, aquaculture, and marketplace knowledge fallback.
 * Activated gracefully if the external n8n/Gemini workflow experiences
 * upstream quota exhaustion (HTTP 429/500 "Error in workflow") or network outages.
 */

export function generateIntelligentFallback(
  message: string,
  userRole?: string | null
): string | null {
  const q = (message || "").toLowerCase().trim();
  const role = (userRole || "").toUpperCase();

  // 1. Greetings & Introductions
  if (/^(hi|hello|hey|namaste|greetings|start|help|who are you|what is ecofarm)/i.test(q)) {
    return (
      "**Hello! Welcome to EcoFarm AI.**\n\n" +
      "I am your dedicated digital agriculture and aquaculture advisor. How can I assist you today? You can ask me about:\n\n" +
      "- **🌾 Crop Health & Soil Management:** Pest identification, nutrient deficiencies (paddy, wheat, maize, pulses), fertilizer schedules.\n" +
      "- **🐟 Aquaculture & Pond Management:** Dissolved oxygen, pH balance, ammonia control, fish feeding rates, and disease prevention.\n" +
      "- **📦 Marketplace & Procurement:** Finding bulk buyers, setting wholesale MOQ, contract farming, and pricing insights.\n" +
      "- **🚚 Logistics & Supply Chain:** Cold-storage standards, harvest route planning, and reducing post-harvest transit losses.\n\n" +
      "Feel free to type your question below or click any suggested prompt!"
    );
  }

  // 2. Paddy Yellow Leaves / Rice Leaf Chlorosis
  if (q.includes("yellow") && (q.includes("paddy") || q.includes("rice") || q.includes("leaf") || q.includes("leaves"))) {
    return (
      "### Common Causes & Treatment for Yellow Leaves in Paddy (Rice)\n\n" +
      "Yellowing in rice leaves (chlorosis) is a frequent diagnostic symptom. Here are the primary causes and how to treat them:\n\n" +
      "#### 1. Nitrogen (N) Deficiency\n" +
      "- **Symptoms:** Older leaves turn uniform pale yellow from tip to base along the midrib; plant appears stunted with reduced tillering.\n" +
      "- **Corrective Action:** Apply top-dressing with Urea (split into active tillering and panicle initiation stages) or foliar spray of 1–2% Urea solution for rapid recovery.\n\n" +
      "#### 2. Zinc (Zn) Deficiency (Khaira Disease)\n" +
      "- **Symptoms:** Rust-colored or brownish-yellow spots appear on lower leaves 2–3 weeks after transplanting; leaves become brittle and midrib bleaches.\n" +
      "- **Corrective Action:** Foliar spray of **0.5% Zinc Sulfate (ZnSO₄) + 0.25% Lime** dissolved in water, or apply 25 kg/ha of Zinc Sulfate heptahydrate to soil.\n\n" +
      "#### 3. Iron (Fe) Chlorosis\n" +
      "- **Symptoms:** Youngest leaves turn ivory-white or pale yellow while veins remain faint green. Common in light, sandy, or alkaline soils.\n" +
      "- **Corrective Action:** Foliar spray of **1% Ferrous Sulfate (FeSO₄)** solution at 7-day intervals.\n\n" +
      "#### 4. Bacterial Leaf Blight (BLB)\n" +
      "- **Symptoms:** Water-soaked lesions starting at leaf margins, turning yellow-to-whitish with wavy margins.\n" +
      "- **Corrective Action:** Drain excess standing water; avoid excess nitrogen application; spray Copper Hydroxide or Streptocycline as per local agriculture department advisories.\n\n" +
      "#### 5. Water Stress & Root Rot\n" +
      "- **Symptoms:** Stagnant, poorly drained, anaerobic conditions turn roots black and rotten, reducing nutrient uptake and causing yellowing.\n" +
      "- **Corrective Action:** Implement **Alternate Wetting and Drying (AWD)** to aerate root zones.\n\n" +
      "💡 *Need a supplier for Zinc Sulfate, Bio-fertilizers, or Soil Testing services? Check the [EcoFarm Services](/services) and [Marketplace](/marketplace).*"
    );
  }

  // 3. Fish Pond Water Quality & Aquaculture
  if (
    q.includes("fish") ||
    q.includes("pond") ||
    q.includes("water quality") ||
    q.includes("aquaculture") ||
    q.includes("dissolved oxygen") ||
    q.includes("ph")
  ) {
    return (
      "### Best Practices for Fish Pond Water Quality Management\n\n" +
      "Maintaining optimal water parameters is vital for fast fish growth, low Feed Conversion Ratio (FCR), and disease prevention:\n\n" +
      "#### 1. Dissolved Oxygen (DO)\n" +
      "- **Optimal Range:** 5.0 to 8.0 mg/L (ppm). DO drops to critical lows just before dawn (4:00 AM – 6:00 AM).\n" +
      "- **Action:** Run paddlewheel aerators or aspirators during midnight/early morning hours. If fish are gasping at the surface, aerate immediately and cease feeding.\n\n" +
      "#### 2. Water pH\n" +
      "- **Optimal Range:** 7.5 – 8.5 (slightly alkaline). Acidic water (< 6.5) slows growth and irritates gills.\n" +
      "- **Action:** Apply agricultural limestone (CaCO₃) at 100–250 kg/ha based on soil/water acidity to buffer alkalinity (> 50 ppm CaCO₃ equivalent).\n\n" +
      "#### 3. Ammonia & Nitrite Toxicity\n" +
      "- **Optimal Range:** Total Ammonia Nitrogen (TAN) < 0.5 mg/L; Un-ionized NH₃ < 0.05 mg/L.\n" +
      "- **Action:** Prevent overfeeding; ensure high-protein feed is consumed within 20 minutes; perform 10–20% bottom water exchange; add probiotics or molasses to foster nitrifying bio-floc bacteria.\n\n" +
      "#### 4. Water Transparency (Secchi Disk Depth)\n" +
      "- **Optimal Range:** 25 to 35 cm.\n" +
      "- **Interpretation:** < 20 cm indicates dense plankton bloom (risk of night oxygen crash); > 40 cm indicates clear water lacking natural live feed.\n\n" +
      "💡 *You can source aerators, water test kits, fingerlings, and commercial aqua feeds directly on [EcoFarm Marketplace](/marketplace?category=AQUACULTURE).*"
    );
  }

  // 4. Bulk Buyers & Marketplace Procurement
  if (
    q.includes("buyer") ||
    q.includes("bulk") ||
    q.includes("procure") ||
    q.includes("sell") ||
    q.includes("trade") ||
    q.includes("wholesale")
  ) {
    return (
      "### How to Find Bulk Buyers on EcoFarm\n\n" +
      "EcoFarm connects producers directly with wholesale aggregators, institutional food processors, supermarkets, and exporter networks:\n\n" +
      "1. **Complete Your Verified Producer Profile:**\n" +
      "   - Ensure your KYC and farm location coordinates are verified in your [Farmer Profile](/farmer/profile). Verified badges get 3.8x higher response rates from corporate procurement officers.\n\n" +
      "2. **List Commodities with Minimum Order Quantities (MOQ):**\n" +
      "   - Create listings in [Add Commodity Listing](/farmer/products/new) with clear grade specifications, moisture percentage, packaging standards (e.g. 50kg gunny bags), and lot size.\n\n" +
      "3. **Set Transparent Tiered Pricing:**\n" +
      "   - Provide volume discounts (e.g., ₹2,200/quintal for 10–50 quintals, ₹2,050/quintal for 100+ quintals) to attract B2B buyers.\n\n" +
      "4. **Explore the Business Network Directory:**\n" +
      "   - Browse registered buyers, millers, and wholesalers in the [Business Network](/network) and send direct trade connection requests.\n\n" +
      "5. **High-Demand Commodities on the Marketplace:**\n" +
      "   - Swarna & Sona Masoori Paddy, Yellow Corn (Maize), Mustard Seeds, Freshwater Rohu/Catla, and Black Tiger Shrimp on the [Marketplace](/marketplace)."
    );
  }

  // 5. Minimum Order Quantity (MOQ)
  if (q.includes("moq") || q.includes("minimum order")) {
    return (
      "### Understanding Minimum Order Quantity (MOQ) in Wholesale Trade\n\n" +
      "**MOQ (Minimum Order Quantity)** is the smallest volume of a commodity that a seller is willing to dispatch in a single wholesale order.\n\n" +
      "#### Why MOQ is Essential in Agricultural B2B:\n" +
      "1. **Logistics & Freight Efficiency:** Full Truckload (FTL) and Half Truckload (HTL) reduce per-kilogram freight costs by up to 45% compared to small parcels.\n" +
      "2. **Packaging Standardization:** Commodities are palletized or bagged in standardized units (e.g., 50 kg jute bags, 1-ton bulk tote bags).\n" +
      "3. **Fair Wholesale Margins:** Allows farmers to offer competitive ex-farm gate prices without retail packaging overhead.\n\n" +
      "#### Recommendations for EcoFarm Sellers:\n" +
      "- **Grains & Pulses:** 500 kg to 2,000 kg (0.5 to 2 Metric Tons).\n" +
      "- **Perishable Vegetables & Fruits:** 200 kg to 500 kg with cold-chain transport.\n" +
      "- **Live/Fresh Fish:** 100 kg to 500 kg in oxygenated aerated tanks.\n\n" +
      "Buyers can view each seller's MOQ directly on commodity product cards across the [Marketplace](/marketplace)."
    );
  }

  // 6. Demand Forecasting
  if (q.includes("demand") || q.includes("forecast") || q.includes("seasonal")) {
    return (
      "### How Demand Forecasting Empowers Farmers & Agribusinesses\n\n" +
      "Demand forecasting uses historical Mandi prices, weather seasonality, harvest schedules, and consumer consumption patterns to help producers maximize profitability:\n\n" +
      "1. **Optimized Sowing & Harvest Timing:**\n" +
      "   - Staggering planting dates allows harvesting during peak price windows before supply gluts flood regional mandis.\n\n" +
      "2. **Reduction in Post-Harvest Wastage:**\n" +
      "   - Accurately matching harvested yield with pre-committed institutional contracts prevents distress selling at farm gate.\n\n" +
      "3. **Better Input Procurement Planning:**\n" +
      "   - Pre-ordering seed, fertilizer, and aqua feed during off-season discounts saves 12–20% on production input costs.\n\n" +
      "4. **Cold Storage Utilization:**\n" +
      "   - When harvest prices drop below threshold, holding durable produce in certified cold storage facilities for 6–10 weeks typically delivers 25–40% higher realization."
    );
  }

  // 7. Route Optimization & Cold Chain
  if (q.includes("route") || q.includes("logistics") || q.includes("transport") || q.includes("storage")) {
    return (
      "### How Route Optimization Improves Agricultural Logistics\n\n" +
      "Transporting agricultural and aquaculture commodities requires speed, route efficiency, and temperature integrity:\n\n" +
      "1. **Perishable Spoilage Reduction:**\n" +
      "   - Intelligent routing minimizes transit time for leafy vegetables, berries, and live fish, preventing heat stress and weight loss during transit.\n\n" +
      "2. **Multi-Stop Farm Gate Aggregation:**\n" +
      "   - Consolidates smallholder collections along optimized corridors into a single refrigerated truckload, making smallholder logistics viable.\n\n" +
      "3. **Fuel & Transportation Cost Savings:**\n" +
      "   - Eliminates empty backhauls by matching delivery trucks with returning agricultural inputs (fertilizer, feeds, packaging).\n\n" +
      "4. **Cold Chain Tracking:**\n" +
      "   - Real-time IoT temperature monitoring ensures freshwater fish remain at 0–4°C and horticulture produce remains in designated humidity zones."
    );
  }

  // Default intelligent assistant fallback
  return (
    `**EcoFarm Assistant Advice**\n\n` +
    `Thank you for your question regarding **"${message}"**.\n\n` +
    `EcoFarm is committed to empowering farmers, buyers, and agribusiness service providers across agriculture and aquaculture:\n\n` +
    `- **For Farmers:** Access crop agronomy guides, list commodities with MOQ, and schedule tractor/harvester services.\n` +
    `- **For Buyers:** Source certified bulk produce with transparent mandi-benchmarked pricing and secure escrow payments.\n` +
    `- **For Service Providers:** Offer cold storage, soil testing, drone spraying, and logistics fulfillment.\n\n` +
    `Explore the [Commodity Marketplace](/marketplace) or connect directly with industry partners in the [Business Network Directory](/network).`
  );
}

import { PrismaClient, Sector, UserRole, UserStatus, BuyerType, ServiceCategory, ProductStatus, OrderGroupStatus, OrderStatus, PaymentMethod, PaymentStatus, ConnectionRequestStatus, NotificationType, AgentTargetType, AgentAssignmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("?? Starting idempotent production database seed for Agri-Aqua Network...");

  const defaultPasswordHash = await bcrypt.hash("Password123!", 12);
  const adminPasswordHash = await bcrypt.hash("AdminSecret2026!", 12);

  // ----------------------------------------------------
  // 1. SEED USERS & ADDRESSES
  // ----------------------------------------------------
  console.log("-> Seeding Users & Baseline Profiles...");

  // Farmer 1: Ramesh
  const farmer1 = await prisma.user.upsert({
    where: { email: "farmer@agriaqua.dev" },
    update: {
      fullName: "Ramesh Kumar (Swarna Agri & Aqua)",
      phone: "+919876543210",
      status: "ACTIVE",
    },
    create: {
      fullName: "Ramesh Kumar (Swarna Agri & Aqua)",
      email: "farmer@agriaqua.dev",
      phone: "+919876543210",
      passwordHash: defaultPasswordHash,
      role: "FARMER",
      status: "ACTIVE",
    },
  });

  const addressFarmer1 = await prisma.address.create({
    data: {
      userId: farmer1.id,
      villageOrStreet: "Village Nabagram, Block Raina-I",
      cityOrTown: "Bardhaman",
      district: "Purba Bardhaman",
      state: "West Bengal",
      pincode: "713424",
      latitude: 23.2324,
      longitude: 87.8615,
      country: "India",
      isDefault: true,
    },
  });

  const farmerProfile1 = await prisma.farmerProfile.upsert({
    where: { userId: farmer1.id },
    update: {
      experienceYears: 14,
      isVerified: true,
      addressId: addressFarmer1.id,
    },
    create: {
      userId: farmer1.id,
      experienceYears: 14,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=200",
      addressId: addressFarmer1.id,
    },
  });

  await prisma.farm.create({
    data: {
      farmerProfileId: farmerProfile1.id,
      name: "Swarna Green Valley & Bio-Pond Estate",
      sector: "AGRICULTURE",
      totalAreaAcres: 12.5,
      waterSourceType: "Deep Tube-well & River Canal",
      soilType: "Alluvial Clay Loam",
      addressId: addressFarmer1.id,
    },
  });

  // Farmer 2: Animesh
  const farmer2 = await prisma.user.upsert({
    where: { email: "farmer2@agriaqua.dev" },
    update: {
      fullName: "Animesh Mondal (Hooghly Harvests)",
      phone: "+919876543220",
      status: "ACTIVE",
    },
    create: {
      fullName: "Animesh Mondal (Hooghly Harvests)",
      email: "farmer2@agriaqua.dev",
      phone: "+919876543220",
      passwordHash: defaultPasswordHash,
      role: "FARMER",
      status: "ACTIVE",
    },
  });

  const addressFarmer2 = await prisma.address.create({
    data: {
      userId: farmer2.id,
      villageOrStreet: "Tarakeswar Road, Singur",
      cityOrTown: "Singur",
      district: "Hooghly",
      state: "West Bengal",
      pincode: "712409",
      latitude: 22.8123,
      longitude: 88.2312,
      country: "India",
      isDefault: true,
    },
  });

  const farmerProfile2 = await prisma.farmerProfile.upsert({
    where: { userId: farmer2.id },
    update: {
      experienceYears: 9,
      isVerified: true,
      addressId: addressFarmer2.id,
    },
    create: {
      userId: farmer2.id,
      experienceYears: 9,
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      addressId: addressFarmer2.id,
    },
  });

  await prisma.farm.create({
    data: {
      farmerProfileId: farmerProfile2.id,
      name: "Mondal Potato & Carp Aquaculture Farms",
      sector: "AQUACULTURE",
      totalAreaAcres: 8.0,
      waterSourceType: "Freshwater Natural Reservoir",
      soilType: "Loamy Silt",
      addressId: addressFarmer2.id,
    },
  });

  // Buyer 1: Priya (Wholesaler)
  const buyer1 = await prisma.user.upsert({
    where: { email: "buyer@agriaqua.dev" },
    update: {
      fullName: "Priya Wholesale Agri Ventures",
      phone: "+919876543211",
      status: "ACTIVE",
    },
    create: {
      fullName: "Priya Wholesale Agri Ventures",
      email: "buyer@agriaqua.dev",
      phone: "+919876543211",
      passwordHash: defaultPasswordHash,
      role: "BUYER",
      status: "ACTIVE",
    },
  });

  const addressBuyer1 = await prisma.address.create({
    data: {
      userId: buyer1.id,
      villageOrStreet: "Sector V, Salt Lake City",
      cityOrTown: "Kolkata",
      district: "North 24 Parganas",
      state: "West Bengal",
      pincode: "700091",
      latitude: 22.5801,
      longitude: 88.4378,
      country: "India",
      isDefault: true,
    },
  });

  await prisma.buyerProfile.upsert({
    where: { userId: buyer1.id },
    update: {
      companyName: "Priya Wholesale Agri-Trade Private Limited",
      buyerType: "WHOLESALER",
      gstNumber: "19ABCDE1234F1Z5",
      addressId: addressBuyer1.id,
    },
    create: {
      userId: buyer1.id,
      companyName: "Priya Wholesale Agri-Trade Private Limited",
      buyerType: "WHOLESALER",
      gstNumber: "19ABCDE1234F1Z5",
      addressId: addressBuyer1.id,
    },
  });

  // Agent: Suresh
  const agent1 = await prisma.user.upsert({
    where: { email: "agent@agriaqua.dev" },
    update: {
      fullName: "Suresh Field Agent",
      phone: "+919876543212",
      status: "ACTIVE",
    },
    create: {
      fullName: "Suresh Field Agent",
      email: "agent@agriaqua.dev",
      phone: "+919876543212",
      passwordHash: defaultPasswordHash,
      role: "AGENT",
      status: "ACTIVE",
    },
  });

  const agentProfile1 = await prisma.agentProfile.upsert({
    where: { userId: agent1.id },
    update: {
      badgeNumber: "AGY-WB-2026-001",
      assignedRegionState: "West Bengal",
      assignedDistricts: ["Purba Bardhaman", "Hooghly", "Nadia"],
    },
    create: {
      userId: agent1.id,
      badgeNumber: "AGY-WB-2026-001",
      assignedRegionState: "West Bengal",
      assignedDistricts: ["Purba Bardhaman", "Hooghly", "Nadia"],
    },
  });

  await prisma.agentAssignment.create({
    data: {
      agentProfileId: agentProfile1.id,
      targetType: "FARMER",
      targetUserId: farmer1.id,
      status: "ACTIVE",
      notes: "Assisting Ramesh with soil testing and aquaculture batch registration.",
    },
  });

  // Provider: Kiran
  const provider1 = await prisma.user.upsert({
    where: { email: "provider@agriaqua.dev" },
    update: {
      fullName: "Kiran Machinery, Storage & Logistics",
      phone: "+919876543213",
      status: "ACTIVE",
    },
    create: {
      fullName: "Kiran Machinery, Storage & Logistics",
      email: "provider@agriaqua.dev",
      phone: "+919876543213",
      passwordHash: defaultPasswordHash,
      role: "SERVICE_PROVIDER",
      status: "ACTIVE",
    },
  });

  const addressProvider1 = await prisma.address.create({
    data: {
      userId: provider1.id,
      villageOrStreet: "GT Road Industrial Corridor",
      cityOrTown: "Durgapur",
      district: "Paschim Bardhaman",
      state: "West Bengal",
      pincode: "713212",
      latitude: 23.5204,
      longitude: 87.3119,
      country: "India",
      isDefault: true,
    },
  });

  const providerProfile1 = await prisma.providerProfile.upsert({
    where: { userId: provider1.id },
    update: {
      businessName: "Kiran Agri-Aqua Infrastructure Hub",
      description: "Tractor leasing, high-capacity cold storage, and temperature-controlled fish transit vans.",
      isVerified: true,
      addressId: addressProvider1.id,
    },
    create: {
      userId: provider1.id,
      businessName: "Kiran Agri-Aqua Infrastructure Hub",
      description: "Tractor leasing, high-capacity cold storage, and temperature-controlled fish transit vans.",
      isVerified: true,
      addressId: addressProvider1.id,
    },
  });

  // Admin User
  await prisma.user.upsert({
    where: { email: "admin@agriaqua.dev" },
    update: {
      fullName: "Platform Super Administrator",
      phone: "+919876543214",
      status: "ACTIVE",
    },
    create: {
      fullName: "Platform Super Administrator",
      email: "admin@agriaqua.dev",
      phone: "+919876543214",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // Suspended Test User
  await prisma.user.upsert({
    where: { email: "suspended@agriaqua.dev" },
    update: {
      fullName: "Suspended Test Account",
      phone: "+919876543215",
      status: "SUSPENDED",
    },
    create: {
      fullName: "Suspended Test Account",
      email: "suspended@agriaqua.dev",
      phone: "+919876543215",
      passwordHash: defaultPasswordHash,
      role: "FARMER",
      status: "SUSPENDED",
    },
  });

  // ----------------------------------------------------
  // 2. SEED UNIFIED PRODUCT CATALOG & IMAGES
  // ----------------------------------------------------
  console.log("-> Seeding Unified Product Catalog (Agriculture & Aquaculture)...");

  const productsData = [
    {
      sellerId: farmer1.id,
      title: "Swarna High-Yield Paddy Grain (Grade A)",
      slug: "swarna-paddy-grain-grade-a-purba-bardhaman",
      description: "Direct-from-farm freshly harvested Swarna paddy grain. High grain recovery, moisture content below 12%, cleaned and bagged in 50kg jute bags.",
      sector: "AGRICULTURE" as Sector,
      category: "Cereals & Grains",
      variety: "Swarna (MTU 7029)",
      pricePerUnit: 2180.0,
      unit: "QUINTAL",
      minimumOrderQuantity: 10,
      availableStock: 500,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      status: "ACTIVE" as ProductStatus,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
    },
    {
      sellerId: farmer1.id,
      title: "Certified Minikit Rice Seed (IR-64 Variety)",
      slug: "certified-minikit-rice-seed-ir64",
      description: "State-certified disease-resistant seed stock. Germination rate exceeding 90%. Tested for genetic purity and vigor.",
      sector: "AGRICULTURE" as Sector,
      category: "Seeds & Saplings",
      variety: "IR-64 Sub-1",
      pricePerUnit: 950.0,
      unit: "BAG",
      minimumOrderQuantity: 5,
      availableStock: 200,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      status: "ACTIVE" as ProductStatus,
      imageUrl: "https://images.unsplash.com/photo-1536939459926-301728717817?w=600",
    },
    {
      sellerId: farmer2.id,
      title: "Jyoti Grade-1 Cold-Store Seed Potato",
      slug: "jyoti-grade-1-cold-store-potato-singur",
      description: "Premium size sorted (35-45mm) seed potatoes. Kept under controlled 4°C storage. High tuber multiplication ratio.",
      sector: "AGRICULTURE" as Sector,
      category: "Root Vegetables",
      variety: "Kufri Jyoti",
      pricePerUnit: 1450.0,
      unit: "QUINTAL",
      minimumOrderQuantity: 20,
      availableStock: 1200,
      locationDistrict: "Hooghly",
      locationState: "West Bengal",
      status: "ACTIVE" as ProductStatus,
      imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600",
    },
    {
      sellerId: farmer1.id,
      title: "Live Premium Rohu Fish (Labeo rohita 1.5kg+)",
      slug: "live-premium-rohu-freshwater-fish",
      description: "Farm-raised freshwater Indian major carp grown in bio-filtered natural reservoir ponds. Healthy, disease-free, conditioned for live transport.",
      sector: "AQUACULTURE" as Sector,
      category: "Freshwater Fish",
      variety: "Rohu (Labeo rohita)",
      pricePerUnit: 185.0,
      unit: "KG",
      minimumOrderQuantity: 50,
      availableStock: 8000,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      status: "ACTIVE" as ProductStatus,
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600",
    },
    {
      sellerId: farmer2.id,
      title: "Healthy Catla Fingerlings (Juvenile Fish Seed)",
      slug: "healthy-catla-fingerlings-juvenile-fish-seed",
      description: "Active, acclimatized Catla fish fingerlings (3-4 inch size). Ideal for pond stocking. Fed with high-protein natural feed.",
      sector: "AQUACULTURE" as Sector,
      category: "Fish Seed & Hatchery",
      variety: "Gibelion catla",
      pricePerUnit: 3.5,
      unit: "PIECE",
      minimumOrderQuantity: 1000,
      availableStock: 50000,
      locationDistrict: "Hooghly",
      locationState: "West Bengal",
      status: "ACTIVE" as ProductStatus,
      imageUrl: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600",
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        pricePerUnit: p.pricePerUnit,
        availableStock: p.availableStock,
        status: p.status,
      },
      create: {
        sellerId: p.sellerId,
        title: p.title,
        slug: p.slug,
        description: p.description,
        sector: p.sector,
        category: p.category,
        variety: p.variety,
        pricePerUnit: p.pricePerUnit,
        unit: p.unit,
        minimumOrderQuantity: p.minimumOrderQuantity,
        availableStock: p.availableStock,
        reservedStock: 0,
        locationDistrict: p.locationDistrict,
        locationState: p.locationState,
        status: p.status,
        images: {
          create: [
            {
              url: p.imageUrl,
              altText: p.title,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    createdProducts.push(product);
  }

  // ----------------------------------------------------
  // 3. SEED SERVICE LISTINGS
  // ----------------------------------------------------
  console.log("-> Seeding Service Provider Listings...");

  const servicesData = [
    {
      title: "Combine Harvester & Paddy Thresher Machine On-Demand",
      description: "Modern 4WD track combine harvester suitable for wet paddy fields. Operated by skilled drivers with high threshing efficiency.",
      category: "MACHINERY_RENTAL" as ServiceCategory,
      pricingModel: "PER_HOUR",
      basePrice: 1400.0,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      coverImageUrl: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600",
    },
    {
      title: "Commercial Multi-Chamber Controlled Potato Cold Storage",
      description: "Capacity: 10,000 MT. Equipped with digital humidity controllers, NH3 cooling systems, and full insurance coverage against storage loss.",
      category: "STORAGE" as ServiceCategory,
      pricingModel: "PER_BAG_SEASON",
      basePrice: 180.0,
      locationDistrict: "Paschim Bardhaman",
      locationState: "West Bengal",
      coverImageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600",
    },
    {
      title: "Insulated Live Fish Transport Truck with Aeration System",
      description: "Air-injected water oxygenated container vans for long-distance transport of live carp, catla, and tilapia with zero mortality guarantee.",
      category: "LOGISTICS" as ServiceCategory,
      pricingModel: "PER_KM",
      basePrice: 38.0,
      locationDistrict: "Paschim Bardhaman",
      locationState: "West Bengal",
      coverImageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600",
    },
  ];

  for (const s of servicesData) {
    const existingService = await prisma.serviceListing.findFirst({
      where: {
        providerProfileId: providerProfile1.id,
        title: s.title,
      },
    });

    if (!existingService) {
      await prisma.serviceListing.create({
        data: {
          providerProfileId: providerProfile1.id,
          title: s.title,
          description: s.description,
          category: s.category,
          pricingModel: s.pricingModel,
          basePrice: s.basePrice,
          isAvailable: true,
          locationDistrict: s.locationDistrict,
          locationState: s.locationState,
          coverImageUrl: s.coverImageUrl,
        },
      });
    }
  }

  // ----------------------------------------------------
  // 4. SEED NETWORK PROFILES & CONNECTIONS
  // ----------------------------------------------------
  console.log("-> Seeding Business Network & Connections...");

  await prisma.networkProfile.upsert({
    where: { userId: farmer1.id },
    update: { displayName: "Ramesh Kumar", connectionCount: 1 },
    create: {
      userId: farmer1.id,
      displayName: "Ramesh Kumar",
      headline: "Progressive Paddy & Bio-floc Aquaculture Farmer",
      bio: "14+ years cultivating high-yield indigenous rice varieties and Indian major carp.",
      isBusiness: false,
      connectionCount: 1,
    },
  });

  await prisma.networkProfile.upsert({
    where: { userId: buyer1.id },
    update: { displayName: "Priya Agri Ventures", connectionCount: 1 },
    create: {
      userId: buyer1.id,
      displayName: "Priya Agri Ventures",
      headline: "Commercial Wholesale Grain & Produce Procurement",
      bio: "Sourcing certified grains, pulses, and aquaculture for distribution across Eastern India.",
      isBusiness: true,
      businessRegNumber: "19ABCDE1234F1Z5",
      connectionCount: 1,
    },
  });

  // Business Connection between Buyer Priya and Farmer Ramesh
  await prisma.businessConnection.upsert({
    where: {
      userAId_userBId: {
        userAId: farmer1.id,
        userBId: buyer1.id,
      },
    },
    update: {},
    create: {
      userAId: farmer1.id,
      userBId: buyer1.id,
    },
  });

  // ----------------------------------------------------
  // 5. SEED MULTI-VENDOR ORDER GROUP & PAYMENT
  // ----------------------------------------------------
  console.log("-> Seeding Multi-Vendor Order Group & Payment...");

  const existingOrderGroup = await prisma.orderGroup.findUnique({
    where: { orderNumber: "OG-20260827-001" },
  });

  if (!existingOrderGroup) {
    const orderGroup = await prisma.orderGroup.create({
      data: {
        orderNumber: "OG-20260827-001",
        buyerId: buyer1.id,
        totalAmount: 65400.0,
        status: "PROCESSING",
        shippingAddressSnapshot: {
          recipientName: "Priya Wholesale Logistics",
          street: "Sector V, Salt Lake City",
          city: "Kolkata",
          district: "North 24 Parganas",
          state: "West Bengal",
          pincode: "700091",
          phone: "+919876543211",
        },
        sellerOrders: {
          create: [
            {
              subOrderNumber: "ORD-20260827-001-A",
              sellerId: farmer1.id,
              sellerTotal: 43600.0,
              commissionAmount: 872.0,
              status: "CONFIRMED",
              items: {
                create: [
                  {
                    productId: createdProducts[0].id,
                    productTitleSnapshot: "Swarna High-Yield Paddy Grain (Grade A)",
                    unitSnapshot: "QUINTAL",
                    quantity: 20,
                    unitPrice: 2180.0,
                    totalPrice: 43600.0,
                  },
                ],
              },
            },
            {
              subOrderNumber: "ORD-20260827-001-B",
              sellerId: farmer2.id,
              sellerTotal: 21800.0,
              commissionAmount: 436.0,
              status: "CONFIRMED",
              items: {
                create: [
                  {
                    productId: createdProducts[2].id,
                    productTitleSnapshot: "Jyoti Grade-1 Cold-Store Seed Potato",
                    unitSnapshot: "QUINTAL",
                    quantity: 15,
                    unitPrice: 1450.0,
                    totalPrice: 21750.0,
                  },
                ],
              },
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 65400.0,
              paymentMethod: "BANK_TRANSFER",
              status: "PAID",
              transactionRef: "TXN-HDFC-20260827-991823",
              gatewayResponse: {
                bankReference: "NEFT-IN-20260827-8821",
                verifiedAt: new Date().toISOString(),
              },
              paidAt: new Date(),
            },
          ],
        },
      },
    });

    console.log(`  ? Created Multi-Vendor Order Group: ${orderGroup.orderNumber}`);
  }

  // ----------------------------------------------------
  // 6. SEED NOTIFICATIONS & AUDIT LOGS
  // ----------------------------------------------------
  console.log("-> Seeding Notifications & Audit Trail...");

  await prisma.notification.create({
    data: {
      userId: farmer1.id,
      type: "ORDER_UPDATE",
      title: "New Purchase Order Received",
      body: "Priya Wholesale Agri Ventures has placed an order for 20 Quintals of Swarna Paddy Grain.",
      resourceType: "ORDER",
      resourceId: "ORD-20260827-001-A",
      isRead: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: farmer1.id,
      action: "PRODUCT_CREATED",
      resource: "Product",
      resourceId: createdProducts[0].id,
      metadata: {
        title: "Swarna High-Yield Paddy Grain (Grade A)",
        stock: 500,
        price: 2180,
      },
      ipAddress: "127.0.0.1",
    },
  });

  console.log("? Phase 3 Production Seed completed successfully and idempotently.");
}

main()
  .catch((e) => {
    console.error("Seed execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

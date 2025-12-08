import { PrismaClient, Role, Currency, BookingStatus, ProductType } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// Data Dummy Tenant dan Admin
const tenantData = [
  {
    id: '5c0b5937-2bc8-48a2-ae04-0a4ac7f270d6',
    vendorName: 'Fastboat Express',
    email: 'tenant.fastboat@example.com',
    ownerName: 'Bapak Ferry',
    businessAddress: 'Jl. Pelabuhan No. 1, Bali',
    contractStartDate: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'bec75eb2-23d6-464e-9cb6-65773c139a3e',
    vendorName: 'Tour Package Pro',
    email: 'tenant.tour@example.com',
    ownerName: 'Ibu Wisata',
    businessAddress: 'Jl. Wisata Indah No. 5, Bali',
    contractStartDate: new Date('2024-03-15T00:00:00Z'),
  },
  {
    id: 'e818c89e-b13b-419f-b90d-c632b82e10b4',
    vendorName: 'Attraction Fun Park',
    email: 'tenant.attraction@example.com',
    ownerName: 'Pak Wahana',
    businessAddress: 'Jl. Hiburan Raya No. 10',
    contractStartDate: new Date('2024-05-20T00:00:00Z'),
  },
  {
    id: 'bfb0ec44-87c2-4b2d-8330-3c37eec97791',
    vendorName: 'Bali Moto Rental',
    email: 'tenant.rental@example.com',
    ownerName: 'Mas Rental',
    businessAddress: 'Jl. Bandara Ngurah Rai No. 7',
    contractStartDate: new Date('2024-07-01T00:00:00Z'),
  },
];

// ⚠️ CATATAN PENTING:
// Untuk Super Admin dan Tenant Admin, Anda HARUS mendaftar akun ini
// di Supabase Auth untuk mendapatkan User ID (UID) yang benar.
// Ganti nilai placeholder ini dengan UID dari Supabase Anda!
const superAdminUID = 'a0e551e0-9063-4b99-a167-378f9a2b6f01'; 
const tenantAdminUIDs = [
  '37ae1d14-a8c6-4038-9949-7a368e21a646','98599ad4-04df-45ad-b268-873f1eece354','dffb1630-4e92-4b31-b5c6-d05b5b2619bb','0decc0e7-ab2d-4414-a461-224c04552331'
]

async function main() {
  console.log(`Start seeding...`);

  // 1. CLEANUP (Hanya jika Anda ingin database bersih setiap kali seed)
  // await prisma.review.deleteMany();
  // await prisma.booking.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.tenant.deleteMany();
  
  // 2. SEED TENANTS
  const tenants = [];
  for (const data of tenantData) {
    const tenant = await prisma.tenant.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    });
    tenants.push(tenant);
    console.log(`Created tenant with id: ${tenant.id}`);
  }

  // 3. SEED USERS (Menggunakan UID Placeholder)
  const usersToSeed = [
    // SUPER ADMIN APP
    {
      id: superAdminUID, 
      email: 'superadmin@app.com',
      role: Role.SUPER_ADMIN,
      fullName: 'Super Admin',
      isActive: true,
      // tenantId: null
    },
    // ADMIN TENANT 1
    {
      id: tenantAdminUIDs[0], 
      email: 'admin.fastboat@example.com',
      role: Role.TENANT_ADMIN,
      fullName: 'Admin Fastboat',
      tenantId: tenants[0].id, // tnt_fastboat_express
      isActive: true,
    },
    // ADMIN TENANT 2
    {
      id: tenantAdminUIDs[1], 
      email: 'admin.tour@example.com',
      role: Role.TENANT_ADMIN,
      fullName: 'Admin Tour',
      tenantId: tenants[1].id, // tnt_tour_package_pro
      isActive: true,
    },
    // ADMIN TENANT 3
    {
      id: tenantAdminUIDs[2], 
      email: 'admin.attraction@example.com',
      role: Role.TENANT_ADMIN,
      fullName: 'Admin Attraction',
      tenantId: tenants[2].id, // tnt_attraction_fun
      isActive: true,
    },
    // ADMIN TENANT 4
    {
      id: tenantAdminUIDs[3], 
      email: 'admin.rental@example.com',
      role: Role.TENANT_ADMIN,
      fullName: 'Admin Rental',
      tenantId: tenants[3].id, // tnt_rental_moto
      isActive: true,
    },
  ];

  for (const userData of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        role: userData.role,
        tenantId: userData.tenantId,
      },
      create: userData,
    });
    console.log(`Created user: ${user.email} with role ${user.role}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
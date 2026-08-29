import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserOrmEntity } from '../entities/user.entity';

export async function resetAndSeedDatabase(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(UserOrmEntity);

  const existingCount = await userRepo.count();

  // In production or if data already exists, DO NOT clear table data!
  if (process.env.NODE_ENV === 'production' || process.env.DISABLE_SEED === 'true' || existingCount > 0) {
    console.log(`[TypeORM] Existing data detected (${existingCount} users). Skipping destructive database reset.`);
    return;
  }

  const adminPass = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
  const vendorPass = process.env.SEED_VENDOR_PASSWORD;
  const travelerPass = process.env.SEED_DEMO_PASSWORD;

  if (!adminPass || !vendorPass || !travelerPass) {
    console.log('[TypeORM] Seed credentials not fully defined in environment variables. Skipping seed to prevent insecure defaults.');
    return;
  }

  console.log('[TypeORM] Initializing default seed accounts from environment variables...');
  const hashedAdminPass = await bcrypt.hash(adminPass, 10);
  const hashedVendorPass = await bcrypt.hash(vendorPass, 10);
  const hashedTravelerPass = await bcrypt.hash(travelerPass, 10);

  const freshUsers = [
    {
      id: 'user_superadmin_01',
      name: 'Super Admin TREXIO',
      email: 'superadmin@trexio.id',
      phone: '+628123456781',
      password_hash: hashedAdminPass,
      role: 'super_admin',
      roles: ['admin', 'super_admin'],
      tenant_id: 'tenant_default',
    },
    {
      id: 'user_admin_01',
      name: 'Admin TREXIO',
      email: 'admin@trexio.id',
      phone: '+628123456780',
      password_hash: hashedAdminPass,
      role: 'admin',
      roles: ['admin', 'super_admin'],
      tenant_id: 'tenant_default',
    },
    {
      id: 'user_vendor_01',
      name: 'Official TREXIO Travel Vendor',
      email: 'vendor@trexio.id',
      phone: '+628120000000',
      password_hash: hashedVendorPass,
      role: 'vendor',
      roles: ['user', 'vendor'],
      tenant_id: 'tenant_default',
    },
    {
      id: 'user_demo_01',
      name: 'Traveler Demo',
      email: 'traveler@trexio.id',
      phone: '+628123456789',
      password_hash: hashedTravelerPass,
      role: 'user',
      roles: ['user'],
      tenant_id: 'tenant_default',
    },
  ];

  for (const userData of freshUsers) {
    const user = userRepo.create(userData);
    await userRepo.save(user);
  }

  console.log('[TypeORM] Successfully reset database and seeded fresh accounts for Super Admin, Tenant Admin, Vendor, and Traveler.');
}

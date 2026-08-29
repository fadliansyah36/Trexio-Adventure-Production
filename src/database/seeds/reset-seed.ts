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

  console.log('[TypeORM] Initializing default seed accounts for fresh database...');
  const hashedAdminPass = await bcrypt.hash('admin123', 10);
  const hashedVendorPass = await bcrypt.hash('vendor123', 10);
  const hashedTravelerPass = await bcrypt.hash('traveler123', 10);

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

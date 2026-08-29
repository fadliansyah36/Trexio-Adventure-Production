import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserOrmEntity } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithSupabase(payload: { email?: string; name?: string; supabase_uid?: string; idToken?: string }) {
    const email = (payload.email || '').trim().toLowerCase();
    const uid = payload.supabase_uid || '';
    const name = payload.name || '';

    if (!email && !uid) {
      throw new BadRequestException('Email atau Supabase UID diperlukan untuk autentikasi.');
    }

    let user: UserOrmEntity | null = null;
    if (uid) {
      user = await this.userRepository.findOne({ where: { uid } });
    }

    if (!user && email) {
      user = await this.userRepository.findOne({ where: { email } });
      if (user) {
        user.uid = uid || user.uid;
        if (name && (!user.name || user.name.startsWith('User '))) {
          user.name = name;
        }
        await this.userRepository.save(user);
      }
    }

    if (!user) {
      const newUser = this.userRepository.create({
        id: `user_sb_${uuidv4().substring(0, 8)}`,
        uid: uid || `uid_${uuidv4().substring(0, 8)}`,
        email: email || `user_${uuidv4().substring(0, 6)}@trexio.id`,
        name: name || (email ? email.split('@')[0] : 'Pengguna Trexio'),
        role: 'user',
        roles: ['user'],
        tenant_id: 'tenant_default',
      });
      user = await this.userRepository.save(newUser);
    }

    return this.login(user);
  }

  async loginWithFirebase(idToken: string, fallbackEmail?: string, fallbackName?: string) {
    return this.loginWithSupabase({ email: fallbackEmail, name: fallbackName, idToken });
  }

  async validateUser(emailOrShorthand: string, pass: string): Promise<UserOrmEntity | null> {
    const cleanInput = (emailOrShorthand || '').trim().toLowerCase();
    
    // Find user by email or ID
    let user = await this.userRepository.findOne({
      where: [{ email: cleanInput }, { id: cleanInput }],
    });

    // Handle role shorthand keywords
    if (!user) {
      if (['superadmin', 'super_admin', 'super'].includes(cleanInput)) {
        user = await this.userRepository.findOne({ where: { email: 'superadmin@trexio.id' } });
      } else if (['admin', 'tenant'].includes(cleanInput)) {
        user = await this.userRepository.findOne({ where: { email: 'admin@trexio.id' } });
      } else if (['vendor', 'mitra', 'organizer'].includes(cleanInput)) {
        user = await this.userRepository.findOne({ where: { email: 'vendor@trexio.id' } });
      } else if (['user', 'traveler', 'client'].includes(cleanInput)) {
        user = await this.userRepository.findOne({ where: { email: 'traveler@trexio.id' } });
      }
    }

    if (!user) {
      return null;
    }

    // Verify password hash
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(pass, user.password_hash);
    }

    if (isMatch) {
      return user;
    }

    return null;
  }

  async validateJwtPayload(payload: any): Promise<UserOrmEntity | null> {
    const userId = payload.sub || payload.id;
    if (!userId) return null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      return user;
    }

    // Fallback if user missing in DB but exists in payload
    return {
      id: userId,
      email: payload.email || '',
      name: payload.name || 'User',
      phone: payload.phone || '',
      password_hash: '',
      role: payload.role || 'user',
      roles: payload.roles || ['user'],
      tenant_id: payload.tenant_id || 'tenant_default',
      created_at: new Date(),
      updated_at: new Date(),
    } as UserOrmEntity;
  }

  async login(user: UserOrmEntity) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.roles || [user.role],
      tenant_id: user.tenant_id || 'tenant_default',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.roles || [user.role],
        tenant_id: user.tenant_id,
      },
    };
  }

  async register(data: { name?: string; email: string; password: string; phone?: string; role?: string }) {
    const existing = await this.userRepository.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = this.userRepository.create({
      id: `user_${uuidv4().substring(0, 8)}`,
      email: data.email.toLowerCase(),
      name: data.name || 'User Baru',
      phone: data.phone || '',
      password_hash: hashedPassword,
      role: data.role || 'user',
      roles: data.role ? [data.role] : ['user'],
      tenant_id: 'tenant_default',
    });

    const savedUser = await this.userRepository.save(newUser);
    return this.login(savedUser);
  }

  async getDiagnostics(rawToken?: string) {
    let dbStatus = 'healthy';
    let userCount = 0;
    try {
      userCount = await this.userRepository.count();
    } catch (err) {
      dbStatus = `error: ${err.message}`;
    }

    let tokenValid = false;
    let decodedPayload: any = null;
    let tokenError: string | null = null;

    if (rawToken) {
      try {
        decodedPayload = this.jwtService.verify(rawToken);
        tokenValid = true;
      } catch (err) {
        tokenError = err.message;
        try {
          decodedPayload = this.jwtService.decode(rawToken);
        } catch {
          /* ignore decode error */
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        totalUsers: userCount,
      },
      jwt: {
        tokenProvided: Boolean(rawToken),
        tokenValid,
        tokenError,
        decodedPayload,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
      },
    };
  }
}

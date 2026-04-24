import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dtos/users.dto';
import { EmailService } from '../../internal-communication/email.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.seedInitialAdmin();
  }

  private async seedInitialAdmin() {
    const userCount = await this.usersRepository.count();
    if (userCount === 0) {
      console.log('👤 No users found, seeding initial admin user...');
      
      // Find the Super Administrator role (created by RolesPermissionsService)
      let adminRole = await this.roleRepository.findOne({ where: { name: 'Super Administrator' } });
      
      // If role doesn't exist yet (race condition), we'll just set the role string for now
      // The roleObject can be linked later or we can create it here
      if (!adminRole) {
        adminRole = this.roleRepository.create({
          name: 'Super Administrator',
          description: 'Complete system access and management',
          isSystem: true
        });
        await this.roleRepository.save(adminRole);
      }

      const hashedPassword = await bcrypt.hash('Admin@12345', 10);
      const adminUser = this.usersRepository.create({
        email: 'admin@sms.school',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'super administrator',
        roleId: adminRole.id,
        isActive: true,
        tenantId: uuidv4(),
      });

      await this.usersRepository.save(adminUser);
      console.log('✓ Initial admin user created: admin@sms.school / Admin@12345');
    }
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['roleObject'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roleObject', 'roleObject.permissions'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['roleObject'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      tenantId: createUserDto.tenantId || uuidv4(),
    });

    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.roleId !== undefined) {
      if (updateUserDto.roleId) {
        const role = await this.roleRepository.findOne({ where: { id: updateUserDto.roleId } });
        if (!role) {
          throw new NotFoundException(`Role with ID ${updateUserDto.roleId} not found`);
        }
        user.roleObject = role;
        user.roleId = role.id;
        if (!updateUserDto.role) {
          updateUserDto.role = role.name.toLowerCase();
        }
      } else {
        user.roleObject = null as any;
        user.roleId = null as any;
      }
    }

    if (updateUserDto.password) {
      const plainPassword = updateUserDto.password; // Keep plain for email
      updateUserDto.password = await bcrypt.hash(plainPassword, 10);
      
      // Clear force change flag if password is updated
      user.mustChangePassword = false;

      // Notify user via email
      await this.emailService.sendPasswordChangedNotification(
        user.email,
        user.firstName,
        plainPassword
      );
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async removeByEmail(email: string, tenantId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { email, tenantId },
    });
    if (user) {
      await this.usersRepository.remove(user);
    }
  }

  // Helper for Staff/Student integration
  async findOrCreateUser(email: string, details: Partial<CreateUserDto>): Promise<User> {
    const user = await this.findByEmail(email);
    
    if (user) {
      // Update existing user properties if provided
      const updates: any = {};
      
      if (details.roleId !== undefined) {
        updates.roleId = details.roleId;

        if (details.roleId) {
          const role = await this.roleRepository.findOne({ where: { id: details.roleId } });
          if (role) {
            user.roleObject = role;
            if (details.role === undefined) {
              updates.role = role.name.toLowerCase();
            }
          }
        } else {
          user.roleObject = null as any;
        }
      }
      if (details.role !== undefined) updates.role = details.role;
      if (details.tenantId !== undefined) updates.tenantId = details.tenantId;
      if (details.photo !== undefined) updates.photo = details.photo;
      if (details.firstName !== undefined) updates.firstName = details.firstName;
      if (details.lastName !== undefined) updates.lastName = details.lastName;
      if (details.mustChangePassword !== undefined) updates.mustChangePassword = details.mustChangePassword;

      // Handle password update for re-provisioning (e.g. newly admitted student)
      if (details.password) {
        updates.password = await bcrypt.hash(details.password, 10);
      }

      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates);
        return this.usersRepository.save(user);
      }
      return user;
    }

    // Create new user if not exists
    return this.create({
      email,
      password: details.password || 'sms@123', // Default password if not provided
      firstName: details.firstName || 'Staff',
      lastName: details.lastName || '',
      roleId: details.roleId,
      role: details.role,
      tenantId: details.tenantId,
      photo: details.photo,
      mustChangePassword: details.mustChangePassword || false,
    });
  }
}

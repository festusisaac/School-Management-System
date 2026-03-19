import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../auth/entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dtos/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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
      tenantId: uuidv4(), // Placeholder for multi-tenancy if needed
    });

    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  // Helper for Staff/Student integration
  async findOrCreateUser(email: string, details: Partial<CreateUserDto>): Promise<User> {
    let user = await this.findByEmail(email);
    
    if (user) {
      // Update existing user role if provided
      if (details.roleId || details.role) {
        Object.assign(user, {
          roleId: details.roleId || user.roleId,
          role: details.role || user.role,
        });
        return this.usersRepository.save(user);
      }
      return user;
    }

    // Create new user if not exists
    return this.create({
      email,
      password: details.password || 'sms@123', // Default password if not provided
      firstName: details.firstName || 'Staff',
      lastName: details.lastName || 'Member',
      roleId: details.roleId,
      role: details.role,
    });
  }
}

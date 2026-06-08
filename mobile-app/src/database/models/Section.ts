import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type Class from './Class';

export default class Section extends Model {
  static table = 'sections';

  @field('tenant_id') tenantId!: string;
  @field('name') name!: string;
  @field('class_id') classId!: string;
  @field('is_active') isActive!: boolean;

  @relation('classes', 'class_id') class!: Class;

  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;
}

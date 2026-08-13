import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Class extends Model {
  static table = 'classes';

  @field('tenant_id') tenantId!: string;
  @field('name') name!: string;
  @field('is_active') isActive!: boolean;
  @field('school_section_id') schoolSectionId?: string;

  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;
}

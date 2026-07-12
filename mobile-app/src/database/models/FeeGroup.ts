import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export interface FeeHeadSnapshot {
  id: string;
  name: string;
  description?: string;
  defaultAmount: string;
  isOptional: boolean;
  isActive: boolean;
}

export default class FeeGroup extends Model {
  static table = 'fee_groups';

  @text('tenant_id') tenantId!: string;
  @text('name') name!: string;
  @text('description') description?: string;
  @field('is_active') isActive!: boolean;
  @text('heads_json') headsJson?: string;

  /** Parsed list of fee heads embedded in this group. */
  get heads(): FeeHeadSnapshot[] {
    try {
      return this.headsJson ? JSON.parse(this.headsJson) : [];
    } catch {
      return [];
    }
  }
}

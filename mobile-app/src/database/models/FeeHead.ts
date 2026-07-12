import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';

export default class FeeHead extends Model {
  static table = 'fee_heads';

  @text('tenant_id') tenantId!: string;
  @text('fee_group_id') feeGroupId!: string;
  @text('name') name!: string;
  @text('description') description?: string;
  @text('default_amount') defaultAmount!: string;
  @field('is_optional') isOptional!: boolean;
  @field('is_active') isActive!: boolean;

  @relation('fee_groups', 'fee_group_id') feeGroup!: any;
}

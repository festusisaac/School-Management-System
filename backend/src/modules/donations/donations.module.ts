import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationsService } from './services/donations.service';
import { DonationsController } from './controllers/donations.controller';
import { DonationProject, Donation } from './entities/donation.entity';
import { AlumniModule } from '../alumni/alumni.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DonationProject, Donation]),
    forwardRef(() => AlumniModule),
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}

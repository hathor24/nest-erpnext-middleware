import { Module } from '@nestjs/common';
import { ManufacturersController } from './manufacturers.controller';
import { ManufacturersService } from './manufacturers.service';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [ManufacturersController],
  providers: [ManufacturersService],
  imports: [CommonModule],
})
export class ManufacturersModule {}

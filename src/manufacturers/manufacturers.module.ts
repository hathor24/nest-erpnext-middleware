import { Module } from '@nestjs/common';
import { ManufacturersController } from './manufacturers.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [ManufacturersController],
  imports: [CommonModule],
})
export class ManufacturersModule {}

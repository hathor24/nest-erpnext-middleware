import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [UnitsController],
  imports: [CommonModule],
})
export class UnitsModule {}

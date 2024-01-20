import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { CommonModule } from '../common/common.module';

@Module({
  providers: [UnitsService],
  controllers: [UnitsController],
  imports: [CommonModule],
})
export class UnitsModule {}

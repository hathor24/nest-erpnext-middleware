import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PropertiesController],
})
export class PropertiesModule {}

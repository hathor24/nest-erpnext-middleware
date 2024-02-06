import { Module } from '@nestjs/common';
// import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { CommonModule } from '../common/common.module';

@Module({
  // providers: [PropertiesService],
  imports: [CommonModule],
  controllers: [PropertiesController],
})
export class PropertiesModule {}

import { Module } from '@nestjs/common';
// import { ConfiguratorSettingsService } from './configurator-settings.service';
import { CommonModule } from '../common/common.module';

@Module({
  providers: [CommonModule],
})
export class ConfiguratorSettingsModule {}

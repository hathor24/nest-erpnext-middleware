import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguratorSettingsService } from './configurator-settings.service';

describe('ConfiguratorSettingsService', () => {
  let service: ConfiguratorSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfiguratorSettingsService],
    }).compile();

    service = module.get<ConfiguratorSettingsService>(ConfiguratorSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

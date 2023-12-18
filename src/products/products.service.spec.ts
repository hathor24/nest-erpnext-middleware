import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ShopsService } from '../shops/shops.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let shopApiClient: any;

  beforeEach(async () => {
    shopApiClient = {
      patch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        ShopsService,
        { provide: 'SHOP_API_CLIENT', useValue: shopApiClient },
      ],
      controllers: [ProductsController],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('assignPropertyGroupIdToPropertyValue', async () => {
    const propertyValueId = 'testId';
    const propertyGroupId = 'testGroupId';

    await service.assignPropertyGroupIdToPropertyValue(
      shopApiClient,
      propertyValueId,
      propertyGroupId,
    );

    expect(shopApiClient.patch).toHaveBeenCalledWith(
      `/api/property-group-option/${propertyValueId}`,
      { groupId: propertyGroupId },
    );
  });

  test('assignPropertyValueIdToProduct', async () => {
    const productId = 'testProductId';
    const propertyValueId = 'testPropertyValueId';

    await service.assignPropertyValueIdToProduct(
      shopApiClient,
      productId,
      propertyValueId,
    );

    expect(shopApiClient.patch).toHaveBeenCalledWith(
      `/api/product/${productId}`,
      { propertyValueId: propertyValueId },
    );
  });
});

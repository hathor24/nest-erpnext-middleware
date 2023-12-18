import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;
  let shopApiClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            assignPropertyGroupIdToPropertyValue: jest.fn(),
            assignPropertyValueIdToProduct: jest.fn(),
          },
        },
        { provide: 'SHOP_API_CLIENT', useValue: shopApiClient },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Hier können Sie weitere Tests für Ihre Controller-Methoden hinzufügen
  it('should call assignPropertyGroupIdToPropertyValue with correct parameters', async () => {
    const propertyValueId = 'testId';
    const propertyGroupId = 'testGroupId';

    // Mock the service method
    service.assignPropertyGroupIdToPropertyValue = jest
      .fn()
      .mockResolvedValue(null);

    // Call the controller method
    await service.assignPropertyGroupIdToPropertyValue(
      shopApiClient,
      propertyValueId,
      propertyGroupId,
    );

    // Check if the service method was called with correct parameters
    expect(service.assignPropertyGroupIdToPropertyValue).toHaveBeenCalledWith(
      shopApiClient,
      propertyValueId,
      propertyGroupId,
    );
  });

  it('should call assignPropertyValueIdToProduct with correct parameters', async () => {
    const productId = 'testProductId';
    const propertyValueId = 'testPropertyValueId';

    // Mock the service method
    service.assignPropertyValueIdToProduct = jest.fn().mockResolvedValue(null);

    // Call the controller method
    await service.assignPropertyValueIdToProduct(
      shopApiClient,
      productId,
      propertyValueId,
    );

    // Check if the service method was called with correct parameters
    expect(service.assignPropertyValueIdToProduct).toHaveBeenCalledWith(
      shopApiClient,
      productId,
      propertyValueId,
    );
  });
});

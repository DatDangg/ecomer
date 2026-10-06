import { QueryProductDto } from './dto/query-product.dto';
import {
  CATEGORY_ID,
  createModelMock,
  createQuery,
  createService,
  createSingleQuery,
  PRODUCT_ID,
  productDoc,
  SELLER_ID,
} from './test-support/products-service.harness';

/** Plain query object: the service tolerates missing DTO defaults. */
function query(overrides: Partial<QueryProductDto> = {}): QueryProductDto {
  return overrides as QueryProductDto;
}

describe('ProductsService.findAll', () => {
  it('filters only public products and applies default sort/pagination', async () => {
    const model = createModelMock();
    const findQuery = createQuery([productDoc()]);
    model.find.mockReturnValue(findQuery);
    model.countDocuments.mockReturnValue(createSingleQuery(1));
    const service = await createService(model);

    const result = await service.findAll(query());

    expect(model.find).toHaveBeenCalledWith({
      isActive: true,
      isBlocked: false,
    });
    expect(model.countDocuments).toHaveBeenCalledWith({
      isActive: true,
      isBlocked: false,
    });
    expect(findQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(findQuery.skip).toHaveBeenCalledWith(0);
    expect(findQuery.limit).toHaveBeenCalledWith(20);
    expect(result).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(result.items[0]).toMatchObject({
      id: PRODUCT_ID,
      sellerId: SELLER_ID,
      categoryId: CATEGORY_ID,
      name: 'iPhone 15 Pro',
    });
  });

  it('trims search and builds search/category/seller/price filters', async () => {
    const model = createModelMock();
    const findQuery = createQuery([]);
    model.find.mockReturnValue(findQuery);
    const service = await createService(model);

    await service.findAll(
      query({
        search: '  iphone  ',
        categoryId: CATEGORY_ID,
        sellerId: SELLER_ID,
        minPrice: 100,
        maxPrice: 200,
        sortBy: 'price',
        order: 'asc',
      }),
    );

    expect(model.find).toHaveBeenCalledWith({
      isActive: true,
      isBlocked: false,
      $text: { $search: 'iphone' },
      categoryId: CATEGORY_ID,
      sellerId: SELLER_ID,
      price: { $gte: 100, $lte: 200 },
    });
    expect(findQuery.sort).toHaveBeenCalledWith({ price: 1 });
  });

  it('omits the price clause when no price bound is given', async () => {
    const model = createModelMock();
    const findQuery = createQuery([]);
    model.find.mockReturnValue(findQuery);
    const service = await createService(model);

    await service.findAll(query());

    expect(model.find).toHaveBeenCalledWith({
      isActive: true,
      isBlocked: false,
    });
  });

  it('honours page/limit and computes totalPages for out-of-range pages', async () => {
    const model = createModelMock();
    const findQuery = createQuery([]);
    model.find.mockReturnValue(findQuery);
    model.countDocuments.mockReturnValue(createSingleQuery(25));
    const service = await createService(model);

    const result = await service.findAll(query({ page: 3, limit: 10 }));

    expect(findQuery.skip).toHaveBeenCalledWith(20);
    expect(findQuery.limit).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      items: [],
      total: 25,
      page: 3,
      limit: 10,
      totalPages: 3,
    });
  });

  it.each([
    ['price', 'asc', { price: 1 }],
    ['price', 'desc', { price: -1 }],
    ['createdAt', 'asc', { createdAt: 1 }],
    ['createdAt', 'desc', { createdAt: -1 }],
    ['name', 'asc', { name: 1 }],
    ['name', 'desc', { name: -1 }],
  ] as const)('sorts by %s %s', async (sortBy, order, expected) => {
    const model = createModelMock();
    const findQuery = createQuery([]);
    model.find.mockReturnValue(findQuery);
    const service = await createService(model);

    await service.findAll(query({ sortBy, order }));

    expect(findQuery.sort).toHaveBeenCalledWith(expected);
  });
});

describe('ProductsService.findPublicById', () => {
  it('returns null for a malformed id without hitting the database', async () => {
    const model = createModelMock();
    const service = await createService(model);

    await expect(
      service.findPublicById('not-an-object-id'),
    ).resolves.toBeNull();
    expect(model.findOne).not.toHaveBeenCalled();
  });

  it('queries only visible products and maps the result', async () => {
    const model = createModelMock();
    model.findOne.mockReturnValue(createQuery(productDoc()));
    const service = await createService(model);

    const result = await service.findPublicById(PRODUCT_ID);

    expect(model.findOne).toHaveBeenCalledWith({
      _id: PRODUCT_ID,
      isActive: true,
      isBlocked: false,
    });
    expect(result?.slug).toBe('iphone-15-pro');
  });

  it('returns null when the product is missing or not visible', async () => {
    const model = createModelMock();
    model.findOne.mockReturnValue(createQuery(null));
    const service = await createService(model);

    await expect(service.findPublicById(PRODUCT_ID)).resolves.toBeNull();
  });
});

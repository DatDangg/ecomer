import { ConflictException } from '@nestjs/common';
import { slugify } from './categories.service';
import {
  CATEGORY_ID,
  categoryDoc,
  createConnectionMock,
  createModelMock,
  createQuery,
  createService,
} from './test-support/categories-service.harness';

describe('slugify', () => {
  it.each([
    ['Điện thoại', 'dien-thoai'],
    ['  Thời   trang! ', 'thoi-trang'],
    ['Sách & Vở', 'sach-vo'],
    ['---', ''],
  ])('turns %j into %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe('CategoriesService (create + public reads)', () => {
  describe('create', () => {
    it('generates a slug from the name and forces isActive=true', async () => {
      const model = createModelMock();
      model.create.mockResolvedValue(categoryDoc());
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      const result = await service.create({ name: 'Điện thoại' });

      expect(model.create).toHaveBeenCalledWith({
        name: 'Điện thoại',
        slug: 'dien-thoai',
        imageUrl: undefined,
        isActive: true,
      });
      expect(result).toMatchObject({
        id: CATEGORY_ID,
        name: 'Điện thoại',
        slug: 'dien-thoai',
        imageUrl: null,
        isActive: true,
      });
    });

    it('throws 409 when the name already exists and does not create', async () => {
      const model = createModelMock();
      model.exists.mockResolvedValue({ _id: 'existing' });
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await expect(
        service.create({ name: 'Điện thoại' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('appends a numeric suffix when the generated slug collides', async () => {
      const model = createModelMock();
      model.exists
        .mockResolvedValueOnce(null) // name free
        .mockResolvedValueOnce({ _id: 'taken' }) // dien-thoai taken
        .mockResolvedValueOnce(null); // dien-thoai-2 free
      model.create.mockResolvedValue(categoryDoc({ slug: 'dien-thoai-2' }));
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await service.create({ name: 'Điện thoại' });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'dien-thoai-2' }),
      );
    });
  });

  describe('findAll', () => {
    it('filters active categories and sorts by name ascending by default', async () => {
      const model = createModelMock();
      const query = createQuery([categoryDoc()]);
      model.find.mockReturnValue(query);
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      const result = await service.findAll({ sortBy: 'name', order: 'asc' });

      expect(model.find).toHaveBeenCalledWith({ isActive: true });
      expect(query.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toHaveLength(1);
    });

    it('builds a case-insensitive name search with escaped regex', async () => {
      const model = createModelMock();
      const query = createQuery([]);
      model.find.mockReturnValue(query);
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await service.findAll({ search: 'a.b', sortBy: 'name', order: 'asc' });

      expect(model.find).toHaveBeenCalledWith({
        isActive: true,
        name: { $regex: 'a\\.b', $options: 'i' },
      });
    });

    it('honours an explicit descending sort', async () => {
      const model = createModelMock();
      const query = createQuery([]);
      model.find.mockReturnValue(query);
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await service.findAll({ sortBy: 'createdAt', order: 'desc' });

      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findPublicById', () => {
    it('returns null for a malformed id without hitting the database', async () => {
      const model = createModelMock();
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await expect(
        service.findPublicById('not-an-object-id'),
      ).resolves.toBeNull();
      expect(model.findOne).not.toHaveBeenCalled();
    });

    it('queries only active categories and maps the result', async () => {
      const model = createModelMock();
      model.findOne.mockReturnValue(createQuery(categoryDoc()));
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      const result = await service.findPublicById(CATEGORY_ID);

      expect(model.findOne).toHaveBeenCalledWith({
        _id: CATEGORY_ID,
        isActive: true,
      });
      expect(result?.slug).toBe('dien-thoai');
    });

    it('returns null when the category is missing or inactive', async () => {
      const model = createModelMock();
      model.findOne.mockReturnValue(createQuery(null));
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await expect(service.findPublicById(CATEGORY_ID)).resolves.toBeNull();
    });
  });
});

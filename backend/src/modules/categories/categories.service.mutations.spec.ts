import { BadRequestException, ConflictException } from '@nestjs/common';
import { UpdateCategoryInput } from './categories.service';
import {
  CATEGORY_ID,
  categoryDoc,
  createConnectionMock,
  createModelMock,
  createQuery,
  createService,
} from './test-support/categories-service.harness';

describe('CategoriesService (update + delete)', () => {
  describe('update', () => {
    it('returns null for a malformed id without hitting the database', async () => {
      const model = createModelMock();
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await expect(service.update('bad-id', { name: 'X' })).resolves.toBeNull();
      expect(model.exists).not.toHaveBeenCalled();
    });

    it('returns 409 when renaming to an existing name', async () => {
      const model = createModelMock();
      model.exists.mockResolvedValue({ _id: 'other' });
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await expect(
        service.update(CATEGORY_ID, { name: 'Điện thoại' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('ignores mass-assignment keys such as slug', async () => {
      const model = createModelMock();
      model.findByIdAndUpdate.mockReturnValue(
        createQuery(categoryDoc({ name: 'Mới' })),
      );
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      await service.update(CATEGORY_ID, {
        name: 'Mới',
        slug: 'hacked',
      } as unknown as UpdateCategoryInput);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        CATEGORY_ID,
        { $set: { name: 'Mới' } },
        { new: true },
      );
    });

    it('returns the current document for an empty patch', async () => {
      const model = createModelMock();
      model.findOne.mockReturnValue(createQuery(categoryDoc()));
      const { connection } = createConnectionMock();
      const service = await createService(model, connection);

      const result = await service.update(CATEGORY_ID, {});

      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(result?.id).toBe(CATEGORY_ID);
    });
  });

  describe('remove', () => {
    it('returns false for a missing category and never counts products', async () => {
      const model = createModelMock();
      model.findOne.mockReturnValue(createQuery(null));
      const { connection, collection } = createConnectionMock();
      const service = await createService(model, connection);

      await expect(service.remove(CATEGORY_ID)).resolves.toBe(false);
      expect(collection.countDocuments).not.toHaveBeenCalled();
    });

    it('rejects deletion with 400 while products still reference the category', async () => {
      const model = createModelMock();
      model.findOne.mockReturnValue(createQuery(categoryDoc()));
      const { connection, collection } = createConnectionMock(3);
      const service = await createService(model, connection);

      await expect(service.remove(CATEGORY_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(model.findByIdAndDelete).not.toHaveBeenCalled();

      const filter = collection.countDocuments.mock.calls[0][0] as {
        categoryId: { toString(): string };
      };
      expect(filter.categoryId.toString()).toBe(CATEGORY_ID);
    });

    it('deletes the category once no product references it', async () => {
      const model = createModelMock();
      model.findOne.mockReturnValue(createQuery(categoryDoc()));
      model.findByIdAndDelete.mockReturnValue(createQuery(categoryDoc()));
      const { connection } = createConnectionMock(0);
      const service = await createService(model, connection);

      await expect(service.remove(CATEGORY_ID)).resolves.toBe(true);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(CATEGORY_ID);
    });
  });
});

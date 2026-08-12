import { Test, TestingModule } from '@nestjs/testing';
import { NameService } from './name.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Mock context object
 * @param overrides - Optional overrides for the context object
 * @returns Mock context object
 */
const mockContext = (overrides = {}) => ({
  id: 'test-context-id',
  key: 'test-context',
  ...overrides,
});

/**
 * Mock name entry object
 * @param overrides - Optional overrides for the name entry object
 * @returns Mock name entry object
 */
const mockNameEntry = (overrides = {}) => ({
  id: 'test-entry-id',
  value: 'test',
  charset: 'testcharset',
  context_id: 'test-context-id',
  audio_key: 'test-audio-key',
  ...overrides,
});

/**
 * Mirror of the service's addAudioUrl helper for building expected results.
 * The mocked storageService.getSignedUrl returns `signed-url:<key>`
 */
const withAudioUrl = <T extends { audio_key?: string | null }>(entry: T) => ({
  ...entry,
  audio_url: entry.audio_key ? `signed-url:${entry.audio_key}` : null,
});

describe('NameService', () => {
  let service: NameService;
  let prisma: {
    context: { findUnique: jest.Mock; findMany: jest.Mock };
    nameEntry: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: { findUnique: jest.Mock; findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    nameEntry: {
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let storageService: {
    upload: jest.Mock;
    getSignedUrl: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      context: { findUnique: jest.fn(), findMany: jest.fn() },
      nameEntry: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: { findUnique: jest.fn(), findFirst: jest.fn() },
      $transaction: jest.fn(),
    };
    tx = {
      nameEntry: {
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(
      (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
    );
    storageService = {
      upload: jest.fn().mockResolvedValue(undefined),
      getSignedUrl: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(`signed-url:${key}`),
        ),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NameService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<NameService>(NameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create name entry', () => {
    it('should create a name entry', async () => {
      // Create mock context
      const contextData = mockContext();
      prisma.context.findUnique.mockResolvedValue(contextData);

      // Create mock name entry data
      const nameEntryData = mockNameEntry({
        value: 'test',
        charset: 'test charset',
        context_id: contextData.id,
      });
      prisma.nameEntry.create.mockResolvedValue(nameEntryData);

      // Try to create a name entry with the mock data
      const result = await service.create('test', {
        value: 'test',
        charset: 'test charset',
        context: contextData.key,
      });

      // Check if the name entry was created successfully
      expect(prisma.nameEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            user_id: 'test',
            context_id: contextData.id,
            value: 'test',
            charset: 'test charset',
          },
        }),
      );
      expect(result).toEqual(withAudioUrl(nameEntryData));
    });

    it('should allow empty string name entries', async () => {
      // Create mock context
      const contextData = mockContext();
      prisma.context.findUnique.mockResolvedValue(contextData);

      // Create mock name entry data with empty value
      const emptyNameEntryData = mockNameEntry({
        value: '',
        charset: 'test charset',
        context_id: contextData.id,
      });
      prisma.nameEntry.create.mockResolvedValue(emptyNameEntryData);

      // Try to create a name entry with the mock data
      const result = await service.create('test', {
        value: '',
        charset: 'test charset',
        context: contextData.key,
      });

      // Check if the name entry was created successfully
      expect(prisma.nameEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            user_id: 'test',
            context_id: contextData.id,
            value: '',
            charset: 'test charset',
          },
        }),
      );
      expect(result).toEqual(withAudioUrl(emptyNameEntryData));
    });

    it('should throw an error if the context does not exist', async () => {
      // Mock context lookup to return null
      prisma.context.findUnique.mockResolvedValue(null);

      // Try to create a name entry with a non-existent context and expect it to throw
      await expect(
        service.create('test', {
          value: 'test',
          charset: 'test charset',
          context: 'test-context',
        }),
      ).rejects.toThrow(NotFoundException);

      // Check the create was never called
      expect(prisma.nameEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('get name entry', () => {
    it('should return all active name entries for a user when no context is provided', async () => {
      // Mock name entries
      const nameEntriesData = [
        {
          id: 'test-1',
          value: 'test 1',
          charset: 'test charset 1',
          audio_key: null,
        },
        {
          id: 'test-2',
          value: 'test 2',
          charset: 'test charset 2',
          audio_key: null,
        },
      ];
      prisma.nameEntry.findMany.mockResolvedValue(nameEntriesData);

      // Try to get name entries
      const result = await service.query('test-user');

      // Check if the name entries were returned
      expect(prisma.nameEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'test-user',
            deleted_at: null,
          },
        }),
      );
      expect(result).toEqual(nameEntriesData.map(withAudioUrl));
    });

    it('should return all active name entries for a user when a context is provided', async () => {
      // Mock context
      const contextData = mockContext();
      prisma.context.findUnique.mockResolvedValue(contextData);

      // Mock name entries
      const nameEntriesData = [
        mockNameEntry({
          id: 'test-1',
          value: 'test 1',
          charset: 'test charset 1',
        }),
        mockNameEntry({
          id: 'test-2',
          value: 'test 2',
          charset: 'test charset 2',
        }),
      ];
      prisma.nameEntry.findMany.mockResolvedValue(nameEntriesData);

      // Try to get name entries
      const result = await service.query('test-user', contextData.key);

      // Check if the name entries were returned
      expect(prisma.nameEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'test-user',
            context_id: contextData.id,
            deleted_at: null,
          },
        }),
      );
      expect(result).toEqual(nameEntriesData.map(withAudioUrl));
    });
  });

  describe('query by user', () => {
    it('should throw NotFoundException if the target user does not exist', async () => {
      // Mock user lookup to return null
      prisma.user.findUnique.mockResolvedValue(null);

      // Try to query by user and expect it to throw
      await expect(
        service.queryByUser('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);

      // Check findMany was not called
      expect(prisma.nameEntry.findMany).not.toHaveBeenCalled();
    });

    it('should return name entries without the user email when the target user exists', async () => {
      // Mock user lookup
      prisma.user.findUnique.mockResolvedValue({ id: 'target-user-id' });

      // Mock name entries
      const nameEntriesData = [
        {
          id: 'entry-1',
          value: 'name 1',
          charset: 'charset 1',
          audio_key: null,
          context: { name: 'Work', description: 'Work context' },
        },
      ];
      prisma.nameEntry.findMany.mockResolvedValue(nameEntriesData);

      // Call queryByUser
      const result = await service.queryByUser('target-user-id');

      // Check the target user was validated
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'target-user-id' },
        select: { id: true },
      });

      // Check the findMany select does not include the user
      const [findManyArgs] = prisma.nameEntry.findMany.mock.calls[0] as [
        { select: Record<string, unknown> },
      ];
      expect(findManyArgs.select).not.toHaveProperty('user');

      // Check the result does not include the user email
      expect(result).toEqual(nameEntriesData.map(withAudioUrl));
    });

    it('should filter by context when contextKey is provided', async () => {
      // Mock user lookup
      prisma.user.findUnique.mockResolvedValue({ id: 'target-user-id' });

      // Mock context lookup
      const contextData = mockContext();
      prisma.context.findUnique.mockResolvedValue(contextData);

      // Mock name entries
      prisma.nameEntry.findMany.mockResolvedValue([]);

      // Call queryByUser with a context
      await service.queryByUser('target-user-id', contextData.key);

      // Check findMany was called with the context filter
      expect(prisma.nameEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'target-user-id',
            context_id: contextData.id,
            deleted_at: null,
          },
        }),
      );
    });

    it('should throw NotFoundException if the context is not valid', async () => {
      // Mock user lookup to return a valid user
      prisma.user.findUnique.mockResolvedValue({ id: 'target-user-id' });

      // Mock context lookup to return null
      prisma.context.findUnique.mockResolvedValue(null);

      // Try to query by user with an invalid context and expect it to throw
      await expect(
        service.queryByUser('target-user-id', 'invalid'),
      ).rejects.toThrow(NotFoundException);

      // Check findMany was not called
      expect(prisma.nameEntry.findMany).not.toHaveBeenCalled();
    });
  });

  describe('query by email', () => {
    it('should throw NotFoundException if the email does not match a user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.queryByEmail('missing@test.com')).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.nameEntry.findMany).not.toHaveBeenCalled();
    });

    it('should return name entries for the user with that email (case insensitive)', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'target-user-id' });

      const nameEntriesData = [
        {
          id: 'entry-1',
          value: 'name 1',
          charset: 'charset 1',
          audio_key: null,
          context: { name: 'Work', description: 'Work context' },
        },
      ];
      prisma.nameEntry.findMany.mockResolvedValue(nameEntriesData);

      const result = await service.queryByEmail('User@Test.com');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: 'user@test.com', mode: 'insensitive' },
        },
        select: { id: true },
      });
      expect(result).toEqual(nameEntriesData.map(withAudioUrl));
    });

    it('should filter by context when contextKey is provided', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'target-user-id' });

      const contextData = mockContext();
      prisma.context.findUnique.mockResolvedValue(contextData);
      prisma.nameEntry.findMany.mockResolvedValue([]);

      await service.queryByEmail('user@test.com', contextData.key);

      expect(prisma.nameEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'target-user-id',
            context_id: contextData.id,
            deleted_at: null,
          },
        }),
      );
    });
  });

  describe('get name entry history', () => {
    it('should use defaults when no page and limit are provided', async () => {
      // Mock soft-deleted entries
      const deletedEntries = [
        {
          id: 'd1',
          value: 'old name',
          deleted_at: new Date(),
          audio_key: null,
        },
      ];
      prisma.nameEntry.findMany.mockResolvedValue(deletedEntries);
      prisma.nameEntry.count.mockResolvedValue(1);

      // Try to get name entry history
      const result = await service.queryHistory('test-user', {});

      // Check if the name entry history was returned with the correct pagination
      expect(prisma.nameEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'test-user',
            deleted_at: { not: null },
          },
          skip: 0,
          take: 20,
          orderBy: { deleted_at: 'desc' },
        }),
      );
      expect(result).toEqual({
        data: deletedEntries.map(withAudioUrl),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should paginate correctly with custom page and limit', async () => {
      // Mock soft-deleted entries
      const deletedEntries = [
        { id: 'd3', value: 'even older', audio_key: null },
      ];
      prisma.nameEntry.findMany.mockResolvedValue(deletedEntries);
      prisma.nameEntry.count.mockResolvedValue(12);

      // Try to get name entry history
      const result = await service.queryHistory('test-user', {
        page: 2,
        limit: 5,
      });

      // Check if the name entry history was returned with the correct pagination
      expect(prisma.nameEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result).toEqual({
        data: deletedEntries.map(withAudioUrl),
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });

    it('should filter by context when contextKey is provided', async () => {
      // Mock context
      const contextData = mockContext();
      prisma.context.findUnique.mockResolvedValue(contextData);

      // Mock soft-deleted entries
      const deletedEntries = [mockNameEntry({ deleted_at: new Date() })];
      prisma.nameEntry.findMany.mockResolvedValue(deletedEntries);
      prisma.nameEntry.count.mockResolvedValue(0);

      // Try to get name entry history
      await service.queryHistory('test-user', { context: contextData.key });

      // Check if the name entry history was returned with the correct context filter
      expect(prisma.nameEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'test-user',
            deleted_at: { not: null },
            context_id: contextData.id,
          },
        }),
      );
    });

    it('should throw an error if the context does not exist', async () => {
      // Mock context lookup to return null
      prisma.context.findUnique.mockResolvedValue(null);

      // Try to get name entry history and expect it to throw
      await expect(
        service.queryHistory('test-user', { context: 'invalid' }),
      ).rejects.toThrow(NotFoundException);

      // Check if the name entry history was not returned
      expect(prisma.nameEntry.findMany).not.toHaveBeenCalled();
    });
  });

  describe('get all contexts', () => {
    it('should return all contexts', async () => {
      // Mock contexts
      const contextsData = [
        mockContext({
          name: 'Context 1',
          key: 'context-1',
          description: 'Description 1',
        }),
        mockContext({
          name: 'Context 2',
          key: 'context-2',
          description: 'Description 2',
        }),
        mockContext({
          name: 'Context 3',
          key: 'context-3',
          description: 'Description 3',
        }),
      ];
      prisma.context.findMany.mockResolvedValue(contextsData);

      // Try to get all contexts
      const result = await service.getAllContexts();

      // Check if the contexts were returned
      expect(prisma.context.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
      expect(result).toBe(contextsData);
    });

    it('should return an empty array if there are no contexts', async () => {
      // Mock contexts to return an empty array
      prisma.context.findMany.mockResolvedValue([]);

      // Try to get all contexts
      const result = await service.getAllContexts();

      // Check if the contexts were returned
      expect(prisma.context.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
      expect(result).toEqual([]);
    });
  });

  describe('update name entry', () => {
    it('should throw error if no fields are provided', async () => {
      // Try to update a name entry with no fields and expect it to throw
      await expect(
        service.update('test-user', 'test-entry-id', {}),
      ).rejects.toThrow(BadRequestException);

      // Check if the update prisma methods were never called
      expect(tx.nameEntry.update).not.toHaveBeenCalled();
      expect(tx.nameEntry.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw error if the name entry does not exist', async () => {
      // Mock name entry lookup to return null
      prisma.nameEntry.findUnique.mockResolvedValue(null);

      // Try to update a name entry that does not exist and expect it to throw
      await expect(
        service.update('test-user', 'test-entry-id', { value: 'test' }),
      ).rejects.toThrow(NotFoundException);

      // Check if the update prisma methods were never called
      expect(tx.nameEntry.update).not.toHaveBeenCalled();
      expect(tx.nameEntry.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw error if the context is not valid', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock context lookup to return null
      prisma.context.findUnique.mockResolvedValue(null);

      // Try to update a name entry with an invalid context and expect it to throw
      await expect(
        service.update('test-user', 'test-entry-id', {
          value: 'test',
          context: 'invalid',
        }),
      ).rejects.toThrow(NotFoundException);

      // Check if the update prisma methods were never called
      expect(tx.nameEntry.update).not.toHaveBeenCalled();
      expect(tx.nameEntry.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should update only the value (inherit other properties)', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry({
        value: 'old name',
        charset: 'old charset',
        context_id: 'old context id',
        audio_key: 'old-audio-key',
      });
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the transaction create return value
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Try to update a name entry with the mock data
      const result = await service.update('test-user', 'test-entry-id', {
        value: 'new name',
      });

      // Check the old entry was soft-deleted, new entry was created and returned
      expect(tx.nameEntry.update).toHaveBeenCalledWith({
        where: { id: 'test-entry-id' },
        data: { deleted_at: expect.any(Date) as Date },
      });
      expect(tx.nameEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            user_id: 'test-user',
            value: 'new name',
            charset: 'old charset',
            audio_key: 'old-audio-key',
            context_id: 'old context id',
          },
        }),
      );
      expect(result).toEqual(withAudioUrl(nameEntryData));
    });

    it('should update only the context (inherit other properties)', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the new context lookup
      const newContext = mockContext({
        id: 'new-context-id',
        key: 'new-context',
      });
      prisma.context.findUnique.mockResolvedValue(newContext);

      // Mock the transaction update return value
      tx.nameEntry.update.mockResolvedValue({});

      // Mock the transaction create return value
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Try to update a name entry with the new context key
      const result = await service.update('test-user', 'test-entry-id', {
        context: newContext.key,
      });

      // Check the old entry was soft-deleted, new entry was created and returned
      expect(tx.nameEntry.update).toHaveBeenCalledWith({
        where: { id: 'test-entry-id' },
        data: { deleted_at: expect.any(Date) as Date },
      });
      expect(tx.nameEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            user_id: 'test-user',
            value: nameEntryData.value,
            charset: nameEntryData.charset,
            audio_key: nameEntryData.audio_key,
            context_id: newContext.id,
          },
        }),
      );
      expect(result).toEqual(withAudioUrl(nameEntryData));
    });

    it('should cleanup 1 entry when soft-deleted count is at the limit', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the transaction create return value
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Mock count at the limit (50)
      tx.nameEntry.count.mockResolvedValue(50);

      // Mock the oldest exceeded entries lookup
      const oldestEntry = { id: 'oldest-entry-id', audio_key: null };
      tx.nameEntry.findMany.mockResolvedValue([oldestEntry]);

      // Try to update a name entry
      await service.update('test-user', 'test-entry-id', { value: 'new name' });

      // Check the oldest 1 entry was queried and deleted
      expect(tx.nameEntry.findMany).toHaveBeenCalledWith({
        where: { user_id: 'test-user', deleted_at: { not: null } },
        orderBy: { deleted_at: 'asc' },
        take: 1,
        select: { id: true, audio_key: true },
      });
      expect(tx.nameEntry.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [oldestEntry.id] } },
      });
      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('should cleanup entries when soft-deleted count exceeds the limit', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the transaction create return value
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Mock count exceeding the limit (50)
      tx.nameEntry.count.mockResolvedValue(52);

      // Mock the oldest exceeded entries lookup
      const oldestEntries = [
        { id: 'oldest-entry-1', audio_key: null },
        { id: 'oldest-entry-2', audio_key: null },
        { id: 'oldest-entry-3', audio_key: null },
      ];
      tx.nameEntry.findMany.mockResolvedValue(oldestEntries);

      // Try to update a name entry
      await service.update('test-user', 'test-entry-id', { value: 'new name' });

      // Check the oldest 3 entries were queried and deleted
      expect(tx.nameEntry.findMany).toHaveBeenCalledWith({
        where: { user_id: 'test-user', deleted_at: { not: null } },
        orderBy: { deleted_at: 'asc' },
        take: 3,
        select: { id: true, audio_key: true },
      });
      expect(tx.nameEntry.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: oldestEntries.map((entry) => entry.id) } },
      });
    });

    it('should delete orphaned R2 objects when their audio_key has no remaining references', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the transaction create return value
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Mock count at the limit
      tx.nameEntry.count.mockResolvedValue(50);

      // Mock the oldest exceeded entries with an audio_key
      tx.nameEntry.findMany.mockResolvedValue([
        { id: 'oldest-entry-id', audio_key: 'orphan-key' },
      ]);

      // Mock count for 'orphan-key' to be 0
      prisma.nameEntry.count.mockResolvedValue(0);

      // Try to update a name entry
      await service.update('test-user', 'test-entry-id', { value: 'new name' });

      // Check ref count was queried and R2 delete was called
      expect(prisma.nameEntry.count).toHaveBeenCalledWith({
        where: { audio_key: 'orphan-key' },
      });
      expect(storageService.delete).toHaveBeenCalledWith('orphan-key');
    });

    it('should NOT delete R2 objects that are still referenced by other entries', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the transaction create return value
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Mock count at the limit
      tx.nameEntry.count.mockResolvedValue(50);

      // Mock the oldest exceeded entries with an audio_key that is shared
      tx.nameEntry.findMany.mockResolvedValue([
        { id: 'oldest-entry-id', audio_key: 'shared-key' },
      ]);

      // Mock count for 'shared-key' to be greater than 0
      prisma.nameEntry.count.mockResolvedValue(2);

      // Try to update a name entry
      await service.update('test-user', 'test-entry-id', { value: 'new name' });

      // Check R2 delete was not called because the key is still referenced
      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('should dedupe audio_keys before checking orphan status', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Mock count exceeding the limit
      tx.nameEntry.count.mockResolvedValue(52);

      // Mock oldest entries all sharing the same audio_key
      tx.nameEntry.findMany.mockResolvedValue([
        { id: 'oldest-1', audio_key: 'dup-key' },
        { id: 'oldest-2', audio_key: 'dup-key' },
        { id: 'oldest-3', audio_key: 'dup-key' },
      ]);

      // Mock count for 'dup-key' to be 0
      prisma.nameEntry.count.mockResolvedValue(0);

      // Try to update a name entry
      await service.update('test-user', 'test-entry-id', { value: 'new name' });

      // Check ref count was checked once and delete was called once
      expect(prisma.nameEntry.count).toHaveBeenCalledTimes(1);
      expect(storageService.delete).toHaveBeenCalledTimes(1);
      expect(storageService.delete).toHaveBeenCalledWith('dup-key');
    });

    it('should propagate errors from R2 delete during cleanup', async () => {
      // Mock name entry lookup to return a name entry
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Mock count at the limit
      tx.nameEntry.count.mockResolvedValue(50);
      tx.nameEntry.findMany.mockResolvedValue([
        { id: 'oldest', audio_key: 'flaky-key' },
      ]);

      // Mock count for 'flaky-key' to be 0
      prisma.nameEntry.count.mockResolvedValue(0);

      // Mock R2 delete to fail
      storageService.delete.mockRejectedValue(new Error('R2 down'));

      // Try to update and expect it to throw
      await expect(
        service.update('test-user', 'test-entry-id', { value: 'new name' }),
      ).rejects.toThrow('R2 down');

      // Check that R2 delete was called
      expect(storageService.delete).toHaveBeenCalledWith('flaky-key');
    });
  });

  describe('upload audio', () => {
    const mockFile = (overrides = {}) =>
      ({
        buffer: Buffer.from('test-audio-bytes'),
        mimetype: 'audio/mpeg',
        originalname: 'test.mp3',
        size: 100,
        ...overrides,
      }) as Express.Multer.File;

    it('should throw NotFoundException when the name entry does not exist', async () => {
      // Mock name entry lookup to return null
      prisma.nameEntry.findUnique.mockResolvedValue(null);

      // Call uploadAudio with a non-existent name entry and expect it to throw
      await expect(
        service.uploadAudio(
          'test-user',
          '00000000-0000-0000-0000-000000000000',
          mockFile(),
        ),
      ).rejects.toThrow(NotFoundException);

      // Check that upload, tx and create were not called
      expect(storageService.upload).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.nameEntry.update).not.toHaveBeenCalled();
      expect(tx.nameEntry.create).not.toHaveBeenCalled();
    });

    it('should upload the file, soft-delete the old entry, create a new one and return the signed url', async () => {
      // Mock name entry lookup
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the transaction create return value
      tx.nameEntry.create.mockImplementation(
        (args: { data: { audio_key: string } }) =>
          Promise.resolve({
            ...nameEntryData,
            audio_key: args.data.audio_key,
          }),
      );

      // Call uploadAudio with the mock data
      const result = await service.uploadAudio(
        'test-user',
        nameEntryData.id,
        mockFile({ mimetype: 'audio/mpeg' }),
      );

      // Check that upload was called with the correct data
      expect(storageService.upload).toHaveBeenCalledTimes(1);
      const [key, buffer, mimetype] = storageService.upload.mock.calls[0] as [
        string,
        Buffer,
        string,
      ];
      expect(key).toMatch(
        new RegExp(`^audio/test-user/${nameEntryData.id}/.+\\.mp3$`),
      );
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(mimetype).toBe('audio/mpeg');

      // Check that the old entry was soft-deleted
      expect(tx.nameEntry.update).toHaveBeenCalledWith({
        where: { id: nameEntryData.id },
        data: { deleted_at: expect.any(Date) as Date },
      });

      // Check that a new entry was created with the new audio_key
      expect(tx.nameEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            user_id: 'test-user',
            value: nameEntryData.value,
            charset: nameEntryData.charset,
            audio_key: key,
            context_id: nameEntryData.context_id,
          },
        }),
      );

      // Check that the result includes the signed url for the newly uploaded key
      expect(result.audio_url).toBe(`signed-url:${key}`);
    });

    it('should map known mimetypes to their extension', async () => {
      // Mock name entry lookup
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);
      tx.nameEntry.create.mockResolvedValue({
        ...nameEntryData,
        audio_key: 'k',
      });

      // Call uploadAudio
      await service.uploadAudio(
        'test-user',
        nameEntryData.id,
        mockFile({ mimetype: 'audio/webm' }),
      );

      // Check that upload was called with the correct data
      const [key] = storageService.upload.mock.calls[0] as [string];
      expect(key).toMatch(/\.webm$/);
    });

    it('should default to .bin for unknown mimetypes', async () => {
      // Mock name entry lookup
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);
      tx.nameEntry.create.mockResolvedValue({
        ...nameEntryData,
        audio_key: 'k',
      });

      // Call uploadAudio
      await service.uploadAudio(
        'test-user',
        nameEntryData.id,
        mockFile({ mimetype: 'audio/ogg' }),
      );

      // Check that upload was called with the correct data
      const [key] = storageService.upload.mock.calls[0] as [string];
      expect(key).toMatch(/\.bin$/);
    });

    it('should cleanup orphaned R2 objects when max soft-deleted is reached', async () => {
      // Mock name entry lookup
      const nameEntryData = mockNameEntry();
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);
      tx.nameEntry.create.mockResolvedValue(nameEntryData);

      // Mock count at the limit
      tx.nameEntry.count.mockResolvedValue(50);
      tx.nameEntry.findMany.mockResolvedValue([
        { id: 'oldest', audio_key: 'orphan-key' },
      ]);

      // Mock count for 'orphan-key' to be 0
      prisma.nameEntry.count.mockResolvedValue(0);

      // Call uploadAudio
      await service.uploadAudio(
        'test-user',
        nameEntryData.id,
        mockFile({ mimetype: 'audio/mpeg' }),
      );

      // Check R2 delete was called for the orphaned key
      expect(storageService.delete).toHaveBeenCalledWith('orphan-key');
    });
  });

  describe('remove audio', () => {
    it('should throw NotFoundException when the name entry does not exist', async () => {
      // Mock name entry lookup to return null
      prisma.nameEntry.findUnique.mockResolvedValue(null);

      // Call removeAudio with a non-existent name entry and expect it to throw
      await expect(
        service.removeAudio(
          'test-user',
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(NotFoundException);

      // Check that tx, create and delete were not called
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.nameEntry.update).not.toHaveBeenCalled();
      expect(tx.nameEntry.create).not.toHaveBeenCalled();
      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('should be idempotent when the entry already has no audio', async () => {
      // Mock name entry lookup with audio_key null
      const nameEntryData = {
        id: 'test-entry-id',
        value: 'test',
        charset: 'testcharset',
        audio_key: null,
        context_id: 'test-context-id',
        context: {
          name: 'Context',
          key: 'context',
          description: 'Description',
        },
      };
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Call removeAudio
      const result = await service.removeAudio('test-user', 'test-entry-id');

      // Check no tx, create or update was called
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.nameEntry.update).not.toHaveBeenCalled();
      expect(tx.nameEntry.create).not.toHaveBeenCalled();

      // Check result includes audio_url null
      expect(result).toEqual({
        id: nameEntryData.id,
        value: nameEntryData.value,
        charset: nameEntryData.charset,
        audio_key: null,
        context: nameEntryData.context,
        audio_url: null,
      });
    });

    it('should soft-delete the old entry, create a new one with audio_key null and return it', async () => {
      // Mock name entry lookup with an audio_key
      const nameEntryData = {
        id: 'test-entry-id',
        value: 'test',
        charset: 'testcharset',
        audio_key: 'existing-key',
        context_id: 'test-context-id',
        context: {
          name: 'Context',
          key: 'context',
          description: 'Description',
        },
      };
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);

      // Mock the transaction create return value
      const createdEntry = {
        id: 'new-entry-id',
        value: nameEntryData.value,
        charset: nameEntryData.charset,
        audio_key: null,
        context: nameEntryData.context,
      };
      tx.nameEntry.create.mockResolvedValue(createdEntry);

      // Call removeAudio
      const result = await service.removeAudio('test-user', 'test-entry-id');

      // Check that the old entry was soft-deleted
      expect(tx.nameEntry.update).toHaveBeenCalledWith({
        where: { id: nameEntryData.id },
        data: { deleted_at: expect.any(Date) as Date },
      });

      // Check that the new entry was created with audio_key null
      expect(tx.nameEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            user_id: 'test-user',
            value: nameEntryData.value,
            charset: nameEntryData.charset,
            audio_key: null,
            context_id: nameEntryData.context_id,
          },
        }),
      );

      // Check the returned entry includes audio_url null
      expect(result).toEqual({ ...createdEntry, audio_url: null });
    });

    it('should NOT delete the R2 object of the removed audio since it is still referenced by the soft-deleted entry (history)', async () => {
      // Mock name entry lookup with an audio_key
      const nameEntryData = {
        id: 'test-entry-id',
        value: 'test',
        charset: 'testcharset',
        audio_key: 'existing-key',
        context_id: 'test-context-id',
        context: {
          name: 'Context',
          key: 'context',
          description: 'Description',
        },
      };
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);
      tx.nameEntry.create.mockResolvedValue({
        id: 'new-id',
        value: nameEntryData.value,
        charset: nameEntryData.charset,
        audio_key: null,
        context: nameEntryData.context,
      });

      // No hard-deleted entries this time
      tx.nameEntry.count.mockResolvedValue(0);

      // Call removeAudio
      await service.removeAudio('test-user', 'test-entry-id');

      // Check the R2 object was not deleted
      expect(storageService.delete).not.toHaveBeenCalled();
    });

    it('should cleanup orphaned R2 objects when max soft-deleted is reached', async () => {
      // Mock name entry lookup with an audio_key
      const nameEntryData = {
        id: 'test-entry-id',
        value: 'test',
        charset: 'testcharset',
        audio_key: 'existing-key',
        context_id: 'test-context-id',
        context: {
          name: 'Context',
          key: 'context',
          description: 'Description',
        },
      };
      prisma.nameEntry.findUnique.mockResolvedValue(nameEntryData);
      tx.nameEntry.create.mockResolvedValue({
        id: 'new-id',
        value: nameEntryData.value,
        charset: nameEntryData.charset,
        audio_key: null,
        context: nameEntryData.context,
      });

      // Mock count at the limit; oldest entry has an orphaned audio_key
      tx.nameEntry.count.mockResolvedValue(50);
      tx.nameEntry.findMany.mockResolvedValue([
        { id: 'oldest', audio_key: 'orphan-key' },
      ]);

      // Mock count for 'orphan-key' to be 0
      prisma.nameEntry.count.mockResolvedValue(0);

      // Call removeAudio
      await service.removeAudio('test-user', 'test-entry-id');

      // Check R2 delete was called for the orphaned key
      expect(storageService.delete).toHaveBeenCalledWith('orphan-key');
    });
  });

  describe('remove name entry', () => {
    it('should soft-delete an active name entry', async () => {
      prisma.nameEntry.findUnique.mockResolvedValue({ id: 'test-entry-id' });
      tx.nameEntry.count.mockResolvedValue(0);

      await service.remove('test-user', 'test-entry-id');

      expect(prisma.nameEntry.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-entry-id', user_id: 'test-user', deleted_at: null },
        select: { id: true },
      });
      expect(tx.nameEntry.update).toHaveBeenCalledWith({
        where: { id: 'test-entry-id' },
        data: { deleted_at: expect.any(Date) as Date },
      });
      expect(tx.nameEntry.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the entry does not exist', async () => {
      prisma.nameEntry.findUnique.mockResolvedValue(null);

      await expect(service.remove('test-user', 'missing-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(tx.nameEntry.update).not.toHaveBeenCalled();
    });

    it('should cleanup oldest history when soft-deleted count is at the limit', async () => {
      prisma.nameEntry.findUnique.mockResolvedValue({ id: 'test-entry-id' });
      tx.nameEntry.count.mockResolvedValue(50);
      tx.nameEntry.findMany.mockResolvedValue([
        { id: 'oldest-entry-id', audio_key: null },
      ]);

      await service.remove('test-user', 'test-entry-id');

      expect(tx.nameEntry.findMany).toHaveBeenCalledWith({
        where: { user_id: 'test-user', deleted_at: { not: null } },
        orderBy: { deleted_at: 'asc' },
        take: 1,
        select: { id: true, audio_key: true },
      });
      expect(tx.nameEntry.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['oldest-entry-id'] } },
      });
      expect(tx.nameEntry.update).toHaveBeenCalledWith({
        where: { id: 'test-entry-id' },
        data: { deleted_at: expect.any(Date) as Date },
      });
    });
  });
});

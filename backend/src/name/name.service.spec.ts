import { Test, TestingModule } from '@nestjs/testing';
import { NameService } from './name.service';
import { PrismaService } from 'src/prisma/prisma.service';
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
  audio_url: 'test-audio-url',
  ...overrides,
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
    };
    $transaction: jest.Mock;
  };
  let tx: {
    nameEntry: {
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      context: { findUnique: jest.fn(), findMany: jest.fn() },
      nameEntry: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    tx = {
      nameEntry: { create: jest.fn(), update: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (cb: (t: typeof tx) => Promise<unknown>) => cb(tx),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [NameService, { provide: PrismaService, useValue: prisma }],
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
      expect(result).toBe(nameEntryData);
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
      expect(result).toBe(emptyNameEntryData);
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
        },
        {
          id: 'test-2',
          value: 'test 2',
          charset: 'test charset 2',
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
      expect(result).toBe(nameEntriesData);
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
      expect(result).toBe(nameEntriesData);
    });
  });

  describe('get name entry history', () => {
    it('should use defaults when no page and limit are provided', async () => {
      // Mock soft-deleted entries
      const deletedEntries = [
        { id: 'd1', value: 'old name', deleted_at: new Date() },
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
        data: deletedEntries,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should paginate correctly with custom page and limit', async () => {
      // Mock soft-deleted entries
      const deletedEntries = [{ id: 'd3', value: 'even older' }];
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
        data: deletedEntries,
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
        audio_url: 'old audio url',
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
            audio_url: 'old audio url',
            context_id: 'old context id',
          },
        }),
      );
      expect(result).toEqual(nameEntryData);
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
            audio_url: nameEntryData.audio_url,
            context_id: newContext.id,
          },
        }),
      );
      expect(result).toEqual(nameEntryData);
    });
  });
});

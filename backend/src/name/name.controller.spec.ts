import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { NameController } from './name.controller';
import { NameService } from './name.service';
import type { JwtUser } from 'src/auth/current-user.decorator';

describe('NameController', () => {
  let controller: NameController;
  let nameService: {
    create: jest.Mock;
    query: jest.Mock;
    queryHistory: jest.Mock;
    update: jest.Mock;
    uploadAudio: jest.Mock;
    removeAudio: jest.Mock;
  };
  const mockUser: JwtUser = { sub: 'test-user-id', email: 'test@test.com' };

  const mockFile = (overrides: Partial<Express.Multer.File> = {}) =>
    ({
      buffer: Buffer.from('fake-audio'),
      mimetype: 'audio/mpeg',
      originalname: 'test.mp3',
      size: 100,
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(async () => {
    nameService = {
      create: jest.fn(),
      query: jest.fn(),
      queryHistory: jest.fn(),
      update: jest.fn(),
      uploadAudio: jest.fn(),
      removeAudio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NameController],
      providers: [{ provide: NameService, useValue: nameService }],
    }).compile();

    controller = module.get<NameController>(NameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call nameService.create with the user id and dto', async () => {
      // Mock create response
      const createdEntry = { id: 'entry-1', value: 'test' };
      nameService.create.mockResolvedValue(createdEntry);

      // Call create with dto
      const dto = {
        value: 'test',
        charset: 'charsettest',
        context: 'context-test',
      };
      const result = await controller.create(mockUser, dto);

      // Check delegation and return
      expect(nameService.create).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toBe(createdEntry);
    });
  });

  describe('findAll', () => {
    it('should call nameService.query with the user id and context', async () => {
      // Mock query response
      const entries = [{ id: 'test-1' }, { id: 'test-2' }];
      nameService.query.mockResolvedValue(entries);

      // Call findAll with a query containing context
      const query = { context: 'context-test' };
      const result = await controller.findAll(mockUser, query);

      // Check delegation and return
      expect(nameService.query).toHaveBeenCalledWith(
        mockUser.sub,
        query.context,
      );
      expect(result).toBe(entries);
    });
  });

  describe('queryHistory', () => {
    it('should call nameService.queryHistory with the user id and query', async () => {
      // Mock history response
      const historyResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      nameService.queryHistory.mockResolvedValue(historyResponse);

      // Call queryHistory with pagination and context
      const query = { page: 1, limit: 20, context: 'context-test' };
      const result = await controller.queryHistory(mockUser, query);

      // Check delegation and return
      expect(nameService.queryHistory).toHaveBeenCalledWith(
        mockUser.sub,
        query,
      );
      expect(result).toBe(historyResponse);
    });
  });

  describe('update', () => {
    it('should call nameService.update with the user id, entry id, and dto', async () => {
      // Mock update response
      const updatedEntry = { id: 'new-entry-id', value: 'updated' };
      nameService.update.mockResolvedValue(updatedEntry);

      // Call update with id and dto
      const dto = { value: 'updated' };
      const result = await controller.update(mockUser, 'entry-id', dto);

      // Check delegation and return
      expect(nameService.update).toHaveBeenCalledWith(
        mockUser.sub,
        'entry-id',
        dto,
      );
      expect(result).toBe(updatedEntry);
    });
  });

  describe('uploadAudio', () => {
    it('should throw BadRequestException when no file is provided', () => {
      // Call uploadAudio with no file and expect to throw
      expect(() =>
        controller.uploadAudio(
          mockUser,
          'entry-id',
          undefined as unknown as Express.Multer.File,
        ),
      ).toThrow(BadRequestException);

      // Check that uploadAudio from nameService was not called
      expect(nameService.uploadAudio).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the mimetype is not allowed', () => {
      // Call uploadAudio with an invalid mimetype and expect to throw
      expect(() =>
        controller.uploadAudio(
          mockUser,
          'entry-id',
          mockFile({ mimetype: 'image/png' }),
        ),
      ).toThrow(BadRequestException);

      // Check that uploadAudio from nameService was not called
      expect(nameService.uploadAudio).not.toHaveBeenCalled();
    });

    it('should delegate to nameService.uploadAudio and return its result', async () => {
      // Mock uploadAudio response
      const uploadedEntry = {
        id: 'entry-id',
        audio_url: 'signed-url:some-key',
      };
      nameService.uploadAudio.mockResolvedValue(uploadedEntry);

      const file = mockFile({ mimetype: 'audio/webm' });
      const result = await controller.uploadAudio(mockUser, 'entry-id', file);

      // Check delegation and return
      expect(nameService.uploadAudio).toHaveBeenCalledWith(
        mockUser.sub,
        'entry-id',
        file,
      );
      expect(result).toBe(uploadedEntry);
    });
  });

  describe('removeAudio', () => {
    it('should call nameService.removeAudio with the user id and entry id and return its result', async () => {
      // Mock removeAudio response
      const updatedEntry = {
        id: 'new-entry-id',
        audio_url: null,
      };
      nameService.removeAudio.mockResolvedValue(updatedEntry);

      // Call removeAudio
      const result = await controller.removeAudio(mockUser, 'entry-id');

      // Check delegation and return
      expect(nameService.removeAudio).toHaveBeenCalledWith(
        mockUser.sub,
        'entry-id',
      );
      expect(result).toBe(updatedEntry);
    });
  });
});

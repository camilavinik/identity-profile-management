import { Test, TestingModule } from '@nestjs/testing';
import { NameController } from './name.controller';
import { NameService } from './name.service';
import type { JwtUser } from 'src/auth/current-user.decorator';

describe('NameController', () => {
  let controller: NameController;
  let nameService: {
    create: jest.Mock;
    query: jest.Mock;
    queryHistory: jest.Mock;
  };
  const mockUser: JwtUser = { sub: 'test-user-id', email: 'test@test.com' };

  beforeEach(async () => {
    nameService = {
      create: jest.fn(),
      query: jest.fn(),
      queryHistory: jest.fn(),
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
});

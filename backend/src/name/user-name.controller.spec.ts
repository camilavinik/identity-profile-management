import { Test, TestingModule } from '@nestjs/testing';
import { UserNameController } from './user-name.controller';
import { NameService } from './name.service';

describe('UserNameController', () => {
  let controller: UserNameController;
  let nameService: {
    queryByUser: jest.Mock;
    queryByEmail: jest.Mock;
  };

  beforeEach(async () => {
    nameService = {
      queryByUser: jest.fn(),
      queryByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserNameController],
      providers: [{ provide: NameService, useValue: nameService }],
    }).compile();

    controller = module.get<UserNameController>(UserNameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should call nameService.queryByEmail with the email and context', async () => {
      const entries = [{ id: 'entry-1', value: 'test' }];
      nameService.queryByEmail.mockResolvedValue(entries);

      const result = await controller.findByEmail('user@test.com', {
        context: 'legal',
      });

      expect(nameService.queryByEmail).toHaveBeenCalledWith(
        'user@test.com',
        'legal',
      );
      expect(result).toBe(entries);
    });
  });

  describe('findByUser', () => {
    it('should call nameService.queryByUser with the id from the path and the context from the query', async () => {
      // Mock queryByUser response
      const entries = [{ id: 'entry-1', value: 'test' }];
      nameService.queryByUser.mockResolvedValue(entries);

      // Call findByUser with id and context
      const result = await controller.findByUser('target-user-id', {
        context: 'context-test',
      });

      // Check delegation and return
      expect(nameService.queryByUser).toHaveBeenCalledWith(
        'target-user-id',
        'context-test',
      );
      expect(result).toBe(entries);
    });

    it('should call nameService.queryByUser with only the id when no context is provided', async () => {
      // Mock queryByUser response
      const entries = [{ id: 'entry-1', value: 'test' }];
      nameService.queryByUser.mockResolvedValue(entries);

      // Call findByUser without a context
      const result = await controller.findByUser('target-user-id', {});

      // Check delegation and return
      expect(nameService.queryByUser).toHaveBeenCalledWith(
        'target-user-id',
        undefined,
      );
      expect(result).toBe(entries);
    });
  });
});

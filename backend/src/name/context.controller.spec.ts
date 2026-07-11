import { Test, TestingModule } from '@nestjs/testing';
import { ContextController } from './context.controller';
import { NameService } from './name.service';

describe('ContextController', () => {
  let controller: ContextController;
  let nameService: { getAllContexts: jest.Mock };

  beforeEach(async () => {
    nameService = { getAllContexts: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContextController],
      providers: [{ provide: NameService, useValue: nameService }],
    }).compile();

    controller = module.get<ContextController>(ContextController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllContexts', () => {
    it('should delegate to nameService.getAllContexts and return its result', async () => {
      const contexts = [
        { name: 'Legal', key: 'legal', description: 'official documents' },
      ];
      nameService.getAllContexts.mockResolvedValue(contexts);

      const result = await controller.getAllContexts();

      expect(nameService.getAllContexts).toHaveBeenCalledWith();
      expect(result).toBe(contexts);
    });
  });
});

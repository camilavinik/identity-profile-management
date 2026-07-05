import { Test, TestingModule } from '@nestjs/testing';
import { NameService } from './name.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('NameService', () => {
  let service: NameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NameService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<NameService>(NameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './storage.service';

// Mock the presigner module
jest.mock('@aws-sdk/s3-request-presigner');

const R2_ENV: Record<string, string> = {
  R2_URL: 'https://example.r2.cloudflarestorage.com',
  R2_ACCESS_KEY_ID: 'test-access-key',
  R2_SECRET_ACCESS_KEY: 'test-secret-key',
  R2_BUCKET: 'test-bucket',
};

describe('StorageService', () => {
  let service: StorageService;
  let configService: { getOrThrow: jest.Mock };
  let sendSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key in R2_ENV) return R2_ENV[key];
        throw new Error(`Unexpected config key: ${key}`);
      }),
    };

    // Intercept S3Client.send so no actual network calls are made
    sendSpy = jest
      .spyOn(S3Client.prototype, 'send')
      .mockImplementation(() => Promise.resolve({}) as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read all required R2 env vars via getOrThrow', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('R2_URL');
    expect(configService.getOrThrow).toHaveBeenCalledWith('R2_ACCESS_KEY_ID');
    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'R2_SECRET_ACCESS_KEY',
    );
    expect(configService.getOrThrow).toHaveBeenCalledWith('R2_BUCKET');
  });

  describe('upload', () => {
    it('should send a PutObjectCommand with the correct key, body and content type', async () => {
      const key = 'audio/user/entry/123.mp3';
      const body = Buffer.from('fake-audio');
      const contentType = 'audio/mpeg';

      // Call upload
      await service.upload(key, body, contentType);

      // Check that send was called with the correct data
      expect(sendSpy).toHaveBeenCalledTimes(1);
      const [firstArg] = sendSpy.mock.calls[0] as [unknown];
      expect(firstArg).toBeInstanceOf(PutObjectCommand);
      const command = firstArg as PutObjectCommand;
      expect(command.input).toEqual({
        Bucket: R2_ENV.R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      });
    });

    it('should propagate errors from the S3 client', async () => {
      // Mock send to return an error
      sendSpy.mockRejectedValueOnce(new Error('S3 down'));

      // Call upload and expect it to throw
      await expect(
        service.upload('key', Buffer.from(''), 'audio/mpeg'),
      ).rejects.toThrow('S3 down');
    });
  });

  describe('getSignedUrl', () => {
    it('should delegate to the presigner and return the signed url', async () => {
      // Mock getSignedUrl to return a signed url
      const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<
        typeof getSignedUrl
      >;
      mockedGetSignedUrl.mockResolvedValue('https://signed.com/audio');

      // Call getSignedUrl
      const result = await service.getSignedUrl('audio/user/entry/123.mp3');

      // Check that the result is the signed url and that getSignedUrl was called
      expect(result).toBe('https://signed.com/audio');
      expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);
      const [, command, options] = mockedGetSignedUrl.mock.calls[0];
      expect(command.input).toEqual({
        Bucket: R2_ENV.R2_BUCKET,
        Key: 'audio/user/entry/123.mp3',
      });
      expect(options).toEqual({ expiresIn: 3600 });
    });

    it('should accept a custom expiration', async () => {
      // Mock getSignedUrl to return a signed url
      const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<
        typeof getSignedUrl
      >;
      mockedGetSignedUrl.mockResolvedValue('https://signed.com/x');

      // Call getSignedUrl
      await service.getSignedUrl('key', 60);

      // Check that getSignedUrl was called with the correct data
      const [, , options] = mockedGetSignedUrl.mock.calls[0];
      expect(options).toEqual({ expiresIn: 60 });
    });
  });

  describe('delete', () => {
    it('should send a DeleteObjectCommand with the correct key', async () => {
      const key = 'audio/user/entry/123.mp3';

      // Call delete
      await service.delete(key);

      // Check that send was called with the correct data
      expect(sendSpy).toHaveBeenCalledTimes(1);
      const [firstArg] = sendSpy.mock.calls[0] as [unknown];
      expect(firstArg).toBeInstanceOf(DeleteObjectCommand);
      const command = firstArg as DeleteObjectCommand;
      expect(command.input).toEqual({
        Bucket: R2_ENV.R2_BUCKET,
        Key: key,
      });
    });

    it('should propagate errors from the S3 client', async () => {
      // Mock send to return an error
      sendSpy.mockRejectedValueOnce(new Error('S3 down'));

      // Call delete and expect it to throw
      await expect(service.delete('key')).rejects.toThrow('S3 down');
    });
  });
});

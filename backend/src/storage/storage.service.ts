import { Injectable } from '@nestjs/common';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow<string>('R2_URL');
    const accessKeyId =
      this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    const bucketName = this.configService.getOrThrow<string>('R2_BUCKET');

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucket = bucketName;
  }

  async upload(key: string, file: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      }),
    );
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 3600, // 1 hour
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}

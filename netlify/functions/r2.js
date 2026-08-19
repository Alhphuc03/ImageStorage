import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { headers } from './utils/mongo.js';

function getS3Client(customConfig = {}) {
  const accountId = customConfig.accountId || process.env.R2_ACCOUNT_ID;
  const accessKeyId = customConfig.accessKeyId || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = customConfig.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Thiếu thông tin kết nối Cloudflare R2 (Account ID, Access Key ID hoặc Secret Access Key)');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId.trim()}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    },
  });
}

function getBucketAndDomain(customConfig = {}) {
  const bucketName = (customConfig.bucketName || process.env.R2_BUCKET_NAME || '').trim();
  let publicDomain = (customConfig.publicDomain || process.env.R2_PUBLIC_DOMAIN || '').trim();

  if (publicDomain && !publicDomain.startsWith('http://') && !publicDomain.startsWith('https://')) {
    publicDomain = `https://${publicDomain}`;
  }
  // Loại bỏ dấu / ở cuối nếu có
  if (publicDomain.endsWith('/')) {
    publicDomain = publicDomain.slice(0, -1);
  }

  return { bucketName, publicDomain };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};
    const action = params.action || body.action;

    // 1. Kiểm tra cấu hình server
    if (action === 'get_status') {
      const hasServerConfig = Boolean(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          hasServerConfig,
          bucketName: process.env.R2_BUCKET_NAME || '',
          publicDomain: process.env.R2_PUBLIC_DOMAIN || '',
          accountId: process.env.R2_ACCOUNT_ID ? '******' : '',
        }),
      };
    }

    // 2. Thử nghiệm kết nối tới R2 Bucket
    if (action === 'test') {
      const config = body.config || {};
      const { bucketName } = getBucketAndDomain(config);
      if (!bucketName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Vui lòng cung cấp Tên Bucket (Bucket Name)' }),
        };
      }

      const s3 = getS3Client(config);
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });

      await s3.send(command);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Kết nối tới Cloudflare R2 thành công rực rỡ!',
        }),
      };
    }

    // 3. Tải trực tiếp qua Serverless (Không lo lỗi CORS trình duyệt)
    if (action === 'upload_direct') {
      const config = body.config || {};
      const { bucketName, publicDomain } = getBucketAndDomain(config);

      if (!bucketName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Chưa cấu hình Bucket Name cho Cloudflare R2' }),
        };
      }

      const base64Data = body.base64 || '';
      if (!base64Data) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Thiếu dữ liệu ảnh base64' }),
        };
      }

      // Tách header base64 nếu có
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const filename = body.filename || `image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.webp`;
      const contentType = body.contentType || 'image/webp';
      const folder = (body.folder || config.folder || 'photos').replace(/^\/+|\/+$/g, '');
      const key = folder ? `${folder}/${filename}` : filename;

      const s3 = getS3Client(config);
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await s3.send(command);

      // Tạo public URL
      let publicUrl = '';
      if (publicDomain) {
        publicUrl = `${publicDomain}/${key}`;
      } else {
        const accountId = config.accountId || process.env.R2_ACCOUNT_ID;
        publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          publicUrl,
          key,
          bucket: bucketName,
          size: buffer.length,
        }),
      };
    }

    // 4. Tạo Pre-signed URL
    if (action === 'presign' || (event.httpMethod === 'POST' && (!action || action === 'presign'))) {
      const config = body.config || {};
      const { bucketName, publicDomain } = getBucketAndDomain(config);
      
      if (!bucketName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Chưa cấu hình Bucket Name cho Cloudflare R2',
          }),
        };
      }

      const s3 = getS3Client(config);
      const filename = body.filename || `image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.webp`;
      const contentType = body.contentType || 'image/webp';
      const folder = (body.folder || config.folder || 'photos').replace(/^\/+|\/+$/g, '');
      const key = folder ? `${folder}/${filename}` : filename;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 1800 });

      let publicUrl = '';
      if (publicDomain) {
        publicUrl = `${publicDomain}/${key}`;
      } else {
        const accountId = config.accountId || process.env.R2_ACCOUNT_ID;
        publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          uploadUrl,
          publicUrl,
          key,
          bucket: bucketName,
        }),
      };
    }

    // 5. Xóa 1 file khỏi R2 Bucket
    if (action === 'delete') {
      const config = body.config || {};
      const { bucketName } = getBucketAndDomain(config);
      let key = body.key || params.key;

      // Nếu truyền url thay vì key, trích xuất key từ URL
      if (!key && (body.url || params.url)) {
        const urlStr = body.url || params.url;
        try {
          const u = new URL(urlStr);
          key = u.pathname.replace(/^\/+/, '');
        } catch {
          key = urlStr.split('.r2.dev/')[1] || urlStr.split('.cloudflarestorage.com/')[1];
        }
      }

      if (key && bucketName) {
        const s3 = getS3Client(config);
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        await s3.send(command);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã xóa file khỏi R2' }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Thiếu key của file cần xóa' }),
      };
    }

    // 6. Xóa sạch toàn bộ file trong R2 Bucket
    if (action === 'clear_all') {
      const config = body.config || {};
      const { bucketName } = getBucketAndDomain(config);

      if (bucketName) {
        const s3 = getS3Client(config);
        const listCmd = new ListObjectsV2Command({
          Bucket: bucketName,
        });
        const listRes = await s3.send(listCmd);
        const objects = listRes.Contents || [];

        let deletedCount = 0;
        for (const obj of objects) {
          if (obj.Key) {
            await s3.send(new DeleteObjectCommand({
              Bucket: bucketName,
              Key: obj.Key,
            }));
            deletedCount++;
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Đã xóa sạch ${deletedCount} file khỏi Cloudflare R2`,
          }),
        };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: 'Yêu cầu không hợp lệ' }),
    };
  } catch (error) {
    console.error('Lỗi Cloudflare R2 Handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Lỗi xử lý Cloudflare R2',
      }),
    };
  }
}

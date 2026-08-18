import { connectToDatabase, headers } from './utils/mongo.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('photos');

    // 1. GET: Lấy danh sách ảnh
    if (event.httpMethod === 'GET') {
      const photos = await collection
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .toArray();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: photos }),
      };
    }

    // 2. POST: Thêm mới một hoặc nhiều ảnh
    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');

      // Nếu là hành động lưu toàn bộ (bulk replace)
      if (payload.action === 'bulk_save' && Array.isArray(payload.photos)) {
        await collection.deleteMany({});
        if (payload.photos.length > 0) {
          const docs = payload.photos.map(p => {
            const { _id, ...rest } = p;
            return rest;
          });
          await collection.insertMany(docs);
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã lưu toàn bộ ảnh thành công' }),
        };
      }

      // Nếu thêm danh sách ảnh mới (Array)
      if (Array.isArray(payload)) {
        if (payload.length === 0) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, data: [] }),
          };
        }

        const cleanDocs = payload.map(item => {
          const { _id, ...rest } = item;
          if (!rest.id) {
            rest.id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          }
          return rest;
        });

        // Insert hoặc upsert từng ảnh
        for (const doc of cleanDocs) {
          await collection.updateOne(
            { id: doc.id },
            { $set: doc },
            { upsert: true }
          );
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: cleanDocs }),
        };
      }

      // Nếu thêm 1 ảnh đơn lẻ
      if (!payload.id) {
        payload.id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      }
      const { _id, ...cleanData } = payload;
      await collection.updateOne(
        { id: cleanData.id },
        { $set: cleanData },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: cleanData }),
      };
    }

    // 3. PUT: Cập nhật thông tin ảnh (Yêu thích, Ghi chú, Đổi Album...)
    if (event.httpMethod === 'PUT') {
      const payload = JSON.parse(event.body || '{}');
      if (!payload.id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Thiếu photo id' }),
        };
      }

      const { _id, ...updateData } = payload;
      await collection.updateOne({ id: payload.id }, { $set: updateData });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: payload }),
      };
    }

    // 4. DELETE: Xóa ảnh
    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const body = event.body ? JSON.parse(event.body) : {};
      const photoId = params.id || body.id;

      if (photoId) {
        await collection.deleteOne({ id: photoId });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã xóa bức ảnh' }),
        };
      }

      if (params.action === 'clear' || body.action === 'clear') {
        await collection.deleteMany({});
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã xóa sạch toàn bộ ảnh' }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Yêu cầu không hợp lệ' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  } catch (error) {
    console.error('Lỗi API photos:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
}

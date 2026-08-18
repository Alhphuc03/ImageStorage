import { connectToDatabase, headers } from './utils/mongo.js';

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('folders');

    // 1. GET: Lấy danh sách toàn bộ Album
    if (event.httpMethod === 'GET') {
      const folders = await collection.find({}, { projection: { _id: 0 } }).toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: folders }),
      };
    }

    // 2. POST: Thêm hoặc Cập nhật Album
    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');

      // Nếu truyền mảng (bulk save)
      if (Array.isArray(payload)) {
        await collection.deleteMany({});
        if (payload.length > 0) {
          const docs = payload.map(f => {
            const { _id, ...rest } = f;
            return rest;
          });
          await collection.insertMany(docs);
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã lưu danh sách album thành công' }),
        };
      }

      // Nếu tạo một folder đơn lẻ
      if (!payload.id) {
        payload.id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
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

    // 3. PUT: Cập nhật thông tin Album
    if (event.httpMethod === 'PUT') {
      const payload = JSON.parse(event.body || '{}');
      if (!payload.id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Thiếu folder id' }),
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

    // 4. DELETE: Xóa Album
    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const body = event.body ? JSON.parse(event.body) : {};
      const folderId = params.id || body.id;

      if (folderId) {
        await collection.deleteOne({ id: folderId });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã xóa album' }),
        };
      }

      if (params.action === 'clear' || body.action === 'clear') {
        await collection.deleteMany({});
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã xóa toàn bộ album' }),
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
    console.error('Lỗi API folders:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
}

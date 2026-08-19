import { connectToDatabase, headers } from './utils/mongo.js';

// Tài khoản mặc định ban đầu nếu database chưa có user
const DEFAULT_ADMIN = {
  id: 'user_admin_default',
  username: 'admin',
  password: '123', // Admin có thể đổi sau
  fullName: 'Quản Trị Viên',
  role: 'admin', // 'admin' | 'editor' | 'viewer'
  avatar: '👑',
  createdAt: new Date().toISOString()
};

const DEFAULT_USERS = [
  DEFAULT_ADMIN,
  {
    id: 'user_editor_default',
    username: 'editor',
    password: '123',
    fullName: 'Người Chỉnh Sửa',
    role: 'editor',
    avatar: '✍️',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_viewer_default',
    username: 'khach',
    password: '123',
    fullName: 'Khách Xem',
    role: 'viewer',
    avatar: '👁️',
    createdAt: new Date().toISOString()
  }
];

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('users');

    // Khởi tạo tài khoản mẫu nếu collection chưa có
    const count = await collection.countDocuments();
    if (count === 0) {
      await collection.insertMany(DEFAULT_USERS);
    }

    // 1. GET: Lấy danh sách toàn bộ User (cho Admin quản lý)
    if (event.httpMethod === 'GET') {
      const users = await collection.find({}, { projection: { _id: 0 } }).toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: users }),
      };
    }

    // 2. POST: Các thao tác Login, Tạo / Cập nhật, Xóa
    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const action = payload.action;

      // a. Xử lý Đăng Nhập (Login)
      if (action === 'login') {
        const { username, password } = payload;
        if (!username || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' }),
          };
        }

        const user = await collection.findOne(
          { username: username.trim().toLowerCase(), password: password.trim() },
          { projection: { _id: 0 } }
        );

        if (!user) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName || user.username,
              role: user.role || 'viewer',
              avatar: user.avatar || '👤'
            }
          }),
        };
      }

      // b. Xóa người dùng (Delete User)
      if (action === 'delete') {
        const { id } = payload;
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: 'Thiếu ID người dùng' }),
          };
        }

        // Không cho phép xóa admin chính
        if (id === 'user_admin_default' || payload.username === 'admin') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: 'Không thể xóa tài khoản Admin mặc định' }),
          };
        }

        await collection.deleteOne({ id });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Đã xóa người dùng thành công' }),
        };
      }

      // c. Thêm hoặc Sửa người dùng (Save / Update User)
      const userData = payload.user || payload;
      if (!userData.username || !userData.password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Tên đăng nhập và mật khẩu không được để trống' }),
        };
      }

      const cleanUsername = userData.username.trim().toLowerCase();

      // Nếu tạo mới, kiểm tra trùng username
      if (!userData.id) {
        const existing = await collection.findOne({ username: cleanUsername });
        if (existing) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: `Tên đăng nhập "${cleanUsername}" đã tồn tại` }),
          };
        }
        userData.id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        userData.createdAt = new Date().toISOString();
      }

      const { _id, ...cleanData } = userData;
      cleanData.username = cleanUsername;
      cleanData.role = cleanData.role || 'viewer';

      await collection.updateOne(
        { id: cleanData.id },
        { $set: cleanData },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Đã lưu thông tin người dùng thành công',
          user: cleanData
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  } catch (error) {
    console.error('Lỗi API Users:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
}

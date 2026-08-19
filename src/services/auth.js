// Quản lý Xác Thực & Người Dùng (Auth Service)

const CURRENT_USER_KEY = 'storage_current_user_v1';
const LOCAL_USERS_KEY = 'storage_local_users_backup_v1';

// Danh sách user mẫu dự phòng (offline fallback)
const INITIAL_FALLBACK_USERS = [
  {
    id: 'user_admin_default',
    username: 'admin',
    password: '123',
    fullName: 'Quản Trị Viên',
    role: 'admin',
    avatar: '👑'
  },
  {
    id: 'user_editor_default',
    username: 'editor',
    password: '123',
    fullName: 'Người Chỉnh Sửa',
    role: 'editor',
    avatar: '✍️'
  },
  {
    id: 'user_viewer_default',
    username: 'khach',
    password: '123',
    fullName: 'Khách Xem',
    role: 'viewer',
    avatar: '👁️'
  }
];

export const authService = {
  // Lấy người dùng đang đăng nhập hiện tại
  getCurrentUser() {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Lưu phiên đăng nhập
  setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Lỗi lưu phiên đăng nhập:', e);
    }
  },

  // Đăng xuất
  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Đăng nhập (gọi API với fallback offline)
  async login(username, password) {
    const cleanU = (username || '').trim().toLowerCase();
    const cleanP = (password || '').trim();

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: cleanU, password: cleanP })
      });
      const data = await res.json();
      if (data.success && data.user) {
        this.setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Đăng nhập thất bại' };
    } catch (err) {
      // Fallback offline qua LocalStorage
      const localUsers = this.getLocalUsers();
      const match = localUsers.find(
        u => u.username.toLowerCase() === cleanU && u.password === cleanP
      );
      if (match) {
        const userObj = {
          id: match.id,
          username: match.username,
          fullName: match.fullName || match.username,
          role: match.role || 'viewer',
          avatar: match.avatar || '👤'
        };
        this.setCurrentUser(userObj);
        return { success: true, user: userObj };
      }
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }
  },

  // Đăng ký tài khoản mới (Mặc định luôn là role: 'editor')
  async register(username, password, fullName) {
    const cleanU = (username || '').trim().toLowerCase();
    const cleanP = (password || '').trim();
    const cleanName = (fullName || '').trim() || cleanU;

    if (!cleanU || !cleanP) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' };
    }

    if (cleanU.length < 3) {
      return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' };
    }

    if (cleanP.length < 3) {
      return { success: false, message: 'Mật khẩu phải có ít nhất 3 ký tự' };
    }

    const newUserPayload = {
      username: cleanU,
      password: cleanP,
      fullName: cleanName,
      role: 'editor', // BẮT BUỘC: Đăng ký tự do chỉ được cấp quyền editor
      avatar: '✍️',
      createdAt: new Date().toISOString()
    };

    const saveResult = await this.saveUser(newUserPayload);
    if (saveResult.success) {
      const userObj = {
        id: saveResult.user.id,
        username: saveResult.user.username,
        fullName: saveResult.user.fullName,
        role: 'editor',
        avatar: '✍️'
      };
      this.setCurrentUser(userObj);
      return { success: true, user: userObj };
    }

    return { success: false, message: saveResult.message || 'Đăng ký thất bại' };
  },

  // Lấy danh sách toàn bộ người dùng (Dành cho Admin)
  async getUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        this.setLocalUsers(data.data);
        return data.data;
      }
    } catch (e) {
      console.warn('Không thể tải users từ server, dùng local:', e);
    }
    return this.getLocalUsers();
  },

  // Lưu hoặc cập nhật người dùng (Admin)
  async saveUser(userData) {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', user: userData })
      });
      const data = await res.json();
      if (data.success) {
        // Cập nhật local
        const local = this.getLocalUsers();
        const existsIdx = local.findIndex(u => u.id === userData.id);
        if (existsIdx >= 0) {
          local[existsIdx] = { ...local[existsIdx], ...userData };
        } else {
          local.push(data.user || userData);
        }
        this.setLocalUsers(local);
        return { success: true, user: data.user || userData };
      }
      return { success: false, message: data.message };
    } catch (err) {
      // Offline fallback
      const local = this.getLocalUsers();
      const existsIdx = local.findIndex(u => u.id === userData.id);
      if (existsIdx >= 0) {
        local[existsIdx] = { ...local[existsIdx], ...userData };
      } else {
        const newUser = {
          ...userData,
          id: userData.id || `user_${Date.now()}`
        };
        local.push(newUser);
      }
      this.setLocalUsers(local);
      return { success: true, user: userData };
    }
  },

  // Xóa người dùng (Admin)
  async deleteUser(userId) {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: userId })
      });
      const data = await res.json();
      if (data.success) {
        const local = this.getLocalUsers().filter(u => u.id !== userId);
        this.setLocalUsers(local);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const local = this.getLocalUsers().filter(u => u.id !== userId);
      this.setLocalUsers(local);
      return { success: true };
    }
  },

  // Helper local storage
  getLocalUsers() {
    try {
      const saved = localStorage.getItem(LOCAL_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FALLBACK_USERS;
  },

  setLocalUsers(users) {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch {}
  }
};

/**
 * Kiểm tra xem Album có được hiển thị cho currentUser không
 */
export function isFolderVisible(folder, currentUser) {
  if (!folder) return false;
  if (currentUser?.role === 'admin') return true;
  // Nếu là riêng tư (isPublic === false), chỉ người tạo (createdBy) mới xem được
  if (folder.isPublic === false) {
    return Boolean(currentUser?.username && folder.createdBy === currentUser.username);
  }
  return true;
}

/**
 * Kiểm tra xem Bức Ảnh có được hiển thị cho currentUser không
 */
export function isPhotoVisible(photo, currentUser, folders = []) {
  if (!photo) return false;
  if (currentUser?.role === 'admin') return true;

  // 1. Nếu bức ảnh được đánh dấu riêng tư
  if (photo.isPublic === false) {
    if (!currentUser?.username || photo.createdBy !== currentUser.username) {
      return false;
    }
  }

  // 2. Nếu bức ảnh nằm trong 1 Album, và Album đó bị đặt Riêng tư
  if (photo.folderId && photo.folderId !== 'all') {
    const parentFolder = (folders || []).find(f => f && f.id === photo.folderId);
    if (parentFolder && parentFolder.isPublic === false) {
      if (!currentUser?.username || parentFolder.createdBy !== currentUser.username) {
        return false;
      }
    }
  }

  return true;
}


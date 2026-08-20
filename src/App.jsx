import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import FolderList from './components/FolderList';
import PhotoGrid from './components/PhotoGrid';
import MobileBottomNav from './components/MobileBottomNav';
import MobileAlbumDrawer from './components/MobileAlbumDrawer';
import LoginGate from './components/LoginGate';

// Lazy load các Modals chỉ khi người dùng thực sự mở lên
const UploadModal = lazy(() => import('./components/UploadModal'));
const FolderModal = lazy(() => import('./components/FolderModal'));
const R2Modal = lazy(() => import('./components/R2Modal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const PhotoViewer = lazy(() => import('./components/PhotoViewer'));
const ConfirmModal = lazy(() => import('./components/ConfirmModal'));
const UserManagementModal = lazy(() => import('./components/UserManagementModal'));

import { 
  getStoredFolders, 
  saveFolders, 
  getStoredPhotos, 
  savePhotos, 
  getStoredPrefs, 
  savePrefs,
  resetToSampleData
} from './services/storage';
import { 
  loadPhotosFromDB, 
  savePhotosToDB, 
  loadFoldersFromDB, 
  saveFoldersToDB 
} from './services/db';
import {
  fetchFoldersApi,
  saveFolderApi,
  deleteFolderApi,
  saveAllFoldersApi,
  clearAllFoldersApi,
  fetchPhotosApi,
  addPhotosApi,
  updatePhotoApi,
  deletePhotoApi,
  clearAllPhotosApi,
  deleteR2FileApi,
  clearAllR2FilesApi,
  bulkSavePhotosApi
} from './services/api';
import { getStoredR2Config } from './services/r2';
import { speechAssistant } from './services/speech';
import { authService } from './services/auth';

import './App.css';

export default function App() {
  // 0. Xác thực & Người dùng hiện tại
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // 1. Trạng thái Trợ năng & Giao diện
  const [prefs, setPrefs] = useState(() => getStoredPrefs());
  const [fontSize, setFontSize] = useState(prefs?.fontSize || 'large');
  const [theme, setTheme] = useState(prefs?.theme || 'light');
  const [speechEnabled, setSpeechEnabled] = useState(prefs?.speechEnabled !== false);

  // 2. Chế độ Xem ảnh (Viewer) vs Chế độ Quản trị (Edit Mode)
  const [isEditMode, setIsEditMode] = useState(() => {
    const user = authService.getCurrentUser();
    if (user?.role === 'viewer') return false;
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return false;
    }
    return true;
  });

  // Tự động chuyển về Chỉ Xem nếu là tài khoản viewer
  useEffect(() => {
    if (currentUser?.role === 'viewer') {
      setIsEditMode(false);
    }
  }, [currentUser]);

  // 3. Dữ liệu Thư mục, Ảnh & Cấu hình Cloudflare R2
  const [folders, setFolders] = useState(() => getStoredFolders() || []);
  const [photos, setPhotos] = useState(() => getStoredPhotos() || []);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites'
  const [r2Config, setR2Config] = useState(() => getStoredR2Config() || {});

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    if (speechEnabled) {
      speechAssistant.speak('Đã đăng xuất');
    }
  };

  // Tải dữ liệu từ MongoDB API khi mở ứng dụng (MongoDB là nguồn dữ liệu chuẩn)
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      // 1. Tải nhanh từ IndexedDB trước để không bị giật giao diện
      const [localPhotos, localFolders] = await Promise.all([
        loadPhotosFromDB(),
        loadFoldersFromDB()
      ]);
      
      if (isMounted) {
        if (Array.isArray(localPhotos)) setPhotos(localPhotos);
        if (Array.isArray(localFolders)) setFolders(localFolders);
      }

      // 2. Đồng bộ trực tuyến từ MongoDB Atlas (MongoDB là chuẩn tuyệt đối)
      try {
        const [apiFolders, apiPhotos] = await Promise.all([
          fetchFoldersApi(),
          fetchPhotosApi()
        ]);

        if (!isMounted) return;

        // Nếu kết nối MongoDB thành công
        if (Array.isArray(apiFolders)) {
          setFolders(apiFolders);
          saveFolders(apiFolders);
          saveFoldersToDB(apiFolders);
        }

        if (Array.isArray(apiPhotos)) {
          setPhotos(apiPhotos);
          savePhotos(apiPhotos);
          savePhotosToDB(apiPhotos);
        }
      } catch (err) {
        console.warn('Lỗi khi đồng bộ từ MongoDB:', err);
      }
    }

    initializeData();

    return () => { isMounted = false; };
  }, []);

  // 4. Trạng thái Hộp thoại Modals & Mobile Drawer
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [isR2Open, setIsR2Open] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlbumDrawerOpen, setIsAlbumDrawerOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // 5. Trình xem ảnh phóng to (Viewer)
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    photos: [],
    index: 0,
    autoPlay: false
  });

  // 6. Thông báo nổi (Toast) & Cài đặt PWA
  const [toast, setToast] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Đồng bộ tùy chọn giao diện vào thẻ <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-theme', theme);
    savePrefs({ fontSize, theme, speechEnabled });
    speechAssistant.setEnabled(speechEnabled);
  }, [fontSize, theme, speechEnabled]);

  // Lưu folders & photos vào LocalStorage & IndexedDB đồng thời làm cache
  useEffect(() => {
    saveFolders(folders);
    saveFoldersToDB(folders);
  }, [folders]);

  useEffect(() => {
    savePhotos(photos);
    savePhotosToDB(photos);
  }, [photos]);

  const showToast = (message, icon = '🎉') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const triggerCelebration = async () => {
    try {
      const confettiMod = await import('canvas-confetti');
      const confetti = confettiMod.default || confettiMod;
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // ignore
    }
  };

  // --- XỬ LÝ THƯ MỤC (FOLDERS) ---
  const handleOpenNewFolder = () => {
    setFolderToEdit(null);
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder) => {
    setFolderToEdit(folder);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (folderData) => {
    if (folderToEdit) {
      setFolders(prev => prev.map(f => f.id === folderData.id ? { ...f, ...folderData } : f));
      showToast(`Đã đổi tên album "${folderData.name}"!`, '📁');
    } else {
      setFolders(prev => [...prev, folderData]);
      triggerCelebration();
      showToast(`Đã tạo album mới "${folderData.name}"!`, '✨');
    }
    // Gửi lên MongoDB
    saveFolderApi(folderData);
  };

  const handleDeleteFolder = (folder) => {
    const photoCount = (photos || []).filter(p => p && p.folderId === folder.id).length;
    setConfirmState({
      isOpen: true,
      title: `Xóa album "${folder.name}"`,
      message: `Bạn có chắc muốn xóa album "${folder.name}"? Album này hiện có ${photoCount} bức ảnh. (Các bức ảnh vẫn sẽ được lưu ở mục Tất Cả Ảnh).`,
      onConfirm: () => {
        setFolders(prev => prev.filter(f => f.id !== folder.id));
        setPhotos(prev => prev.map(p => p.folderId === folder.id ? { ...p, folderId: null } : p));
        if (activeFolderId === folder.id) {
          setActiveFolderId(null);
        }
        setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null });
        showToast(`Đã xóa album "${folder.name}"`, '🗑️');
        // Xóa trên MongoDB
        deleteFolderApi(folder.id);
      }
    });
  };

  // --- XỬ LÝ ẢNH (PHOTOS) ---
  const handleUploadSuccess = (newUploadedPhotos) => {
    setPhotos(prev => [...newUploadedPhotos, ...prev]);
    triggerCelebration();
    showToast(`Đã tải lên thành công ${newUploadedPhotos.length} bức ảnh mới!`, '🎉');
    // Lưu vào MongoDB
    addPhotosApi(newUploadedPhotos);
  };

  const handleToggleFavorite = (photoId) => {
    let updatedPhoto = null;
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        const nextState = !p.isFavorite;
        updatedPhoto = { ...p, isFavorite: nextState };
        if (speechEnabled) {
          speechAssistant.speak(nextState ? 'Đã thêm ảnh vào danh sách yêu thích' : 'Đã bỏ yêu thích');
        }
        return updatedPhoto;
      }
      return p;
    }));

    setViewerState(prev => {
      if (!prev.isOpen || !prev.photos) return prev;
      return {
        ...prev,
        photos: prev.photos.map(p => p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p)
      };
    });

    if (updatedPhoto) {
      updatePhotoApi(updatedPhoto);
    }
  };

  const handleDeletePhoto = (photo) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa bức ảnh này',
      message: `Bạn có chắc chắn muốn xóa bức ảnh này khỏi kho lưu trữ và Cloudflare R2 không?`,
      onConfirm: () => {
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null });
        showToast('Đã xóa bức ảnh', '🗑️');
        if (speechEnabled) {
          speechAssistant.speak('Đã xóa bức ảnh');
        }
        // Xóa trên MongoDB & Cloudflare R2
        deletePhotoApi(photo.id);
        if (photo.url) {
          deleteR2FileApi(photo.url);
        }
      }
    });
  };

  const handleOpenPhotoViewer = (photoList, index = 0, autoPlay = false) => {
    setViewerState({
      isOpen: true,
      photos: photoList,
      index,
      autoPlay
    });
  };

  const handleResetData = () => {
    setConfirmState({
      isOpen: true,
      title: 'Khôi phục ảnh mẫu',
      message: 'Bạn có muốn khôi phục lại các album và ảnh mẫu gia đình ban đầu không?',
      onConfirm: () => {
        const { folders: sampleF, photos: sampleP } = resetToSampleData();
        setFolders(sampleF);
        setPhotos(sampleP);
        setActiveFolderId(null);
        setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null });
        showToast('Đã khôi phục album ảnh mẫu thành công!', '🔄');
        if (speechEnabled) {
          speechAssistant.speak('Đã khôi phục album mẫu');
        }
        // Đồng bộ lên MongoDB
        saveAllFoldersApi(sampleF);
        bulkSavePhotosApi(sampleP);
      }
    });
  };

  const handleClearAllPhotos = () => {
    setConfirmState({
      isOpen: true,
      title: 'Dọn Sạch Toàn Bộ Dữ Liệu',
      message: 'Bạn có chắc chắn muốn xóa sạch toàn bộ Album, Ảnh trên máy, trong cơ sở dữ liệu MongoDB và trên Cloudflare R2 không?',
      onConfirm: async () => {
        // Đóng hộp thoại ngay lập tức để không bị đơ giao diện
        setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null });
        showToast('Đang dọn sạch toàn bộ Album, Ảnh trên MongoDB & Cloudflare R2...', '⏳');

        setPhotos([]);
        setFolders([]);
        setActiveFolderId(null);
        clearAllData();
        await savePhotosToDB([]);
        await saveFoldersToDB([]);

        // Xóa sạch trên MongoDB cả photos, folders và Cloudflare R2 bucket
        await Promise.all([
          clearAllPhotosApi(),
          clearAllFoldersApi(),
          clearAllR2FilesApi()
        ]);

        showToast('Đã dọn sạch toàn bộ Album, Ảnh trên MongoDB & Cloudflare R2!', '✨');
        if (speechEnabled) {
          speechAssistant.speak('Đã dọn sạch toàn bộ album, ảnh và lưu trữ');
        }
      }
    });
  };

  // NẾU CHƯA ĐĂNG NHẬP -> HIỂN THỊ MÀN HÌNH ĐĂNG NHẬP (LOGIN GATE)
  if (!currentUser) {
    return (
      <LoginGate
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user?.role === 'viewer') {
            setIsEditMode(false);
          }
          showToast(`Xin chào ${user.fullName || user.username}!`, '👋');
          if (speechEnabled) {
            speechAssistant.speak(`Đăng nhập thành công. Chào mừng ${user.fullName || user.username}`);
          }
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* 1. HEADER */}
      <Header
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        speechEnabled={speechEnabled}
        onToggleSpeech={() => setSpeechEnabled(prev => !prev)}
        r2Config={r2Config}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(prev => !prev)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewFolder={handleOpenNewFolder}
        onOpenR2={() => setIsR2Open(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={handleResetData}
        onClearAllPhotos={handleClearAllPhotos}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
      />

      {/* 2. THÂN ỨNG DỤNG */}
      <main className="main-body">
        {/* TRƯỜNG HỢP 1: Chế độ Xem thuần túy (isEditMode === false hoặc là Viewer) */}
        {!isEditMode || currentUser?.role === 'viewer' ? (
          !activeFolderId ? (
            /* Khi chưa chọn album: Hiển thị danh sách các Album */
            <FolderList
              folders={folders}
              photos={photos}
              activeFolderId={activeFolderId}
              onSelectFolder={(id) => {
                setActiveFolderId(id);
                setFilterMode('all');
              }}
              onOpenNewFolder={handleOpenNewFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              isEditMode={false}
              speechEnabled={speechEnabled}
              currentUser={currentUser}
            />
          ) : (
            /* Khi đã chọn album hoặc bấm Tất Cả / Yêu Thích: Mở danh sách ảnh */
            <PhotoGrid
              photos={photos}
              folders={folders}
              activeFolderId={activeFolderId}
              filterMode={filterMode}
              onFilterModeChange={setFilterMode}
              onSelectFolder={(id) => {
                setActiveFolderId(id);
                setFilterMode('all');
              }}
              onOpenPhotoViewer={handleOpenPhotoViewer}
              onToggleFavorite={handleToggleFavorite}
              onDeletePhoto={handleDeletePhoto}
              onOpenUpload={() => setIsUploadOpen(true)}
              isEditMode={false}
              speechEnabled={speechEnabled}
              currentUser={currentUser}
            />
          )
        ) : (
          /* TRƯỜNG HỢP 2: Chế độ Quản trị / Chỉnh sửa (isEditMode === true) */
          <>
            <FolderList
              folders={folders}
              photos={photos}
              activeFolderId={activeFolderId}
              onSelectFolder={(id) => {
                setActiveFolderId(id === activeFolderId ? null : id);
                setFilterMode('all');
              }}
              onOpenNewFolder={handleOpenNewFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              isEditMode={true}
              speechEnabled={speechEnabled}
              currentUser={currentUser}
            />

            <PhotoGrid
              photos={photos}
              folders={folders}
              activeFolderId={activeFolderId}
              filterMode={filterMode}
              onFilterModeChange={setFilterMode}
              onSelectFolder={(id) => {
                setActiveFolderId(id);
                setFilterMode('all');
              }}
              onOpenPhotoViewer={handleOpenPhotoViewer}
              onToggleFavorite={handleToggleFavorite}
              onDeletePhoto={handleDeletePhoto}
              onOpenUpload={() => setIsUploadOpen(true)}
              isEditMode={true}
              speechEnabled={speechEnabled}
              currentUser={currentUser}
            />
          </>
        )}
      </main>

      {/* 3. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHO MOBILE */}
      <MobileBottomNav
        activeTab={filterMode === 'favorites' ? 'favorites' : activeFolderId === 'all' ? 'all' : activeFolderId ? 'folder' : 'album'}
        activeFolderId={activeFolderId}
        filterMode={filterMode}
        folders={folders}
        photos={photos}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(prev => !prev)}
        onOpenAlbumDrawer={() => {
          if ((!isEditMode || currentUser?.role === 'viewer') && activeFolderId) {
            setActiveFolderId(null);
            setFilterMode('all');
          } else {
            setIsAlbumDrawerOpen(true);
          }
        }}
        onSelectAllPhotos={() => {
          setActiveFolderId('all');
          setFilterMode('all');
        }}
        onSelectFavorites={() => {
          setActiveFolderId('all');
          setFilterMode('favorites');
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        speechEnabled={speechEnabled}
        currentUser={currentUser}
      />

      {/* 4. SIDEBAR DRAWER CHỌN ALBUM CHO MOBILE */}
      <MobileAlbumDrawer
        isOpen={isAlbumDrawerOpen}
        onClose={() => setIsAlbumDrawerOpen(false)}
        folders={folders}
        photos={photos}
        activeFolderId={activeFolderId}
        onSelectFolder={(id) => {
          setActiveFolderId(id);
          setFilterMode('all');
        }}
        onOpenNewFolder={handleOpenNewFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        isEditMode={isEditMode}
        speechEnabled={speechEnabled}
        currentUser={currentUser}
      />

      {/* 5. SUSPENSE WRAPPER CHO CÁC MODALS LAZY LOADED */}
      <Suspense fallback={null}>
        {/* MODAL CÀI ĐẶT & TRỢ NĂNG */}
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
            setTheme={setTheme}
            speechEnabled={speechEnabled}
            setSpeechEnabled={setSpeechEnabled}
            r2Config={r2Config}
            onOpenR2={() => setIsR2Open(true)}
            onResetData={handleResetData}
            onClearAllPhotos={handleClearAllPhotos}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(prev => !prev)}
            currentUser={currentUser}
            onOpenUsersModal={() => setIsUsersModalOpen(true)}
            onLogout={handleLogout}
            installPrompt={installPrompt}
          />
        )}

        {/* MODAL TẢI ẢNH LÊN */}
        {isUploadOpen && (
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            folders={folders}
            activeFolderId={activeFolderId}
            onUploadSuccess={handleUploadSuccess}
            r2Config={r2Config}
            onOpenR2={() => setIsR2Open(true)}
            speechEnabled={speechEnabled}
            currentUser={currentUser}
          />
        )}

        {/* MODAL TẠO / SỬA THƯ MỤC */}
        {isFolderModalOpen && (
          <FolderModal
            isOpen={isFolderModalOpen}
            folderToEdit={folderToEdit}
            onClose={() => setIsFolderModalOpen(false)}
            onSaveFolder={handleSaveFolder}
            speechEnabled={speechEnabled}
            currentUser={currentUser}
          />
        )}

        {/* MODAL CÀI ĐẶT CLOUDFLARE R2 (CHỈ ADMIN) */}
        {isR2Open && (
          <R2Modal
            isOpen={isR2Open}
            currentConfig={r2Config}
            onClose={() => setIsR2Open(false)}
            onSaveConfig={(cfg) => {
              setR2Config(cfg);
              showToast('Đã lưu cấu hình Cloudflare R2 thành công!', '⚡');
            }}
            speechEnabled={speechEnabled}
          />
        )}

        {/* MODAL QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (CHỈ ADMIN) */}
        {isUsersModalOpen && (
          <UserManagementModal
            isOpen={isUsersModalOpen}
            onClose={() => setIsUsersModalOpen(false)}
            currentUser={currentUser}
          />
        )}

        {/* TRÌNH XEM ẢNH TOÀN MÀN HÌNH (LIGHTBOX & SLIDESHOW) */}
        {viewerState.isOpen && (
          <PhotoViewer
            photos={viewerState.photos}
            initialIndex={viewerState.index}
            initialAutoPlay={viewerState.autoPlay}
            folders={folders}
            onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
            onToggleFavorite={handleToggleFavorite}
            speechEnabled={speechEnabled}
          />
        )}

        {/* HỘP THOẠI XÁC NHẬN */}
        {confirmState.isOpen && (
          <ConfirmModal
            isOpen={confirmState.isOpen}
            title={confirmState.title}
            message={confirmState.message}
            onClose={() => setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null })}
            onConfirm={confirmState.onConfirm}
          />
        )}
      </Suspense>

      {/* 6. THÔNG BÁO NỔI TOAST */}
      {toast && (
        <div className="toast-notification">
          <span className="toast-icon">{toast.icon}</span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

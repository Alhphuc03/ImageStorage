import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import FolderList from './components/FolderList';
import PhotoGrid from './components/PhotoGrid';
import UploadModal from './components/UploadModal';
import FolderModal from './components/FolderModal';
import CloudinaryModal from './components/CloudinaryModal';
import SettingsModal from './components/SettingsModal';
import PhotoViewer from './components/PhotoViewer';
import ConfirmModal from './components/ConfirmModal';
import MobileBottomNav from './components/MobileBottomNav';
import MobileAlbumDrawer from './components/MobileAlbumDrawer';

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
import { getStoredCloudinaryConfig } from './services/cloudinary';
import { speechAssistant } from './services/speech';

import './App.css';

export default function App() {
  // 1. Trạng thái Trợ năng & Giao diện
  const [prefs, setPrefs] = useState(() => getStoredPrefs());
  const [fontSize, setFontSize] = useState(prefs?.fontSize || 'large');
  const [theme, setTheme] = useState(prefs?.theme || 'light');
  const [speechEnabled, setSpeechEnabled] = useState(prefs?.speechEnabled !== false);

  // 2. Chế độ Xem ảnh (Viewer) vs Chế độ Quản trị (Edit Mode)
  // Mặc định trên Mobile là Chế độ Xem thuần túy (chọn album rồi xem ảnh)
  const [isEditMode, setIsEditMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return false;
    }
    return true;
  });

  // 3. Dữ liệu Thư mục, Ảnh & Cấu hình Cloudinary (Ưu tiên nạp dữ liệu thật của người dùng)
  const [folders, setFolders] = useState(() => getStoredFolders() || []);
  const [photos, setPhotos] = useState(() => getStoredPhotos() || []);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [cloudinaryConfig, setCloudinaryConfig] = useState(() => getStoredCloudinaryConfig() || {});

  // Tải dữ liệu thật dung lượng cao từ IndexedDB khi mở ứng dụng
  useEffect(() => {
    let isMounted = true;
    loadPhotosFromDB().then((dbPhotos) => {
      if (isMounted && Array.isArray(dbPhotos) && dbPhotos.length > 0) {
        setPhotos(dbPhotos);
      }
    });
    loadFoldersFromDB().then((dbFolders) => {
      if (isMounted && Array.isArray(dbFolders) && dbFolders.length > 0) {
        setFolders(dbFolders);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // 4. Trạng thái Hộp thoại Modals & Mobile Drawer
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [isCloudinaryOpen, setIsCloudinaryOpen] = useState(false);
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

  // 6. Thông báo nổi (Toast)
  const [toast, setToast] = useState(null);

  // Đồng bộ tùy chọn giao diện vào thẻ <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-theme', theme);
    savePrefs({ fontSize, theme, speechEnabled });
    speechAssistant.setEnabled(speechEnabled);
  }, [fontSize, theme, speechEnabled]);

  // Lưu folders & photos vào LocalStorage & IndexedDB đồng thời
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

  const triggerCelebration = () => {
    try {
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
      }
    });
  };

  // --- XỬ LÝ ẢNH (PHOTOS) ---
  const handleUploadSuccess = (newUploadedPhotos) => {
    setPhotos(prev => [...newUploadedPhotos, ...prev]);
    triggerCelebration();
    showToast(`Đã tải lên thành công ${newUploadedPhotos.length} bức ảnh mới!`, '🎉');
  };

  const handleToggleFavorite = (photoId) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        const nextState = !p.isFavorite;
        if (speechEnabled) {
          speechAssistant.speak(nextState ? 'Đã thêm ảnh vào danh sách yêu thích' : 'Đã bỏ yêu thích');
        }
        return { ...p, isFavorite: nextState };
      }
      return p;
    }));
  };

  const handleDeletePhoto = (photo) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa bức ảnh này',
      message: `Bạn có chắc chắn muốn xóa bức ảnh này khỏi kho lưu trữ không?`,
      onConfirm: () => {
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null });
        showToast('Đã xóa bức ảnh', '🗑️');
        if (speechEnabled) {
          speechAssistant.speak('Đã xóa bức ảnh');
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
      }
    });
  };

  const handleClearAllPhotos = () => {
    setConfirmState({
      isOpen: true,
      title: 'Dọn Sạch Kho Ảnh',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ các bức ảnh cũ để bắt đầu lưu trữ ảnh mới của bạn không? (Các album vẫn sẽ được giữ nguyên).',
      onConfirm: () => {
        setPhotos([]);
        setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null });
        showToast('Đã dọn sạch toàn bộ ảnh cũ!', '✨');
        if (speechEnabled) {
          speechAssistant.speak('Đã dọn sạch ảnh cũ');
        }
      }
    });
  };

  return (
    <div className="app-container">
      {/* 1. HEADER */}
      <Header
        fontSize={fontSize}
        setFontSize={setFontSize}
        theme={theme}
        setTheme={setTheme}
        speechEnabled={speechEnabled}
        setSpeechEnabled={setSpeechEnabled}
        cloudinaryConfig={cloudinaryConfig}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(prev => !prev)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewFolder={handleOpenNewFolder}
        onOpenCloudinary={() => setIsCloudinaryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={handleResetData}
        onClearAllPhotos={handleClearAllPhotos}
      />

      {/* 2. THÂN ỨNG DỤNG */}
      <main className="main-body">
        {/* TRƯỜNG HỢP 1: Chế độ Xem thuần túy (isEditMode === false) */}
        {!isEditMode ? (
          !activeFolderId ? (
            /* Khi chưa chọn album: Hiển thị danh sách các Album */
            <FolderList
              folders={folders}
              photos={photos}
              activeFolderId={activeFolderId}
              onSelectFolder={setActiveFolderId}
              onOpenNewFolder={handleOpenNewFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              isEditMode={false}
              speechEnabled={speechEnabled}
            />
          ) : (
            /* Khi đã chọn album: Mở danh sách ảnh trong album đó */
            <PhotoGrid
              photos={photos}
              folders={folders}
              activeFolderId={activeFolderId}
              onSelectFolder={setActiveFolderId}
              onOpenPhotoViewer={handleOpenPhotoViewer}
              onToggleFavorite={handleToggleFavorite}
              onDeletePhoto={handleDeletePhoto}
              onOpenUpload={() => setIsUploadOpen(true)}
              isEditMode={false}
              speechEnabled={speechEnabled}
            />
          )
        ) : (
          /* TRƯỜNG HỢP 2: Chế độ Quản trị / Chỉnh sửa (isEditMode === true) */
          <>
            <FolderList
              folders={folders}
              photos={photos}
              activeFolderId={activeFolderId}
              onSelectFolder={(id) => setActiveFolderId(id === activeFolderId ? null : id)}
              onOpenNewFolder={handleOpenNewFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              isEditMode={true}
              speechEnabled={speechEnabled}
            />

            <PhotoGrid
              photos={photos}
              folders={folders}
              activeFolderId={activeFolderId}
              onSelectFolder={setActiveFolderId}
              onOpenPhotoViewer={handleOpenPhotoViewer}
              onToggleFavorite={handleToggleFavorite}
              onDeletePhoto={handleDeletePhoto}
              onOpenUpload={() => setIsUploadOpen(true)}
              isEditMode={true}
              speechEnabled={speechEnabled}
            />
          </>
        )}
      </main>

      {/* 3. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHO MOBILE */}
      <MobileBottomNav
        activeTab={activeFolderId ? 'folder' : 'all'}
        activeFolderId={activeFolderId}
        folders={folders}
        photos={photos}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(prev => !prev)}
        onOpenAlbumDrawer={() => setIsAlbumDrawerOpen(true)}
        onSelectAllPhotos={() => setActiveFolderId('all')}
        onSelectFavorites={() => {
          setActiveFolderId('all');
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        speechEnabled={speechEnabled}
      />

      {/* 4. SIDEBAR DRAWER CHỌN ALBUM CHO MOBILE */}
      <MobileAlbumDrawer
        isOpen={isAlbumDrawerOpen}
        onClose={() => setIsAlbumDrawerOpen(false)}
        folders={folders}
        photos={photos}
        activeFolderId={activeFolderId}
        onSelectFolder={setActiveFolderId}
        onOpenNewFolder={handleOpenNewFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        isEditMode={isEditMode}
        speechEnabled={speechEnabled}
      />

      {/* 5. MODAL CÀI ĐẶT & TRỢ NĂNG */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        theme={theme}
        setTheme={setTheme}
        speechEnabled={speechEnabled}
        setSpeechEnabled={setSpeechEnabled}
        cloudinaryConfig={cloudinaryConfig}
        onOpenCloudinary={() => setIsCloudinaryOpen(true)}
        onResetData={handleResetData}
        onClearAllPhotos={handleClearAllPhotos}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(prev => !prev)}
      />

      {/* 6. MODAL TẢI ẢNH LÊN */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folders={folders}
        activeFolderId={activeFolderId}
        onUploadSuccess={handleUploadSuccess}
        cloudinaryConfig={cloudinaryConfig}
        onOpenCloudinary={() => setIsCloudinaryOpen(true)}
        speechEnabled={speechEnabled}
      />

      {/* 7. MODAL TẠO / SỬA THƯ MỤC */}
      <FolderModal
        isOpen={isFolderModalOpen}
        folderToEdit={folderToEdit}
        onClose={() => setIsFolderModalOpen(false)}
        onSaveFolder={handleSaveFolder}
        speechEnabled={speechEnabled}
      />

      {/* 8. MODAL CÀI ĐẶT CLOUDINARY */}
      <CloudinaryModal
        isOpen={isCloudinaryOpen}
        currentConfig={cloudinaryConfig}
        onClose={() => setIsCloudinaryOpen(false)}
        onSaveConfig={(cfg) => {
          setCloudinaryConfig(cfg);
          showToast('Đã lưu cấu hình Cloudinary thành công!', '☁️');
        }}
        speechEnabled={speechEnabled}
      />

      {/* 9. TRÌNH XEM ẢNH TOÀN MÀN HÌNH (LIGHTBOX & SLIDESHOW) */}
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

      {/* 10. HỘP THOẠI XÁC NHẬN */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onClose={() => setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmState.onConfirm}
      />

      {/* 11. THÔNG BÁO NỔI TOAST */}
      {toast && (
        <div className="toast-notification">
          <span className="toast-icon">{toast.icon}</span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

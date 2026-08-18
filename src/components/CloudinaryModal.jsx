import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Sparkles,
  Zap,
  Save
} from 'lucide-react';
import { testCloudinaryConnection, saveCloudinaryConfig } from '../services/cloudinary';
import { speechAssistant } from '../services/speech';

export default function CloudinaryModal({
  isOpen,
  currentConfig,
  onClose,
  onSaveConfig,
  speechEnabled
}) {
  const [cloudName, setCloudName] = useState(currentConfig?.cloudName || '');
  const [uploadPreset, setUploadPreset] = useState(currentConfig?.uploadPreset || '');
  const [folder, setFolder] = useState(currentConfig?.folder || 'storage_photos');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCloudName(currentConfig?.cloudName || '');
      setUploadPreset(currentConfig?.uploadPreset || '');
      setFolder(currentConfig?.folder || 'storage_photos');
      setTestResult(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testCloudinaryConnection(cloudName, uploadPreset);
    setTestResult(res);
    setTesting(false);
    if (speechEnabled) {
      speechAssistant.speak(res.success ? 'Kết nối Cloudinary thành công!' : 'Kết nối chưa thành công, vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const newConfig = {
      cloudName: cloudName.trim(),
      uploadPreset: uploadPreset.trim(),
      folder: folder.trim() || 'storage_photos'
    };
    saveCloudinaryConfig(newConfig);
    onSaveConfig(newConfig);
    if (speechEnabled) {
      speechAssistant.speak('Đã lưu cấu hình Cloudinary thành công.');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Cloud size={24} color="#2563eb" />
            <span>Cài Đặt Lưu Trữ Cloudinary</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body có đầy đủ padding */}
        <form onSubmit={handleSave} style={{ display: 'contents' }}>
          <div className="modal-body">
            {/* Lời giới thiệu */}
            <div className="info-callout">
              <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 3, fontSize: 'var(--font-base)' }}>
                ☁️ Lưu trữ đám mây Cloudinary
              </strong>
              Giúp ảnh của bạn luôn được lưu an toàn, sắc nét và không bao giờ bị mất ngay cả khi bạn đổi máy tính hoặc điện thoại.
            </div>

            {testResult && (
              <div className={`status-callout ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Các trường nhập liệu */}
            <div className="form-group">
              <label className="form-label">
                1. Tên Cloud (Cloud Name):
              </label>
              <input
                type="text"
                placeholder="Ví dụ: dojsevb9v"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                required
              />
              <span className="form-hint">Tìm thấy ngay tại màn hình Dashboard chính trên Cloudinary.com</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                2. Upload Preset (Chế độ Unsigned):
              </label>
              <input
                type="text"
                placeholder="Ví dụ: ml_default hoặc storage_preset"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                required
              />
              <span className="form-hint">Tạo trong Settings &gt; Upload &gt; Upload presets (phải chọn <strong>Unsigned</strong>)</span>
            </div>

            <div className="form-group">
              <label className="form-label">
                3. Thư mục trên Cloud (Mặc định):
              </label>
              <input
                type="text"
                placeholder="storage_photos"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              />
            </div>

            {/* Hướng dẫn tạo Upload Preset */}
            <div className="instruction-box">
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>
                📖 Hướng dẫn lấy thông tin trong 3 bước:
              </div>
              <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.45, fontSize: 'var(--font-sm)' }}>
                <li>Đăng nhập vào <a href="https://cloudinary.com/console" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>cloudinary.com/console</a>.</li>
                <li>Vào biểu tượng ⚙️ <strong>Settings</strong> &rarr; Thẻ <strong>Upload</strong> &rarr; Cuộn xuống <strong>Upload presets</strong> &rarr; Bấm <strong>Add upload preset</strong>.</li>
                <li>Tại dòng <strong>Signing Mode</strong>, chọn <strong>Unsigned</strong> &rarr; Bấm <strong>Save</strong> &rarr; Copy tên Preset dán vào ô số 2 ở trên.</li>
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleTest}
              disabled={testing || !cloudName || !uploadPreset}
              title="Kiểm tra xem tên Cloud và Preset có hợp lệ không"
            >
              <Zap size={16} />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}</span>
            </button>

            <button type="submit" className="btn-primary">
              <Save size={16} />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Save, 
  Server, 
  Key, 
  Database, 
  Globe, 
  Info 
} from 'lucide-react';
import { testR2Connection, saveR2Config, checkServerR2Status } from '../services/r2';
import { speechAssistant } from '../services/speech';

export default function R2Modal({
  isOpen,
  currentConfig,
  onClose,
  onSaveConfig,
  speechEnabled
}) {
  const [accountId, setAccountId] = useState(currentConfig?.accountId || '');
  const [accessKeyId, setAccessKeyId] = useState(currentConfig?.accessKeyId || '');
  const [secretAccessKey, setSecretAccessKey] = useState(currentConfig?.secretAccessKey || '');
  const [bucketName, setBucketName] = useState(currentConfig?.bucketName || '');
  const [publicDomain, setPublicDomain] = useState(currentConfig?.publicDomain || '');
  const [folder, setFolder] = useState(currentConfig?.folder || 'photos');
  
  const [serverStatus, setServerStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAccountId(currentConfig?.accountId || '');
      setAccessKeyId(currentConfig?.accessKeyId || '');
      setSecretAccessKey(currentConfig?.secretAccessKey || '');
      setBucketName(currentConfig?.bucketName || '');
      setPublicDomain(currentConfig?.publicDomain || '');
      setFolder(currentConfig?.folder || 'photos');
      setTestResult(null);

      // Kiểm tra xem server có sẵn biến môi trường không
      checkServerR2Status().then(res => {
        if (res && res.success) {
          setServerStatus(res);
          if (res.hasServerConfig && !bucketName) {
            setBucketName(res.bucketName || '');
            setPublicDomain(res.publicDomain || '');
          }
        }
      });
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const configToTest = {
      accountId: accountId.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      bucketName: bucketName.trim(),
      publicDomain: publicDomain.trim(),
      folder: folder.trim() || 'photos'
    };

    const res = await testR2Connection(configToTest);
    setTestResult(res);
    setTesting(false);

    if (speechEnabled) {
      speechAssistant.speak(
        res.success 
          ? 'Kết nối Cloudflare R2 thành công!' 
          : 'Kết nối chưa thành công, vui lòng kiểm tra lại thông tin cấu hình.'
      );
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const newConfig = {
      accountId: accountId.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      bucketName: bucketName.trim(),
      publicDomain: publicDomain.trim(),
      folder: folder.trim() || 'photos'
    };
    saveR2Config(newConfig);
    onSaveConfig(newConfig);
    if (speechEnabled) {
      speechAssistant.speak('Đã lưu cấu hình Cloudflare R2 thành công.');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Cloud size={24} color="#f6821f" />
            <span>Cài Đặt Lưu Trữ Cloudflare R2</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ display: 'contents' }}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Lời giới thiệu & Ưu điểm */}
            <div className="info-callout" style={{ borderColor: '#f6821f', background: 'rgba(246, 130, 31, 0.08)' }}>
              <strong style={{ color: '#ea580c', display: 'block', marginBottom: 4, fontSize: 'var(--font-base)' }}>
                ⚡ Cloudflare R2 Object Storage (10 GB Miễn Phí Vĩnh Viễn)
              </strong>
              <p style={{ margin: 0, fontSize: 'var(--font-sm)', lineHeight: 1.5 }}>
                • <strong>Miễn phí 100% băng thông tải/xem ảnh</strong> (Không lo phát sinh chi phí).<br />
                • <strong>Sức chứa hơn 50.000 bức ảnh</strong> nhờ công nghệ nén WebP thông minh tích hợp sẵn.<br />
                • Tốc độ tải cực nhanh tại Việt Nam thông qua mạng lưới CDN Cloudflare.
              </p>
            </div>

            {/* Thông báo kết nối Server Netlify nếu có */}
            {serverStatus?.hasServerConfig && (
              <div className="status-callout success" style={{ marginBottom: 12 }}>
                <Server size={18} />
                <span>Máy chủ Netlify đã được cấu hình sẵn biến môi trường R2 ({serverStatus.bucketName})! Bạn có thể để trống hoặc ghi đè tùy ý.</span>
              </div>
            )}

            {/* Báo kết quả Test */}
            {testResult && (
              <div className={`status-callout ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* 1. Account ID */}
            <div className="form-group">
              <label className="form-label">
                <Database size={15} /> 1. Cloudflare Account ID:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 8e5f3c9a12b4d6e7f8a9b0c1d2e3f4a5"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required={!serverStatus?.hasServerConfig}
              />
              <span className="form-hint">Tìm thấy tại trang chủ Cloudflare Dashboard (cột bên phải) hoặc trong mục R2 Overview.</span>
            </div>

            {/* 2. Bucket Name */}
            <div className="form-group">
              <label className="form-label">
                <Cloud size={15} /> 2. Tên Bucket (Bucket Name):
              </label>
              <input
                type="text"
                placeholder="Ví dụ: storage-photos hoặc my-gallery"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                required={!serverStatus?.hasServerConfig}
              />
              <span className="form-hint">Tên Bucket bạn đã tạo trong Cloudflare R2 Dashboard.</span>
            </div>

            {/* 3. Public Domain */}
            <div className="form-group">
              <label className="form-label">
                <Globe size={15} /> 3. Tên miền xem ảnh công khai (Public Domain / R2.dev URL):
              </label>
              <input
                type="text"
                placeholder="Ví dụ: https://pub-xxxxxxxx.r2.dev hoặc https://images.yourdomain.com"
                value={publicDomain}
                onChange={(e) => setPublicDomain(e.target.value)}
                required={!serverStatus?.hasServerConfig}
              />
              <span className="form-hint">Bật trong R2 Bucket &gt; Settings &gt; <strong>Public access</strong> (bật R2.dev subdomain hoặc Custom Domain).</span>
            </div>

            {/* 4. Access Key ID & Secret Access Key */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">
                  <Key size={15} /> 4. R2 Access Key ID:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0a1b2c3d4e5f6g7h8i9j..."
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  required={!serverStatus?.hasServerConfig}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Key size={15} /> 5. R2 Secret Access Key:
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  required={!serverStatus?.hasServerConfig}
                />
              </div>
            </div>

            {/* Hướng dẫn tạo tài khoản R2 */}
            <div className="instruction-box">
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={16} /> Hướng dẫn tạo R2 và lấy Key trong 4 bước:
              </div>
              <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5, fontSize: 'var(--font-sm)' }}>
                <li>Đăng nhập <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" style={{ color: '#f6821f', fontWeight: 700 }}>dash.cloudflare.com</a> &rarr; Chọn menu <strong>R2</strong> bên trái.</li>
                <li>Bấm <strong>Create bucket</strong> (đặt tên ví dụ: <code>storage-photos</code>).</li>
                <li>Vào Bucket vừa tạo &rarr; Chọn thẻ <strong>Settings</strong> &rarr; Cuộn xuống <strong>Public access</strong> &rarr; Bấm <strong>Allow Access (R2.dev subdomain)</strong> và sao chép đường link Public URL dán vào ô số 3.</li>
                <li>Quay lại trang R2 &rarr; Bấm <strong>Manage R2 API Tokens</strong> &rarr; <strong>Create API token</strong> (Chọn quyền <code>Object Read & Write</code>) &rarr; Sao chép <strong>Access Key ID</strong> và <strong>Secret Access Key</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleTest}
              disabled={testing || (!bucketName && !serverStatus?.hasServerConfig)}
              title="Kiểm tra kết nối tới R2"
            >
              <Zap size={16} color="#f6821f" />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}</span>
            </button>

            <button type="submit" className="btn-primary" style={{ background: '#ea580c', borderColor: '#c2410c' }}>
              <Save size={16} />
              <span>Lưu Cấu Hình R2</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

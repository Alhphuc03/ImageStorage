/**
 * Dữ liệu mẫu khởi tạo cho album ảnh gia đình
 */

export const INITIAL_FOLDERS = [
  {
    id: 'family',
    name: 'Gia Đình & Con Cháu',
    icon: '👨‍👩‍👧‍👦',
    color: '#3B82F6',
    description: 'Những khoảnh khắc ấm áp sum vầy bên con cháu yêu quý',
    coverImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'travel',
    name: 'Chuyến Đi Du Lịch',
    icon: '✈️',
    color: '#10B981',
    description: 'Tham quan danh lam thắng cảnh, biển xanh và núi đồi tươi đẹp',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-02-15T09:30:00.000Z'
  },
  {
    id: 'garden',
    name: 'Cây Cảnh & Làm Vườn',
    icon: '🌸',
    color: '#EC4899',
    description: 'Góc sân nhỏ xanh mát cùng những chậu hoa rực rỡ tự tay chăm sóc',
    coverImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-03-01T07:15:00.000Z'
  },
  {
    id: 'memories',
    name: 'Kỷ Niệm Ngày Xưa',
    icon: '📷',
    color: '#F59E0B',
    description: 'Những bức ảnh thời thanh xuân và kỷ niệm ghi dấu một thời',
    coverImage: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tet',
    name: 'Tết Sum Vầy & Họp Mặt',
    icon: '🧧',
    color: '#EF4444',
    description: 'Hoa mai, hoa đào, bánh chưng xanh và nụ cười rạng rỡ đón năm mới',
    coverImage: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-01-28T10:00:00.000Z'
  }
];

export const INITIAL_PHOTOS = [
  {
    id: 'photo-1',
    title: 'Cả nhà chụp ảnh lưu niệm ở công viên',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
    folderId: 'family',
    note: 'Chủ nhật trời đẹp cả nhà đưa các cháu đi dạo công viên, các cháu cười rất tươi.',
    date: '15/05/2026',
    isFavorite: true,
    createdAt: '2026-05-15T10:00:00.000Z',
    fileSize: '2.4 MB'
  },
  {
    id: 'photo-2',
    title: 'Cháu ngoại tập đi xe đạp nhỏ',
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80',
    folderId: 'family',
    note: 'Bé Bi hôm nay biết giữ thăng bằng xe đạp 2 bánh, vui cả buổi chiều.',
    date: '20/06/2026',
    isFavorite: true,
    createdAt: '2026-06-20T14:30:00.000Z',
    fileSize: '3.1 MB'
  },
  {
    id: 'photo-3',
    title: 'Kỳ nghỉ bãi biển Nha Trang bình yên',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    folderId: 'travel',
    note: 'Buổi sáng ngắm bình minh trên biển, gió mát rượi và không khí thật trong lành.',
    date: '10/07/2026',
    isFavorite: false,
    createdAt: '2026-07-10T06:00:00.000Z',
    fileSize: '4.2 MB'
  },
  {
    id: 'photo-4',
    title: 'Núi non hùng vĩ chuyến đi Đà Lạt',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    folderId: 'travel',
    note: 'Đà Lạt sương mờ thông reo, trời se se lạnh uống ly trà atiso rất ấm lòng.',
    date: '02/08/2026',
    isFavorite: true,
    createdAt: '2026-08-02T09:00:00.000Z',
    fileSize: '3.8 MB'
  },
  {
    id: 'photo-5',
    title: 'Chậu hoa phong lan nở rực rỡ buổi sớm',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80',
    folderId: 'garden',
    note: 'Cây lan sau 3 tháng chăm bón cẩn thận nay đã trổ bông thơm ngát cả góc hiên nhà.',
    date: '12/04/2026',
    isFavorite: true,
    createdAt: '2026-04-12T07:30:00.000Z',
    fileSize: '1.9 MB'
  },
  {
    id: 'photo-6',
    title: 'Vườn rau xanh mướt sau cơn mưa rào',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a48?auto=format&fit=crop&w=1200&q=80',
    folderId: 'garden',
    note: 'Rau cải và cà chua trên giàn chuẩn bị thu hoạch cho bữa cơm chiều.',
    date: '18/05/2026',
    isFavorite: false,
    createdAt: '2026-05-18T16:00:00.000Z',
    fileSize: '2.7 MB'
  },
  {
    id: 'photo-7',
    title: 'Chiếc máy ảnh cơ và tấm ảnh thời xưa',
    url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=80',
    folderId: 'memories',
    note: 'Kỷ vật thời trai trẻ cùng các bạn đồng ngũ chụp lại những năm tháng đáng nhớ.',
    date: '01/01/2026',
    isFavorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    fileSize: '2.1 MB'
  },
  {
    id: 'photo-8',
    title: 'Bữa cơm tất niên gia đình ấm cúng',
    url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=1200&q=80',
    folderId: 'tet',
    note: 'Đêm 30 Tết con cháu tề tựu đông đủ, chúc thọ ông bà mạnh khỏe an khang.',
    date: '28/01/2026',
    isFavorite: true,
    createdAt: '2026-01-28T19:00:00.000Z',
    fileSize: '3.5 MB'
  }
];

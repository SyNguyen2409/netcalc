# NETCALC PRO — Cyber Network Calculator

Phiên bản: **VIP Pro** — Tài liệu tinh chỉnh cho người dùng chuyên nghiệp

NETCALC PRO là một công cụ subnetting / VLSM trực quan, tối ưu cho kỹ sư mạng và sinh viên CNTT. README này trình bày nhanh cách chạy, tuỳ chỉnh, và các mẹo nâng cao để biến giao diện thành dashboard chuyên nghiệp.

**Tính năng nổi bật**
- Giao diện hiện đại, responsive với theme light/dark
- Hỗ trợ: CIDR ⇄ Subnet mask, VLSM (Variable Length Subnet Mask)
- Chế độ tối ưu theo số host hoặc số subnet
- Terminal-style output, bảng kết quả rõ ràng
- Toggle theme tùy chỉnh + nhiều hiệu ứng CSS đẹp mắt

**Mục đích**
Đây là một ứng dụng front-end tĩnh (HTML/CSS/JS) giúp phân tích subnet IPv4, phù hợp để chạy cục bộ hoặc triển khai tĩnh trên web server.

**Thư mục chính**
- `index.html` — entrypoint giao diện
- `style.css` — toàn bộ style, biến theme ở `:root` và `body.light-mode`
- `script.js` — logic chuyển đổi theme và các hàm tính toán IP/subnet

**Chuẩn bị (Prerequisites)**
- Trình duyệt hiện đại (Chrome, Edge, Firefox)
- (Tùy chọn) `node` / `npx` để chạy web server tĩnh nhanh
- Hoặc Python (nếu thích dùng `python -m http.server`)

**Chạy nhanh (Quick Start)**
Mở trực tiếp file `index.html` trong trình duyệt là đủ cho trải nghiệm cục bộ. Để phục vụ qua HTTP (tốt để tránh ràng buộc CORS khi mở file):

PowerShell (Python):
```
python -m http.server 8000
# Sau đó mở http://localhost:8000/index.html
```

Node (npx http-server):
```
npx http-server . -p 8080
# Sau đó mở http://localhost:8080/index.html
```

Mẹo: nếu dùng Windows PowerShell, đảm bảo chạy lệnh trong thư mục `e:\My Products\Subnet_Calculator` hoặc mở VS Code Live Server.

**Theme (Light / Dark) và Toggle**
- Toggle theme gọi `toggleTheme()` trong `script.js`.
- Theme lưu trạng thái trong `localStorage` (nếu đã bật trong code). Nếu bạn muốn, tôi có thể thêm tính năng lưu trạng thái tự động.

Ví dụ logic (tóm tắt):
```
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Khi load trang: đọc localStorage và set class phù hợp
```

**Tùy chỉnh nhanh màu/theme**
- Mở `style.css`, tìm phần `:root` để thay đổi biến CSS toàn cục như `--primary`, `--accent`, `--bg-deep`.
- Phần `body.light-mode { ... }` chứa các giá trị dành cho chế độ sáng.

**Kiểm thử & Debug**
- Mở Developer Tools (F12) — tab Console để xem lỗi JS
- Kiểm tra `script.js` để đảm bảo hàm `toggleTheme` tồn tại nếu toggle không phản hồi

**Thêm tính năng đề xuất (Tôi có thể làm giúp)**
- Lưu trạng thái toggle vào `localStorage` và sync checkbox khi trang load
- Thêm nút `Export` để xuất bảng subnet ra CSV
- Thêm test inputs / sample presets (ví dụ: lớp A/B/C mẫu) ở giao diện
- Minify `script.js` / `style.css` và thêm `index.min.html` để deploy

**Cách đóng góp**
- Tạo branch riêng, làm thay đổi và mở PR. Mô tả rõ mục đích, test case, và ảnh chụp màn hình nếu có.

**LICENSE**
Tệp này mặc định là bản demo — nếu bạn muốn tôi thêm `LICENSE` (MIT/Apache/GPL), tôi có thể tạo ngay.

**Thông tin tác giả / liên hệ**
- Tác giả: SyNguyen2409 (owner repo `netcalc`)
- Liên hệ: tạo issues trên repo, hoặc gửi email (bổ sung nếu bạn muốn công khai địa chỉ liên hệ)

--

Muốn mình làm tiếp phần nào sau đây?
- (A) Gắn lưu theme vào `localStorage` + sync checkbox khi load
- (B) Thêm nút export CSV cho bảng subnet
- (C) Tinh chỉnh style header để toggle chính giữa và responsive

Chọn 1 hoặc 2, tôi sẽ tiếp tục and implement ngay.
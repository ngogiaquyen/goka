bạn có thể tham khảo component vòng quay ở thư mục E:\JOB\goka\Spinner 
sử dụng db với prisma
### Tổng quan hệ thống: Website Quay Thưởng Khuyến Mại (Goka Wheel)

**Mục đích**  
Tạo một website cho phép người dùng quay vòng may mắn để nhận khuyến mại/voucher.  
- Mã voucher chỉ hiển thị khi người dùng trúng đúng ô khuyến mại.  
- Tăng tương tác bằng cách giới hạn lượt quay và khuyến khích chia sẻ bài viết của Goka trên Facebook để mở thêm lượt quay.  
- Đảm bảo mỗi người dùng chỉ quay được một lượt mỗi ngày (dựa trên số điện thoại), chống gian lận cơ bản.

**Công nghệ chính**  
- Framework: Next.js (hiện đại, hỗ trợ server-side rendering và API routes).  
- Authentication: NextAuth.js (hỗ trợ đăng nhập Facebook, Google, và Email + Password).  
- Database: MySQL (chạy trong Docker container để dễ quản lý, phát triển và triển khai).  
- OTP Email: Dùng dịch vụ gửi mail (Resend hoặc tương tự) để verify email.  
- Facebook Integration: Sử dụng Facebook JavaScript SDK để mở hộp thoại chia sẻ (ưu tiên mở app Facebook trên điện thoại).  
- Scheduler: Công cụ tự động chạy định kỳ (cron job) để reset lượt quay và thay đổi voucher theo ngày/giờ.

**Tính năng chính**

1. **Đăng nhập / Đăng ký**  
   - Hỗ trợ 3 cách:  
     - Email + Mật khẩu + Số điện thoại (nhập phone ngay từ form đăng ký).  
     - Facebook Login.  
     - Google Login.  
   - Bắt buộc cung cấp **số điện thoại** (unique trong hệ thống) để làm khóa chính kiểm soát lượt quay.  
   - **Không verify số điện thoại** (không gửi OTP cho phone).  
   - **Verify email** bắt buộc:  
     - Với Email/Password: Gửi OTP 6 số qua email ngay khi đăng ký, phải xác thực trước khi hoàn tất tài khoản.  
     - Với Facebook/Google: Email tự động được xác thực bởi nhà cung cấp.  
   - Luồng điển hình:  
     - Đăng ký Email → verify OTP email → nhập số điện thoại → vào ứng dụng.  
     - Đăng nhập Facebook/Google → nếu thiếu số điện thoại → chuyển đến trang nhập phone → lưu ngay → vào ứng dụng.

2. **Giới hạn lượt quay**  
   - Mỗi số điện thoại chỉ được **1 lượt quay miễn phí mỗi ngày** (reset lúc 0h).  
   - Muốn quay thêm (lượt thứ 2 trong ngày) → người dùng phải **chia sẻ bài viết của Goka trên Facebook**.  
   - Hệ thống kiểm tra lượt quay dựa trên số điện thoại unique.

3. **Chia sẻ bài viết để quay thêm**  
   - Khi hết lượt, hiển thị nút “Chia sẻ để quay thêm”.  
   - Nhấn nút → mở hộp thoại chia sẻ Facebook (ưu tiên mở ứng dụng Facebook native trên điện thoại).  
   - Chia sẻ thành công → hệ thống ghi nhận ngay và mở khóa lượt quay thứ 2 trong ngày.  
   - Tự động xác nhận qua callback từ Facebook SDK (khó giả mạo).

4. **Vòng quay & Voucher**  
   - Vòng quay may mắn được thiết kế đẹp mắt, responsive (ưu tiên mobile).  
   - Kết quả quay được random và tính toán ở server (tránh gian lận từ client).  
   - Chỉ hiển thị **mã voucher** khi trúng ô khuyến mại.  
   - Voucher:  
     - Có thể lên lịch thay đổi tự động theo ngày/giờ.  
     - Giới hạn số lượng sử dụng trong ngày.  
     - Hết ngày → tự động chuyển sang voucher mới hoặc reset giới hạn.

5. **Chống gian lận cơ bản**  
   - Số điện thoại unique (không cho trùng lặp).  
   - Email phải được verify.  
   - Giới hạn tốc độ gọi API (rate limit) để tránh lạm dụng.  
   - Lưu lịch sử quay theo số điện thoại và IP (dễ kiểm tra nếu có dấu hiệu bất thường).

**Luồng trải nghiệm người dùng điển hình (trên mobile)**  
1. Vào website → Chọn đăng nhập (Facebook / Google / Email).  
2. Hoàn tất đăng ký/đăng nhập + thêm số điện thoại nếu cần.  
3. Quay vòng may mắn 1 lần/ngày miễn phí.  
4. Hết lượt → Chia sẻ bài viết Goka (mở app Facebook) → quay thêm 1 lần.  
5. Trúng ô khuyến mại → nhận và hiển thị mã voucher ngay lập tức.

Hệ thống ưu tiên trải nghiệm di động, dễ sử dụng, tăng tương tác qua chia sẻ xã hội, và kiểm soát gian lận ở mức hợp lý mà không làm phức tạp người dùng.

Nếu bạn muốn chỉnh sửa phần nào (ví dụ thêm chi tiết về voucher, thay đổi luồng, hoặc bổ sung tính năng), cứ cho mình biết nhé Quyến!
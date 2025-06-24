# OAuth Setup Guide - Fix redirect_uri_mismatch

## Nguyên nhân lỗi
Google OAuth yêu cầu redirect URI phải khớp CHÍNH XÁC với URL đã đăng ký trong Google Console.

## Cách khắc phục

### 1. Kiểm tra Redirect URI hiện tại
NextAuth.js sử dụng format: `http://localhost:3000/api/auth/callback/google`

### 2. Cập nhật Google Console
1. Truy cập: https://console.cloud.google.com/
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Click vào OAuth 2.0 Client ID của bạn
5. Trong phần **Authorized redirect URIs**, thêm:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   
### 3. Nếu đang deploy production, thêm cả:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

### 4. Important: Các URI phải thêm chính xác
- ✅ `http://localhost:3000/api/auth/callback/google` 
- ❌ `http://localhost:3000/api/auth/callback/google/` (không có dấu / cuối)
- ❌ `http://localhost:3000` (thiếu path callback)

### 5. Sau khi thêm URI
- Click **Save**
- Đợi 5-10 phút để changes take effect
- Clear browser cache và cookies
- Thử login lại

## Kiểm tra cấu hình NextAuth

Đảm bảo trong `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
```

Và khi deploy production:
```
NEXTAUTH_URL=https://yourdomain.com
```

## Debug Tips
1. Check browser console để xem exact redirect URI được gửi
2. So sánh với list URI trong Google Console
3. Chú ý http vs https
4. Chú ý trailing slashes

## GitHub và Microsoft OAuth
Tương tự, cần cấu hình callback URLs:
- GitHub: `http://localhost:3000/api/auth/callback/github`
- Microsoft: `http://localhost:3000/api/auth/callback/azure-ad`
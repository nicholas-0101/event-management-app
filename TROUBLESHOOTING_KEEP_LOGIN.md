# Troubleshooting Keep Login Issue

## Masalah: Organizer Tidak Bisa Akses Halaman Event-Organizer

### 🔍 **Debugging Steps**

1. **Buka Browser Developer Tools (F12)**
2. **Buka Console Tab**
3. **Login sebagai Organizer**
4. **Lihat Log Messages**

### 📋 **Log Messages yang Harus Muncul**

#### Saat Login:

```
🔐 setAuthData: Setting auth data { hasToken: true, role: "ORGANIZER", username: "..." }
🔐 setAuthData: Auth data set successfully
```

#### Saat Akses Event-Organizer:

```
🔄 AutoRedirect: Checking redirects... { pathname: "/event-organizer" }
🔄 AutoRedirect: Skipping redirect for this path
🔒 AuthGuard: Checking authentication... { pathname: "/event-organizer", requiredRole: "ORGANIZER" }
🔒 AuthGuard: Auth data retrieved { hasToken: true, hasUserData: true }
🔒 AuthGuard: User data { role: "ORGANIZER", isVerified: true, username: "..." }
🔒 AuthGuard: Verifying token with backend...
🔒 AuthGuard: Token verified successfully
🔒 AuthGuard: Authentication successful, rendering children
🔒 AuthGuard: Access granted, rendering children
```

### ❌ **Jika Log Tidak Muncul atau Error**

#### 1. **Token Tidak Tersimpan**

- Check localStorage: `localStorage.getItem("token")`
- Check cookies: `document.cookie`
- Pastikan `setAuthData` dipanggil saat login

#### 2. **User Data Tidak Tersimpan**

- Check localStorage: `localStorage.getItem("user")`
- Pastikan format JSON valid
- Check apakah role = "ORGANIZER" (bukan "organizer")

#### 3. **Token Verification Failed**

- Check network tab untuk request ke `/auth/verify`
- Pastikan backend endpoint berfungsi
- Check apakah token expired

#### 4. **Role Mismatch**

- Pastikan user.role === "ORGANIZER" (case sensitive)
- Check database apakah role tersimpan dengan benar

### 🛠️ **Manual Testing**

#### Test 1: Check Local Storage

```javascript
// Di browser console
console.log("Token:", localStorage.getItem("token"));
console.log("User:", localStorage.getItem("user"));
```

#### Test 2: Check Cookies

```javascript
// Di browser console
console.log("Cookies:", document.cookie);
```

#### Test 3: Check Auth Utils

```javascript
// Di browser console
import { getAuthData } from "@/lib/auth-utils";
const { token, userData } = getAuthData();
console.log("Auth Data:", { token, userData });
```

### 🔧 **Common Fixes**

#### 1. **Clear Storage dan Login Ulang**

```javascript
localStorage.clear();
document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
```

#### 2. **Check Backend Response**

- Pastikan response dari `/auth/signin` memiliki format yang benar
- Check apakah `user.role` = "ORGANIZER" (bukan lowercase)

#### 3. **Check Network Requests**

- Buka Network tab di DevTools
- Login dan lihat request ke `/auth/signin`
- Check response data

### 📱 **Test Case Lengkap**

1. **Buka aplikasi di browser baru**
2. **Login sebagai organizer**
3. **Check console untuk log messages**
4. **Coba akses `/event-organizer`**
5. **Check apakah redirect ke signin atau berhasil akses**

### 🚨 **Emergency Fix**

Jika masih bermasalah, coba:

1. **Restart development server**
2. **Clear browser cache dan cookies**
3. **Check apakah semua file tersimpan dengan benar**
4. **Verify import paths di semua komponen**

### 📞 **Support**

Jika masalah masih berlanjut, share:

- Console log messages
- Network requests
- Error messages
- Browser dan OS version

# Keep Login Feature Implementation

## Overview

Fitur keep login telah diperbaiki untuk memberikan pengalaman yang lebih baik dimana user dan organizer akan otomatis diarahkan ke halaman yang sesuai berdasarkan role mereka.

## Fitur Utama

### 1. Auto-Redirect Berdasarkan Role

- **Organizer**: Otomatis diarahkan ke `/event-organizer` saat membuka web utama
- **User Biasa**: Otomatis diarahkan ke web utama (`/`) saat mencoba mengakses `/event-organizer`

### 2. Middleware Protection

- Middleware Next.js menangani redirect otomatis di level server
- Menggunakan cookies untuk akses data user di middleware
- Proteksi route berdasarkan role dan autentikasi

### 3. Client-Side Auth Guard

- Komponen `AuthGuard` untuk proteksi halaman berdasarkan role
- Komponen `AutoRedirect` untuk redirect otomatis saat aplikasi load
- Fallback ke localStorage jika cookies tidak tersedia

## Komponen yang Dibuat

### 1. `middleware.ts`

- File middleware Next.js untuk handle redirect otomatis
- Mengakses token dan user data dari cookies
- Redirect berdasarkan role user

### 2. `auth-utils.ts`

- Utility functions untuk manage authentication data
- Sync antara localStorage dan cookies
- Helper functions untuk check role dan status user

### 3. `AuthGuard.tsx`

- Component untuk proteksi halaman berdasarkan role
- Verifikasi token dengan backend
- Handle redirect jika user tidak punya akses

### 4. `AutoRedirect.tsx`

- Component untuk redirect otomatis saat aplikasi load
- Check status autentikasi dan role
- Redirect ke halaman yang sesuai

## Cara Kerja

### 1. Saat User Login

```typescript
// Data disimpan di localStorage dan cookies
setAuthData(token, userData);
```

### 2. Saat Aplikasi Load

```typescript
// AutoRedirect component check status
// Redirect berdasarkan role:
// - Organizer → /event-organizer
// - User → /
```

### 3. Saat Akses Halaman

```typescript
// AuthGuard component protect halaman
// Verifikasi token dan role
// Redirect jika tidak punya akses
```

### 4. Middleware Protection

```typescript
// Server-side redirect
// Check cookies untuk token dan user data
// Redirect sebelum halaman di-render
```

## Implementasi di Layout

### Root Layout

```typescript
// src/app/layout.tsx
<AutoRedirect /> // Handle redirect otomatis
```

### Event Organizer Layout

```typescript
// src/app/event-organizer/layout.tsx
<AuthGuard requiredRole="ORGANIZER" redirectTo="/">
  {children}
</AuthGuard>
```

### Protected User Pages

```typescript
// src/app/transaction-history/layout.tsx
<AuthGuard requiredRole="USER" redirectTo="/">
  {children}
</AuthGuard>
```

## Keuntungan

1. **User Experience**: User langsung diarahkan ke halaman yang sesuai
2. **Security**: Proteksi route berdasarkan role
3. **Consistency**: Data auth sync antara localStorage dan cookies
4. **Performance**: Middleware redirect sebelum render
5. **Maintainability**: Code terorganisir dengan baik

## Testing

### Test Case 1: Organizer Keep Login

1. Login sebagai organizer
2. Close browser
3. Buka kembali aplikasi
4. Harus langsung ke `/event-organizer`

### Test Case 2: User Keep Login

1. Login sebagai user biasa
2. Close browser
3. Buka kembali aplikasi
4. Harus langsung ke web utama (`/`)

### Test Case 3: Role Protection

1. User biasa mencoba akses `/event-organizer`
2. Harus di-redirect ke `/`
3. Organizer mencoba akses `/`
4. Harus di-redirect ke `/event-organizer`

## Troubleshooting

### Issue: Redirect Loop

- Check apakah token valid
- Check apakah user data lengkap
- Check apakah role sesuai

### Issue: Data Tidak Sync

- Clear localStorage dan cookies
- Login ulang
- Check network request

### Issue: Middleware Tidak Bekerja

- Restart development server
- Check console untuk error
- Verify file middleware.ts ada di root

## Dependencies

- Next.js 14+ (untuk middleware)
- React hooks (useEffect, useState)
- Next.js navigation (useRouter, usePathname)
- Axios untuk API calls

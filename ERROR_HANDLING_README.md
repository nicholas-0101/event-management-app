# Authentication Error Handling System

## Overview

This document describes the comprehensive error handling system implemented for the authentication (sign-in and sign-up) functionality in the event management application.

## Components

### 1. AuthErrorHandler (`src/helper/authErrorHandler.ts`)

A utility class that processes backend errors and converts them to user-friendly, localized Indonesian messages.

**Features:**

- Handles different HTTP status codes (400, 401, 409, 422, 500)
- Provides field-specific error messages
- Supports both backend validation errors and custom error messages
- Localized error messages in Indonesian

**Error Types Handled:**

- **400 Bad Request**: Validation errors, duplicate emails/usernames, missing fields
- **401 Unauthorized**: Invalid credentials, token issues
- **409 Conflict**: Duplicate data conflicts
- **422 Unprocessable Entity**: Data format issues
- **500 Internal Server Error**: Server-side errors

### 2. ErrorDisplay Component (`src/components/ui/error-display.tsx`)

A reusable UI component for displaying different types of error messages with appropriate styling.

**Features:**

- Different styles for error, warning, info, and success messages
- Optional close button
- Responsive design
- Icon support for different message types

### 3. Enhanced Backend Error Handling

The backend has been updated to provide more detailed error information including:

- Field-specific error messages
- Structured error responses
- Better validation error handling

## Usage Examples

### Sign-In Error Handling

```typescript
import { AuthErrorHandler } from "@/helper/authErrorHandler";

try {
  const response = await apiCall.post("/auth/signin", values);
  // Handle success
} catch (error: any) {
  const authError = AuthErrorHandler.handleError(error);
  setError(authError);
}
```

### Sign-Up Error Handling

```typescript
try {
  const response = await apiCall.post("/auth/signup", values);
  // Handle success
} catch (error: any) {
  const authError = AuthErrorHandler.handleError(error);
  setError(authError);
}
```

### Field-Specific Error Display

```typescript
{
  error && AuthErrorHandler.isFieldError(error, "email") && (
    <span className="text-red-400 italic text-sm">{error.message}</span>
  );
}
```

## Error Message Examples

### Common Error Messages

- **Email already registered**: "Email sudah terdaftar. Silakan gunakan email lain atau login."
- **Username already taken**: "Username sudah digunakan. Silakan pilih username lain."
- **Invalid credentials**: "Email atau password salah. Silakan cek kembali."
- **Invalid referral code**: "Kode referral tidak valid atau sudah tidak berlaku."
- **Server error**: "Terjadi kesalahan pada server. Silakan coba lagi nanti."

### Field-Specific Errors

- **Email field**: Shows under email input when email-related errors occur
- **Password field**: Shows under password input for password validation errors
- **Username field**: Shows under username input for username-related errors
- **Referral field**: Shows under referral input for referral code errors

## Backend Integration

### Error Response Format

```json
{
  "message": "Error description",
  "field": "field_name", // Optional field identifier
  "status": 400
}
```

### Validation Errors

The backend uses express-validator middleware that provides structured validation errors:

```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid_value",
      "msg": "Validation message",
      "path": "field_name",
      "location": "body"
    }
  ]
}
```

## Benefits

1. **User Experience**: Clear, localized error messages in Indonesian
2. **Field-Specific Feedback**: Users know exactly which field has an issue
3. **Consistent Styling**: Uniform error display across the application
4. **Maintainable**: Centralized error handling logic
5. **Backend Integration**: Seamless connection with backend error responses
6. **Accessibility**: Proper error messaging for screen readers

## Future Enhancements

1. **Error Logging**: Add error tracking and analytics
2. **Retry Mechanisms**: Implement automatic retry for network errors
3. **Error Recovery**: Suggest solutions for common errors
4. **Multi-language Support**: Extend beyond Indonesian
5. **Error Categories**: Group errors by severity and type

## Testing

To test the error handling system:

1. **Invalid Credentials**: Try signing in with wrong email/password
2. **Duplicate Registration**: Try registering with existing email/username
3. **Validation Errors**: Submit forms with invalid data
4. **Network Issues**: Test with network disconnected
5. **Server Errors**: Test with backend unavailable

## Troubleshooting

### Common Issues

1. **Error not displaying**: Check if error state is properly set
2. **Field errors not showing**: Verify field names match between frontend and backend
3. **Styling issues**: Ensure ErrorDisplay component is properly imported
4. **Backend errors not caught**: Check if error response format matches expected structure

### Debug Mode

Enable console logging to see detailed error information:

```typescript
console.error("Auth error details:", error);
```

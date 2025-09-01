export interface BackendError {
  message?: string;
  errors?: Array<{
    type: string;
    value: string;
    msg: string;
    path: string;
    location: string;
  }>;
  status?: number;
  field?: string;
}

export interface AuthErrorResponse {
  message: string;
  type: "error" | "warning" | "info";
  field?: string;
}

export class AuthErrorHandler {
  /**
   * Handle backend authentication errors and return user-friendly messages
   */
  static handleError(error: any): AuthErrorResponse {
    console.error("Auth error details:", error);

    // Handle network errors
    if (!error.response) {
      return {
        message: "Network error. Please check your internet connection.",
        type: "error",
      };
    }

    const { status, data } = error.response;
    const backendError: BackendError = data;

    // Handle validation errors from express-validator
    if (
      status === 400 &&
      backendError.errors &&
      Array.isArray(backendError.errors)
    ) {
      const firstError = backendError.errors[0];
      return {
        message: firstError.msg || "Validation error occurred",
        type: "error",
        field: firstError.path,
      };
    }

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return this.handle400Error(backendError);
      case 401:
        return this.handle401Error(backendError);
      case 409:
        return this.handle409Error(backendError);
      case 422:
        return this.handle422Error(backendError);
      case 500:
        return this.handle500Error(backendError);
      default:
        return this.handleGenericError(backendError, status);
    }
  }

  private static handle400Error(error: BackendError): AuthErrorResponse {
    if (error.message) {
      // Handle specific backend error messages
      if (error.message.includes("Email already registered")) {
        return {
          message:
            "Email sudah terdaftar. Silakan gunakan email lain atau login.",
          type: "error",
          field: "email",
        };
      }
      if (error.message.includes("Username already taken")) {
        return {
          message: "Username sudah digunakan. Silakan pilih username lain.",
          type: "error",
          field: "username",
        };
      }
      if (error.message.includes("Invalid referral code")) {
        return {
          message: "Kode referral tidak valid atau sudah tidak berlaku.",
          type: "error",
          field: "referral",
        };
      }
      if (error.message.includes("All fields are required")) {
        return {
          message: "Semua field harus diisi.",
          type: "error",
        };
      }
      if (error.message.includes("Password must contain")) {
        return {
          message:
            "Password harus mengandung huruf besar, huruf kecil, dan angka minimal 4 karakter.",
          type: "error",
          field: "password",
        };
      }
      return {
        message: error.message,
        type: "error",
        field: error.field || undefined,
      };
    }
    return {
      message: "Data yang dimasukkan tidak valid. Silakan periksa kembali.",
      type: "error",
    };
  }

  private static handle401Error(error: BackendError): AuthErrorResponse {
    if (error.message?.includes("Invalid email or password")) {
      return {
        message: "Email atau password salah. Silakan cek kembali.",
        type: "error",
        field: error.field || undefined,
      };
    }
    if (error.message?.includes("Invalid token format")) {
      return {
        message: "Token tidak valid. Silakan login kembali.",
        type: "error",
      };
    }
    if (error.message?.includes("Token has expired")) {
      return {
        message: "Sesi telah berakhir. Silakan login kembali.",
        type: "error",
      };
    }
    return {
      message: "Autentikasi gagal. Silakan cek kredensial Anda.",
      type: "error",
    };
  }

  private static handle409Error(error: BackendError): AuthErrorResponse {
    if (error.message?.includes("already exists")) {
      return {
        message:
          "Email atau username sudah terdaftar. Silakan gunakan yang lain.",
        type: "error",
      };
    }
    return {
      message: "Data sudah ada dalam sistem.",
      type: "error",
    };
  }

  private static handle422Error(error: BackendError): AuthErrorResponse {
    return {
      message: "Data tidak dapat diproses. Silakan periksa format input.",
      type: "error",
    };
  }

  private static handle500Error(error: BackendError): AuthErrorResponse {
    return {
      message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
      type: "error",
    };
  }

  private static handleGenericError(
    error: BackendError,
    status: number
  ): AuthErrorResponse {
    if (error.message) {
      return {
        message: error.message,
        type: "error",
      };
    }
    return {
      message: `Terjadi kesalahan (${status}). Silakan coba lagi.`,
      type: "error",
    };
  }

  /**
   * Get field-specific error message for form validation
   */
  static getFieldError(field: string, error: AuthErrorResponse): string | null {
    if (error.field === field || !error.field) {
      return error.message;
    }
    return null;
  }

  /**
   * Check if error is related to a specific field
   */
  static isFieldError(error: AuthErrorResponse, field: string): boolean {
    return error.field === field || !error.field;
  }
}

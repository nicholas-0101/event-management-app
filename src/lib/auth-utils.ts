// Utility functions for managing authentication data in both cookies and localStorage

export interface UserData {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ORGANIZER";
  is_verified: boolean;
  referral_code?: string | null;
  points?: number;
  profile_pic?: string | null;
}

// Set authentication data in both localStorage and cookies
export const setAuthData = (token: string, userData: UserData) => {
  console.log("🔐 setAuthData: Setting auth data", {
    hasToken: !!token,
    role: userData.role,
    username: userData.username,
  });

  // Set in localStorage
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));

  // Set in cookies (for middleware access)
  document.cookie = `token=${token}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; SameSite=Lax`; // 7 days
  document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; SameSite=Lax`; // 7 days

  console.log("🔐 setAuthData: Auth data set successfully");
};

// Get authentication data from localStorage (primary) or cookies (fallback)
export const getAuthData = (): {
  token: string | null;
  userData: UserData | null;
} => {
  // Try localStorage first
  const token = localStorage.getItem("token");
  const userDataStr = localStorage.getItem("user");

  if (token && userDataStr) {
    try {
      const userData = JSON.parse(userDataStr) as UserData;
      console.log("🔐 getAuthData: Data from localStorage", {
        hasToken: !!token,
        role: userData.role,
        username: userData.username,
      });
      return { token, userData };
    } catch (error) {
      console.error(
        "🔐 getAuthData: Error parsing user data from localStorage:",
        error
      );
    }
  }

  // Fallback to cookies
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const cookieToken = cookies.token;
  const cookieUser = cookies.user;

  if (cookieToken && cookieUser) {
    try {
      const userData = JSON.parse(decodeURIComponent(cookieUser)) as UserData;
      console.log("🔐 getAuthData: Data from cookies", {
        hasToken: !!cookieToken,
        role: userData.role,
        username: userData.username,
      });
      return { token: cookieToken, userData };
    } catch (error) {
      console.error(
        "🔐 getAuthData: Error parsing user data from cookies:",
        error
      );
    }
  }

  console.log("🔐 getAuthData: No auth data found");
  return { token: null, userData: null };
};

// Clear authentication data from both localStorage and cookies
export const clearAuthData = () => {
  console.log("🔐 clearAuthData: Clearing auth data");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  console.log("🔐 clearAuthData: Auth data cleared");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { token } = getAuthData();
  return !!token;
};

// Check if user has specific role
export const hasRole = (requiredRole: "USER" | "ORGANIZER"): boolean => {
  const { userData } = getAuthData();
  return userData?.role === requiredRole;
};

// Get user role
export const getUserRole = (): "USER" | "ORGANIZER" | null => {
  const { userData } = getAuthData();
  return userData?.role || null;
};

// Check if user is verified
export const isUserVerified = (): boolean => {
  const { userData } = getAuthData();
  return userData?.is_verified || false;
};

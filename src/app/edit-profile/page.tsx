"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiCall } from "@/helper/axios";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle,
  Camera,
  Upload,
  X,
} from "lucide-react";

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  profile_pic?: string;
}

interface ChangeEmailForm {
  newEmail: string;
}

interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdateProfileForm {
  username: string;
}

export default function EditProfile({ standalone = true }: { standalone?: boolean }) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);

  const getProfilePicUrl = (pic: string | null | undefined) => {
    if (!pic)
      return "https://i.pinimg.com/736x/1c/c5/35/1cc535901e32f18db87fa5e340a18aff.jpg";
    if (pic.startsWith("http")) return pic;
    return `https://event-management-api-sigma.vercel.app/${pic}`;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form states
  const [changeEmailForm, setChangeEmailForm] = useState<ChangeEmailForm>({
    newEmail: "",
  });
  const [changePasswordForm, setChangePasswordForm] =
    useState<ChangePasswordForm>({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  const [updateProfileForm, setUpdateProfileForm] = useState<UpdateProfileForm>(
    {
      username: "",
    }
  );

  // UI states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/signin");
          return;
        }

        const response = await apiCall.get("/auth/keep");
        const userData = response.data.data || response.data;

        setUserData(userData);
        setUpdateProfileForm({ username: userData.username || "" });
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        if (error.response?.status === 401) {
          router.push("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Handler functions
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(changeEmailForm.newEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Check if new email is same as current email
    if (userData && changeEmailForm.newEmail === userData.email) {
      setError("New email address must be different from your current email.");
      return;
    }

    setIsLoadingEmail(true);

    try {
      console.log(
        "Sending change email request with:",
        changeEmailForm.newEmail
      );

      const response = await apiCall.put("/profile/change-email", {
        newEmail: changeEmailForm.newEmail,
      });

      console.log("Change email response:", response.data);

      if (response.status === 200 && response.data.success) {
        setSuccess(
          "Verification email sent to your new email address. Please check your inbox and click the verification link."
        );
        setChangeEmailForm({ newEmail: "" });
      } else {
        throw new Error(
          response.data.message || "Failed to send verification email"
        );
      }
    } catch (error: any) {
      console.error("Error changing email:", error);

      // Handle different types of errors
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else if (error.response?.status === 400) {
        setError("Invalid email address or email already in use.");
      } else if (error.response?.status === 401) {
        setError("Please sign in again to continue.");
        router.push("/signin");
      } else {
        setError("Failed to change email. Please try again.");
      }
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (changePasswordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsLoadingPassword(true);

    try {
      const response = await apiCall.put("/profile/change-password", {
        oldPassword: changePasswordForm.oldPassword,
        newPassword: changePasswordForm.newPassword,
      });

      if (response.status === 200) {
        setSuccess("Password changed successfully!");
        setChangePasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoadingProfile(true);

    try {
      const response = await apiCall.put("/profile/update", {
        username: updateProfileForm.username,
      });

      if (response.status === 200) {
        setSuccess("Profile updated successfully!");
        // Update local user data
        if (userData) {
          setUserData({ ...userData, username: updateProfileForm.username });
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        return;
      }

      setSelectedFile(file);
      setError("");

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("profile_pic", selectedFile);

      const response = await apiCall.post(
        "/profile/upload-profile-img",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        setSuccess("Profile photo updated successfully!");

        // Update local user data
        if (userData) {
          setUserData({
            ...userData,
            profile_pic: response.data.data.profile_pic,
          });
        }

        // Clear selected file and preview
        setSelectedFile(null);
        setPreviewUrl(null);

        // Clear file input
        const fileInput = document.getElementById(
          "profile-photo-input"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      }
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to upload photo. Please try again.");
      }
    } finally {
      setIsLoadingPhoto(false);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError("");

    // Clear file input
    const fileInput = document.getElementById(
      "profile-photo-input"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  if (loading) {
    return (
      <div className={standalone ? "min-h-screen bg-background py-8 px-4 flex items-center justify-center" : "py-8 flex items-center justify-center"}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#09431C] mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={standalone ? "min-h-screen bg-background py-8 px-4 flex items-center justify-center" : "py-8 flex items-center justify-center"}>
        <div className="text-center">
          <p className="text-muted-foreground">User data not found.</p>
        </div>
      </div>
    );
  }

  const card = (
    <Card className="rounded-2xl shadow-md border border-gray-100">
      <CardHeader className="border-b">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={getProfilePicUrl(userData.profile_pic)}
              alt="Profile"
              className="size-16 rounded-full object-cover border-2 border-[#c6ee9a]"
            />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-[#09431C]">{userData.username}</CardTitle>
            <CardDescription>Update your account information and security settings.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-6">
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-[#c6ee9a]/30 border border-[#97d753] rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#09431C]" />
              <p className="text-[#09431C] text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 min-w-max whitespace-nowrap rounded-xl">
              <TabsTrigger value="profile" className="flex items-center gap-2 rounded-xl">
                <User className="w-4 h-4" />
                Edit Profile
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex items-center gap-2 rounded-xl">
                <Camera className="w-4 h-4" />
                Profile Picture
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2 rounded-xl">
                <Mail className="w-4 h-4" />
                Change Email
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2 rounded-xl">
                <Lock className="w-4 h-4" />
                Change Password
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#09431C]">Profile Information</h3>
                <p className="text-sm text-muted-foreground">Update your basic profile information.</p>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={updateProfileForm.username}
                    onChange={(e) => setUpdateProfileForm({ username: e.target.value })}
                    placeholder="Enter your username"
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Email</Label>
                  <Input value={userData.email} disabled className="bg-muted rounded-full" />
                  <p className="text-xs text-muted-foreground">To change your email, use the "Change Email" tab.</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={userData.role} disabled className="bg-muted rounded-full" />
                </div>
                <Button
                  type="submit"
                  disabled={isLoadingProfile}
                  className="w-full rounded-full bg-[#6fb229] hover:bg-[#6fb229]/80"
                >
                  {isLoadingProfile ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Photo Tab */}
          <TabsContent value="photo" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#09431C]">Profile Photo</h3>
                <p className="text-sm text-muted-foreground">Upload a new profile photo. Supported formats: JPG, PNG, GIF. Max size: 5MB.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Current Photo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={getProfilePicUrl(userData.profile_pic)}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#c6ee9a]"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userData.profile_pic ? "Current profile photo" : "Using default profile photo"}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profile-photo-input">Select New Photo</Label>
                    <Input
                      id="profile-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="mt-1 rounded-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Click to select an image file</p>
                  </div>
                  {previewUrl && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="relative inline-block">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-32 h-32 rounded-2xl object-cover border-2 border-[#c6ee9a]"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={clearSelectedFile}
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedFile && (
                    <Button
                      onClick={handlePhotoUpload}
                      disabled={isLoadingPhoto}
                      className="w-full rounded-full bg-[#6fb229] hover:bg-[#6fb229]/80"
                    >
                      {isLoadingPhoto ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Change Email Tab */}
          <TabsContent value="email" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#09431C]">Change Email Address</h3>
                <p className="text-sm text-muted-foreground">Enter your new email address. A verification link will be sent to confirm the change.</p>
              </div>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Email</Label>
                  <Input value={userData.email} disabled className="bg-muted rounded-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email Address</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={changeEmailForm.newEmail}
                    onChange={(e) => setChangeEmailForm({ newEmail: e.target.value })}
                    placeholder="New email address"
                    required
                    className="rounded-full"
                  />
                  <p className="text-xs text-muted-foreground">A verification link will be sent to this email address. Make sure you have access to this email.</p>
                </div>
                <Button
                  type="submit"
                  disabled={isLoadingEmail || !changeEmailForm.newEmail}
                  className="w-full rounded-full bg-[#6fb229] hover:bg-[#6fb229]/80"
                >
                  {isLoadingEmail ? "Sending Verification..." : "Send Verification Email"}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Change Password Tab */}
          <TabsContent value="password" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#09431C]">Change Password</h3>
                <p className="text-sm text-muted-foreground">Enter your current password and choose a new one.</p>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      value={changePasswordForm.oldPassword}
                      onChange={(e) => setChangePasswordForm({ ...changePasswordForm, oldPassword: e.target.value })}
                      placeholder="Current password"
                      required
                      className="rounded-full pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={changePasswordForm.newPassword}
                      onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                      placeholder="New password"
                      required
                      className="rounded-full pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters long.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={changePasswordForm.confirmPassword}
                      onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      required
                      className="rounded-full pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoadingPassword || !changePasswordForm.oldPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword}
                  className="w-full rounded-full bg-[#6fb229] hover:bg-[#6fb229]/80"
                >
                  {isLoadingPassword ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  if (!standalone) {
    return card;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">{card}</div>
    </div>
  );
}

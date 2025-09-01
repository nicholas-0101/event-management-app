import * as Yup from "yup";

export const SignUpSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "*username must be at least 3 characters")
    .max(20, "*username must be less than 20 characters")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "*username can only contain letters, numbers, and underscores"
    )
    .required("*username is required"),
  email: Yup.string()
    .email("*invalid email format")
    .required("*email is required"),
  password: Yup.string()
    .min(4, "*password must be at least 4 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "*password must contain uppercase, lowercase, and number"
    )
    .required("*password is required"),
  referral: Yup.string()
    .min(1, "*referral code cannot be empty if provided")
    .optional(),
  role: Yup.string()
    .oneOf(["USER", "ORGANIZER"], "*please select a valid role")
    .required("*role is required"),
});

export interface ISignUpValue {
  username: string;
  email: string;
  password: string;
  referral?: string;
  role: string;
}

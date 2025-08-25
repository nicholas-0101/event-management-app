import * as Yup from "yup";

export const SignUpSchema = Yup.object().shape({
  username: Yup.string().required("*username is required"),
  email: Yup.string().email("*invalid email").required("*email is required"),
  password: Yup.string()
    .min(6, "*password must be at least 6 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must contain at least 1 lowercase, 1 uppercase, and 1 number"
    )
    .required("*password is required"),
  referral: Yup.string().optional(),
  role: Yup.string().required("*role is required"),
});

export interface ISignUpValue {
  username: string;
  email: string;
  password: string;
  referral?: string;
  role: string;
}

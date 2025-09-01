import * as Yup from "yup";

export const SignInSchema = Yup.object().shape({
  email: Yup.string().email("*invalid email").required("*email is required"),
  password: Yup.string()

    .min(4, "*password must be at least 4 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "*password must contain uppercase, lowercase, and number"
    )
    .required("*password is required"),
});

export interface ISignInValue {
  email: string;
  password: string;
}

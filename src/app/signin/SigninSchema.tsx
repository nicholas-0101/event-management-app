import * as Yup from "yup";

export const SignInSchema = Yup.object().shape({
  email: Yup.string()
    .email("*invalid email")
    .required("*email is required"),
  password: Yup.string()
    .min(6, "*password must be at least 6 characters")
    .required("*password is required"),
});

export interface ISignInValue{
    email:string;
    password:string;
}
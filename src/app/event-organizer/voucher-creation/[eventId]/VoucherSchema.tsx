import * as Yup from "yup";

export const voucherValidationSchema = Yup.object().shape({
  voucher_code: Yup.string()
    .required("*voucher code is required")
    .min(3, "*voucher code must be at least 3 characters"),
  discount_value: Yup.number()
    .required("*discount is required")
    .min(0, "*discount must be at least 0%")
    .max(100, "*discount cannot exceed 100%"),
  voucher_start_date: Yup.date()
    .required("*start date is required")
    .typeError("*invalid start date"),
  voucher_end_date: Yup.date()
    .required("*expired date is required")
    .min(Yup.ref("voucher_start_date"), "*expired date cannot be before start date")
    .typeError("*invalid expired date"),
});
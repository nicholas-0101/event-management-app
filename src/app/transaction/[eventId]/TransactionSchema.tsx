import * as Yup from "yup";

export interface ITransactionTicket {
  ticket_id: number;
  qty: number;
  
}

export interface ITransactionForm {
  tickets: ITransactionTicket[];
  voucherId?: number;
  couponId?: number;
  pointId?: number;
}

export const transactionValidationSchema = Yup.object().shape({
  tickets: Yup.array()
    .of(
      Yup.object().shape({
        ticket_id: Yup.number().required("*ticket is required"),
        qty: Yup.number()
          .required("*quantity is required")
          .min(1, "*quantity must be at least 1"),
      })
    )
    .min(1, "*at least one ticket is required"),
});

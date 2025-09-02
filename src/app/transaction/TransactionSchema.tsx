import * as Yup from "yup";

export interface ITicket {
  ticket_id: number;
  qty: number;
}

export interface ITransactionForm {
  tickets: ITicket[];
  voucherId?: number;
  couponId?: number;
  pointId?: number;
}

export const transactionValidationSchema = Yup.object().shape({
  tickets: Yup.array()
    .of(
      Yup.object().shape({
        ticket_id: Yup.number().required("Ticket is required"),
        qty: Yup.number()
          .required("Quantity is required")
          .min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one ticket is required"),
});

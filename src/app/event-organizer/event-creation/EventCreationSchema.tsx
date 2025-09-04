import * as Yup from "yup";

// export interface ITicket {
//   ticket_price: number | null;
//   ticket_quota: number | null;
//   ticket_type: string;
// }

// export interface IEventCreate {
//   event_name: string;
//   event_total_seats: number | null;
//   event_description: string;
//   event_location: string;
//   event_category: "concert" | "festival" | "sport" | "theater";
//   event_thumbnail: File | null;
//   event_start_date: Date | string;
//   event_end_date: Date | string;
//   tickets: ITicket[];
// }

// export const initialValues: IEventCreate = {
//     event_name: "",
//     event_total_seats: null,
//     event_description: "",
//     event_location: "",
//     event_category: "" as "concert" | "festival" | "sport" | "theater",
//     event_thumbnail: null,
//     event_start_date: "",
//     event_end_date: "",
//     tickets: [
//       {
//         ticket_type: "Regular",
//         ticket_price: null,
//         ticket_quota: null,
//       },
//       {
//         ticket_type: "vip",
//         ticket_price: null,
//         ticket_quota: null,
//       },
//     ],
//   };

export interface ITicket {
  ticket_price: number | "";   // allow empty string for inputs
  ticket_quota: number | "";   // same here
  ticket_type: string;
}

export interface IEventCreate {
  event_name: string;
  event_total_seats: number | ""; // keep input stable
  event_description: string;
  event_location: string;
  event_category: "concert" | "festival" | "sport" | "theater" | ""; // allow empty initial
  event_thumbnail: File | null;
  event_start_date: Date | null;
  event_end_date: Date | null;
  tickets: ITicket[];
}

export const initialValues: IEventCreate = {
  event_name: "",
  event_total_seats: "",
  event_description: "",
  event_location: "",
  event_category: "", // user must pick one
  event_thumbnail: null,
  event_start_date: null,
  event_end_date: null,
  tickets: [
    {
      ticket_type: "Regular",
      ticket_price: "",
      ticket_quota: "",
    },
    {
      ticket_type: "vip",
      ticket_price: "",
      ticket_quota: "",
    },
  ],
};

export const eventCreationSchema = Yup.object().shape({
  event_name: Yup.string().required("*event name is required"),
  event_total_seats: Yup.number()
    .typeError("*total seats must be a number")
    .min(1, "*total seats must be at least 1")
    .required("*total seats is required"),
  event_description: Yup.string().required("*event description is required"),
  event_location: Yup.string().required("*event location is required"),
  event_category: Yup.string()
    .oneOf(["concert", "festival", "sport", "theater"], "*invalid category")
    .required("*event category is required"),
  event_thumbnail: Yup.mixed<File>()
    .required("*event thumbnail is required")
    .test("fileType", "*only image files are allowed", (value) => {
      if (!value) return false;
      return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
        value.type
      );
    }),
  event_start_date: Yup.date().required("*event date is required"),
 
  tickets: Yup.array()
    .of(
      Yup.object().shape({
        ticket_price: Yup.number()
          .nullable().min(0, "*price can't negative")
          .required("*price is required"),
        ticket_quota: Yup.number()
          .nullable().min(0, "*quota can't negative")
          .required("*quota is required"),
      })
    )
    .min(1, "*at least one ticket is required"),
});

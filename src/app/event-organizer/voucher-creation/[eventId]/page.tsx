// "use client";
// import { useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { apiCall } from "@/helper/axios";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// export default function CreateVoucherPage() {
//   const router = useRouter();
//   const params = useParams();
//   const eventId = params.eventId;

//   const [code, setCode] = useState("");
//   const [discount, setDiscount] = useState<string>(""); // start empty
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       await apiCall.post(`/voucher/create/${eventId}`, {
//         voucher_code: code,
//         discount_value: Number(discount),
//         voucher_start_date: startDate,
//         voucher_end_date: endDate,
//       });
//       alert("Voucher created successfully!");
//       router.back();
//     } catch (err: any) {
//       console.error(err.response?.data || err.message);
//       alert(
//         "Failed to create voucher: " +
//           (err.response?.data?.message || err.message)
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-3xl">
//       <h1 className="text-3xl font-bold mb-4 text-center text-[#09431C]">Create Voucher</h1>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         <div className="flex flex-col gap-2">
//           <Label>Voucher Code</Label>
//           <Input
//             placeholder="Create an unique code"
//             value={code}
//             onChange={(e) => setCode(e.target.value)}
//             required
//             className="rounded-lg"
//           />
//         </div>

//         <div className="flex flex-col gap-2">
//           <Label>Voucher Discount</Label>
//           <Input
//             type="number"
//             placeholder="Discount (in %)"
//             value={discount}
//             onChange={(e) => setDiscount(e.target.value)}
//             required
//             className="rounded-lg"
//             min={0}
//             max={100}
//           />
//         </div>

//         <div className="flex flex-col gap-2">
//           <Label>Voucher Start Date</Label>
//           <Input
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             required
//             className="rounded-lg"
//           />
//         </div>

//         <div className="flex flex-col gap-2">
//           <Label>Voucher Expired Date</Label>
//           <Input
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             required
//             className="rounded-lg"
//           />
//         </div>

//         <Button type="submit" disabled={loading} className="bg-[#6FB229] hover:bg-[#09431C] rounded-lg">
//           {loading ? "Creating..." : "Create Voucher"}
//         </Button>
//       </form>
//     </div>
//   );
// }


"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiCall } from "@/helper/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { voucherValidationSchema } from "./VoucherSchema";

export default function CreateVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const [loading, setLoading] = useState(false);

  const initialValues = {
    voucher_code: "",
    discount_value: "",
    voucher_start_date: "",
    voucher_end_date: "",
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      await apiCall.post(`/voucher/create/${eventId}`, {
        voucher_code: values.voucher_code,
        discount_value: Number(values.discount_value),
        voucher_start_date: values.voucher_start_date,
        voucher_end_date: values.voucher_end_date,
      });
      alert("Voucher created successfully!");
      router.replace("/event-organizer");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      alert(
        "Failed to create voucher: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-3xl">
      <h1 className="text-3xl font-bold mb-4 text-center text-[#09431C]">
        Create Voucher
      </h1>

      <Formik
        initialValues={initialValues}
        validationSchema={voucherValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange }) => (
          <Form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Voucher Code</Label>
              <Field
                as={Input}
                name="voucher_code"
                placeholder="Create an unique code"
                value={values.voucher_code}
                onChange={handleChange}
                className="rounded-lg"
              />
              <ErrorMessage
                name="voucher_code"
                component="div"
                className="text-red-400 text-sm italic"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Voucher Discount</Label>
              <Field
                as={Input}
                type="number"
                name="discount_value"
                placeholder="Discount (in %)"
                value={values.discount_value}
                onChange={handleChange}
                className="rounded-lg"
                min={0}
                max={100}
              />
              <ErrorMessage
                name="discount_value"
                component="div"
                className="text-red-400 text-sm italic"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Voucher Start Date</Label>
              <Field
                as={Input}
                type="date"
                name="voucher_start_date"
                value={values.voucher_start_date}
                onChange={handleChange}
                className="rounded-lg"
              />
              <ErrorMessage
                name="voucher_start_date"
                component="div"
                className="text-red-400 text-sm italic"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Voucher Expired Date</Label>
              <Field
                as={Input}
                type="date"
                name="voucher_end_date"
                value={values.voucher_end_date}
                onChange={handleChange}
                className="rounded-lg"
              />
              <ErrorMessage
                name="voucher_end_date"
                component="div"
                className="text-red-400 text-sm italic"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
            >
              {loading ? "Creating..." : "Create Voucher"}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

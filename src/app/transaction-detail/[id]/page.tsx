// "use client";

// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { apiCall } from "@/helper/axios";

// interface ITransaction {
//   id: number;
//   user_id: number;
//   coupon_id: number | null;
//   voucher_id: number | null;
//   point_id: number | null;
//   status: string;
//   points_used: number;
//   discount_voucher: number;
//   discount_coupon: number;
//   total_price: number;
//   transaction_date_time: string;
//   transaction_expired: string; // ISO string from backend
//   is_accepted: boolean;
//   payment_proof_url: string | null;
// }

// export default function UploadPaymentProofPage() {
//   const params = useParams();
//   const router = useRouter();
//   const transactionId = params?.id as string;

//   const [transaction, setTransaction] = useState<ITransaction | null>(null);
//   const [file, setFile] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [expired, setExpired] = useState(false);

//   // Fetch transaction details
//   useEffect(() => {
//     const fetchTransaction = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const { data } = await apiCall.get<ITransaction>(
//           `/transaction/${transactionId}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         setTransaction(data);

//         const now = new Date();
//         const expire = new Date(data.transaction_expired);
//         if (now >= expire || data.status === "EXPIRED") setExpired(true);
//       } catch (err) {
//         console.error(err);
//         alert("Failed to fetch transaction info");
//       }
//     };

//     fetchTransaction();
//   }, [transactionId]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
//   };

//   const handleSubmit = async () => {
//     if (!file) return alert("Please select a file first");
//     if (expired) return alert("Cannot upload, transaction expired");

//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("payment_proof", file);

//       const token = localStorage.getItem("token");
//       await apiCall.post(`/transaction/upload-proof/${transactionId}`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       alert("Payment proof uploaded successfully!");
//       router.push("/transactions");
//     } catch (err: any) {
//       console.error(err);
//       alert("Failed to upload payment proof: " + (err.response?.data?.message || err.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br p-6 flex justify-center items-center">
//       <section className="w-full max-w-xl p-6 bg-white rounded-3xl shadow flex flex-col gap-6">
//         <h1 className="text-3xl font-bold text-center text-[#09431C]">
//           Upload Payment Proof
//         </h1>

//         {transaction && (
//           <div className="bg-gray-50 p-4 rounded-lg border mb-4 space-y-1">
//             <p><strong>Transaction ID:</strong> {transaction.id}</p>
//             <p><strong>Status:</strong> {transaction.status}</p>
//             <p><strong>Total Price:</strong> Rp {transaction.total_price.toLocaleString("id-ID")}</p>
//             <p><strong>Points Used:</strong> {transaction.points_used}</p>
//             <p><strong>Coupon ID Used:</strong> {transaction.coupon_id ?? "None"}</p>
//             <p><strong>Voucher ID Used:</strong> {transaction.voucher_id ?? "None"}</p>
//             <p>
//               <strong>Expires At:</strong>{" "}
//               {new Date(transaction.transaction_expired).toLocaleString()}
//             </p>
//           </div>
//         )}

//         <div className="flex flex-col gap-2">
//           <Label>Payment Proof</Label>
//           <input
//             type="file"
//             accept="image/*,application/pdf"
//             onChange={handleFileChange}
//             className="rounded-lg border border-neutral-300 p-2"
//             disabled={expired}
//           />
//           {file && <p className="text-sm text-gray-600">Selected file: {file.name}</p>}
//         </div>

//         <Button
//           type="button"
//           disabled={loading || expired}
//           className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
//           onClick={handleSubmit}
//         >
//           {loading ? "Uploading..." : "Upload Payment Proof"}
//         </Button>

//         {expired && (
//           <p className="text-center text-red-500 font-semibold">
//             Transaction is expired. Upload is disabled.
//           </p>
//         )}
//       </section>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiCall } from "@/helper/axios";

interface ITransaction {
  id: number;
  user: { username: string };
  tickets: { ticket_id: number; qty: number }[];
  status: string;
  points_used: number;
  discount_voucher: number;
  discount_coupon: number;
  total_price: number;
  transaction_expired: string;
  payment_proof_url: string | null;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params?.id as string;

  const [transaction, setTransaction] = useState<ITransaction | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  // Fetch transaction details
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await apiCall.get<ITransaction>(
          `/transaction/${transactionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTransaction(data);

        const now = new Date();
        const expire = new Date(data.transaction_expired);
        if (now >= expire || data.status === "EXPIRED") setExpired(true);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch transaction info");
      }
    };

    fetchTransaction();
  }, [transactionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please select a file first");
    if (expired) return alert("Cannot upload, transaction expired");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("payment_proof", file);

      const token = localStorage.getItem("token");
      await apiCall.post(
        `/transaction/upload-proof/${transactionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Payment proof uploaded successfully!");
      router.push("/transactions");
    } catch (err: any) {
      console.error(err);
      alert(
        "Failed to upload payment proof: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br p-6 pt-4 flex justify-center items-center">
      <section className="w-full max-w-xl p-6 bg-white rounded-3xl shadow flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center text-[#09431C]">
          Transaction Detail
        </h1>

        {transaction && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <p>
                <strong>Username:</strong> {transaction.user.username}
              </p>
              <Badge
                className={`rounded-full  text-sm font-semibold ${
                  transaction.status === "WAITING_PAYMENT" ||
                  transaction.status === "WAITING_CONFIRMATION"
                    ? "bg-yellow-200 text-yellow-700 outline-2 outline-yellow-600"
                    : transaction.status === "REJECTED" ||
                      transaction.status === "CANCELLED" ||
                      transaction.status === "EXPIRED"
                    ? "bg-red-200 text-red-900 outline-2 outline-red-800"
                    : transaction.status === "SUCCESS"
                    ? "bg-lime-200 text-lime-900 outline-2 outline-lime-900"
                    : "bg-gray-300 text-gray-800 outline-2 outline-gray-800"
                }`}
              >
                {transaction.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <strong>Tickets:</strong>
              <ul className="list-disc pl-5">
                {transaction.tickets.map((t) => (
                  <li key={t.ticket_id}>
                    Ticket ID: {t.ticket_id}, Qty: {t.qty}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Points Used</span>
                <span>{transaction.points_used}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Discount Coupon</span>
                <span>{transaction.discount_coupon}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Discount Voucher</span>
                <span>{transaction.discount_voucher}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-[#6FB229]">
                  Total Price
                </span>
                <span className="font-semibold text-[#6FB229]">
                  Rp {transaction.total_price.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label>Payment Proof</Label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="rounded-lg border border-neutral-300 p-2"
            disabled={expired}
          />
          {file && (
            <p className="text-sm text-gray-600">Selected file: {file.name}</p>
          )}
        </div>

        {expired && (
          <p className="text-center text-red-400 font-semibold">
            Transaction is expired. Upload is disabled.
          </p>
        )}

        <div className="flex flex-col gap-4">
          <Button
            type="button"
            disabled={
              loading ||
              expired ||
              !transaction ||
              [
                "EXPIRED",
                "SUCCESS",
                "REJECTED",
                "CANCELLED",
                "WAITING_CONFIRMATION",
              ].includes(transaction.status)
            }
            className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
            onClick={handleSubmit}
          >
            {loading ? "Uploading..." : "Upload Payment Proof"}
          </Button>

          <Button
            type="button"
            disabled={
              loading ||
              !transaction ||
              ["EXPIRED", "SUCCESS", "REJECTED", "CANCELLED"].includes(
                transaction.status
              )
            }
            className="w-full border-2 border-[#6FB229] bg-transparent hover:bg-[#6FB229]/20 text-[#6FB229] rounded-lg"
            // onClick={handleSubmit}
          >
            {loading ? "Cancelling..." : "Cancel Transaction"}
          </Button>
        </div>
      </section>
    </div>
  );
}

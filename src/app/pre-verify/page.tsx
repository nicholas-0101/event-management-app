import { Card } from "@/components/ui/card";

export default function PreVerifyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <Card className="p-6 bg-white shadow-md text-center flex flex-col gap-2 rounded-3xl">
            <h1 className="text-2xl font-bold mb-2 text-[#09431C]">Account registered</h1>
            <p className="text-center text-gray-600">
              Please check your email to verify your account
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
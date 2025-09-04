"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiCall } from "@/helper/axios";
import { Star } from "lucide-react";
import slugify from "slugify";

export default function CreateReviewPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [eventName, setEventName] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review_text, setReview_text] = useState("");
  const [loading, setLoading] = useState(false);

  // fetch event detail to get the event name
  useEffect(() => {
    const fetchEventName = async () => {
      try {
        const res = await apiCall.get(`/event/${eventId}`);
        setEventName(res.data?.data?.event_name ?? null);
      } catch (err) {
        console.error("Failed to fetch event name:", err);
      }
    };

    if (eventId) fetchEventName();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      alert("Please select at least 1 star.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await apiCall.post(
        `/review/${eventId}`,
        { review_text, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Review submitted successfully!");
      localStorage.setItem(`reviewed_event_${eventId}`, "true");

      if (eventName) {
        router.push(`/event-detail/${slugify(eventName, { lower: true })}`);
      } else {
        router.back();
      }
    } catch (err: any) {
      console.error("Submit review error:", err);

      const message = err.response?.data?.message || "Failed to submit review.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br p-6 pt-4 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-[#09431C]">
        Review {eventName ? `: ${eventName}` : ""}
      </h1>

      <Card className="w-full max-w-xl p-6 bg-white rounded-3xl shadow flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Star Rating */}
          <div className="flex gap-2 items-center justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer transition-colors ${
                  (hoverRating || rating) >= star
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          {/* Review Text */}
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Write your review..."
              value={review_text}
              onChange={(e) => setReview_text(e.target.value)}
              className="rounded-lg border-gray-300 h-50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg cursor-pointer"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

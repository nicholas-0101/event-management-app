"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CardItemProps {
  thumbnail: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  category: string;
  price: number;
  href: string;
}

function formatDate(date: string | Date) {
  if (!date) return "";

  if (typeof date !== "string") {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  const onlyDate = date.split("T")[0];
  const [year, month, day] = onlyDate.split("-").map(Number);

  // no timezone conversion
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function EventCard({
  thumbnail,
  title,
  dateStart,
  dateEnd,
  category,
  price,
  href,
}: CardItemProps) {
  return (
    <a href={href}>
      <Card className="rounded-3xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col gap-4 pb-5 w-98">
        <div className="relative w-full h-40">
          <Image src={thumbnail} alt={title} fill className="object-cover" />
        </div>
        <div className="flex flex-col gap-3">
          <CardHeader className="flex flex-col gap-1">
            <div className="flex justify-between w-full">
              <CardTitle className="text-lg font-semibold p-0">
                {title}
              </CardTitle>
              <Badge className="rounded-full">{category}</Badge>
            </div>
            <span className="rounded-full bg-transparent text-neutral-500 font-medium text-sm">
              {formatDate(dateStart)} - {formatDate(dateEnd)}
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold p-0">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(price)}
            </p>
          </CardContent>
        </div>
      </Card>
    </a>
  );
}

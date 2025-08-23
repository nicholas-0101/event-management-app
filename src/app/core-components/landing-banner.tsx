"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  {
    id: 1,
    img: "sport_banner.png", // sports
  },
  {
    id: 2,
    img: "https://picsum.photos/id/238/800/400", // theater
  },
  {
    id: 3,
    img: "concert_banner.png", // concert
  },
  {
    id: 4,
    img: "https://picsum.photos/id/238/800/400", // festival
  },
];

export default function HeroBanner() {
  const autoplay = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false }) // scroll to the next slide every 3s
  );
  return (
    <div className="w-full">
      <Carousel
        plugins={[autoplay.current]} // plugins for autoplay
        className="w-full cursor-pointer"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="p-2">
                <Card className="w-full h-[450px] bg-[#6FB229] shadow-none rounded-4xl overflow-hidden">
                  <img
                    src={slide.img}
                    alt={`Slide ${slide.id}`}
                    className="w-full h-full object-cover"
                  />
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none" />
        <CarouselNext className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none" />
      </Carousel>
    </div>
  );
}

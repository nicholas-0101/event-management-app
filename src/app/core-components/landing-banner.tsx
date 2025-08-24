"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  { id: 1, img: "concert_banner.png", category: "Concert" },
  { id: 2, img: "festival_banner.png", category: "Festival" },
  { id: 3, img: "sport_banner.png", category: "Sport" },
  { id: 4, img: "theater_banner.png", category: "Theater" },
];

interface Props {
  setActiveCategory: (category: string) => void;
}

export default function HeroBanner({ setActiveCategory }: Props) {
  const autoplay = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  );

  return (
    <div className="w-full">
      <Carousel plugins={[autoplay.current]} className="w-full cursor-pointer">
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="p-2">
                <Card
                  className="w-full h-[450px] bg-[#6FB229] shadow-none rounded-4xl overflow-hidden"
                  onClick={() => setActiveCategory(slide.category)}
                >
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
        <CarouselPrevious className="border-0 bg-transparent shadow-none" />
        <CarouselNext className="border-0 bg-transparent shadow-none" />
      </Carousel>
    </div>
  );
}

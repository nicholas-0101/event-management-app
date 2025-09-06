"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem
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
                  className="w-full shadow-none rounded-3xl md:rounded-4xl overflow-hidden group"
                  onClick={() => setActiveCategory(slide.category)}
                >
                  <div className="relative w-full aspect-[71/25]">
                    <img
                      src={slide.img}
                      alt={`Slide ${slide.id}`}
                      className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
                    />
                  </div>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

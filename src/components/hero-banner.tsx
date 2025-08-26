import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HeroBanner() {
  return (
    <section className="relative w-full h-[80dvh] md:h-[50dvh] lg:h-[80dvh]">
      <div className="w-full h-full z-[5] relative overflow-hidden">
        <Image
          src="https://res.cloudinary.com/dklqhgo8r/image/upload/v1741713850/t2p30xzk3gixgprfvwbn.png"
          alt="Purple ethnic outfit with embroidery"
          fill
          className="object-cover w-full h-full object-top"
          priority
        />

        <div className="absolute md:right-10 w-fit h-fit bottom-0 m-5  lg:top-1/2 lg:-translate-y-1/2   bg-[#fff3e3] p-8 md:p-5 lg:p-12 flex flex-col ">
            <p className="text-xs uppercase tracking-wider mb-3 text-gray-700 font-medium letter-spacing-wide">
              New Arrival
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-4xl font-medium text-[#8c738d] mb-6 leading-tight">
              Discover Our
              <br />
              New Collection
            </h1>
            <p className="text-sm text-gray-700 mb-8 max-w-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit
              tellus, luctus nec ullamcorper mattis.
            </p>
            <Button className="bg-[#8c738d] hover:bg-[#7a6279] text-white rounded-none px-10 py-6 text-sm uppercase tracking-wider font-medium w-1/2">
              BUY NOW
            </Button>
        </div>
      </div>
    </section>
  );
}

/*
      <div className="bg-[#fff3e3] p-8 md:p-12 flex items-center">
          <div className="max-w-md mx-auto md:mx-0">
            <p className="text-xs uppercase tracking-wider mb-3 text-gray-700 font-medium letter-spacing-wide">
              New Arrival
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[#8c738d] mb-6 leading-tight">
              Discover Our
              <br />
              New Collection
            </h1>
            <p className="text-sm text-gray-700 mb-8 max-w-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis.
            </p>
            <Button className="bg-[#8c738d] hover:bg-[#7a6279] text-white rounded-none px-10 py-6 text-sm uppercase tracking-wider font-medium">
              BUY NOW
            </Button>
          </div>
        </div>
*/

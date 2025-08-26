import Image from "next/image";

export default function RaasKurtiesSection() {
  return (
    <section className="py-12 ">
      <div className="w-full lg:min-h-screen px-4">
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-xl text-[#a08452] mb-1">
            Buy Your Next Wedding Dress From
          </h2>
          <h3 className="text-4xl font-bold text-[#795d2a] mb-8">
            #RaasKurties
          </h3>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-4">
          {/* 1 */}
          <div className="col-span-1 hidden lg:block">
            <div className="aspect-[3/4] relative mb-3">
              <Image src="/lot_0016__PUN0716.png" fill alt="kurti" className="object-cover" />
            </div>
            <div className="aspect-[3/2] relative mb-3">
            <Image src="/lot_0009__PUN0747.png" fill alt="kurti" className="object-cover" />
            </div>
          </div>

          {/* 2 */}
          <div className="col-span-1 mt-16">
            <div className="aspect-[3/4] relative mb-3">
              <Image src="/image 107.png" fill alt="kurti" className="object-cover" />
            </div>
            <div className="aspect-[3/2] relative mb-3">
            <Image src="/lot_0033__PUN0670.png" fill alt="kurti" className="object-cover" />
            </div>
          </div>

          {/* 3 */}
          <div className="col-span-1 mt-32">
            <div className="aspect-[3/4] relative mb-3">
            <Image src="/lot_0028__PUN0687.png" fill alt="kurti" className="object-cover" />
            </div>
          </div>

          {/* 4 */}
          <div className="col-span-1 mt-16">
            <div className="aspect-[3/4] relative mb-3">
            <Image src="/lot_0015__PUN0717.png" fill alt="kurti" className="object-cover" />
            </div>
            <div className="aspect-[3/2] relative mb-3">
            <Image src="/lot_0000__PUN0768.png" fill alt="kurti" className="object-cover" />
            </div>
          </div>

          {/* 5 */}
          <div className="col-span-1 hidden lg:block">
            <div className="aspect-[3/4] relative mb-3">
            <Image src="/lot_0005__PUN0762.png" fill alt="kurti" className="object-cover" />
            </div>
            <div className="aspect-[3/2] relative mb-3">
            <Image src="/lot_0019__PUN0710.png" fill alt="kurti" className="object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
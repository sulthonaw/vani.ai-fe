import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* 1. Background Image: Comic Hospital Lobby */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/hospital-comic-lobby.png"
          alt="Lobi Rumah Sakit Bergaya Komik"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* 2. Gradient Overlay: Dark Blue matching image, gradient upwards to transparent (opacity 0) */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-t from-[#061224] via-[#081832]/75 to-transparent"
        aria-hidden="true"
      />

      {/* 3. Centered Content: Hanya Halo Ditengah */}
      <div className="z-10 text-center px-4">
        <h1 className="font-[family-name:var(--font-handwriting)] text-8xl sm:text-9xl md:text-[12rem] text-white font-bold drop-shadow-[0_8px_32px_rgba(0,0,0,0.7)] tracking-wider select-none">
          Halo
        </h1>
      </div>
    </section>
  );
}

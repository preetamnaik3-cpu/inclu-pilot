import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  showPoweredBy?: boolean;
}

const sizeMap = {
  sm: { box: 40, text: "text-lg" },
  md: { box: 64, text: "text-2xl" },
  lg: { box: 96, text: "text-3xl" },
};

export function BrandLogo({
  size = "md",
  showTagline = true,
  showPoweredBy = true,
}: BrandLogoProps) {
  const { box, text } = sizeMap[size];

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
        style={{ width: box, height: box }}
      >
        <Image
          src="/incluhub-logo.png"
          alt="IncluHub"
          fill
          className="object-contain p-1.5"
          sizes={`${box}px`}
          priority
        />
      </div>
      <h1 className={`mt-4 font-bold tracking-tight text-stone-900 ${text}`}>IncluPilot</h1>
      {showTagline ? (
        <p className="mt-1 text-sm text-stone-500">Your project, in one place</p>
      ) : null}
      {showPoweredBy ? (
        <p className="mt-3 text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
          Powered by IncluHub
        </p>
      ) : null}
    </div>
  );
}

export function PoweredByBadge() {
  return (
    <p className="text-center text-[10px] font-semibold tracking-widest text-stone-400 uppercase">
      Powered by IncluHub
    </p>
  );
}

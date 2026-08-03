import Image from "next/image";

type FeatureSplitProps = {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
};

export function FeatureSplit({
  id,
  eyebrow,
  title,
  body,
  points,
  imageSrc,
  imageAlt,
  reverse = false,
}: FeatureSplitProps) {
  return (
    <section
      id={id}
      className="relative scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <div
        className={`mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
          reverse ? "" : ""
        }`}
      >
        <div
          className={`reveal relative aspect-[4/3] overflow-hidden ${
            reverse ? "lg:order-2" : ""
          }`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
          <div
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
            aria-hidden="true"
          />
        </div>

        <div className={`reveal ${reverse ? "lg:order-1" : ""}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
            {eyebrow}
          </p>
          <h2
            id={id ? `${id}-heading` : undefined}
            className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
            {body}
          </p>
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-sm leading-relaxed text-white/75 sm:text-base"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFD700]"
                  aria-hidden="true"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

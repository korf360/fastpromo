type BrandMarkProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md";
};

export function BrandMark({
  href = "/",
  className = "",
  size = "md",
}: BrandMarkProps) {
  const textSize = size === "sm" ? "text-lg" : "text-xl sm:text-[1.35rem]";

  const wordmark = (
    <span
      className={`${textSize} font-semibold tracking-[-0.02em] text-white transition-colors duration-300 ${className}`}
    >
      Fast<span className="font-medium text-white/55">Promo</span>
    </span>
  );

  if (!href) return wordmark;

  return (
    <a
      href={href}
      className="group rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
      aria-label="FastPromo home"
    >
      <span className="transition-opacity duration-300 group-hover:opacity-90">
        {wordmark}
      </span>
    </a>
  );
}

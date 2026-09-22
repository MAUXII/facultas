import { cn } from "@/lib/utils";
import { APP_ICON, APP_NAME } from "@/lib/brand";

export function BrandMark({
  size = 28,
  className,
  animate = true,
}: {
  size?: number;
  className?: string;
  /** Deriva o azul como onda. Default true. */
  animate?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={APP_NAME}
      className={cn(
        "ff-brand-mark relative inline-block shrink-0 overflow-hidden rounded-full",
        animate && "ff-brand-mark--waves",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="ff-brand-mark__sea absolute inset-[-35%]"
        style={{ backgroundImage: `url(${APP_ICON})` }}
      />
    </span>
  );
}

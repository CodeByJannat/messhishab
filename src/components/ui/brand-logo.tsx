import { cn } from "@/lib/utils";
import { PreloadLink } from "@/components/PreloadLink";
import { Link } from "react-router-dom";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  linkTo?: string;
  usePreloadLink?: boolean;
}

const sizeConfig = {
  sm: {
    logo: "w-8 h-8",
    text: "text-lg",
    gap: "gap-2",
  },
  md: {
    logo: "w-10 h-10",
    text: "text-xl",
    gap: "gap-2",
  },
  lg: {
    logo: "w-12 h-12",
    text: "text-2xl",
    gap: "gap-3",
  },
  xl: {
    logo: "w-14 h-14",
    text: "text-3xl",
    gap: "gap-3",
  },
};

export function BrandLogo({
  size = "md",
  showText = true,
  className,
  linkTo,
  usePreloadLink = true,
}: BrandLogoProps) {
  const config = sizeConfig[size];

  const content = (
    <div className={cn("flex items-center", config.gap, className)}>
      <img
        src="/favicon.png"
        alt="Mess Hishab"
        className={cn(config.logo, "rounded-xl shadow-md")}
      />
      {showText && (
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            config.text
          )}
        >
          <span className="text-foreground">Mess</span>
          <span className="text-primary ml-1">Hishab</span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    if (usePreloadLink) {
      return <PreloadLink to={linkTo}>{content}</PreloadLink>;
    }
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
}

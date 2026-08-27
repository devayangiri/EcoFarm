import React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy";
  roleBadge?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

export function Avatar({
  src,
  alt = "User avatar",
  name,
  size = "md",
  status,
  roleBadge,
  className,
  ...props
}: AvatarProps) {
  const getInitials = (fullName?: string) => {
    if (!fullName) return "";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={cn("relative inline-flex shrink-0 select-none", className)} {...props}>
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full font-heading font-bold bg-surface-container text-brand-primary border border-surface-dim",
          sizeClasses[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : name ? (
          <span>{getInitials(name)}</span>
        ) : (
          <User className="h-1/2 w-1/2 text-slate-neutral" />
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
            status === "online" && "bg-status-success",
            status === "busy" && "bg-status-error",
            status === "offline" && "bg-slate-neutral"
          )}
        />
      )}
    </div>
  );
}

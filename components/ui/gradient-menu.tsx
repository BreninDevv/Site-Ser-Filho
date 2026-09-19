"use client";

/**
 * Menu estilo 21st.dev (gradient-menu): círculo → pill com gradiente/glow.
 * Cores de produção vêm de `lib/ui/cores-marca` (não use os roxos de demo
 * no header/painel oficiais).
 *
 * Mobile / touch (`(hover: none)`): 1º toque expande o pill; 2º toque navega.
 * Item ativo (activeGradient): gradiente + glow fixos, sem forçar largura do pill.
 */
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  IoCameraOutline,
  IoHeartOutline,
  IoHomeOutline,
  IoShareSocialOutline,
  IoVideocamOutline,
} from "react-icons/io5";

import { cn } from "@/lib/utils";

export type GradientMenuItem = {
  title: string;
  icon: IconType;
  gradientFrom: string;
  gradientTo: string;
  to: string;
  end?: boolean;
};

export type GradientMenuProps = {
  items?: GradientMenuItem[];
  orientation?: "horizontal" | "vertical";
  variant?: "site" | "painel";
  /** Item da rota atual mantém gradiente + glow sem hover. */
  activeGradient?: boolean;
  /** Tamanho menor para caber no header sticky atual. */
  compact?: boolean;
  className?: string;
};

/** Itens de demonstração do 21st.dev (não usar no menu oficial da igreja). */
export const defaultGradientMenuItems: GradientMenuItem[] = [
  {
    title: "Home",
    icon: IoHomeOutline,
    gradientFrom: "#a955ff",
    gradientTo: "#ea51ff",
    to: "/",
  },
  {
    title: "Video",
    icon: IoVideocamOutline,
    gradientFrom: "#56CCF2",
    gradientTo: "#2F80ED",
    to: "/video",
  },
  {
    title: "Photo",
    icon: IoCameraOutline,
    gradientFrom: "#FF9966",
    gradientTo: "#FF5E62",
    to: "/photo",
  },
  {
    title: "Share",
    icon: IoShareSocialOutline,
    gradientFrom: "#80FF72",
    gradientTo: "#7EE8FA",
    to: "/share",
  },
  {
    title: "Tym",
    icon: IoHeartOutline,
    gradientFrom: "#ffa9c6",
    gradientTo: "#f434e2",
    to: "/tym",
  },
];

function usePrefersTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const sync = () => setTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return touch;
}

function isItemActive(
  pathname: string,
  item: GradientMenuItem,
  hash: string
): boolean {
  const [path, itemHash] = item.to.split("#");
  if (item.end) {
    return pathname === path && (!itemHash || hash === `#${itemHash}`);
  }
  if (itemHash) {
    return pathname === path && hash === `#${itemHash}`;
  }
  if (path === "/painel") return pathname === "/painel";
  if (path === "/inicio") {
    return pathname === "/inicio" || pathname === "/";
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function GradientMenu({
  items = defaultGradientMenuItems,
  orientation = "horizontal",
  variant = "site",
  activeGradient = false,
  compact = false,
  className,
}: GradientMenuProps) {
  const pathname = usePathname() || "/";
  const [hash, setHash] = useState("");
  const isTouch = usePrefersTouch();
  const [expandedTo, setExpandedTo] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setHash(window.location.hash || "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  useEffect(() => {
    setExpandedTo(null);
  }, [pathname, hash]);

  const onDocClick = useCallback(
    (e: Event) => {
      if (!expandedTo) return;
      const root = document.querySelector("[data-gradient-menu]");
      if (root && !root.contains(e.target as Node)) {
        setExpandedTo(null);
      }
    },
    [expandedTo]
  );

  useEffect(() => {
    if (!expandedTo) return;
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
  }, [expandedTo, onDocClick]);

  return (
    <ul
      data-gradient-menu
      data-variant={variant}
      className={cn(
        "flex items-center",
        orientation === "horizontal" ? "flex-row gap-4" : "flex-col gap-4",
        compact && "gap-2",
        className
      )}
    >
      {items.map((item) => {
        const active = isItemActive(pathname, item, hash);
        const activeLook = Boolean(activeGradient && active);
        return (
          <GradientMenuItemView
            key={item.to}
            item={item}
            active={active}
            activeLook={activeLook}
            isTouch={isTouch}
            expanded={expandedTo === item.to}
            onExpand={() => setExpandedTo(item.to)}
            orientation={orientation}
            compact={compact}
          />
        );
      })}
    </ul>
  );
}

function GradientMenuItemView({
  item,
  active,
  activeLook,
  isTouch,
  expanded,
  onExpand,
  orientation,
  compact,
}: {
  item: GradientMenuItem;
  active: boolean;
  activeLook: boolean;
  isTouch: boolean;
  expanded: boolean;
  onExpand: () => void;
  orientation: "horizontal" | "vertical";
  compact: boolean;
}) {
  const Icon = item.icon;
  const style = {
    "--gradient-from": item.gradientFrom,
    "--gradient-to": item.gradientTo,
  } as CSSProperties;

  /** Pill expandido: hover/foco CSS ou 1º toque no mobile.
   * Ativo NÃO preenche o círculo (só anel) — evita Início preto sólido. */
  const pillOpen = expanded;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isTouch) return;
    if (!expanded) {
      e.preventDefault();
      onExpand();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === " " || e.key === "Enter") {
      if (isTouch && !expanded) {
        e.preventDefault();
        onExpand();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        e.currentTarget.click();
      }
    }
  };

  const sizeIdle = compact ? "h-10 w-10" : "h-[60px] w-[60px]";
  const sizeOpen = compact
    ? "hover:w-[132px] focus-within:w-[132px]"
    : "hover:w-[180px] focus-within:w-[180px]";
  const sizeOpenForced = compact ? "w-[132px]" : "w-[180px]";

  return (
    <li
      style={style}
      className={cn(
        "group relative mx-auto flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-white transition-all duration-500",
        "shadow-[0_10px_28px_rgba(20,20,18,0.14)]",
        sizeIdle,
        sizeOpen,
        "hover:shadow-none focus-within:shadow-none",
        pillOpen && cn(sizeOpenForced, "shadow-none"),
        activeLook &&
          !pillOpen &&
          "shadow-[0_12px_30px_rgba(20,20,18,0.22)]",
        orientation === "vertical" && "lg:mx-0"
      )}
      title={item.title}
    >
      <Link
        href={item.to}
        tabIndex={0}
        aria-label={item.title}
        aria-current={active ? "page" : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "absolute inset-0 z-20 flex items-center justify-center rounded-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-black/20"
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500",
            "group-hover:opacity-100 group-focus-within:opacity-100",
            pillOpen && "opacity-100"
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 top-[8px] -z-10 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 blur-[15px] transition-all duration-500",
            "group-hover:opacity-50 group-focus-within:opacity-50",
            pillOpen && "opacity-50"
          )}
        />
        <span
          className={cn(
            "relative z-10 transition-all duration-500",
            "group-hover:scale-0 group-focus-within:scale-0",
            pillOpen && "scale-0"
          )}
        >
          <Icon
            className={cn(
              compact ? "text-xl" : "text-2xl",
              "text-gray-500 transition-colors duration-500",
              activeLook && !pillOpen && "text-gray-800",
              pillOpen && "text-white",
              "group-hover:text-white group-focus-within:text-white"
            )}
            aria-hidden
          />
        </span>
        <span
          className={cn(
            "absolute z-10 max-w-[120px] truncate text-center tracking-wide text-white uppercase transition-all delay-150 duration-500 scale-0",
            compact ? "text-[11px]" : "text-sm max-w-[150px]",
            "group-hover:scale-100 group-focus-within:scale-100",
            pillOpen && "scale-100"
          )}
        >
          {item.title}
        </span>
      </Link>
    </li>
  );
}

export default GradientMenu;

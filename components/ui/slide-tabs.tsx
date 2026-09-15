"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type PosicaoCursor = {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
};

export type SlideTabItem = {
  label: string;
  href?: string;
};

const ABAS_PADRAO: SlideTabItem[] = [
  { label: "Home" },
  { label: "Pricing" },
  { label: "Features" },
  { label: "Docs" },
  { label: "Blog" },
];

const CURSOR_INICIAL: PosicaoCursor = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  opacity: 0,
};

function indiceDaRota(items: SlideTabItem[], pathname: string) {
  const exato = items.findIndex((item) => item.href && item.href === pathname);
  if (exato >= 0) return exato;
  return items.findIndex(
    (item) =>
      item.href &&
      item.href !== "/inicio" &&
      !item.href.includes("#") &&
      pathname.startsWith(item.href)
  );
}

function medirAba(node: HTMLElement): Omit<PosicaoCursor, "opacity"> {
  return {
    left: node.offsetLeft,
    top: node.offsetTop,
    width: node.offsetWidth,
    height: node.offsetHeight,
  };
}

export function SlideTabs({
  items = ABAS_PADRAO,
  compact = false,
}: {
  items?: SlideTabItem[];
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [position, setPosition] = useState<PosicaoCursor>(CURSOR_INICIAL);
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);
  const listaRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const daRota = indiceDaRota(items, pathname);
    if (daRota >= 0) setSelected(daRota);
  }, [items, pathname]);

  const atualizarCursor = (indice: number, opacity = 1) => {
    const selectedTab = tabsRef.current[indice];
    if (!selectedTab) return;
    setPosition({ ...medirAba(selectedTab), opacity });
  };

  useLayoutEffect(() => {
    atualizarCursor(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, items, compact]);

  useEffect(() => {
    function aoRedimensionar() {
      atualizarCursor(selected);
    }
    window.addEventListener("resize", aoRedimensionar);
    const fontes = document.fonts;
    fontes?.ready?.then(aoRedimensionar).catch(() => {});
    return () => window.removeEventListener("resize", aoRedimensionar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, items]);

  function voltarParaSelecionada() {
    atualizarCursor(selected);
  }

  return (
    <ul
      ref={listaRef}
      onMouseLeave={voltarParaSelecionada}
      className={`relative mx-auto flex w-fit items-center rounded-full border-2 border-black bg-white dark:border-white dark:bg-neutral-800 ${
        compact ? "gap-0 p-0.5" : "p-1"
      }`}
    >
      {items.map((tab, i) => (
        <Tab
          key={`${tab.label}-${tab.href ?? i}`}
          ref={(el) => {
            tabsRef.current[i] = el;
          }}
          setPosition={setPosition}
          onClick={() => setSelected(i)}
          href={tab.href}
          compact={compact}
        >
          {tab.label}
        </Tab>
      ))}
      <Cursor position={position} />
    </ul>
  );
}

const Tab = React.forwardRef<
  HTMLLIElement,
  {
    children: React.ReactNode;
    setPosition: React.Dispatch<React.SetStateAction<PosicaoCursor>>;
    onClick: () => void;
    href?: string;
    compact?: boolean;
  }
>(function Tab({ children, setPosition, onClick, href, compact }, ref) {
  const localRef = useRef<HTMLLIElement | null>(null);

  function unirRef(el: HTMLLIElement | null) {
    localRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }

  const classe = compact
    ? "relative z-10 flex cursor-pointer items-center justify-center px-2.5 py-1 text-[11px] font-semibold text-white mix-blend-difference"
    : "relative z-10 flex cursor-pointer items-center justify-center px-3 py-1.5 text-xs uppercase text-white mix-blend-difference md:px-5 md:py-3 md:text-base";

  function aoEntrar() {
    const node = localRef.current;
    if (!node) return;
    setPosition({ ...medirAba(node), opacity: 1 });
  }

  return (
    <li ref={unirRef} onClick={onClick} onMouseEnter={aoEntrar} className={classe}>
      {href ? (
        <Link
          href={href}
          className="flex items-center justify-center whitespace-nowrap"
        >
          {children}
        </Link>
      ) : (
        <span className="flex items-center justify-center whitespace-nowrap">
          {children}
        </span>
      )}
    </li>
  );
});

function Cursor({ position }: { position: PosicaoCursor }) {
  return (
    <motion.li
      aria-hidden
      animate={{
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
        opacity: position.opacity,
      }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="pointer-events-none absolute z-0 rounded-full bg-black dark:bg-white"
    />
  );
}

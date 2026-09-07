"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type PosicaoCursor = {
  left: number;
  width: number;
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

export function SlideTabs({
  items = ABAS_PADRAO,
  compact = false,
}: {
  items?: SlideTabItem[];
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [position, setPosition] = useState<PosicaoCursor>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const daRota = indiceDaRota(items, pathname);
    if (daRota >= 0) setSelected(daRota);
  }, [items, pathname]);

  useEffect(() => {
    const selectedTab = tabsRef.current[selected];
    if (!selectedTab) return;
    const { width } = selectedTab.getBoundingClientRect();
    setPosition({
      left: selectedTab.offsetLeft,
      width,
      opacity: 1,
    });
  }, [selected, items]);

  function voltarParaSelecionada() {
    const selectedTab = tabsRef.current[selected];
    if (!selectedTab) return;
    const { width } = selectedTab.getBoundingClientRect();
    setPosition({
      left: selectedTab.offsetLeft,
      width,
      opacity: 1,
    });
  }

  return (
    <ul
      onMouseLeave={voltarParaSelecionada}
      className={`relative mx-auto flex w-fit rounded-full border-2 border-black bg-white p-1 dark:border-white dark:bg-neutral-800 ${
        compact ? "p-0.5" : ""
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
      <Cursor position={position} compact={compact} />
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

  const classe =
    compact
      ? "relative z-10 block cursor-pointer px-2.5 py-1 text-[11px] font-semibold text-white mix-blend-difference"
      : "relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase text-white mix-blend-difference md:px-5 md:py-3 md:text-base";

  function aoEntrar() {
    const node = localRef.current;
    if (!node) return;
    const { width } = node.getBoundingClientRect();
    setPosition({
      left: node.offsetLeft,
      width,
      opacity: 1,
    });
  }

  return (
    <li ref={unirRef} onClick={onClick} onMouseEnter={aoEntrar} className={classe}>
      {href ? (
        <Link href={href} className="block">
          {children}
        </Link>
      ) : (
        children
      )}
    </li>
  );
});

function Cursor({
  position,
  compact,
}: {
  position: PosicaoCursor;
  compact?: boolean;
}) {
  return (
    <motion.li
      animate={{ ...position }}
      className={
        compact
          ? "absolute z-0 h-7 rounded-full bg-black dark:bg-white"
          : "absolute z-0 h-7 rounded-full bg-black dark:bg-white md:h-12"
      }
    />
  );
}

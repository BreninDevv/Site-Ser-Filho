"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CORES_FLUIDO_MENU } from "@/lib/ui/cores-marca";
import { motion } from "framer-motion";

type PosicaoCursor = {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
  backgroundColor: string;
};

export type SlideTabItem = {
  label: string;
  href?: string;
  /** Cor do fluido atrás do nome */
  cursorColor?: string;
  /** Texto sobre o fluido: light = branco, dark = preto */
  cursorText?: "light" | "dark";
};

export { CORES_FLUIDO_MENU };

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
  backgroundColor: "#000000",
};

function corDoItem(item: SlideTabItem) {
  const porHref = item.href ? CORES_FLUIDO_MENU[item.href] : undefined;
  const ePainel = item.href?.startsWith("/painel") || item.label === "Painel";
  return {
    cursorColor:
      item.cursorColor ??
      porHref?.cursorColor ??
      (ePainel ? "#0b3d91" : "#000000"),
    cursorText: item.cursorText ?? porHref?.cursorText ?? "light",
  };
}

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

function medirAba(node: HTMLElement): Omit<PosicaoCursor, "opacity" | "backgroundColor"> {
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
  const [hovered, setHovered] = useState<number | null>(null);
  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);
  const listaRef = useRef<HTMLUListElement | null>(null);

  const ativo = hovered ?? selected;

  useEffect(() => {
    const daRota = indiceDaRota(items, pathname);
    if (daRota >= 0) setSelected(daRota);
  }, [items, pathname]);

  const atualizarCursor = (indice: number, opacity = 1) => {
    const selectedTab = tabsRef.current[indice];
    if (!selectedTab) return;
    const item = items[indice];
    const { cursorColor } = corDoItem(item ?? { label: "" });
    setPosition({
      ...medirAba(selectedTab),
      opacity,
      backgroundColor: cursorColor,
    });
  };

  useLayoutEffect(() => {
    atualizarCursor(ativo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, selected, items, compact]);

  useEffect(() => {
    function aoRedimensionar() {
      atualizarCursor(ativo);
    }
    window.addEventListener("resize", aoRedimensionar);
    const fontes = document.fonts;
    fontes?.ready?.then(aoRedimensionar).catch(() => {});
    return () => window.removeEventListener("resize", aoRedimensionar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, items]);

  function voltarParaSelecionada() {
    setHovered(null);
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
      {items.map((tab, i) => {
        const { cursorText } = corDoItem(tab);
        const sobFluido = i === ativo && position.opacity > 0;
        return (
          <Tab
            key={`${tab.label}-${tab.href ?? i}`}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            onClick={() => setSelected(i)}
            onHover={() => {
              setHovered(i);
              atualizarCursor(i);
            }}
            href={tab.href}
            compact={compact}
            sobFluido={sobFluido}
            textoClaro={cursorText === "light"}
          >
            {tab.label}
          </Tab>
        );
      })}
      <Cursor position={position} />
    </ul>
  );
}

const Tab = React.forwardRef<
  HTMLLIElement,
  {
    children: React.ReactNode;
    onClick: () => void;
    onHover: () => void;
    href?: string;
    compact?: boolean;
    sobFluido: boolean;
    textoClaro: boolean;
  }
>(function Tab(
  { children, onClick, onHover, href, compact, sobFluido, textoClaro },
  ref
) {
  const localRef = useRef<HTMLLIElement | null>(null);

  function unirRef(el: HTMLLIElement | null) {
    localRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }

  const corTexto = sobFluido
    ? textoClaro
      ? "text-white"
      : "text-black"
    : "text-black dark:text-white";

  const classe = compact
    ? `relative z-10 flex cursor-pointer items-center justify-center px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200 ${corTexto}`
    : `relative z-10 flex cursor-pointer items-center justify-center px-3 py-1.5 text-xs uppercase transition-colors duration-200 md:px-5 md:py-3 md:text-base ${corTexto}`;

  return (
    <li
      ref={unirRef}
      onClick={onClick}
      onMouseEnter={onHover}
      className={classe}
    >
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
        backgroundColor: position.backgroundColor,
      }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="pointer-events-none absolute z-0 rounded-full"
    />
  );
}

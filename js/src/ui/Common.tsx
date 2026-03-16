import React from "react";
import { useEffect } from "react";

import { IconProps } from "@tabler/icons-react";
import {
  IconAdjustments,
  IconArrowDown,
  IconArrowUp,
  IconCircleCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconExclamationCircle,
  IconInfoCircle,
  IconNotes,
  IconPencil,
  IconPlus,
  IconPoo,
  IconLayoutSidebarRightCollapse,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";

export { Table } from "./Table";

export function cx(
  ...args: Array<string | null | undefined | false>
): string | undefined {
  const classNames = args.filter((arg) => arg && arg.trim());
  if (classNames.length === 0) {
    return undefined;
  }
  return classNames.join(" ");
}

export function ModalCard({
  title,
  visible,
  hideModal,
  children,
}: {
  title: string;
  visible: boolean;
  hideModal: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleKeys = (e) => {
      if (e.key == "Escape") {
        hideModal();
      }
    };
    document.addEventListener("keydown", handleKeys);

    return () => document.removeEventListener("keydown", handleKeys);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-container">
      <div className="card modal">
        <div className="title">
          {title}
          <span className="close-button" onClick={hideModal}>
            ✕
          </span>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ErrorCard({ message }: { message: string | null }) {
  return <StatusCard status="error" message={message} />;
}

export function StatusCard({
  status,
  message,
  children,
}: {
  status: "error" | "info" | "success";
  message: string | null;
  children?: React.ReactNode;
}) {
  return (
    message && (
      <div className={cx("card", status)}>
        <span className="status">
          <Glyph glyph={status} size={20} />
          {message}
        </span>
        {children}
      </div>
    )
  );
}

// prettier-ignore
const GLYPH_MAP = {
  "add": IconPlus,
  "arrow-up": IconArrowUp,
  "arrow-down": IconArrowDown,
  "chevron-left": IconChevronLeft,
  "chevron-right": IconChevronRight,
  "copy": IconCopy,
  "delete": IconTrash,
  "edit": IconPencil,
  "error": IconExclamationCircle,
  "info": IconInfoCircle,
  "notes": IconNotes,
  "sidebar-collapse": IconLayoutSidebarRightCollapse,
  "success": IconCircleCheck,
  "settings": IconAdjustments,
  "upload": IconUpload,
} as const;

type GlyphType = keyof typeof GLYPH_MAP;

interface GlyphProps extends IconProps {
  glyph: GlyphType;
}

export function Glyph({ glyph, className, ...rest }: GlyphProps) {
  const IconComponent = GLYPH_MAP[glyph] || IconPoo;

  return <IconComponent className={cx("glyph", className)} {...rest} />;
}

export function InlineGlyphButton({
  glyph,
  onClick,
}: {
  glyph: GlyphType;
  onClick: () => void;
}) {
  return (
    <span className="button button-small" onClick={onClick}>
      <Glyph glyph={glyph} size={18} />
    </span>
  );
}

export function GlyphButton({
  glyph,
  onClick,
  text,
}: {
  glyph: GlyphType;
  onClick: () => void;
  text?: string;
}) {
  return (
    <span className="button" onClick={onClick}>
      <Glyph glyph={glyph} size={20} />
      {text}
    </span>
  );
}

export function Pill({ children }: { children: string }) {
  return <span className="pill">{children}</span>;
}

export function Section({
  title,
  children,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="section">
      {title && <span className="title">{title}</span>}
      {children}
    </div>
  );
}

export function Flex({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cx("flexrow", className)}>{children}</span>;
}

export function Col({ widthPct }: { widthPct?: number }) {
  if (widthPct === undefined) {
    return <col />;
  }
  const width = `${widthPct}%`;
  return <col style={{ width: width }} />;
}

export function LoadingBanner({ isLoading }: { isLoading: boolean }) {
  const opacity = isLoading ? 1 : 0;
  const events = isLoading ? "auto" : "none";
  return (
    <span
      className="loading-container"
      style={{ opacity: opacity, pointerEvents: events }}
    >
      {isLoading ? (
        <div className="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : null}
    </span>
  );
}

export function Indent() {
  return <span className="glyph">{" :: "}</span>;
}

export function formatCurrency(value: number) {
  return (value / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function CurrencyCell({
  value,
  onClick,
  className,
  style,
}: {
  value: number;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const classNames = cx(
    "number",
    "r-align",
    value <= 0 && "zero",
    onClick && "table-button",
    className,
  );

  return (
    <td className={classNames} onClick={onClick} style={style}>
      {formatCurrency(value)}
    </td>
  );
}

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
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";

function cx(...args: Array<string | null | undefined>): string | undefined {
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
        <div className="modal-header title">
          <span className="modal-title">{title}</span>
          <span className="modal-close-button" onClick={hideModal}>
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

type GlyphType =
  | "add"
  | "arrow-up"
  | "arrow-down"
  | "chevron-left"
  | "chevron-right"
  | "copy"
  | "delete"
  | "edit"
  | "error"
  | "info"
  | "notes"
  | "success"
  | "settings"
  | "upload";

interface GlyphProps extends IconProps {
  glyph: GlyphType;
}

export function Glyph({ glyph, className, ...rest }: GlyphProps) {
  const classNames = cx("glyph", className);
  switch (glyph) {
    case "add":
      return <IconPlus className={classNames} {...rest} />;
    case "arrow-up":
      return <IconArrowUp className={classNames} {...rest} />;
    case "arrow-down":
      return <IconArrowDown className={classNames} {...rest} />;
    case "chevron-left":
      return <IconChevronLeft className={classNames} {...rest} />;
    case "chevron-right":
      return <IconChevronRight className={classNames} {...rest} />;
    case "copy":
      return <IconCopy className={classNames} {...rest} />;
    case "delete":
      return <IconTrash className={classNames} {...rest} />;
    case "edit":
      return <IconPencil className={classNames} {...rest} />;
    case "error":
      return <IconExclamationCircle className={classNames} {...rest} />;
    case "info":
      return <IconInfoCircle className={classNames} {...rest} />;
    case "notes":
      return <IconNotes className={classNames} {...rest} />;
    case "success":
      return <IconCircleCheck className={classNames} {...rest} />;
    case "settings":
      return <IconAdjustments className={classNames} {...rest} />;
    case "upload":
      return <IconUpload className={classNames} {...rest} />;
    default:
      return <IconPoo className={classNames} {...rest} />;
  }
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
      {title && <span className="section-title">{title}</span>}
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
  return <span className="soft">{" :: "}</span>;
}

export function formatCurrency(value: number) {
  return (value / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function CurrencyCell({
  value,
  onClick,
  tooltip,
  className,
  softNegatives = true,
}: {
  value: number;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
  softNegatives?: boolean;
}) {
  let classNames = "number r-align";
  if (softNegatives && value <= 0) {
    classNames += " soft";
  }
  if (onClick) {
    classNames += " td-button";
  }
  if (tooltip) {
    classNames += " tooltip-cell";
  }
  if (className) {
    classNames += " " + className;
  }

  return (
    <td className={classNames} onClick={onClick} data-tooltip={tooltip}>
      {formatCurrency(value)}
    </td>
  );
}

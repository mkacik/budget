import React from "react";
import { useEffect } from "react";

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

type Status = "error" | "info" | "success";

export function StatusCard({
  status,
  message,
  children,
}: {
  status: Status;
  message: string | null;
  children?: React.ReactNode;
}) {
  if (message === null) {
    return null;
  }

  const classNames = ["card", status];
  const glyph = status === "success" ? "check_circle" : status;

  return (
    <div className={classNames.join(" ")}>
      <span className="status">
        <InlineGlyph glyph={glyph} />
        {message}
      </span>
      {children}
    </div>
  );
}

export function ItemCard({ children }: { children: React.ReactNode }) {
  return <div className="card item">{children}</div>;
}

export type Glyph =
  | "add"
  | "check_circle"
  | "chevron_right"
  | "delete"
  | "edit"
  | "error"
  | "info"
  | "pie_chart";

export function GlyphButton({
  glyph,
  onClick,
  text,
}: {
  glyph: Glyph;
  onClick: () => void;
  text?: string;
}) {
  return (
    <div className="button" onClick={onClick}>
      <span className="material-symbols-outlined">{glyph}</span>
      {text}
    </div>
  );
}

export function InlineGlyphButton({
  glyph,
  onClick,
  text,
}: {
  glyph: Glyph;
  onClick: () => void;
  text?: string;
}) {
  return (
    <div className="button button-small" onClick={onClick}>
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
        {glyph}
      </span>
      {text}
    </div>
  );
}

export function InlineGlyph({ glyph }: { glyph: Glyph }) {
  return <span className="material-symbols-outlined">{glyph}</span>;
}

export function SmallInlineGlyph({ glyph }: { glyph: Glyph }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
      {glyph}
    </span>
  );
}

export function Pill({ children }: { children: string }) {
  return <span className="pill">{children}</span>;
}

export function Section({ children }: { children: React.ReactNode }) {
  return <div className="section">{children}</div>;
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return <span className="title">{children}</span>;
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

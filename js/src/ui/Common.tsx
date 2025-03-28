import React from "react";

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
  if (!visible) {
    return null;
  }

  const preventParentOnClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-container" onClick={hideModal}>
      <div className="card modal" onClick={preventParentOnClick}>
        <div className="modal-header">
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
  if (message === null) {
    return null;
  }
  return <div className="card error">❌ {message}</div>;
}

export function ItemCard({ children }: { children: React.ReactNode }) {
  return <div className="card item">{children}</div>;
}

export type Glyph = "add" | "edit" | "delete";

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
}: {
  glyph: Glyph;
  onClick: () => void;
}) {
  return (
    <div className="button button-small" onClick={onClick}>
      <span className="material-symbols-outlined ">{glyph}</span>
    </div>
  );
}

export function Form({
  onSubmit,
  children,
}: {
  onSubmit: (e: React.SyntheticEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <form className="edit-form" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export function FormButtons({ children }: { children: React.ReactNode }) {
  return <div className="edit-form-buttons">{children}</div>;
}

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="edit-form-section-header">{title}</span>
      {children}
    </>
  );
}

export function Pill({ children }: { children: string }) {
  return <span className="pill">{children}</span>;
}

import React from "react";

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

export function FormButtons({ children }: { children: React.ReactNode }) {
  return <div className="edit-form-buttons">{children}</div>;
}

export function FormSubmitButton({ text }: { text: string }) {
  return <input className="button" type="submit" value={text} />;
}

export function FormFieldWide({ children }: { children: React.ReactNode }) {
  return <span className="edit-form-field-wide">{children}</span>;
}

import React from "react";
import { useId } from "react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function Form({
  onSubmit,
  children,
}: {
  onSubmit: (e: React.SyntheticEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <form className="edit-form" onSubmit={onSubmit} autoComplete="off">
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

interface LabeledInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function LabeledInput({ label, ...rest }: LabeledInputProps) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </>
  );
}

interface LabeledTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function LabeledTextArea({ label, ...rest }: LabeledTextAreaProps) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} {...rest} />
    </>
  );
}

interface LabeledSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function LabeledSelect({
  label,
  children,
  ...rest
}: LabeledSelectProps) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <select id={id} {...rest}>
        {children}
      </select>
    </>
  );
}

// cannot simply import because this type is not known at compile time
interface DatePickerProps {
  dateFormat: string;
  selected: Date | null;
  onChange: (name: Date | null) => void;
}

interface LabeledDatePickerProps extends DatePickerProps {
  label: string;
}

export function LabeledDatePicker({ label, ...rest }: LabeledDatePickerProps) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <DatePicker id={id} className="stretch-datepicker" {...rest} />
    </>
  );
}

import React from "react";

export function ModalCard({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return visible ? <div className="modal">{children}</div> : null;
}

export function ErrorCard({ message }: { message: string | null }) {
  if (message === null) {
    return null;
  }
  return <div style={{ color: "red" }}>❌ {message}</div>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

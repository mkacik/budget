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

export function ErrorCard({ message }: { message: string }) {
  return <div style={{ color: "red" }}>❌ {message}</div>;
}

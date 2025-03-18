import React from "react";

export function ModalCard({
  visible,
  hideModal,
  children,
}: {
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
        {children}
      </div>
    </div>
  );
}

export function ErrorCard({ message }: { message: string | null }) {
  if (message === null) {
    return null;
  }
  return <div className="card card-error">❌ {message}</div>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

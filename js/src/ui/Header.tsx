import React from "react";

function HeaderRoot({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <div
      className="header noselect"
      style={isDev ? { backgroundColor: "pink" } : undefined}
    >
      {children}
    </div>
  );
}

function HeaderDivider() {
  return <span className="header-divider">︱</span>;
}

function HeaderLink({
  onClick,
  rightAligned,
  children,
}: {
  onClick?: () => void;
  rightAligned?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className="header-button"
      style={rightAligned ? { marginLeft: "auto" } : undefined}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

function HeaderMain({ children }: { children: React.ReactNode }) {
  return <span className="header-main">{children}</span>;
}

export const Header = HeaderRoot as typeof HeaderRoot & {
  Divider: typeof HeaderDivider;
  Link: typeof HeaderLink;
  Main: typeof HeaderMain;
};

Header.Divider = HeaderDivider;
Header.Link = HeaderLink;
Header.Main = HeaderMain;

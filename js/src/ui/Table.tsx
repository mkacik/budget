import React from "react";

import { cx } from "./Common";

function TableRoot({
  fontSize,
  condensed,
  softZeros,
  striped,
  topAligned,
  children,
}: {
  fontSize?: "small" | "large";
  condensed?: boolean;
  softZeros?: boolean;
  striped?: boolean;
  topAligned?: boolean;
  children: React.ReactNode;
}) {
  const classNames = cx(
    fontSize,
    condensed && "condensed",
    softZeros && "soft-zeros",
    striped && "striped",
    topAligned && "v-top",
  );
  return <table className={classNames}>{children}</table>;
}

export const Table = TableRoot as typeof TableRoot;

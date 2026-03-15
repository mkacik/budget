import React from "react";

import { cx } from "./Common";

function TableRoot({
  condensed,
  largeFont,
  softZeros,
  striped,
  topAligned,
  children,
}: {
  condensed?: boolean;
  largeFont?: boolean;
  softZeros?: boolean;
  striped?: boolean;
  topAligned?: boolean;
  children: React.ReactNode;
}) {
  const classNames = cx(
    condensed && "condensed",
    largeFont && "large",
    softZeros && "soft-zeros",
    striped && "striped",
    topAligned && "v-top",
  );
  return <table className={classNames}>{children}</table>;
}

export const Table = TableRoot as typeof TableRoot;

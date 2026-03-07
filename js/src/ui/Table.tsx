import React from "react";

import { cx } from "./Common";

function TableRoot({
  striped,
  largeFont,
  condensed,
  topAligned,
  children,
}: {
  striped?: boolean;
  largeFont?: boolean;
  condensed?: boolean;
  topAligned?: boolean;
  children: React.ReactNode;
}) {
  const classNames = cx(
    striped && "striped",
    largeFont && "large",
    condensed && "condensed",
    topAligned && "v-top",
  );
  return <table className={classNames}>{children}</table>;
}

export const Table = TableRoot as typeof TableRoot;

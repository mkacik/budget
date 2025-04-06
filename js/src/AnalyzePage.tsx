import React from "react";
import { useState, useEffect } from "react";

import { SpendingDataPoint } from "./types/SpendingData";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";
import { parseData, MonthlySpendingData } from "./MonthlySpendingData";
import {
  Col,
  SmallInlineGlyph,
  ErrorCard,
  Section,
  SectionHeader,
} from "./ui/Common";

function getMonths(year: number): Array<string> {
  return [...Array(12).keys()].map((m) => {
    const month = String(m + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

function SpendingTableCell({
  obj,
  spend,
}: {
  obj: BudgetItemView | BudgetCategoryView;
  spend: number;
}) {
  const classNames = ["number", "r-align"];
  if (spend <= 0) {
    classNames.push("soft");
  } else if (spend > obj.amountPerMonth) {
    classNames.push("red");
  }

  return <td className={classNames.join(" ")}>{spend.toFixed(2)}</td>;
}

function MonthlySpendingPerCategoryTable({
  data,
  budget,
}: {
  data: MonthlySpendingData;
  budget: BudgetView;
}) {
  // TODO: find some way to make this work in 2026
  const months = getMonths(2025);

  const headerRow = months.map((month, idx) => {
    return (
      <th className="r-align nowrap" key={idx}>
        {month}
      </th>
    );
  });

  const rows: Array<React.ReactNode> = [];
  for (const category of budget.categories) {
    const cols: Array<React.ReactNode> = [<td key="hdr">{category.name}</td>];

    for (const month of months) {
      const spend = data.get(month)?.get(category.id)?.spend ?? 0;
      cols.push(<SpendingTableCell key={month} obj={category} spend={spend} />);
    }

    rows.push(
      <tr key={`${category.id}`} className="bold highlight">
        {cols}
      </tr>,
    );

    for (const item of category.items) {
      const cols: Array<React.ReactNode> = [
        <td key="hdr" className="v-center">
          <SmallInlineGlyph glyph="chevron_right" />
          {item.name}
        </td>,
      ];

      for (const month of months) {
        const spend =
          data.get(month)?.get(category.id)?.items.get(item.id)?.spend ?? 0;
        cols.push(<SpendingTableCell key={month} obj={item} spend={spend} />);
      }

      rows.push(<tr key={`${category.id}-${item.id}`}>{cols}</tr>);
    }
  }

  return (
    <table>
      <colgroup>
        <Col />
        {months.map((month) => (
          <Col key={month} widthPct={7} />
        ))}
      </colgroup>

      <thead>
        <tr>
          <th>Name</th>
          {headerRow}
        </tr>
      </thead>

      <tbody>{rows}</tbody>
    </table>
  );
}

function MonthlySpendingTable({
  dataPoints,
  budget,
}: {
  dataPoints: Array<SpendingDataPoint> | null;
  budget: BudgetView;
}) {
  if (dataPoints === null) {
    return <i>fetching data...</i>;
  }

  try {
    const data = parseData(dataPoints, budget);
    return <MonthlySpendingPerCategoryTable data={data} budget={budget} />;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not parse spending data";
    return <ErrorCard message={message} />;
  }
}

export function AnalyzePage({ budget }: { budget: BudgetView }) {
  const [spendingData, setSpendingData] =
    useState<Array<SpendingDataPoint> | null>(null);

  const fetchSpendingData = () => {
    fetch("/api/spending")
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        const data = result.data as Array<SpendingDataPoint>;
        setSpendingData(data);
      });
  };

  useEffect(() => {
    if (spendingData === null) {
      fetchSpendingData();
    }
  }, [spendingData, fetchSpendingData]);

  return (
    <Section>
      <SectionHeader>Analyze spending</SectionHeader>
      <MonthlySpendingTable dataPoints={spendingData} budget={budget} />
    </Section>
  );
}

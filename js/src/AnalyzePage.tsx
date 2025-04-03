import React from "react";
import { useState, useEffect } from "react";

import { SpendingDataPoint } from "./types/SpendingData";

import { BudgetView } from "./BudgetView";
import { Section, SectionHeader } from "./ui/Common";

type CategoryID = number;

type MonthlySpendingPerCategory = {
  category: string;
  month: string;
  spend: number;
};

type MonthlySpendingData = Map<
  string,
  Map<CategoryID, MonthlySpendingPerCategory>
>;

function parseData(
  monthlySpending: Array<SpendingDataPoint>,
  budget: BudgetView,
): MonthlySpendingData {
  const dataPoints: MonthlySpendingData = new Map();
  for (const row of monthlySpending) {
    const item = budget.getItem(row.budget_item_id);
    const category = item.category;

    if (category.ignored) {
      continue;
    }

    const month = row.month;
    if (!dataPoints.has(month)) {
      dataPoints.set(month, new Map());
    }
    const monthDataPoints = dataPoints.get(month)!;
    if (!monthDataPoints.has(category.id)) {
      const categorySpend = {
        category: category.name,
        month: month,
        spend: 0,
      } as MonthlySpendingPerCategory;
      monthDataPoints.set(category.id, categorySpend);
    }
    monthDataPoints.get(category.id)!.spend += row.amount;
  }

  return dataPoints;
}

function MonthlySpendingTable({
  dataPoints,
  budget,
}: {
  dataPoints: Array<SpendingDataPoint> | null;
  budget: BudgetView;
}) {
  if (dataPoints === null) {
    return null;
  }

  const data = parseData(dataPoints, budget);

  const headerRowNames = budget.categories.map((category, i) => (
    <th key={i} className="r-align">
      {category.name}
    </th>
  ));
  const headerRowAmounts = budget.categories.map((category, i) => (
    <th key={i} className="r-align">
      <span className="number">{category.amountPerMonth.toFixed(2)}</span>/mo
    </th>
  ));

  const months = [...Array(12).keys()].map((m) => {
    // TODO: find some way to make this work in 2026
    return "2025-" + String(m + 1).padStart(2, "0");
  });

  const rows: Array<React.ReactNode> = [];
  for (const month of months) {
    const cols: Array<React.ReactNode> = [
      <td key={month + "_hdr"}>{month}</td>,
    ];

    for (const category of budget.categories) {
      const maybeSpend = data.get(month)?.get(category.id);
      const spend =
        maybeSpend !== undefined && maybeSpend !== null ? maybeSpend.spend : 0;

      const classNames = ["r-align"];
      if (spend <= 0) {
        classNames.push("soft");
      } else if (spend > category.amountPerMonth) {
        classNames.push("red");
      }

      const key = month + "_" + String(category.id);
      cols.push(
        <td key={key} className={classNames.join(" ")}>
          {spend.toFixed(2)}
        </td>,
      );
    }

    rows.push(<tr key={month}>{cols}</tr>);
  }

  const columnWidth = 92.0 / budget.categories.length;

  return (
    <table>
      <colgroup>
        <col />
        {budget.categories.map((c, i) => (
          <col key={i} style={{ width: `${columnWidth}%` }} />
        ))}
      </colgroup>

      <thead>
        <tr>
          <th>Category →</th>
          {headerRowNames}
        </tr>
        <tr>
          <th>Month ↓</th>
          {headerRowAmounts}
        </tr>
      </thead>

      <tbody className="number">{rows}</tbody>
    </table>
  );
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

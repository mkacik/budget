import React from "react";
import { useState, useEffect } from "react";
import { format as prettyFormat } from "pretty-format";

import { SpendingDataPoint as IncompleteSpendingDataPoint } from "./types/SpendingData";
/*
export type SpendingData = { data: Array<SpendingDataPoint>, };
export type SpendingDataPoint = { budget_item_id: number, month: string, amount: number, };
*/

import { BudgetView } from "./BudgetView";
import { SectionHeader } from "./ui/Common";

type MonthlySpendingDataPoint = {
  item: string;
  category: string;
  month: string;
  budgeted: number;
  spent: number;
};

function parseData(
  monthlySpending: Array<IncompleteSpendingDataPoint>,
  budget: BudgetView,
): Array<MonthlySpendingDataPoint> {
  const dataPoints: Array<MonthlySpendingDataPoint> = [];
  for (const row of monthlySpending) {
    const budgetItem = budget.getItem(row.budget_item_id);
    const dataPoint = {
      item: budgetItem.name,
      category: budgetItem.category.name,
      month: row.month,
      budgeted: budgetItem.amountPerYear / 12,
      spent: row.amount,
    } as MonthlySpendingDataPoint;
    dataPoints.push(dataPoint);
  }
  return dataPoints;
}

export function AnalyzeCard({ budget }: { budget: BudgetView }) {
  const [spendingData, setSpendingData] =
    useState<Array<IncompleteSpendingDataPoint> | null>(null);

  const fetchSpendingData = () => {
    fetch("/api/spending")
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        const data = result.data as Array<IncompleteSpendingDataPoint>;
        setSpendingData(data);
      });
  };

  useEffect(() => {
    if (spendingData === null) {
      fetchSpendingData();
    }
  }, [spendingData, fetchSpendingData]);

  return (
    <>
      <SectionHeader>Analyze spending</SectionHeader>
      <pre>{prettyFormat(spendingData)}</pre>
    </>
  );
}

import React from "react";
import { useState, useEffect } from "react";
import { SpendingDataPoint } from "./types/SpendingData";

import { BudgetView } from "./BudgetView";
import { MonthlySpendingData } from "./MonthlySpendingData";
import { MonthlySpendingTable } from "./MonthlySpendingTable";
import { ExpensesQuery, ExpensesList } from "./ExpensesList";
import { ErrorCard, Section, SectionHeader, LoadingBanner } from "./ui/Common";

function ExpensesSectionHeader({ query }: { query: ExpensesQuery | null }) {
  if (query === null) {
    return (
      <span className="soft">
        Click on any table cell to select relevant expenses
      </span>
    );
  }

  if (query.variant !== "period") {
    throw new Error("Only period query accepted in this context!");
  }

  const titleParts: Array<React.ReactNode> = [`[${query.period}]`, " "];

  const categorySelector = query.categorySelector;
  if (categorySelector === "uncategorized") {
    titleParts.push(<i key={categorySelector}>uncategorized</i>);
  } else if (categorySelector === "all-not-ignored") {
    titleParts.push(
      <i key={categorySelector}>all (excluding ignored categories)</i>,
    );
  } else if ("displayName" in categorySelector) {
    titleParts.push(categorySelector.displayName);
  }

  return <SectionHeader>{titleParts}</SectionHeader>;
}

export function AnalyzePage({ budget }: { budget: BudgetView }) {
  const [spendingData, setSpendingData] = useState<MonthlySpendingData | null>(
    null,
  );
  const [expensesQuery, setExpensesQuery] = useState<ExpensesQuery | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpendingData = () => {
    setError(null);
    setLoading(true);
    fetch(`/api/spending/${budget.year}`)
      .then((response) => response.json())
      .then((result) => {
        const dataPoints = result.data as Array<SpendingDataPoint>;
        const data = new MonthlySpendingData(dataPoints, budget);
        setSpendingData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
        setError("Something went wrong! Please refresh the page");
      });
  };

  useEffect(() => {
    if (spendingData === null && error === null) {
      fetchSpendingData();
    }
  }, []);

  return (
    <>
      <Section>
        <SectionHeader>Analyze spending</SectionHeader>
        <ErrorCard message={error} />
        {spendingData && (
          <MonthlySpendingTable
            data={spendingData}
            budget={budget}
            updateExpensesQuery={(query) => setExpensesQuery(query)}
          />
        )}
      </Section>
      <Section>
        <ExpensesSectionHeader query={expensesQuery} />
        {expensesQuery && (
          <ExpensesList
            query={expensesQuery}
            budget={budget}
            onExpenseCategoryChange={fetchSpendingData}
          />
        )}
      </Section>
      <LoadingBanner isLoading={loading} />
    </>
  );
}

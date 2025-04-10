import React from "react";
import { useState, useEffect } from "react";

import { SpendingDataPoint } from "./types/SpendingData";
import { Expense } from "./types/Expense";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";
import { parseData, MonthlySpendingData } from "./MonthlySpendingData";
import { ExpensesTable } from "./ExpensesTable";
import {
  Col,
  SmallInlineGlyph,
  ErrorCard,
  Section,
  SectionHeader,
  LoadingBanner,
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
  onClick,
}: {
  obj: BudgetItemView | BudgetCategoryView;
  spend: number;
  onClick?: () => void;
}) {
  const classNames = ["number", "r-align"];
  if (spend <= 0) {
    classNames.push("soft");
  } else if (spend > obj.amountPerMonth) {
    classNames.push("red");
  }

  if (onClick !== undefined) {
    classNames.push("td-button");
  }

  return (
    <td className={classNames.join(" ")} onClick={onClick}>
      {spend.toFixed(2)}
    </td>
  );
}

function MonthlySpendingTable({
  data,
  budget,
  updateSelected,
}: {
  data: MonthlySpendingData;
  budget: BudgetView;
  updateSelected: (number, string) => void;
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
        const onClick = () => {
          updateSelected(item.id, month);
        };
        const cell = (
          <SpendingTableCell
            key={month}
            obj={item}
            spend={spend}
            onClick={onClick}
          />
        );
        cols.push(cell);
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

export function AnalyzePage({ budget }: { budget: BudgetView }) {
  const [spendingData, setSpendingData] = useState<MonthlySpendingData | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Array<Expense> | null>(null);
  const [selected, setSelected] = useState<[number, string] | null>(null);

  const fetchSpendingData = () => {
    setError(null);
    setLoading(true);
    fetch("/api/spending")
      .then((response) => response.json())
      .then((result) => {
        const dataPoints = result.data as Array<SpendingDataPoint>;
        const data = parseData(dataPoints, budget);
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

  const fetchExpenses = () => {
    if (selected === null) {
      return;
    }

    setLoading(true);
    const [budgetItemID, month] = selected;
    fetch(`/api/expenses/monthly/${budgetItemID}/${month}`)
      .then((response) => response.json())
      .then((result) => {
        const expenses = result.expenses as Array<Expense>;
        setExpenses(expenses);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
        setError("Something went wrong! Please refresh the page");
      });
  };

  useEffect(() => {
    if (error === null) {
      fetchExpenses();
    }
  }, [selected]);

  const updateSelected = (budgetItemID: number, month: string) => {
    setSelected([budgetItemID, month]);
  };

  const spendingTable =
    spendingData !== null ? (
      <MonthlySpendingTable
        data={spendingData}
        budget={budget}
        updateSelected={updateSelected}
      />
    ) : null;

  const onExpenseCategoryChange = () => {
    fetchSpendingData();
    fetchExpenses();
  };

  const expensesTable =
    expenses !== null ? (
      <ExpensesTable
        expenses={expenses}
        onSuccess={onExpenseCategoryChange}
        budget={budget}
      />
    ) : null;

  return (
    <>
      <Section>
        <SectionHeader>Analyze spending</SectionHeader>
        <ErrorCard message={error} />
        {spendingTable}
      </Section>
      <Section>{expensesTable}</Section>
      <LoadingBanner isLoading={loading} />
    </>
  );
}

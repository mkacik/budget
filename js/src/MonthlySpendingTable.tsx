import React from "react";

import { ExpensesQuery } from "./types/Expense";

import { useAppSettingsContext } from "./AppSettings";
import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";
import { MonthlySpendingData } from "./MonthlySpendingData";

import * as UI from "./ui/Common";

export interface TitledExpensesQuery extends ExpensesQuery {
  title: string;
}

function getMonths(year: number): Array<string> {
  return [...Array(12).keys()].map((m) => {
    const month = String(m + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

function SpendingTableColgroup({ hasFunds }: { hasFunds: boolean }) {
  // 13/14 -> 12 months + total + optional funds
  const columnCount = hasFunds ? 14 : 13;
  return (
    <colgroup>
      <UI.Col />
      {Array(columnCount)
        .fill(0)
        .map((month, idx) => (
          <UI.Col key={idx} widthPct={6} />
        ))}
    </colgroup>
  );
}

function SpendingTableCell({
  spend,
  limit,
  onClick,
}: {
  spend: number;
  limit: number | null;
  onClick?: () => void;
}) {
  if (!limit) {
    return <UI.CurrencyCell value={spend} onClick={onClick} />;
  }

  const tooltip = `budgeted: ${UI.formatCurrency(limit)}`;
  return (
    <UI.CurrencyCell
      value={spend}
      onClick={onClick}
      tooltip={tooltip}
      className={spend > limit ? "red" : undefined}
    />
  );
}

function SpendingTableHeaderRow({
  year,
  hasFunds,
  updateExpensesQuery,
}: {
  year: number;
  hasFunds: boolean;
  updateExpensesQuery: (TitledExpensesQuery) => void;
}) {
  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const onClick = () => {
      updateExpensesQuery({
        title: `${month} :: all (excluding expenses in ignored categories)`,
        period: month,
        selector: { variant: "AllNotIgnored" },
      });
    };
    const cell = (
      <th key={month} className="r-align nowrap td-button" onClick={onClick}>
        {month}
      </th>
    );
    cells.push(cell);
  }

  return (
    <tr>
      <th>Name</th>
      {cells}
      <th className="r-align">TOTAL</th>
      {hasFunds && <th className="r-align">+funds</th>}
    </tr>
  );
}

function SpendingTableFooterRow({
  year,
  data,
  hasFunds,
  updateExpensesQuery,
  yearlyBudget,
}: {
  year: number;
  data: MonthlySpendingData;
  hasFunds: boolean;
  updateExpensesQuery: (TitledExpensesQuery) => void;
  yearlyBudget: number;
}) {
  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const onClick = () => {
      updateExpensesQuery({
        title: `${month} :: all (excluding expenses in ignored categories)`,
        period: month,
        selector: { variant: "AllNotIgnored" },
      });
    };
    const cell = (
      <SpendingTableCell
        key={month}
        spend={data.getMonthTotal(month)}
        limit={null}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  return (
    <tr>
      <th>TOTAL</th>
      {cells}
      <SpendingTableCell spend={data.getTotalSpend()} limit={yearlyBudget} />
      {hasFunds && (
        <SpendingTableCell spend={data.getTotalSpendInclFunds()} limit={null} />
      )}
    </tr>
  );
}

function SpendingTableUncategorizedRow({
  year,
  data,
  hasFunds,
  updateExpensesQuery,
}: {
  year: number;
  data: MonthlySpendingData;
  hasFunds: boolean;
  updateExpensesQuery: (TitledExpensesQuery) => void;
}) {
  const headerCellOnClick = () => {
    updateExpensesQuery({
      title: `${year} :: uncategorized`,
      period: year.toString(),
      selector: { variant: "Uncategorized" },
    });
  };
  const headerCell = (
    <td className="td-button" onClick={headerCellOnClick}>
      <i>uncategorized</i>
    </td>
  );

  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const spend = data.getUncategorizedSpend(month);
    const onClick = () => {
      updateExpensesQuery({
        title: `${month} :: uncategorized`,
        period: month,
        selector: { variant: "Uncategorized" },
      });
    };
    const cell = (
      <SpendingTableCell
        key={month}
        spend={spend}
        limit={0}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  const total = data.getUncategorizedTotal();

  return (
    <tr className="bold highlight">
      {headerCell}
      {cells}
      <SpendingTableCell spend={total} limit={0} onClick={headerCellOnClick} />
      {hasFunds && (
        <SpendingTableCell spend={data.getUncategorizedTotal()} limit={null} />
      )}
    </tr>
  );
}

function SpendingTableRow({
  obj,
  year,
  data,
  hasFunds,
  updateExpensesQuery,
}: {
  obj: BudgetItemView | BudgetCategoryView;
  year: number;
  data: MonthlySpendingData;
  hasFunds: boolean;
  updateExpensesQuery: (TitledExpensesQuery) => void;
}) {
  const isCategory = obj instanceof BudgetCategoryView;

  const headerCellOnClick = () => {
    updateExpensesQuery({
      title: `${year} :: ${obj.displayName}`,
      period: year.toString(),
      selector: {
        variant: isCategory ? "BudgetCategory" : "BudgetItem",
        id: obj.id,
      },
    });
  };
  const headerCell = (
    <td className="v-center td-button" onClick={headerCellOnClick}>
      {!isCategory && <UI.SmallInlineGlyph glyph="chevron_right" />}
      {obj.name}
    </td>
  );

  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const spend = isCategory
      ? data.getCategorySpend(obj.id, month)
      : data.getItemSpend(obj.id, month);
    const onClick = () => {
      updateExpensesQuery({
        title: `${month} :: ${obj.displayName}`,
        period: month,
        selector: {
          variant: isCategory ? "BudgetCategory" : "BudgetItem",
          id: obj.id,
        },
      });
    };
    const cell = (
      <SpendingTableCell
        key={month}
        spend={spend}
        limit={null}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  const totalSpend = isCategory
    ? data.getCategoryTotal(obj.id)
    : data.getItemTotal(obj.id);

  const totalSpendInclFunds = isCategory
    ? data.getCategoryTotalInclFunds(obj.id)
    : data.getItemTotalInclFunds(obj.id);

  return (
    <tr className={isCategory ? "bold highlight" : ""}>
      {headerCell}
      {cells}
      <SpendingTableCell
        spend={totalSpend}
        limit={obj.amountPerYear}
        onClick={headerCellOnClick}
      />
      {hasFunds && (
        <SpendingTableCell spend={totalSpendInclFunds} limit={null} />
      )}
    </tr>
  );
}

export function MonthlySpendingTable({
  data,
  budget,
  updateExpensesQuery,
}: {
  data: MonthlySpendingData;
  budget: BudgetView;
  updateExpensesQuery: (TitledExpensesQuery) => void;
}) {
  const year = budget.year;
  const hasFunds = budget.hasFunds;

  const rows: Array<React.ReactNode> = [];
  for (const category of budget.categories) {
    rows.push(
      <SpendingTableRow
        key={`${category.id}`}
        obj={category}
        year={year}
        data={data}
        hasFunds={hasFunds}
        updateExpensesQuery={updateExpensesQuery}
      />,
    );

    for (const item of category.items) {
      if (item.isBudgetOnly) {
        continue;
      }
      rows.push(
        <SpendingTableRow
          key={`${category.id}-${item.id}`}
          obj={item}
          year={year}
          data={data}
          hasFunds={hasFunds}
          updateExpensesQuery={updateExpensesQuery}
        />,
      );
    }
  }

  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  return (
    <table>
      <SpendingTableColgroup hasFunds={hasFunds} />

      <thead className={useStickyHeaders ? "sticky-header" : undefined}>
        <SpendingTableHeaderRow
          year={year}
          hasFunds={hasFunds}
          updateExpensesQuery={updateExpensesQuery}
        />
      </thead>

      <tbody>
        {rows}
        <SpendingTableUncategorizedRow
          year={year}
          data={data}
          hasFunds={hasFunds}
          updateExpensesQuery={updateExpensesQuery}
        />
      </tbody>

      <tfoot>
        <SpendingTableFooterRow
          year={year}
          data={data}
          hasFunds={hasFunds}
          updateExpensesQuery={updateExpensesQuery}
          yearlyBudget={budget.amountPerYear}
        />
      </tfoot>
    </table>
  );
}

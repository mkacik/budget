import React from "react";

import { ExpensesQuery } from "./generated/types";

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

function SpendingTableColgroup() {
  return (
    <colgroup>
      <UI.Col />
      {Array(14) // 12 months + total + funds = 14 cols
        .fill(0)
        .map((month, idx) => (
          <UI.Col key={idx} widthPct={6} />
        ))}
    </colgroup>
  );
}

function SpendingTableHeaderRow({
  year,
  updateExpensesQuery,
}: {
  year: number;
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
      <th key={month} className="r-align nowrap table-button" onClick={onClick}>
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
      <th className="r-align">+funds</th>
    </tr>
  );
}

function SpendingTableFooterRow({
  year,
  data,
  updateExpensesQuery,
}: {
  year: number;
  data: MonthlySpendingData;
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
    const key = month;
    const cell = (
      <UI.CurrencyCell
        key={key}
        value={data.getMonthTotal(month)}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  return (
    <tr>
      <th>TOTAL</th>
      {cells}
      <UI.CurrencyCell value={data.getTotalSpend()} />
      <UI.CurrencyCell value={data.getTotalSpendInclFunds()} />
    </tr>
  );
}

function SpendingTableUncategorizedRow({
  year,
  data,
  updateExpensesQuery,
}: {
  year: number;
  data: MonthlySpendingData;
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
    <td className="table-button" onClick={headerCellOnClick}>
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
    const key = month;
    const cell = <UI.CurrencyCell key={key} value={spend} onClick={onClick} />;
    cells.push(cell);
  }

  const total = data.getUncategorizedTotal();

  return (
    <tr className="bold highlight">
      {headerCell}
      {cells}
      <UI.CurrencyCell value={total} onClick={headerCellOnClick} />
      <UI.CurrencyCell value={data.getUncategorizedTotal()} />
    </tr>
  );
}

function SpendingTableRow({
  obj,
  year,
  data,
  updateExpensesQuery,
}: {
  obj: BudgetItemView | BudgetCategoryView;
  year: number;
  data: MonthlySpendingData;
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
    <td className="table-button" onClick={headerCellOnClick}>
      <UI.Flex>
        {!isCategory && <UI.Indent />}
        {obj.name}
      </UI.Flex>
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
    const key = month;
    const cell = <UI.CurrencyCell key={key} value={spend} onClick={onClick} />;
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
      <UI.CurrencyCell value={totalSpend} onClick={headerCellOnClick} />
      <UI.CurrencyCell value={totalSpendInclFunds} />
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

  const rows: Array<React.ReactNode> = [];
  for (const category of budget.categories) {
    rows.push(
      <SpendingTableRow
        key={`${category.id}`}
        obj={category}
        year={year}
        data={data}
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
          updateExpensesQuery={updateExpensesQuery}
        />,
      );
    }
  }

  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  return (
    <UI.Table softZeros>
      <SpendingTableColgroup />

      <thead className={UI.cx(useStickyHeaders && "sticky-header")}>
        <SpendingTableHeaderRow
          year={year}
          updateExpensesQuery={updateExpensesQuery}
        />
      </thead>

      <tbody>
        {rows}
        <SpendingTableUncategorizedRow
          year={year}
          data={data}
          updateExpensesQuery={updateExpensesQuery}
        />
      </tbody>

      <tfoot>
        <SpendingTableFooterRow
          year={year}
          data={data}
          updateExpensesQuery={updateExpensesQuery}
        />
      </tfoot>
    </UI.Table>
  );
}

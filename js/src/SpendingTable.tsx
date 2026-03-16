import React from "react";

import { ExpensesQuery } from "./generated/types";

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
      {Array(15)
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
      <th className="r-border">Name</th>
      {cells}
      <th className="r-align l-border">TOTAL</th>
      <th className="r-align">+ funds</th>
      <th className="r-align">BUDGET</th>
    </tr>
  );
}

function SpendingTableFooterRow({
  data,
  budget,
  updateExpensesQuery,
}: {
  data: MonthlySpendingData;
  budget: BudgetView;
  updateExpensesQuery: (TitledExpensesQuery) => void;
}) {
  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(budget.year)) {
    const onClick = () => {
      updateExpensesQuery({
        title: `${month} :: all (excluding expenses in ignored categories)`,
        period: month,
        selector: { variant: "AllNotIgnored" },
      });
    };
    const cell = (
      <UI.CurrencyCell
        key={month}
        value={data.getMonthTotal(month)}
        onClick={onClick}
      />
    );
    cells.push(cell);
  }

  return (
    <tr>
      <td className="r-border">TOTAL</td>
      {cells}
      <UI.CurrencyCell value={data.getTotalSpend()} className="l-border" />
      <UI.CurrencyCell value={data.getTotalSpendInclFunds()} />
      <UI.CurrencyCell value={budget.amountPerYear} />
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
      <td className="table-button r-border" onClick={headerCellOnClick}>
        <i>uncategorized</i>
      </td>
      {cells}
      <UI.CurrencyCell
        value={total}
        onClick={headerCellOnClick}
        className="l-border"
      />
      <UI.CurrencyCell value={data.getUncategorizedTotal()} />
      <UI.CurrencyCell value={0} />
    </tr>
  );
}

function SpendingTableCategoryRow({
  category,
  data,
  updateExpensesQuery,
}: {
  category: BudgetCategoryView;
  data: MonthlySpendingData;
  updateExpensesQuery: (TitledExpensesQuery) => void;
}) {
  const year = category.year;
  const headerCellOnClick = () => {
    updateExpensesQuery({
      title: `${year} :: ${category.name}`,
      period: year.toString(),
      selector: {
        variant: "BudgetCategory",
        id: category.id,
      },
    });
  };

  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const onClick = () => {
      updateExpensesQuery({
        title: `${month} :: ${category.displayName}`,
        period: month,
        selector: {
          variant: "BudgetCategory",
          id: category.id,
        },
      });
    };
    cells.push(
      <UI.CurrencyCell
        key={month}
        value={data.getCategorySpend(category.id, month)}
        onClick={onClick}
      />,
    );
  }

  const totalSpend = data.getCategoryTotal(category.id);
  const totalSpendInclFunds = data.getCategoryTotalInclFunds(category.id);

  return (
    <tr className="bold highlight">
      <td className="table-button r-border" onClick={headerCellOnClick}>
        {category.name}
      </td>
      {cells}
      <UI.CurrencyCell
        value={totalSpend}
        onClick={headerCellOnClick}
        className="l-border"
      />
      <UI.CurrencyCell value={totalSpendInclFunds} />
      <UI.CurrencyCell value={category.amountPerYear} />
    </tr>
  );
}

function SpendingTableItemRow({
  item,
  data,
  updateExpensesQuery,
}: {
  item: BudgetItemView;
  data: MonthlySpendingData;
  updateExpensesQuery: (TitledExpensesQuery) => void;
}) {
  const year = item.year;
  const headerCellOnClick = () => {
    updateExpensesQuery({
      title: `${year} :: ${item.displayName}`,
      period: year.toString(),
      selector: {
        variant: "BudgetItem",
        id: item.id,
      },
    });
  };

  const cells: Array<React.ReactNode> = [];
  for (const month of getMonths(year)) {
    const onClick = () => {
      updateExpensesQuery({
        title: `${month} :: ${item.displayName}`,
        period: month,
        selector: {
          variant: "BudgetItem",
          id: item.id,
        },
      });
    };
    const spend = data.getItemSpend(item.id, month);
    const cell = (
      <UI.CurrencyCell key={month} value={spend} onClick={onClick} />
    );
    cells.push(cell);
  }

  const totalSpend = data.getItemTotal(item.id);
  const totalSpendInclFunds = data.getItemTotalInclFunds(item.id);

  return (
    <tr>
      <td className="table-button r-border" onClick={headerCellOnClick}>
        <UI.Flex>
          <UI.Indent /> {item.name}
        </UI.Flex>
      </td>
      {cells}
      <UI.CurrencyCell
        value={totalSpend}
        onClick={headerCellOnClick}
        className="l-border"
      />
      <UI.CurrencyCell value={totalSpendInclFunds} />
      <UI.CurrencyCell value={item.amountPerYear} />
    </tr>
  );
}

export function SpendingTable({
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
      <SpendingTableCategoryRow
        key={`${category.id}`}
        category={category}
        data={data}
        updateExpensesQuery={updateExpensesQuery}
      />,
    );

    for (const item of category.items) {
      if (item.isBudgetOnly) {
        continue;
      }
      rows.push(
        <SpendingTableItemRow
          key={`${category.id}-${item.id}`}
          item={item}
          data={data}
          updateExpensesQuery={updateExpensesQuery}
        />,
      );
    }
  }

  return (
    <UI.Table fontSize="small" softZeros>
      <SpendingTableColgroup />

      <thead>
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
          data={data}
          budget={budget}
          updateExpensesQuery={updateExpensesQuery}
        />
      </tfoot>
    </UI.Table>
  );
}

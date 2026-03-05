import React from "react";
import { useState, useEffect } from "react";

import {
  Budget,
  BudgetItemWithSpend,
  BudgetFund,
  FundItems,
  ExpensesQuery,
} from "./generated/types";

import { getAmountPerYear, BudgetView } from "./BudgetView";
import { useAppSettingsContext } from "./AppSettings";
import { BudgetFundForm } from "./BudgetFundForm";
import { FetchHelper } from "./Common";
import { FundsView } from "./FundsView";
import { ExpensesList } from "./ExpensesList";
import { TitledExpensesQuery } from "./MonthlySpendingTable";

import * as UI from "./ui/Common";

type ModalState = {
  visible: boolean;
  target: BudgetFund | null;
};

function FundsTable({
  funds,
  items,
  editFund,
  setExpensesQuery,
}: {
  funds: Array<BudgetFund>;
  items: Array<BudgetItemWithSpend>;
  editFund: (fund: BudgetFund | null) => void;
  setExpensesQuery: (query: TitledExpensesQuery) => void;
}) {
  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  const fundsView = new FundsView(funds, items);

  const rows: Array<React.ReactNode> = [];
  for (const fund of fundsView.funds) {
    const row = (
      <tr className="bold highlight" key={`fund:${fund.id}`}>
        <td className="v-center">
          {fund.name}
          <UI.InlineGlyphButton glyph="edit" onClick={() => editFund(fund)} />
        </td>
        <UI.CurrencyCell value={fund.allowance} />
        <UI.CurrencyCell value={fund.spend} />
      </tr>
    );
    rows.push(row);

    const fundItems = fundsView.getItems(fund.id);
    for (const item of fundItems) {
      const displayName = `${item.year} :: ${item.display_name}`;
      const showItemExpenses = () => {
        setExpensesQuery({
          title: displayName,
          period: item.year.toString(),
          selector: { variant: "BudgetItem", id: item.id },
        });
      };
      const row = (
        <tr key={`item:${item.id}`}>
          <td className="v-center">
            <UI.InlineGlyph glyph="chevron_right" />
            {displayName}
          </td>
          <UI.CurrencyCell value={getAmountPerYear(item.allowance)} />
          <UI.CurrencyCell onClick={showItemExpenses} value={item.spend} />
        </tr>
      );
      rows.push(row);
    }
  }

  return (
    <table className="large">
      <thead className={useStickyHeaders ? "sticky-header" : undefined}>
        <tr>
          <th>Name</th>
          <th className="r-align">Allowance</th>
          <th className="r-align">Spend</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

export function FundsPage({
  funds,
  refreshFunds,
}: {
  funds: Array<BudgetFund>;
  refreshFunds: () => void;
}) {
  const [items, setItems] = useState<FundItems | null>(null);
  const [expensesQuery, setExpensesQuery] =
    useState<TitledExpensesQuery | null>(null);
  const [budget, setBudget] = useState<BudgetView | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    target: null,
  });
  const hideModal = () => setModalState({ visible: false, target: null });
  const editFund = (fund: BudgetFund | null) =>
    setModalState({ visible: true, target: fund });

  const fetchHelper = new FetchHelper(setErrorMessage, setLoading);
  const fetchItems = async () => {
    fetchHelper.fetch(new Request("/api/funds/items"), (json) => {
      setItems(json as FundItems);
    });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const updateExpensesQuery = (query: TitledExpensesQuery) => {
    // Period for expenses must match budget, otherwise table will crash trying to get
    // item names from wrong year budget;  Only once correct budget year is fetched
    // update the query to trigger expenses table refresh. Keying ExpenseList with id
    // of year will prevent new budget and lingering data clashing inside ExpensesList
    const year = query.period.slice(0, 4);
    fetchHelper.fetch(new Request(`/api/budget/${year}`), (json) => {
      const budget = new BudgetView(json as Budget);
      setBudget(budget);
      setExpensesQuery(query);
    });
  };

  return (
    <>
      <UI.Section title="Funds">
        <UI.ErrorCard message={errorMessage} />
        <UI.GlyphButton
          glyph="add"
          text="add fund"
          onClick={() => editFund(null)}
        />
        {items && (
          <FundsTable
            funds={funds}
            items={items.items}
            editFund={editFund}
            setExpensesQuery={updateExpensesQuery}
          />
        )}
      </UI.Section>

      {budget && expensesQuery && (
        <UI.Section title={expensesQuery.title}>
          <ExpensesList
            key={expensesQuery.period}
            query={expensesQuery as ExpensesQuery}
            budget={budget}
            onExpenseCategoryChange={fetchItems}
          />
        </UI.Section>
      )}

      <UI.ModalCard
        title={modalState.target !== null ? "Edit Fund" : "Create fund"}
        visible={modalState.visible}
        hideModal={hideModal}
      >
        <BudgetFundForm
          fund={modalState.target}
          onSuccess={() => {
            refreshFunds();
            hideModal();
          }}
        />
      </UI.ModalCard>

      <UI.LoadingBanner isLoading={loading} />
    </>
  );
}

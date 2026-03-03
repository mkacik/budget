import React from "react";
import { useState, useEffect } from "react";

import { BudgetFund, FundItems } from "./types/Fund";
import { BudgetItemWithSpend } from "./types/Budget";

import { getAmountPerYear } from "./BudgetView";
import { useAppSettingsContext } from "./AppSettings";
import { BudgetFundForm } from "./BudgetFundForm";
import { FetchHelper } from "./Common";
import { FundsView } from "./FundsView";

import * as UI from "./ui/Common";

type ModalState = {
  visible: boolean;
  target: BudgetFund | null;
};

export function FundsTable({
  funds,
  items,
  editFund,
}: {
  funds: Array<BudgetFund>;
  items: Array<BudgetItemWithSpend>;
  editFund: (fund: BudgetFund | null) => void;
}) {
  const useStickyHeaders = useAppSettingsContext().stickyHeaders;

  const fundsView = new FundsView(funds, items);

  const rows: Array<React.ReactNode> = [];
  for (const fund of fundsView.funds) {
    const row = (
      <tr className="bold highlight" key={fund.id}>
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
      const row = (
        <tr key={item.id}>
          <td className="v-center">
            <UI.InlineGlyph glyph="chevron_right" />
            {item.year} :: {item.display_name}
          </td>
          <UI.CurrencyCell value={getAmountPerYear(item.allowance)} />
          <UI.CurrencyCell value={item.spend} />
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

  return (
    <UI.Section>
      <UI.SectionHeader>Funds</UI.SectionHeader>
      <UI.ErrorCard message={errorMessage} />
      <UI.GlyphButton
        glyph="add"
        text="add fund"
        onClick={() => editFund(null)}
      />
      {items && (
        <FundsTable funds={funds} items={items.items} editFund={editFund} />
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
    </UI.Section>
  );
}

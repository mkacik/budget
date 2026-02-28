import React from "react";
import { useState, useEffect } from "react";

import { BudgetFund, Funds, FundItems } from "./types/Fund";
import { BudgetFundForm } from "./BudgetFundForm";
import { FetchHelper } from "./Common";

import * as UI from "./ui/Common";

type ModalState = {
  visible: boolean;
  target: BudgetFund | null;
};

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
  const showModal = (fund: BudgetFund | null) => {
    return () => setModalState({ visible: true, target: fund });
  };

  const fetchHelper = new FetchHelper(setErrorMessage, setLoading);
  const fetchItems = async () => {
    console.log("fetching fund items");
    fetchHelper.fetch(new Request(`/api/funds/items`), (json) => {
      setItems(json as FundItems);
    });
  };

  useEffect(() => {
    fetchItems();
  }, []); // subscribe to item changes

  return (
    <UI.Section>
      <UI.SectionHeader>Funds</UI.SectionHeader>
      <UI.GlyphButton glyph="add" text="add fund" onClick={showModal(null)} />
      {funds && JSON.stringify(funds)}
      {items && JSON.stringify(items)}

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

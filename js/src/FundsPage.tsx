import React from "react";
import { useState, useEffect } from "react";

import { BudgetFund, GetAllFundsResponse } from "./types/Fund";
import { BudgetFundForm } from "./BudgetFundForm";
import { FetchHelper } from "./Common";

import * as UI from "./ui/Common";

type FundsView = GetAllFundsResponse;

type ModalState = {
  visible: boolean;
  target: BudgetFund | null;
};

export function FundsPage() {
  const [fundsView, setFundsView] = useState<FundsView | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    target: null,
  });
  const showModal = (fund: BudgetFund | null) => {
    return () => setModalState({ visible: true, target: fund });
  };
  const hideModal = () => setModalState({ visible: false, target: null });

  const fetchFunds = async () => {
    const fetchHelper = new FetchHelper(setErrorMessage, setLoading);
    const request = new Request(`/api/funds`);
    fetchHelper.fetch(request, (json) => {
      setFundsView(json as FundsView);
    });
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  return (
    <UI.Section>
      <UI.SectionHeader>Funds</UI.SectionHeader>
      <UI.GlyphButton glyph="add" text="add fund" onClick={showModal(null)} />
      {fundsView && JSON.stringify(fundsView)}

      <UI.ModalCard
        title={modalState.target !== null ? "Edit Fund" : "Create fund"}
        visible={modalState.visible}
        hideModal={hideModal}
      >
        <BudgetFundForm
          fund={modalState.target}
          onSuccess={() => {
            fetchFunds();
            hideModal();
          }}
        />
      </UI.ModalCard>

      <UI.LoadingBanner isLoading={loading} />
    </UI.Section>
  );
}

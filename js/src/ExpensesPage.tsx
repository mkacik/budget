import React from "react";
import { useState } from "react";

import { AccountView, AccountsView } from "./AccountsView";
import { ExpensesQuery, ExpensesList } from "./ExpensesList";

import { Section, SectionHeader } from "./ui/Common";

function AccountSelector({
  accounts,
  selected,
  updateSelected,
}: {
  accounts: AccountsView;
  selected: AccountView;
  updateSelected: (AccountView) => void;
}) {
  const onSelectChange = (e: React.SyntheticEvent) => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const account = accounts.getAccount(id)!;
    updateSelected(account);
  };

  return (
    <select onChange={onSelectChange} value={selected.id}>
      {accounts.accounts.map((account, idx) => (
        <option key={idx} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}

export function ExpensesPage({ accounts }: { accounts: AccountsView }) {
  const [selectedAccount, setSelectedAccount] = useState<AccountView>(
    accounts.accounts[0] || null,
  );

  const updateSelectedAccount = (account: AccountView) => {
    setSelectedAccount(account);
  };

  if (selectedAccount === null) {
    return <>{"Add accounts to enable imports and start categorizing"}</>;
  }

  const expensesQuery = {
    variant: "account",
    account: selectedAccount,
  } as ExpensesQuery;

  return (
    <>
      <Section>
        <SectionHeader>Expenses</SectionHeader>
        <div className="flexrow">
          Account
          <AccountSelector
            accounts={accounts}
            selected={selectedAccount}
            updateSelected={updateSelectedAccount}
          />
        </div>
      </Section>

      <Section>
        <ExpensesList query={expensesQuery} />
      </Section>
    </>
  );
}

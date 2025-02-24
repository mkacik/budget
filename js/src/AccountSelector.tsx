import React from "react";

import { Account } from "./types/Account";

export function AccountSelector({
  accounts,
  selected,
  updateAccount,
}: {
  accounts: Array<Account>;
  selected: Account;
  updateAccount: (Account) => void;
}) {
  const accountsByID = new Map(
    accounts.map((account) => [account.id, account]),
  );

  const onSelectChange = (e: React.SyntheticEvent) => {
    const elem = e.target as HTMLSelectElement;
    const id = Number(elem.value);
    const newAccount = accountsByID.get(id)!;
    updateAccount(newAccount);
  };

  return (
    <select onChange={onSelectChange} value={selected.id}>
      {accounts.map((account, idx) => (
        <option key={idx} value={account.id}>
          {account.name}
        </option>
      ))}
    </select>
  );
}

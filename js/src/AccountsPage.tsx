import React from "react";

import { AccountsSection } from "./AccountsSection";
import { AccountsView } from "./AccountsView";
import { StatementSchemasSection } from "./StatementSchemasSection";

export function AccountsPage({
  accounts,
  refreshAccounts,
  refreshSchemas,
}: {
  accounts: AccountsView;
  refreshAccounts: () => void;
  refreshSchemas: () => void;
}) {
  return (
    <>
      <AccountsSection accounts={accounts} refreshAccounts={refreshAccounts} />
      <StatementSchemasSection
        schemas={accounts.schemas}
        refreshSchemas={refreshSchemas}
      />
    </>
  );
}

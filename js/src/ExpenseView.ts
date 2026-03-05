import { Expense } from "./generated/types";

import { AccountView } from "./AccountsView";

export interface ExpenseView extends Expense {
  account: AccountView;
}

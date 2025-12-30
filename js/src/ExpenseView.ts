import { Expense } from "./types/Expense";
import { AccountView } from "./AccountsView";

export interface ExpenseView extends Expense {
  account: AccountView;
}

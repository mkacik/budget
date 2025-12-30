import { ExpenseView } from "./ExpenseView";

export enum SortField {
  DateTime,
  Description,
  Amount,
  Account,
  // Category,
}

export enum SortOrder {
  Asc,
  Desc,
}

export type SortBy = {
  field: SortField;
  order: SortOrder;
};

export function getSortComparator(sortBy: SortBy) {
  const sortOrderMultiplier = sortBy.order === SortOrder.Asc ? 1 : -1;

  const stringComparator = (fieldAccessor: (e: ExpenseView) => string) => {
    const collator = new Intl.Collator("en", { sensitivity: "base" });
    return (a: ExpenseView, b: ExpenseView) => {
      const fieldA = fieldAccessor(a);
      const fieldB = fieldAccessor(b);
      return collator.compare(fieldA, fieldB) * sortOrderMultiplier;
    };
  };

  switch (sortBy.field) {
    case SortField.DateTime: {
      const compare = (a: string, b: string) => {
        if (a === b) {
          return 0;
        }
        return (a > b ? 1 : -1) * sortOrderMultiplier;
      };

      return (a: ExpenseView, b: ExpenseView) => {
        const dateA = a.transaction_date;
        const dateB = b.transaction_date;
        if (dateA === dateB) {
          const timeA = a.transaction_time || "";
          const timeB = b.transaction_time || "";
          return compare(timeA, timeB);
        }
        return compare(dateA, dateB);
      };
    }
    case SortField.Description: {
      return stringComparator((e: ExpenseView) => e.description);
    }
    case SortField.Account: {
      return stringComparator((e: ExpenseView) => e.account.name);
    }
    case SortField.Amount:
      return (a: ExpenseView, b: ExpenseView) =>
        (a.amount - b.amount) * sortOrderMultiplier;
    default:
      throw new Error("SortBy not supported");
  }
}

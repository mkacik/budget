import { Expense } from "./types/Expense";

export enum SortField {
  DateTime,
  Description,
  Amount,
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

  const compare = (...args: [string, string] | [number, number]) => {
    const [fieldA, fieldB] = args;
    if (fieldA === fieldB) {
      return 0;
    }
    return (fieldA > fieldB ? 1 : -1) * sortOrderMultiplier;
  };

  const simpleComparator =
    (fieldAccessor: (e: Expense) => string | number) =>
    (a: Expense, b: Expense) => {
      const fieldA = fieldAccessor(a);
      const fieldB = fieldAccessor(b);

      if (fieldA === fieldB) {
        return 0;
      }
      return (fieldA > fieldB ? 1 : -1) * sortOrderMultiplier;
    };

  switch (sortBy.field) {
    case SortField.DateTime:
      return (a: Expense, b: Expense) => {
        const dateA = a.transaction_date;
        const dateB = b.transaction_date;
        if (dateA === dateB) {
          const timeA = a.transaction_time || "";
          const timeB = b.transaction_time || "";
          return compare(timeA, timeB);
        }
        return compare(dateA, dateB);
      };
    case SortField.Description: {
      const collator = new Intl.Collator("en", { sensitivity: "base" });
      return (a: Expense, b: Expense) => {
        return (
          collator.compare(a.description, b.description) * sortOrderMultiplier
        );
      };
    }
    case SortField.Amount:
      return simpleComparator((e: Expense) => e.amount);
    default:
      throw new Error("SortBy not supported");
  }
}

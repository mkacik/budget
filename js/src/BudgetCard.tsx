import React from "react";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";

function BudgetItemCard({ item }: { item: BudgetItemView }) {
  return (
    <div>
      {item.name} - {item.amountPerYear}
    </div>
  );
}

function BudgetCategoryCard({ category }: { category: BudgetCategoryView }) {
  return (
    <div>
      <div>
        <b>
          {category.name} - {category.amountPerYear}
        </b>
      </div>
      {category.items.map((item, index) => (
        <BudgetItemCard key={index} item={item} />
      ))}
    </div>
  );
}

export function BudgetCard({ budget }: { budget: BudgetView }) {
  return (
    <div>
      <div>Total - {budget.amountPerYear}</div>
      <div>
        {budget.categories.map((category, index) => (
          <BudgetCategoryCard key={index} category={category} />
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { useState } from "react";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";

import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { ModalCard } from "./CommonUI";

function BudgetItemCard({ item }: { item: BudgetItemView }) {
  return (
    <div>
      {item.name} - {item.amountPerYear}
    </div>
  );
}

function BudgetCategoryCard({
  category,
  editCategory,
  children,
}: {
  category: BudgetCategoryView;
  editCategory: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div>
        <b>
          {category.name} - {category.amountPerYear}
        </b>
        <span onClick={editCategory}>[edit]</span>
      </div>
      {children}
    </div>
  );
}

enum ModalMode {
  CATEGORY,
  ITEM,
  HIDDEN,
}

export function BudgetCard({
  budget,
  refreshBudget,
}: {
  budget: BudgetView;
  refreshBudget: () => void;
}) {
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.HIDDEN);
  const [editedCategory, setEditedCategory] =
    useState<BudgetCategoryView | null>(null);
  const [editedItem, setEditedItem] = useState<BudgetItemView | null>(null);

  const editCategory = (category: BudgetCategoryView | null) => {
    setEditedCategory(category);
    setModalMode(ModalMode.CATEGORY);
  };

  const editItem = (item: BudgetItemView | null) => {
    setEditedItem(item);
    setModalMode(ModalMode.ITEM);
  };

  const closeModal = () => {
    setModalMode(ModalMode.HIDDEN);
  };

  let modalContent: React.ReactNode = null;
  switch (modalMode) {
    case ModalMode.CATEGORY: {
      modalContent = (
        <BudgetCategoryForm
          key={editedCategory?.name}
          budgetCategory={editedCategory?.category ?? null}
          hideEditForm={closeModal}
          refreshBudget={refreshBudget}
        />
      );
      break;
    }
    case ModalMode.ITEM: {
      modalContent = "TBD";
      break;
    }
    default:
      break;
  }

  return (
    <div>
      <div>Total - {budget.amountPerYear}</div>
      <div>
        {budget.categories.map((category, index) => (
          <BudgetCategoryCard
            key={index}
            editCategory={() => editCategory(category)}
            category={category}
          >
            {category.items.map((item, index) => (
              <BudgetItemCard key={index} item={item} />
            ))}
          </BudgetCategoryCard>
        ))}
      </div>
      <div>
        <span onClick={() => editCategory(null)}>[add new category]</span>
      </div>
      <div>
        <span>[add new item]</span>
      </div>
      <ModalCard visible={modalMode != ModalMode.HIDDEN}>
        {modalContent}
      </ModalCard>
    </div>
  );
}

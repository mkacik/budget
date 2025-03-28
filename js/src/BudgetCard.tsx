import React from "react";
import { useState } from "react";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";

import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { BudgetItemForm } from "./BudgetItemForm";
import {
  GlyphButton,
  InlineGlyph,
  InlineGlyphButton,
  ModalCard,
  SectionHeader,
} from "./ui/Common";

function BudgetItemRow({
  item,
  editItem,
  skipAmounts,
}: {
  item: BudgetItemView;
  editItem: () => void;
  skipAmounts?: boolean;
}) {
  const amounts = skipAmounts ? null : (
    <>
      <td className="number align-right">
        {(item.amountPerYear / 12).toFixed(2)}
      </td>
      <td className="number align-right">{item.amountPerYear.toFixed(2)}</td>
    </>
  );

  return (
    <tr>
      <td className="row-name">
        <InlineGlyph glyph="chevron_right" />
        {item.name}
        <InlineGlyphButton glyph="edit" onClick={editItem} />
      </td>
      {amounts}
    </tr>
  );
}

function BudgetCategoryRow({
  category,
  editCategory,
  skipAmounts,
}: {
  category: BudgetCategoryView;
  editCategory: () => void;
  skipAmounts?: boolean;
}) {
  const amounts = skipAmounts ? null : (
    <>
      <td className="number align-right">
        {(category.amountPerYear / 12).toFixed(2)}
      </td>
      <td className="number align-right">
        {category.amountPerYear.toFixed(2)}
      </td>
    </>
  );

  return (
    <tr className="row-group-header">
      <td className="row-name">
        {category.name}
        <InlineGlyphButton glyph="edit" onClick={editCategory} />
      </td>
      {amounts}
    </tr>
  );
}

export function BudgetTable({
  amountPerYear,
  children,
}: {
  amountPerYear?: number;
  children: React.ReactNode;
}) {
  let header: React.ReactNode = null;
  let footer: React.ReactNode = null;

  if (amountPerYear !== undefined && amountPerYear !== null) {
    header = (
      <tr>
        <th>Name</th>
        <th className="align-right">Amortized monthly</th>
        <th className="align-right">Amortized yearly</th>
      </tr>
    );
    footer = <BudgetTableFooter amountPerYear={amountPerYear} />;
  } else {
    header = (
      <tr>
        <th>Name</th>
      </tr>
    );
  }

  return (
    <table className="budget-table">
      <thead>{header}</thead>
      <tbody>{children}</tbody>
      <tfoot>{footer}</tfoot>
    </table>
  );
}

export function BudgetTableFooter({
  amountPerYear,
}: {
  amountPerYear: number;
}) {
  return (
    <tr className="row-group-header">
      <td className="row-name">TOTAL</td>
      <td className="number align-right">{(amountPerYear / 12).toFixed(2)}</td>
      <td className="number align-right">{amountPerYear.toFixed(2)}</td>
    </tr>
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
  // Note: need this enum, because null value of edited object could represent either new item
  // or new category;
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

  const onEditSuccess = () => {
    refreshBudget();
    setModalMode(ModalMode.HIDDEN);
  };

  let modalTitle: string = "";
  let modalContent: React.ReactNode = null;
  switch (modalMode) {
    case ModalMode.CATEGORY: {
      modalTitle =
        editedCategory === null
          ? "New Budget Category"
          : "Edit Budget Category";
      modalContent = (
        <BudgetCategoryForm
          key={editedCategory?.name}
          budgetCategory={editedCategory?.category ?? null}
          onSuccess={onEditSuccess}
        />
      );
      break;
    }
    case ModalMode.ITEM: {
      modalTitle = editedItem === null ? "New Budget Item" : "Edit Budget Item";
      modalContent = (
        <BudgetItemForm
          key={editedItem?.name}
          budgetItem={editedItem?.item ?? null}
          onSuccess={onEditSuccess}
          allCategories={budget.categories}
        />
      );
      break;
    }
    default:
      break;
  }

  const includedCategories = budget.categories.filter(
    (category) => !category.ignored,
  );
  const excludedCategories = budget.categories.filter(
    (category) => category.ignored,
  );

  let budgetRows: Array<React.ReactElement> = [];
  for (let category of includedCategories) {
    budgetRows.push(
      <BudgetCategoryRow
        key={category.name}
        editCategory={() => editCategory(category)}
        category={category}
      />,
    );

    for (let item of category.items) {
      budgetRows.push(
        <BudgetItemRow
          key={item.name}
          item={item}
          editItem={() => editItem(item)}
        />,
      );
    }
  }

  let ignoredRows: Array<React.ReactElement> = [];
  for (let category of excludedCategories) {
    ignoredRows.push(
      <BudgetCategoryRow
        key={category.name}
        editCategory={() => editCategory(category)}
        category={category}
        skipAmounts={true}
      />,
    );

    for (let item of category.items) {
      ignoredRows.push(
        <BudgetItemRow
          key={item.name}
          item={item}
          editItem={() => editItem(item)}
          skipAmounts={true}
        />,
      );
    }
  }

  const maybeAddNewItemButton =
    budget.categories.length > 0 ? (
      <GlyphButton glyph="add" text="add item" onClick={() => editItem(null)} />
    ) : null;

  return (
    <>
      <SectionHeader>Budget</SectionHeader>

      <BudgetTable amountPerYear={budget.amountPerYear}>
        {budgetRows}
      </BudgetTable>

      <span>
        <SectionHeader>Ignored categories</SectionHeader>
        <p>
          Items from ignored categories can be used to exclude x-account moves.
        </p>

        <BudgetTable>{ignoredRows}</BudgetTable>
      </span>

      <div>
        <GlyphButton
          glyph="add"
          text="add category"
          onClick={() => editCategory(null)}
        />
        {maybeAddNewItemButton}
      </div>

      <ModalCard
        title={modalTitle}
        visible={modalMode !== ModalMode.HIDDEN}
        hideModal={() => setModalMode(ModalMode.HIDDEN)}
      >
        {modalContent}
      </ModalCard>
    </>
  );
}

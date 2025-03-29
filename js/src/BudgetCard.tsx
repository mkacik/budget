import React from "react";
import { useState } from "react";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";

import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { BudgetItemForm } from "./BudgetItemForm";
import { BudgetChart } from "./BudgetChart";
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
  CHART,
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

  const showChart = () => {
    setModalMode(ModalMode.CHART);
  };

  const onEditSuccess = () => {
    refreshBudget();
    setModalMode(ModalMode.HIDDEN);
  };

  const budgetRows: Array<React.ReactElement> = [];
  for (const category of budget.categories) {
    budgetRows.push(
      <BudgetCategoryRow
        key={category.name}
        editCategory={() => editCategory(category)}
        category={category}
      />,
    );

    for (const item of category.items) {
      budgetRows.push(
        <BudgetItemRow
          key={item.name}
          item={item}
          editItem={() => editItem(item)}
        />,
      );
    }
  }

  const ignoredRows: Array<React.ReactElement> = [];
  for (const category of budget.ignoredCategories) {
    ignoredRows.push(
      <BudgetCategoryRow
        key={category.name}
        editCategory={() => editCategory(category)}
        category={category}
        skipAmounts={true}
      />,
    );

    for (const item of category.items) {
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
          budget={budget}
        />
      );
      break;
    }
    case ModalMode.CHART: {
      modalTitle = "Budget";
      modalContent = <BudgetChart categories={budget.categories} />;
      break;
    }
    default:
      break;
  }

  const maybeAddNewItemButton =
    budget.categories.length > 0 ? (
      <GlyphButton glyph="add" text="add item" onClick={() => editItem(null)} />
    ) : null;

  return (
    <>
      <SectionHeader>
        Budget
        <InlineGlyphButton glyph="pie_chart" onClick={showChart} />
      </SectionHeader>

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

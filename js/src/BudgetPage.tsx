import React from "react";
import { useState } from "react";

import { BudgetView, BudgetCategoryView, BudgetItemView } from "./BudgetView";

import { BudgetCloneForm } from "./BudgetCloneForm";
import { BudgetCategoryForm } from "./BudgetCategoryForm";
import { BudgetItemForm } from "./BudgetItemForm";
import {
  BudgetPageSettings,
  BudgetPageSettingsForm,
} from "./BudgetPageSettings";
import {
  GlyphButton,
  InlineGlyph,
  InlineGlyphButton,
  ModalCard,
  Pill,
  Section,
  SectionHeader,
} from "./ui/Common";

function BudgetItemRow({
  item,
  editItem,
  skipAmountColumns,
}: {
  item: BudgetItemView;
  editItem: () => void;
  skipAmountColumns?: boolean;
}) {
  const amounts = item.isCategorizationOnly ? (
    <>
      <td className="r-align soft">—</td>
      <td className="r-align soft">—</td>
    </>
  ) : (
    <>
      <td className="number r-align">{(item.amountPerYear / 12).toFixed(2)}</td>
      <td className="number r-align">{item.amountPerYear.toFixed(2)}</td>
    </>
  );

  const showAmountColumns = !skipAmountColumns;
  return (
    <tr>
      <td className="v-center">
        <InlineGlyph glyph="chevron_right" />
        {item.name}
        {item.isBudgetOnly && <Pill>hidden in categorization</Pill>}
        {item.isCategorizationOnly && <Pill>categorization only</Pill>}
        <InlineGlyphButton glyph="edit" onClick={editItem} />
      </td>
      {showAmountColumns && amounts}
    </tr>
  );
}

function BudgetCategoryRow({
  category,
  editCategory,
  skipAmountColumns,
}: {
  category: BudgetCategoryView;
  editCategory: () => void;
  skipAmountColumns?: boolean;
}) {
  const amounts = skipAmountColumns ? null : (
    <>
      <td className="number r-align">
        {(category.amountPerYear / 12).toFixed(2)}
      </td>
      <td className="number r-align">{category.amountPerYear.toFixed(2)}</td>
    </>
  );

  return (
    <tr className="bold highlight">
      <td className="v-center">
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
        <th className="r-align">Amortized monthly</th>
        <th className="r-align">Amortized yearly</th>
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
    <table className="large">
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
    <tr className="bold">
      <td>TOTAL</td>
      <td className="number r-align">{(amountPerYear / 12).toFixed(2)}</td>
      <td className="number r-align">{amountPerYear.toFixed(2)}</td>
    </tr>
  );
}

const DEFAULT_SETTINGS = {
  showSettings: false,
  showCategorizationOnlyItems: true,
} as BudgetPageSettings;

enum ModalMode {
  CATEGORY,
  ITEM,
  CLONE,
  HIDDEN,
}

export function BudgetPage({
  budget,
  refreshBudget,
  setYear,
}: {
  budget: BudgetView;
  refreshBudget: () => void;
  setYear: (number) => void; // after cloning
}) {
  const [settings, setSettings] =
    useState<BudgetPageSettings>(DEFAULT_SETTINGS);

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

  const toggleSettings = () => {
    setSettings({ ...settings, showSettings: !settings.showSettings });
  };

  const onEditSuccess = () => {
    refreshBudget();
    setModalMode(ModalMode.HIDDEN);
  };

  const budgetRows: Array<React.ReactElement> = [];
  for (const category of budget.categories) {
    budgetRows.push(
      <BudgetCategoryRow
        key={category.id}
        editCategory={() => editCategory(category)}
        category={category}
      />,
    );

    for (const item of category.items) {
      if (!settings.showCategorizationOnlyItems && item.isCategorizationOnly) {
        continue;
      }
      budgetRows.push(
        <BudgetItemRow
          key={`${category.id}-${item.id}`}
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
        skipAmountColumns={true}
      />,
    );

    for (const item of category.items) {
      ignoredRows.push(
        <BudgetItemRow
          key={item.name}
          item={item}
          editItem={() => editItem(item)}
          skipAmountColumns={true}
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
    case ModalMode.CLONE: {
      modalTitle = `Clone ${budget.year} to an empty year`;
      modalContent = (
        <BudgetCloneForm
          fromYear={budget.year}
          onSuccess={(year) => {
            setModalMode(ModalMode.HIDDEN);
            setYear(year);
          }}
        />
      );
      break;
    }
    default:
      break;
  }

  const hasAnyCategories = budget.categories.length > 0;

  return (
    <>
      <Section>
        <SectionHeader>Budget</SectionHeader>

        <Section>
          <div className="flexrow">
            <GlyphButton
              glyph="add"
              text="add category"
              onClick={() => editCategory(null)}
            />
            {hasAnyCategories && (
              <>
                <GlyphButton
                  glyph="add"
                  text="add item"
                  onClick={() => editItem(null)}
                />
                <GlyphButton
                  glyph="file_copy"
                  text="clone to empty year"
                  onClick={() => setModalMode(ModalMode.CLONE)}
                />
              </>
            )}
            <GlyphButton glyph="settings" onClick={toggleSettings} />
          </div>
        </Section>

        {settings.showSettings && (
          <BudgetPageSettingsForm
            settings={settings}
            updateSettings={setSettings}
          />
        )}

        <BudgetTable amountPerYear={budget.amountPerYear}>
          {budgetRows}
        </BudgetTable>
      </Section>

      <Section>
        <SectionHeader>Ignored categories</SectionHeader>
        <span>
          Items from ignored categories can be used to exclude x-account moves.
        </span>

        <BudgetTable>{ignoredRows}</BudgetTable>
      </Section>

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

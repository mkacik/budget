import React from "react";

import { Chart } from "react-google-charts";

import { BudgetCategoryView } from "./BudgetView";

export function BudgetChart({
  categories,
}: {
  categories: Array<BudgetCategoryView>;
}) {
  const data: Array<Array<number | string>> = [["Category", "Yearly budget"]];

  for (const category of categories) {
    data.push([category.name, category.amountPerYear]);
  }

  const options = {
    title: "Yearly budgeted amounts per category",
    legend: {
      position: "bottom",
      alignment: "center",
    },
    backgroundColor: "#f9f9fb",
    chartArea: { left: "10%", top: "10%", width: "80%", height: "75%" },
  };

  return (
    <Chart
      chartType="PieChart"
      width="100%"
      height="100%"
      data={data}
      options={options}
    />
  );
}

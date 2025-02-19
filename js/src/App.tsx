import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Budget } from "./types/Budget";

function App() {
  const [budget, setBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (budget === null) {
      fetch("/api/budget")
        .then((response) => response.json())
        .then((result) => {
          setBudget(result as Budget);
        });
    }
  }, [budget, setBudget]);

  return (
    <div>
      <div>Budget</div>
      <div>{budget?.items.length}</div>
    </div>
  );
}

const domContainer = document.querySelector("#root")!;
const root = createRoot(domContainer);
root.render(<App />);

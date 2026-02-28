"use client";

import { createContext, useContext, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface CompanyFilterContextType {
  selectedCompanyId: Id<"companies"> | null;
  setSelectedCompanyId: (id: Id<"companies"> | null) => void;
}

export const CompanyFilterContext = createContext<CompanyFilterContextType>({
  selectedCompanyId: null,
  setSelectedCompanyId: () => {},
});

export function useCompanyFilter() {
  return useContext(CompanyFilterContext);
}

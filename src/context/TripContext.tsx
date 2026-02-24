import React, { createContext, useContext } from "react";
import { useTripStore } from "@/hooks/useTripStore";

type TripContextType = ReturnType<typeof useTripStore>;

const TripContext = createContext<TripContextType | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const store = useTripStore();
  return <TripContext.Provider value={store}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
}

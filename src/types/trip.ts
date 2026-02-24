export interface Trip {
  id: string;
  name: string;
  currency: string;
  fundManagerId?: string;
  members: Member[];
  transactions: Transaction[];
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
}

export const CATEGORIES = ["Food", "Transport", "Accommodation", "Misc"] as const;
export type Category = typeof CATEGORIES[number];

export const SUBCATEGORIES: Record<Category, string[]> = {
  Food: ["Breakfast", "Lunch", "Dinner", "Snacks", "Drinks"],
  Transport: ["Taxi", "Bus", "Fuel", "Parking", "Flight", "Train"],
  Accommodation: ["Hotel", "Airbnb", "Hostel", "Resort"],
  Misc: ["Shopping", "Activities", "Tips", "Tickets", "Other"],
};

export interface Transaction {
  id: string;
  type: "deposit" | "expense";
  amount: number;
  date: string;
  note: string;
  memberId?: string; // for deposits
  category?: Category; // for expenses
  subcategory?: string; // for expenses
  splits?: ExpenseSplit[]; // for expenses
}

export interface ExpenseSplit {
  memberId: string;
  shareAmount: number;
}

export interface Settlement {
  fromId: string;
  toId: string;
  amount: number;
  completed: boolean;
}

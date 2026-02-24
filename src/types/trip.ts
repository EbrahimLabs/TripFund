export interface Trip {
  id: string;
  name: string;
  currency: string;
  members: Member[];
  transactions: Transaction[];
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  type: "deposit" | "expense";
  amount: number;
  date: string;
  note: string;
  memberId?: string; // for deposits
  category?: "Food" | "Transport" | "Accommodation" | "Misc"; // for expenses
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

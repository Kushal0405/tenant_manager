// Placeholder data used to preview the dashboard UI until the schema
// proposal is approved and these pages are wired to the backend.

export type PropertyRole = "Owner" | "Manager";

export interface MockProperty {
  id: string;
  name: string;
  city: string;
  state: string;
  role: PropertyRole;
  floors: number;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRent: number;
  pendingSettlement: number;
  remindersPending: number;
  gradient: string;
}

export interface MockLessee {
  id: string;
  name: string;
  initials: string;
  propertyName: string;
  unitLabel: string;
  status: "active" | "vacated";
  monthlyRent: number | null;
  avatarGradient: string;
}

export interface MockTransaction {
  id: string;
  title: string;
  meta: string;
  type: "credit" | "debit";
  amount: number;
}

export const mockProperties: MockProperty[] = [
  {
    id: "green-valley",
    name: "Green Valley Apartment",
    city: "Pune",
    state: "Maharashtra",
    role: "Owner",
    floors: 5,
    totalUnits: 8,
    occupiedUnits: 6,
    monthlyRent: 185000,
    pendingSettlement: 23000,
    remindersPending: 2,
    gradient: "linear-gradient(135deg,#C7D2FE,#8B7CF6)",
  },
  {
    id: "dlf-phase-3",
    name: "DLF Phase 3 Villa",
    city: "Gurgaon",
    state: "Haryana",
    role: "Manager",
    floors: 1,
    totalUnits: 2,
    occupiedUnits: 2,
    monthlyRent: 45000,
    pendingSettlement: 0,
    remindersPending: 0,
    gradient: "linear-gradient(135deg,#FDE68A,#F59E0B)",
  },
  {
    id: "coral-woods",
    name: "Coral Woods",
    city: "Bhopal",
    state: "Madhya Pradesh",
    role: "Owner",
    floors: 1,
    totalUnits: 2,
    occupiedUnits: 0,
    monthlyRent: 0,
    pendingSettlement: 0,
    remindersPending: 0,
    gradient: "linear-gradient(135deg,#BBF7D0,#34D399)",
  },
];

export const mockLessees: MockLessee[] = [
  {
    id: "rohan-mehta",
    name: "Rohan Mehta",
    initials: "RM",
    propertyName: "Green Valley Apartment",
    unitLabel: "Unit 201",
    status: "active",
    monthlyRent: 23000,
    avatarGradient: "linear-gradient(135deg,#8B7CF6,#6D28D9)",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    initials: "PN",
    propertyName: "Green Valley Apartment",
    unitLabel: "Unit 304",
    status: "active",
    monthlyRent: 23000,
    avatarGradient: "linear-gradient(135deg,#34D399,#059669)",
  },
  {
    id: "amit-kumar",
    name: "Amit Kumar",
    initials: "AK",
    propertyName: "DLF Phase 3 Villa",
    unitLabel: "Unit 1",
    status: "active",
    monthlyRent: 45000,
    avatarGradient: "linear-gradient(135deg,#F59E0B,#B45309)",
  },
  {
    id: "sunita-gupta",
    name: "Sunita Gupta",
    initials: "SG",
    propertyName: "Coral Woods",
    unitLabel: "Unit 2",
    status: "vacated",
    monthlyRent: null,
    avatarGradient: "linear-gradient(135deg,#94A3B8,#64748B)",
  },
];

export const mockTransactions: MockTransaction[] = [
  {
    id: "t1",
    title: "Unit 1 paid rent",
    meta: "Coral Woods · 7 Jul, 11:30 AM",
    type: "credit",
    amount: 25000,
  },
  {
    id: "t2",
    title: "Electricity bill paid",
    meta: "Coral Woods, Unit 1 · 8 Jul, 4:20 PM",
    type: "debit",
    amount: 1250,
  },
  {
    id: "t3",
    title: "Unit 304 paid rent",
    meta: "Green Valley · 5 Jul, 9:05 AM",
    type: "credit",
    amount: 23000,
  },
  {
    id: "t4",
    title: "Property maintenance",
    meta: "DLF Phase 3 Villa · 3 Jul, 2:10 PM",
    type: "debit",
    amount: 3200,
  },
];

export const mockPortfolioSummary = {
  expectedRent: 230000,
  received: 153000,
  pending: 77000,
  billsDue: 15800,
};

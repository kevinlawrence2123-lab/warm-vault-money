import {
  Banknote,
  Briefcase,
  Car,
  CreditCard,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  PlusCircle,
  Repeat,
  ShoppingBag,
  Smartphone,
  Tag,
  Target,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  "gamepad-2": Gamepad2,
  "heart-pulse": HeartPulse,
  repeat: Repeat,
  tag: Tag,
  briefcase: Briefcase,
  "plus-circle": PlusCircle,
  "shopping-bag": ShoppingBag,
  plane: Plane,
  "graduation-cap": GraduationCap,
  laptop: Laptop,
  smartphone: Smartphone,
  landmark: Landmark,
  wallet: Wallet,
  banknote: Banknote,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  target: Target,
};

export const ICON_CHOICES = Object.keys(ICON_MAP);

export const GOAL_ICON_CHOICES = [
  "target",
  "plane",
  "car",
  "home",
  "graduation-cap",
  "laptop",
  "smartphone",
  "piggy-bank",
  "shopping-bag",
];

export function iconFor(name?: string | null): LucideIcon {
  return ICON_MAP[name ?? "tag"] ?? Tag;
}

export const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank", icon: "landmark" },
  { value: "cash", label: "Cash", icon: "banknote" },
  { value: "mobile_money", label: "Mobile money", icon: "smartphone" },
  { value: "savings", label: "Savings", icon: "piggy-bank" },
];

export const PAYMENT_METHODS = [
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "mobile_money", label: "Mobile money" },
];

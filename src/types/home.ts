import type { MealType, Menu } from '@/hooks/useMeals';

export type DashboardMeal = {
  meal: Menu[];
  type: MealType;
  date: Date;
} | null;

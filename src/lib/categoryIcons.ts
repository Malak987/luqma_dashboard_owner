import {
  Beef,
  Coffee,
  Egg,
  Fish,
  IceCream,
  Pizza,
  Salad,
  Sandwich,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryIcon } from '../data/types';

export const categoryIconMap: Record<CategoryIcon, LucideIcon> = {
  grill: Beef,
  pizza: Pizza,
  seafood: Fish,
  dessert: IceCream,
  drinks: Coffee,
  breakfast: Egg,
  sandwich: Sandwich,
  salad: Salad,
};

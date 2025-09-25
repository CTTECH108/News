import { Button } from "@/components/ui/button";
import { NEWS_CATEGORIES } from "@/types/news";
import { cn } from "@/lib/utils";
import { 
  Globe, 
  Trophy, 
  Landmark, 
  Cpu, 
  Film, 
  TrendingUp, 
  Heart 
} from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const iconMap = {
  globe: Globe,
  'football-ball': Trophy,
  landmark: Landmark,
  microchip: Cpu,
  film: Film,
  'chart-line': TrendingUp,
  heartbeat: Heart,
};

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center mb-8" data-testid="category-filter">
      {NEWS_CATEGORIES.map((category) => {
        const Icon = iconMap[category.icon as keyof typeof iconMap] || Globe;
        const isActive = selectedCategory === category.id;
        
        return (
          <Button
            key={category.id}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "category-pill flex items-center space-x-2",
              isActive && "bg-primary text-primary-foreground"
            )}
            onClick={() => onCategoryChange(category.id)}
            data-testid={`category-${category.id}`}
          >
            <Icon size={16} />
            <span>{category.name}</span>
          </Button>
        );
      })}
    </div>
  );
}

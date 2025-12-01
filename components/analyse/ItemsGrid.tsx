import { Item } from "@/lib/analyse/types";
import ItemCard from "./ItemCard";

export default function ItemsGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {items.map(item => (
        <ItemCard key={item.name + item.type} item={item} />
      ))}
    </div>
  );
}

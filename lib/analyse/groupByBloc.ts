import { Item } from "./types";

export function groupByBloc(items: Item[]) {
  return items.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.bloc]) acc[item.bloc] = [];
    acc[item.bloc].push(item);
    return acc;
  }, {});
}

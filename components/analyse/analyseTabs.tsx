import BlocTabs from "@/components/analyse/BlocTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Item } from "@/lib/analyse/types";

export default function AnalyseTabs({ items }: { items: Item[] }) {
  const types = [
    "ETB",
    "Display",
    "Demi-Display",
    "Tri-Pack",
    "UPC",
    "Artset",
    "Bundle",
  ];

  const tabs = types.map((t) => ({
    label: t,
    data: items.filter((i) => i.type === t),
  }));

  return (
    <Tabs defaultValue={tabs[0].label}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.label} value={tab.label}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label}>
          <BlocTabs items={tab.data} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

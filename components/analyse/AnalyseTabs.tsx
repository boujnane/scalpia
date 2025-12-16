"use client";

import BlocTabs from "@/components/analyse/BlocTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useIsMobile } from "@/lib/utils";
import { Item } from "@/lib/analyse/types";

export default function AnalyseTabs({ items }: { items: Item[] }) {
  const isMobile = useIsMobile();

  const types = [
    "ETB",
    "Display",
    "Demi-Display",
    "Tri-Pack",
    "UPC",
    "Artset",
    "Bundle",
    "Coffret Collection Poster"
  ];

  const tabs = types.map((t) => ({
    label: t,
    data: items.filter((i) => i.type === t),
  }));

  if (isMobile) {
    // Composant pour mobile : accordéon (Applique les styles Shadcn par défaut qui utilisent le thème)
    return (
      <Accordion type="multiple" className="space-y-2 w-full">
        {tabs.map((tab) => (
          <AccordionItem key={tab.label} value={tab.label}>
            <AccordionTrigger>{tab.label}</AccordionTrigger>
            <AccordionContent>
              <BlocTabs items={tab.data} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  // Composant pour desktop : tabs classiques (Applique les styles Shadcn par défaut qui utilisent le thème)
  return (
    <Tabs defaultValue={tabs[0].label}>
      {/* Utilisation de bg-muted/50 pour le conteneur des tabs */}
      <TabsList className="overflow-x-auto flex-nowrap gap-2 scrollbar-none bg-muted/50 rounded-lg">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.label}
            value={tab.label}
            className="
              px-3 py-1.5 text-sm md:text-base flex-shrink-0
              data-[state=active]:bg-background data-[state=active]:shadow-md
            "
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.label}
          value={tab.label}
          className="w-full max-w-full overflow-x-auto pt-4"
        >
          <BlocTabs items={tab.data} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
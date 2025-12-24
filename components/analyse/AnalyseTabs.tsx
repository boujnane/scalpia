"use client";

import { useMemo } from "react";
import BlocTabs from "@/components/analyse/BlocTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useIsMobile } from "@/lib/utils";
import type { Item } from "@/lib/analyse/types";
import { Badge } from "@/components/ui/badge";

export default function AnalyseTabs({ items }: { items: Item[] }) {
  const isMobile = useIsMobile();

  const types = useMemo(
    () => [
      "ETB",
      "Display",
      "Demi-Display",
      "Tri-Pack",
      "UPC",
      "Artset",
      "Bundle",
      "Coffret Collection Poster",
    ],
    []
  );

  // Indexation par type (perf)
  const itemsByType = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const t of types) map[t] = [];
    for (const it of items) {
      if (!it?.type) continue;
      if (!map[it.type]) map[it.type] = [];
      map[it.type].push(it);
    }
    return map;
  }, [items, types]);

  const tabs = useMemo(() => {
    return types.map((t) => ({
      label: t,
      data: itemsByType[t] ?? [],
      count: (itemsByType[t] ?? []).length,
    }));
  }, [itemsByType, types]);

  const defaultTab = useMemo(() => {
    const firstNonEmpty = tabs.find((t) => t.count > 0);
    return (firstNonEmpty ?? tabs[0])?.label;
  }, [tabs]);

  if (isMobile) {
    return (
      <Accordion type="multiple" className="space-y-2 w-full">
        {tabs.map((tab) => (
          <AccordionItem key={tab.label} value={tab.label} className="border-border/60 rounded-xl bg-card">
            <AccordionTrigger className="px-3">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-semibold">{tab.label}</span>
                <Badge variant="secondary" className="ml-2 tabular-nums">
                  {tab.count}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-3">
              {tab.count > 0 ? (
                <BlocTabs items={tab.data} />
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Aucun item pour ce type.
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="overflow-x-auto flex-nowrap gap-2 scrollbar-none bg-muted/50 rounded-xl">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.label}
            value={tab.label}
            className="px-3 py-1.5 text-sm md:text-base flex-shrink-0 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <span className="mr-2">{tab.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              ({tab.count})
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label} className="w-full max-w-full overflow-x-auto pt-4">
          {tab.count > 0 ? (
            <BlocTabs items={tab.data} />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Aucun item pour ce type.
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

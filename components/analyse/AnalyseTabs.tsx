"use client";

import { useMemo, useState } from "react";
import BlocTabs from "@/components/analyse/BlocTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/lib/utils";
import type { Item } from "@/lib/analyse/types";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AnalyseTabs({ items }: { items: Item[] }) {
  // Breakpoint à 768px pour inclure tablettes
  const isMobile = useIsMobile(768);

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

  const [selectedType, setSelectedType] = useState(defaultTab);

  const selectedTab = useMemo(() => {
    return tabs.find((t) => t.label === selectedType) ?? tabs[0];
  }, [tabs, selectedType]);

  // Version mobile avec Select dropdown
  if (isMobile) {
    return (
      <div className="space-y-4 w-full">
        {/* Select dropdown pour choisir le type */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full bg-background border-border">
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.label} value={tab.label}>
                <div className="flex items-center justify-between w-full gap-3">
                  <span>{tab.label}</span>
                  <Badge variant="secondary" className="tabular-nums text-xs">
                    {tab.count}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Contenu du type sélectionné */}
        <div className="w-full">
          {selectedTab.count > 0 ? (
            <BlocTabs items={selectedTab.data} />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground rounded-xl bg-muted/30 border border-border/50">
              Aucun item pour ce type.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Version desktop avec tabs scrollables
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <div className="relative">
        {/* Indicateur de scroll gauche */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 opacity-0 peer-hover:opacity-100" />

        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-1 p-1 bg-muted/50 rounded-xl scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.label}
              value={tab.label}
              className="px-3 py-2 text-sm whitespace-nowrap flex-shrink-0 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
            >
              <span className="mr-1.5">{tab.label}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 tabular-nums">
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Indicateur de scroll droit */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 opacity-0 peer-hover:opacity-100" />
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label} className="w-full pt-4">
          {tab.count > 0 ? (
            <BlocTabs items={tab.data} />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground rounded-xl bg-muted/30 border border-border/50">
              Aucun item pour ce type.
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

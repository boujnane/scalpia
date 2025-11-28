"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildChartData } from "@/lib/buildChartData";

// Types
type Item = {
    name: string;
    releaseDate: string;
    bloc: string;
    image?: string;
    type: "ETB" | "Display" | "Demi-Display" | "Tri-Pack" | "UPC" | "Artset" | "Bundle"; // ajouter tous les types existants
    retailPrice?: number; // prix retail à la sortie en magasin
    prices?: { date: string; price: number }[]; // historique des prix
  };
  

// Grouper par bloc
function groupByBloc(items: Item[]) {
  return items.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.bloc]) acc[item.bloc] = [];
    acc[item.bloc].push(item);
    return acc;
  }, {});
}

// Images des blocs
const blocImages: Record<string, string> = {
  EV: "/EV/SVI.png",
  MEG: "/MEG/MEG.png",
};

export default function AnalysePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [normalize, setNormalize] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "items"));
      const fetchedItems: Item[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as Omit<Item, "prices">;
        const pricesSnap = await getDocs(collection(db, `items/${docSnap.id}/prices`));
        const prices = pricesSnap.docs.map((p) => p.data() as { date: string; price: number });
        fetchedItems.push({ ...data, prices });
      }

      setItems(fetchedItems);

      // Initialiser visibleSeries
      const seriesState: Record<string, boolean> = {};
      fetchedItems.forEach((i) => (seriesState[i.name] = true));
      setVisibleSeries(seriesState);

      setLoading(false);
    }

    fetchItems();
  }, []);

  if (loading) return <div className="p-6">Chargement des items...</div>;

  const tabs = [
    { label: "ETB", data: items.filter((i) => i.type === "ETB") },
    { label: "Display", data: items.filter((i) => i.type === "Display") },
    { label: "Demi-Display", data: items.filter((i) => i.type === "Demi-Display") },
    { label: "Tri-Pack", data: items.filter((i) => i.type === "Tri-Pack") },
    { label: "UPC", data: items.filter((i) => i.type === "UPC") },
    { label: "Artset", data: items.filter((i) => i.type === "Artset") },
    { label: "Bundle", data: items.filter((i) => i.type === "Bundle") },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analyse des Items</h1>

      <Tabs defaultValue={tabs[0].label} className="space-y-4">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.label} value={tab.label}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => {
          const sortedItems = [...tab.data].sort(
            (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
          );

          const grouped = groupByBloc(sortedItems);
          const sortedBlocs = Object.entries(grouped).sort((a, b) => {
            const aMax = Math.max(...a[1].map((x) => new Date(x.releaseDate).getTime()));
            const bMax = Math.max(...b[1].map((x) => new Date(x.releaseDate).getTime()));
            return bMax - aMax;
          });

          return (
            <TabsContent key={tab.label} value={tab.label} className="space-y-4">
              <Tabs defaultValue={sortedBlocs[0][0]} className="space-y-2">
                <TabsList className="gap-3 p-2 flex">
                  {sortedBlocs.map(([bloc]) => (
                    <TabsTrigger
                      key={bloc}
                      value={bloc}
                      className="flex items-center gap-2 px-4 py-2 rounded-md border data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <img src={blocImages[bloc]} alt={bloc} className="h-8 w-auto object-contain opacity-90" />
                    </TabsTrigger>
                  ))}
                </TabsList>

                {sortedBlocs.map(([bloc, blocItems], idx) => (
                  <TabsContent key={bloc} value={bloc} className="space-y-6">
                    {/* 🔥 Graphique récap du bloc */}
                    <div className="w-full h-auto p-4 border rounded-lg bg-white shadow space-y-3">
                      <button
                        onClick={() => setNormalize(!normalize)}
                        className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
                      >
                        {normalize ? "Afficher Prix Réels" : "Normaliser (Base 100)"}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {blocItems.map((item) => (
                          <label key={item.name} className="flex items-center gap-2 text-sm border px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={visibleSeries[item.name]}
                              onChange={() =>
                                setVisibleSeries((prev) => ({
                                  ...prev,
                                  [item.name]: !prev[item.name],
                                }))
                              }
                            />
                            {item.name}
                          </label>
                        ))}
                      </div>

                      <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              type="number"
                              scale="time"
                              domain={["dataMin", "dataMax"]}
                              tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")}
                            />
                            <YAxis />
                            <RechartsTooltip
                              labelFormatter={(l) => new Date(l).toLocaleDateString("fr-FR")}
                              formatter={(v: number) => (normalize ? `${v.toFixed(1)} (index)` : `€${v.toFixed(2)}`)}
                            />
                            <Legend />

                            {blocItems.map((item, idx) => {
                              if (!visibleSeries[item.name]) return null;


                              const initialPrice = item.retailPrice ?? 0;

                              const fullData = buildChartData(item);

                              const normalisedData = normalize
                                ? fullData.map((p) => ({ ...p, price: (p.price / fullData[0].price) * 100 }))
                                : fullData;

                              return (
                                <Line
                                    key={item.name + item.type}
                                    data={normalisedData}
                                    dataKey="price"
                                    name={item.name}
                                    type="monotone"
                                    strokeWidth={2}
                                    stroke={`hsl(${(idx * 70) % 360}, 70%, 50%)`}
                                    strokeOpacity={0.7}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <GridItems data={blocItems} />
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function GridItems({ data }: { data: Item[] }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {data.map((item) => {
          const initialRetailPrice = item.retailPrice ?? 0; // prendre depuis DB
          const chartData = [
            { date: new Date(item.releaseDate).getTime(), price: initialRetailPrice },
            ...(item.prices?.map((p) => ({ date: new Date(p.date).getTime(), price: p.price })) || []),
          ].sort((a, b) => a.date - b.date);
  
          return <ItemCard key={item.name + item.type} item={item} chartData={chartData} />;
        })}
      </div>
    );
  }
  

// ✅ Carte + Modal
function ItemCard({ item, chartData }: { item: Item; chartData: { date: number; price: number }[] }) {
  const [timeFrame, setTimeFrame] = useState<{ start: Date; end: Date }>({
    start: new Date(chartData[0].date),
    end: new Date(chartData[chartData.length - 1].date),
  });

  const setLastNDays = (days: number) => {
    const end = new Date(chartData[chartData.length - 1].date);
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    setTimeFrame({ start, end });
  };

  const filteredData = chartData.filter(
    (d) => d.date >= timeFrame.start.getTime() && d.date <= timeFrame.end.getTime()
  );

  return (
    <div className="border rounded-lg shadow-lg bg-white overflow-hidden hover:shadow-xl transition">
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer p-4 flex flex-col items-center">
            <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden mb-4">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain hover:scale-105 transition-transform"
                />
              )}
            </div>
            <span className="font-semibold text-center">{item.name}</span>
            <Badge variant="secondary" className="mt-2">{item.releaseDate}</Badge>
          </div>
        </DialogTrigger>

        <DialogContent showCloseButton={false} className="w-full max-w-4xl h-[500px] flex flex-col">
          <DialogTitle className="mb-4">{item.name}</DialogTitle>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setTimeFrame({ start: new Date(chartData[0].date), end: new Date(chartData[chartData.length - 1].date) })} className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition">
              All
            </button>
            <button onClick={() => setLastNDays(30)} className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition">1M</button>
            <button onClick={() => setLastNDays(90)} className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition">3M</button>
            <button onClick={() => setLastNDays(180)} className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition">6M</button>
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")} />
                <YAxis />
                <RechartsTooltip labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR")} formatter={(value: number) => `€${value.toFixed(2)}`} />
                <Line type="monotone" dataKey="price" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <DialogClose className="absolute top-2 right-2 px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition">Fermer</DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// CustomDot.tsx (ou dans le même fichier, mais sans 'export default' si c'est local)

const CustomDot = (props: any) => {
  const { cx, cy, index, data } = props;

  if (index === 0) return null; // Pas de comparaison pour le premier point
  
  // Vérifications de sécurité (importantes en Recharts)
  if (!data || data.length === 0 || index >= data.length) return null;

  const currentPrice = data[index]?.price;
  const prevPrice = data[index - 1]?.price;

  if (prevPrice === undefined || currentPrice === undefined) return null;

  const slope = currentPrice - prevPrice;
  // Définition des couleurs : Vert pour hausse, Rouge pour baisse, Gris pour stable
  const color = slope > 0 ? "#10B981" : slope < 0 ? "#EF4444" : "#6B7280"; 

  return (
    <svg x={cx - 4} y={cy - 4} width={8} height={8} fill={color} key={`dot-${index}`}>
      <circle cx="4" cy="4" r={4} />
    </svg>
  );
};

export default CustomDot;

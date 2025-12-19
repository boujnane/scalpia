export function normalizeSeriesName(name: string): string {
    let normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ignoreWords = ["rugit", "garde", "lucario", "gardevoir", "sylveroy", "du froid", "effroi"];
    ignoreWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      normalized = normalized.replace(regex, "");
    });
    normalized = normalized.replace(/\s+/g, " ").trim();
    const fusionMap: Record<string, string> = {
      "koraidon ev": "ecarlate et violet",
      "miraidon ev": "ecarlate et violet",
      "mega evolution 1": "mega evolution",
      "vert forces temporelles": "forces temporelles",
      "serpente forces temporelles": "forces temporelles"
    };
    return fusionMap[normalized] ?? normalized;
  }
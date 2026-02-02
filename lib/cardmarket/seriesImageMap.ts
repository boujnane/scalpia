const SERIES_IMAGE_MAP: Record<string, string> = {
  "zenith supreme": "/EB/EB12.5.png",
  "tempete argentee": "/EB/EB12.png",
  "origine perdue": "/EB/EB11.png",
  "astres radieux": "/EB/EB10.png",
  "stars etincelantes": "/EB/EB9.png",
  "poing de fusion": "/EB/EB8.png",
  "celebrations": "/EB/EB7.5.png",
  "evolution celeste": "/EB/EB7.png",
  "regne de glace": "/EB/EB6.png",
  "foudre noire": "/EV/BLK.png",
  "rivalité destinées": "/EV/DRI.png",
  "rivalites destinees": "/EV/DRI.png",
  "aventures ensemble": "/EV/JTG.png",
  "151": "/EV/MEW.png",
  "flammes obsidiennes": "/EV/OBF.png",
  "destinées de paldea": "/EV/PAF.png",
  "destinees de paldea": "/EV/PAF.png",
  "évolutions à paldea": "/EV/PAL.png",
  "evolutions a paldea": "/EV/PAL.png",
  "faille paradoxe": "/EV/PAR.png",
  "évolutions prismatiques": "/EV/PRE.png",
  "evolutions prismatiques": "/EV/PRE.png",
  "couronne stellaire": "/EV/SCR.png",
  "fable nébuleuse": "/EV/SFA.png",
  "fable nebuleuse": "/EV/SFA.png",
  "étincelles déferlantes": "/EV/SSP.png",
  "etincelles deferlantes": "/EV/SSP.png",
  "écarlate et violet": "/EV/SVI.png",
  "ecarlate et violet": "/EV/SVI.png",
  "forces temporelles": "/EV/TEF.png",
  "mascarade crépusculaire": "/EV/TWM.png",
  "mascarade crepusculaire": "/EV/TWM.png",
  "flamme blanche": "/EV/WHT.png",
  "mega evolution": "/MEG/MEG.png",
  "flammes fantasmagoriques": "/MEG/PFL.png",
};

function normalizeSeriesKey(seriesName: string) {
  return seriesName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getSeriesImage(seriesName: string): string | null {
  if (!seriesName) return null;
  const normalized = normalizeSeriesKey(seriesName);
  return SERIES_IMAGE_MAP[normalized] || null;
}

export const getYRangeFromSeries = (series) => {
  const yValues = getFieldValuesFromSeries(series, 'y');
  const yMaxValue = Math.max(...yValues);
  const yMinValue = Math.min(...yValues);
  const yRange = yMaxValue - yMinValue;

  if (yRange == 0) {
    let yMaxBuffer = yMaxValue * 2;
    return [Math.min(yMaxBuffer, 0), Math.max(yMaxBuffer, 0)];

  } else {
    const yMaxBuffer = yMaxValue + yRange * 0.1;
    const yMinBuffer = yMinValue - yRange * 0.1;
    return [yMinBuffer, yMaxBuffer];
  }
}

export const getFieldValuesFromSeries = (series, field) => {
  const allFieldValues = series
    .map(serie => serie.map(dataPoint => dataPoint[field]))
    .flat();

  const distinctXValues = [...new Set(allFieldValues)];

  return distinctXValues;
}

export const caseInsensitiveStringCmp = (a, b) => {
  a = a.toLowerCase();
  b = b.toLowerCase();

  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
};

export const compareLabels = (a, b) => {
  if (a.label < b.label) {
    return -1;
  }

  if (a.label > b.label) {
    return 1;
  }

  return 0;
};

export const compareMediaLabels = (a, b) => {
  if (a.value === 'mm') {
    return -1;
  } else if (b.value === 'mm') {
    return 1;
  }

  if (a.label < b.label) {
    return -1;
  }

  if (a.label > b.label) {
    return 1;
  }

  return 0;
};

export const getMetaboliteOptions = (data, columnsToSkip) => {
  const firstRow = data[0];
  const metabolites = [];

  for (let key in firstRow) {
    if (columnsToSkip.includes(key) || key.startsWith('IS_')) {
      continue;
    }

    if (data.filter(row => row[key] !== undefined && row[key] !== "").length == 0) {
      continue;
    }

    const metaboliteName = key.split('.')[0];
    metabolites.push(metaboliteName);
  }

  const distinctMetabolites = [...new Set(metabolites)];

  return distinctMetabolites
    .map(metabolite => ({value: metabolite, label: metabolite.toUpperCase()}))
    .sort(compareLabels);
};

export const mediaLabels = {
  'mm': 'Mega Media',
  'bhis': 'Brain Heart Infusion-Supplemented (BHIS)',
  'cm': 'Chopped Meat (CM)',
  'mml': 'Mega Media with Lactate',
  'mms': 'Mega Media with Starch',
  'mm_s04_citrate': 'Mega Media with Sulfate, Citrate',
  'pyg': 'Peptone Yeast Glucose (PYG)',
  'pyg_muc': 'Peptone Yeast Glucose (PYG) with Mucus',
  'paf': 'Polyamine-free Media',
  'rcm': 'Reinforced Clostridial Media (RCM)',
  'rcml': 'Reinforced Clostridial Media (RCM) with Lactate',
  'rcmsg': 'Reinforced Clostridial Media (RCM) with Starch, Glucose',
  'rcmwoa': 'Reinforced Clostridial Media (RCM) without Agar',
  'tsab': 'Tryptic Soy Agar (TSA) with Blood',
  'ycfag': 'Yeast, Casitone, Fatty Acids (YCFA) with Glucose',
};

export const communityColonizations = {
  'Bt_Ca_Er_Pd_Et': {
    label: 'Bt, Ca, Er, Pd, Et',
    description:
      "Bacteroides thetaiotaomicron VPI 5482\n" +
      "Collinsella aerofaciens ATCC 25986\n" +
      "Eubacterium rectale ATCC 33656\n" +
      "Parabacteroides distasonis ATCC 8503\n" +
      "Edwardsiella tarda ATCC 23685",
  },
  'Cs_Bt_Ca_Er_Pd_Et': {
    label: 'Cs, Bt, Ca, Er, Pd, Et',
    description:
      "Clostridium sporogenes ATCC 15579\n" +
      "Bacteroides thetaiotaomicron VPI 5482\n" +
      "Collinsella aerofaciens ATCC 25986\n" +
      "Eubacterium rectale ATCC 33656\n" +
      "Parabacteroides distasonis ATCC 8503\n" +
      "Edwardsiella tarda ATCC 23685",
  },
};

export const monoColonizations = {
  'Bt': {
    label: 'Bt',
    description: "Bacteroides thetaiotaomicron VPI 5482",
  },
  'Cs': {
    label: 'Cs',
    description: "Clostridium sporogenes ATCC 15579",
  },
  'Cp': {
    label: 'Cp',
    description: "Citrobacter portucalensis BEI HM-34",
  },
  'As': {
    label: 'As',
    description: "Anaerostipes sp. BEI HM-220",
  },
};

export const conventionalColonizations = {
  'conventional': {
    label: 'Conventional',
  }
};

export const sampleTypeLabels = {
  'caecal': 'cecal',
};

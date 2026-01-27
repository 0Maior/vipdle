import { CHARACTERS as ALL } from "./data/database";
import { CHARACTERS as PT } from "./data/database";
import { CHARACTERS as UK } from "./data/database_UK";

const BASE_COLUMNS = [
  "picture",
  "name",
  "gender",
  // "orientation",
  "children",
  "height",
  "job",
  "year",
  "place",
  "status",
  "fame",
  "generations",
  "zodiac",
];

export const GAME_MODES = [
  {
    id: "default",
    name: "Classic",
    description: "All characters",
    getCharacters: () => ALL,
    columns: BASE_COLUMNS,
  },
  {
    id: "pt",
    name: "PT",
    description: "Apenas Celebridades Portuguesas",
    getCharacters: () => PT,
    columns: BASE_COLUMNS,
  },
  {
    id: "uk",
    name: "UK (NOT IMPLEMENTED YET)",
    description: "British Celebrities only",
    getCharacters: () => UK,
    columns: BASE_COLUMNS,
  },
  {
    id: "musicians",
    name: "Musicians only",
    description: "Characters whose job includes Musician",
    getCharacters: () => ALL.filter(
        (c) =>
          Array.isArray(c.job) &&
          c.job.some((j) => j.toLowerCase() === "músico")
      ),
    modeSpecific: {
      label: "Music Style",
      tooltip: "Primary music genre or style",

      labelKey: "modespecific_music",
      tooltipKey: "modespecific_music",
    },
    columns: [
      "picture",
      "name",
      "gender",
      "children",
      "height",
      "modespecific",
      "year",
      "place",
      "status",
      "fame",
      "generations",
      "zodiac",
    ],
  },

  {
    id: "politics",
    name: "Politicians only",
    description: "Political figures",
    getCharacters: () => ALL.filter(
        (c) =>
          Array.isArray(c.job) &&
          c.job.some((j) => j.toLowerCase() === "político")
      ),
    modeSpecific: {
      label: "Political Party",
      tooltip: "Main political affiliation",
      
      labelKey: "modespecific_politics",
      tooltipKey: "modespecific_politics",
    },
    columns: [
      "picture",
      "name",
      "gender",
      "children",
      "height",
      "modespecific",
      "year",
      "place",
      "status",
      "fame",
      "generations",
      "zodiac",
    ],
  },
  
  {
    id: "extremamentedesagradavel",
    name: "Extremamente Desagradável",
    description: "Visados no Extremamente Desagradável da Joana Marques",
    getCharacters: () => ALL.filter(
        (c) =>
          Array.isArray(c.programs) &&
          c.programs.some((j) => j.toLowerCase() === "extremamentedesagradavel")
      ),
    columns: BASE_COLUMNS,
  },
];

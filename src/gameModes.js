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
  /*{
    id: "default",
    name: "Classic",
    description: "All characters",
    getCharacters: () => ALL,
    columns: BASE_COLUMNS,
  },*/
  {
    id: "pt",
    name: "PT",
    description: "Apenas Celebridades Portuguesas",
    getCharacters: () => PT,
    columns: BASE_COLUMNS,
  },
  {
    id: "uk",
    name: "UK",
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
    modeSpecific1: {
      label: "Music Style",
      tooltip: "Primary music genre or style",

      labelKey: "modespecific1_music",
      tooltipKey: "modespecific1_music",
    },
    columns: [
      "picture",
      "name",
      "gender",
      "children",
      "height",
      "modespecific1",
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
    modeSpecific1: {
      label: "Political Party",
      tooltip: "Main political affiliation",
      
      labelKey: "modespecific1_politics",
      tooltipKey: "modespecific1_politics",
    },
    columns: [
      "picture",
      "name",
      "gender",
      "children",
      "height",
      "modespecific1",
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
    name: "Extremamente Desagradável (IN DEVELOPMENT)",
    description: "Visados no Extremamente Desagradável da Joana Marques",
    getCharacters: () => ALL.filter(
        (c) =>
          Array.isArray(c.programs) &&
          c.programs.some((j) => j.toLowerCase() === "extremamentedesagradavel")
      ),
    columns: BASE_COLUMNS,
  },

  {
    id: "comedians",
    name: "Comedians only",
    description: "Comedian figures",
    getCharacters: () => ALL.filter(
        (c) =>
          Array.isArray(c.job) &&
          c.job.some((j) => j.toLowerCase() === "humorista")
      ),
    modeSpecific1: {
      label: "Performance Format",
      tooltip: "Stand-up / Sketch / Improv / Musical",
      
      labelKey: "modespecific1_comedian",
      tooltipKey: "modespecific1_comedian",
    },
    modespecific2: {
      label: "Channel",
      tooltip: "Live / TV / Radio / Social Networks",
      
      labelKey: "modespecific2_comedian",
      tooltipKey: "modespecific2_comedian",
    },
    columns: [
      "picture",
      "name",
      "gender",
      "children",
      "height",
      "modespecific1",
      "modespecific2",
      "year",
      "place",
      "status",
      "fame",
      "generations",
    ],
  },
];

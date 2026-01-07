import { CHARACTERS as ALL } from "./data/database";
import { CHARACTERS as PT } from "./data/database";
import { CHARACTERS as UK } from "./data/database_UK";

export const GAME_MODES = [
  {
    id: "default",
    name: "Classic",
    description: "All characters",
    getCharacters: () => ALL,
  },
  {
    id: "pt",
    name: "PT",
    description: "Portuguese Celebrities only",
    getCharacters: () => PT,
  },
  {
    id: "uk",
    name: "UK",
    description: "British Celebrities only",
    getCharacters: () => UK,
  },
  {
    id: "musicians",
    name: "Musicians only",
    description: "Characters whose job includes Musician",
    getCharacters: () =>
      ALL.filter((c) =>
        c.job.some((j) => j.toLowerCase() === "músico")
      ),
  },
];

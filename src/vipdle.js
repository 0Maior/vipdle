import "./vipdle.css";
import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import Tooltip from "./Tooltip";
import { GAME_MODES } from "./gameModes";
import { TRANSLATIONS } from "./i18n";

const RATE_LIMIT_MS = 60 * 1000; // 1 minute

// ---------------------------------------------------------------------------
// Fires a re-render when the viewport crosses the mobile breakpoint (640px).
// ---------------------------------------------------------------------------
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches); // sync on mount
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}


function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle(array, seed) {
  const rng = mulberry32(seed);
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getDailyCharacter(list, salt = "") {
  if (!Array.isArray(list) || list.length === 0) return null;

  const dateStr = new Date().toISOString().slice(0, 10); // UTC
  const seed = hashString(`${dateStr}-${salt}`);

  const shuffled = seededShuffle(list, seed);
  return shuffled[0];
}

function getNextDailyCharacters(list, days = 20, salt = "") {
  const results = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dateStr = d.toISOString().slice(0, 10);
    const seed = hashString(`${dateStr}-${salt}`);
    const shuffled = seededShuffle(list, seed);

    results.push({
      date: dateStr,
      character: shuffled[0],
    });
  }

  return results;
}

function normalizeHeightCategory(height, gender) {
  // Case 1: already a string in DB
  if (typeof height === "string") {
    const h = height.toLowerCase().trim();

    if (["alto", "tall"].includes(h)) return "tall";
    if (["médio", "medio", "average"].includes(h)) return "average";
    if (["baixo", "short"].includes(h)) return "short";

    return "unknown";
  }

  // Case 2: numeric height
  if (typeof height === "number") {
    if (gender === "M") {
      if (height >= 1.8) return "tall";
      if (height >= 1.65) return "average";
      return "short";
    }

    if (gender === "F") {
      if (height >= 1.7) return "tall";
      if (height >= 1.55) return "average";
      return "short";
    }
  }

  return "unknown";
}

const JOB_MAP = {
  // Arts & Media
  "academico": "academic",
  "académico": "academic",
  "artista plastico": "visual_artist",
  "artista plástico": "visual_artist",
  "ator": "actor",
  "guionista": "screenwriter",
  "humorista": "comedian",
  "musico": "musician",
  "músico": "musician",
  "modelo": "model",
  "youtuber": "youtuber",
  "apresentador": "host",
  "jornalista": "journalist",
  "escritor": "writer",

  // Sports
  "atleta": "athlete",
  "treinador": "coach",
  "dirigente desportivo": "sports_manager",

  // STEM / Professions
  "engenheiro": "engineer",
  "medico": "doctor",
  "médico": "doctor",
  "arquiteto": "architect",
  "chef": "chef",
  "aviador": "pilot",

  // Politics / Power
  "politico": "politician",
  "político": "politician",
  "rei": "royalty",
  "militar": "military",
  "religioso": "religious",

  // Business / Society
  "empresario": "businessperson",
  "empresário": "businessperson",
  "socialite": "socialite",

  // Other
  "ativista": "activist",
  "explorador": "explorer",
  "criminoso": "criminal",
  "vitima": "victim",
  "vítima": "victim",
};

function normalizeJob(jobList) {
  if (!Array.isArray(jobList) || jobList.length === 0) {
    return ["unknown"];
  }

  const normalized = jobList
    .map(j =>
      j
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    )
    .map(j => JOB_MAP[j] ?? "unknown");

  // Remove duplicates + sort for stable comparison
  return [...new Set(normalized)].sort();
}


const STATUS_MAP = {
  // Portuguese
  vivo: "alive",
  morta: "dead",
  morto: "dead",

  // English
  alive: "alive",
  dead: "dead",
};

function normalizeStatus(value) {
  if (!value) return "unknown";

  const key = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return STATUS_MAP[key] ?? "unknown";
}

const ZODIAC_MAP = {
  // Portuguese
  carneiro: "aries",
  touro: "taurus",
  gemeos: "gemini",
  gémeos: "gemini",
  caranguejo: "cancer",
  leao: "leo",
  leão: "leo",
  virgem: "virgo",
  balanca: "libra",
  balança: "libra",
  escorpiao: "scorpio",
  escorpião: "scorpio",
  sagitario: "sagittarius",
  sagitário: "sagittarius",
  capricornio: "capricorn",
  capricórnio: "capricorn",
  aquario: "aquarius",
  aquário: "aquarius",
  peixes: "pisces",

  // English (already canonical)
  aries: "aries",
  taurus: "taurus",
  gemini: "gemini",
  cancer: "cancer",
  leo: "leo",
  virgo: "virgo",
  libra: "libra",
  scorpio: "scorpio",
  sagittarius: "sagittarius",
  capricorn: "capricorn",
  aquarius: "aquarius",
  pisces: "pisces",
};

function normalizeZodiac(value) {
  if (!value) return "unknown";

  const key = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ZODIAC_MAP[key] ?? "unknown";
}

function normalizeHint(value) {
  if (typeof value !== "string") return "-";

  const trimmed = value.trim();
  return trimmed === "" ? "-" : trimmed;
}

// ---------------------------------------------------------------------------
// Scoring: ranks how well a character name matches the search query.
// Lower score = better match.
//   0  – full name starts with the query (best)
//   1  – every token starts a word in the name
//   2  – all tokens found somewhere inside the name (worst passing score)
// Ties are broken by name length (shorter names first).
// ---------------------------------------------------------------------------
function scoreMatch(character, normalizedTokens) {
  const names = Array.isArray(character.names) ? character.names : [character.name];

  let bestScore = Infinity;

  for (const fullName of names) {
    const normName = fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/["()]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Check: does the full name START with the entire query?
    const fullQuery = normalizedTokens.join(" ");
    if (normName.startsWith(fullQuery)) {
      bestScore = Math.min(bestScore, 0);
      continue;
    }

    // Check: does every token start a word boundary in the name?
    const words = normName.split(" ");
    const allTokensStartWord = normalizedTokens.every((token) =>
      words.some((word) => word.startsWith(token))
    );
    if (allTokensStartWord) {
      bestScore = Math.min(bestScore, 1);
      continue;
    }

    // Fallback: all tokens appear somewhere (already guaranteed by the filter)
    bestScore = Math.min(bestScore, 2);
  }

  return bestScore;
}

const VIPdle = () => {
  const [gameMode, setGameMode] = useState(GAME_MODES?.[0] ?? null);
  const [characters, setCharacters] = useState([]);

  const [target, setTarget] = useState(null);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [didQuit, setDidQuit] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCharacter, setReportCharacter] = useState("");
  const [reportField, setReportField] = useState("");
  const [reportValue, setReportValue] = useState("");
  const [reportSource, setReportSource] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedHints, setRevealedHints] = useState([]);

  const [language, setLanguage] = useState("pt");
  const t = TRANSLATIONS[language];
  const isMobile = useIsMobile();

  const COLUMN_CONFIG = {
    picture: {
      header: t.table.picture,
      render: (c) => (
        <img
          src={`${process.env.PUBLIC_URL}/images/${c.image}`}
          alt={c.name}
          className="table-avatar"
        />
      ),
      getClass: (c, target) =>
        target && c.id === target.id ? "correct" : "wrong",
    },

    name: {
      header: t.table.name,
      render: (c) => c.name,
      getClass: (c, target, getClass) => getClass("name", c.name),
    },

    gender: {
      header: t.table.gender,
      render: (c) => c.gender,
      getClass: (c, target, getClass) => getClass("gender", c.gender),
    },

    children: {
      header: t.table.children,
      render: (c) => c.children,
      getClass: (c, target, getClass) => getClass("children", c.children),
    },

    height: {
      header: t.table.height,
      render: (c) => {
        const category = normalizeHeightCategory(c.height, c.gender);
        if (!category) return "Unknown";

        return t.height_labels?.[category] ?? category;
      },
      getClass: (c, target, getClass) => getClass("height", c),
    },

    job: {
      header: (
        <>
          {t.table.job}
          <Tooltip content={t.tooltips.job_tooltip}>
            <span className="help-icon">ℹ️</span>
          </Tooltip>
        </>
      ),
      render: (c) => {
        const jobs = normalizeJob(c.job);

        return jobs
          .map(j => t.job?.[j] ?? j)
          .join(", ");
      },
      getClass: (c, target, getClass) => getClass("job", c.job),
    },

    year: {
      header: t.table.year,
      render: (c, target) => {
        if (!c.year || !target?.year) return c.year ?? "—";

        let arrow = "";
        if (c.year < target.year) arrow = " ↑";
        if (c.year > target.year) arrow = " ↓";

        return (
          <>
            {c.year}
            <span className="arrow">{arrow}</span>
          </>
        );
      },
      getClass: (c, target, getClass) => getClass("year", c.year),
    },

    place: {
      header: t.table.place,
      render: (c) => c.place,
      getClass: (c, target, getClass) => getClass("place", c.place),
    },

    status: {
      header: t.table.status,
      render: (c) => {
        const s = normalizeStatus(c.status);
        if (!s) return "Unknown";

        return t.status?.[s] ?? s;
      },
      getClass: (c, target, getClass) => getClass("status", c),
    },

    fame: {
      header: (
        <>
          {t.table.fame}
          <Tooltip content={t.tooltips.fame_tooltip}>
            <span className="help-icon">ℹ️</span>
          </Tooltip>
        </>
      ),
      render: (c) => c.fame,
      getClass: (c, target, getClass) => getClass("fame", c.fame),
    },

    generations: {
      header: (
        <>
          {t.table.generations}
          <Tooltip content={t.tooltips.generations_tooltip}>
            <span className="help-icon">ℹ️</span>
          </Tooltip>
        </>
      ),
      render: (c) => c.generations.join(", "),
      getClass: (c, target, getClass) =>
        getClass("generations", c.generations),
    },

    zodiac: {
      header: t.table.zodiac,
      render: (c) => {
        const z = normalizeZodiac(c.zodiac);
        if (!z) return "Unknown";

        return t.zodiac?.[z] ?? z;
      },
      getClass: (c, target, getClass) => getClass("zodiac", c),
    },


    modespecific: {
      header: ({ gameMode, t }) => {
        const label =
          t?.table?.[gameMode?.modeSpecific?.labelKey] ??
          gameMode?.modeSpecific?.labelKey ??
          "Extra";

        const tooltipText =
          t?.tooltips?.[gameMode?.modeSpecific?.tooltipKey];

        return (
          <>
            {label}
            {tooltipText && (
              <Tooltip content={tooltipText}>
                <span className="help-icon">ℹ️</span>
              </Tooltip>
            )}
          </>
        );
      },

      render: (c) => c.modespecific.join(", ") || "—",

      getClass: (c, target) =>
        target && c.modespecific === target.modespecific
          ? "correct"
          : "wrong",
    },
  };


  const columns = gameMode?.columns ?? [];

  // Initialize game: Pick a random character
  useEffect(() => {
    if (!gameMode) return;

    const list = gameMode.getCharacters?.() ?? [];
    setCharacters(list);
    setTarget(list.length ? getDailyCharacter(list, gameMode.id) : null);
    setGuesses([]);
    setGuess("");
    setGameOver(false);
    setHintsUsed(0);
    setRevealedHints([]);
  }, [gameMode]);

  const handleGuess = (e) => {
    e.preventDefault();
    const foundChar = characters.find(c => c.name.toLowerCase() === guess.toLowerCase());
    
    if (foundChar) {
      setGuesses([foundChar, ...guesses]);
      if (foundChar.id === target.id) setGameOver(true);
      setGuess("");
    } else {
      alert("Character not found in database!");
    }

    setShowDropdown(false);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setGuess(value);
    setActiveIndex(-1);

    if (!value) {
      setSuggestions(characters);
      setShowDropdown(true);
      return;
    }

    const normalizedValue = normalize(value);
    const searchTokens = normalizedValue.split(" ").filter(Boolean);

    // Filter: all tokens must appear somewhere in at least one of the character's names
    const matches = characters.filter((c) => {
      const names = Array.isArray(c.names) ? c.names : [c.name];

      return names.some((fullName) => {
        const normalizedName = normalize(fullName);
        return searchTokens.every((token) => normalizedName.includes(token));
      });
    });

    // Sort by match quality, then alphabetically as tiebreaker
    matches.sort((a, b) => {
      const scoreA = scoreMatch(a, searchTokens);
      const scoreB = scoreMatch(b, searchTokens);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.name.localeCompare(b.name);
    });

    setSuggestions(matches);
    setShowDropdown(true);
  };

  const handleFocus = () => {
    setSuggestions(characters);
    setShowDropdown(true);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleHint = () => {
    if (!target || hintsUsed >= 3) return;

    const hintKey = `hint${hintsUsed + 1}`;
    const nextHint = normalizeHint(target[hintKey]);

    if (!nextHint) {
      setHintsUsed(3); // no more hints available
      return;
    }

    setRevealedHints((prev) => [...prev, nextHint]);
    setHintsUsed((prev) => prev + 1);
  };


  const getClass = (attr, value) => {
    if (!target) return "";
    
    // JOB: partial match allowed
    if (attr === "job") {
      const targetJobs = target.job.map(normalize);
      const guessJobs = value.map(normalize);

      const intersectionCount = guessJobs.filter(job =>
        targetJobs.includes(job)
      ).length;

      const isExactMatch =
        intersectionCount === targetJobs.length &&
        intersectionCount === guessJobs.length;

      if (isExactMatch) return "correct";

      if (intersectionCount > 0) return "close";

      return "wrong";
    }

    if (attr === "generations") {
      const matches = value.filter(generations => target.generations.includes(generations)).length;

      if (matches === target.generations.length && value.length === target.generations.length)
        return "correct";

      if (matches > 0)
        return "close";

      return "wrong";
    }

    if (attr === "fame" || attr === "children") {
      if (value === target[attr]) return "correct";
      else return "wrong";
    }

    if (attr === "height") {
      const guessCat = normalizeHeightCategory(value.height, value.gender);
      const targetCat = normalizeHeightCategory(
        target.height,
        target.gender
      );

      return guessCat === targetCat ? "correct" : "wrong";
    }

    if (attr === "status") {
      const guessS = normalizeStatus(value.status);
      const targetS = normalizeStatus(target.status);

      if (!guessS || !targetS) return "wrong";

      return guessS === targetS ? "correct" : "wrong";
    }

    if (attr === "zodiac") {
      const guessZ = normalizeZodiac(value.zodiac);
      const targetZ = normalizeZodiac(target.zodiac);

      return guessZ === targetZ ? "correct" : "wrong";
    }

    // default behavior
    if (value === target[attr]) return "correct";

    if (typeof value === "number" && Math.abs(value - target[attr]) <= 10)
      return "close";

    return "wrong";
  };

  const selectSuggestion = (character) => {
    setGuess(character.name);
    setShowDropdown(false);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  // Highlights every matched token inside the displayed name.
  // Finds all occurrences, merges overlapping ranges, then renders
  // plain and highlighted segments in order.
  const highlightMatch = (text, match) => {
    if (!match) return text;

    const tokens = normalize(match).split(" ").filter(Boolean);
    if (tokens.length === 0) return text;

    // Normalize the display text the same way for index matching
    const normText = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Collect all [start, end) ranges where any token appears
    const ranges = [];
    for (const token of tokens) {
      let pos = 0;
      while (pos < normText.length) {
        const idx = normText.indexOf(token, pos);
        if (idx === -1) break;
        ranges.push([idx, idx + token.length]);
        pos = idx + 1;
      }
    }

    if (ranges.length === 0) return text;

    // Sort ranges by start position, then merge any that overlap or touch
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [ranges[0].slice()];
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      if (ranges[i][0] <= last[1]) {
        last[1] = Math.max(last[1], ranges[i][1]);
      } else {
        merged.push(ranges[i].slice());
      }
    }

    // Walk through merged ranges and build React segments
    const segments = [];
    let cursor = 0;
    for (const [start, end] of merged) {
      if (cursor < start) {
        segments.push(<span key={`p-${cursor}`}>{text.slice(cursor, start)}</span>);
      }
      segments.push(
        <span key={`h-${start}`} className="highlight">
          {text.slice(start, end)}
        </span>
      );
      cursor = end;
    }
    if (cursor < text.length) {
      segments.push(<span key={`p-${cursor}`}>{text.slice(cursor)}</span>);
    }

    return <>{segments}</>;
  };

  const getCharacterByName = (name) =>
  characters.find((c) => c.name === name);

  const sendDatabaseReport = () => {
    if (!canSendReport()) {
      alert("Please wait before sending another report ⏳");
      return;
    }

    if (!isValidUrl(reportSource)) {
      alert("Please enter a valid URL (http:// or https://)");
      return;
    }

    const character = getCharacterByName(reportCharacter);

    if (!character) {
      alert("Character not found in database");
      return;
    }

    if (!isValidValueForField(reportField, reportValue)) {
      alert("The value format is not valid for this field");
      return;
    }

    if (isSameAsDatabase(character, reportField, reportValue)) {
      alert("This value is already correct in the database");
      return;
    }

    setIsSendingReport(true);

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          date: new Date().toISOString(),
          character: reportCharacter,
          field: reportField,
          correct_value: reportValue,
          source: reportSource || "No source provided",
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      )
      .then(() => {
        localStorage.setItem(
          "vipdle_last_report_time",
          Date.now().toString()
        );

        alert("Thanks! Report sent 🙏");
        setShowReportModal(false);
        setReportCharacter("");
        setReportField("");
        setReportValue("");
        setReportSource("");
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to send report 😢");
      })
      .finally(() => {
        setIsSendingReport(false);
      });
  };

  const isValidValueForField = (field, value) => {
    if (!value) return false;

    switch (field) {
      case "height":
      case "year":
      case "fame":
      case "children":
        return !isNaN(Number(value));

      case "job":
      case "generations":
        // comma-separated list
        return value.split(",").every(v => v.trim().length > 0);

      case "image":
        return /\.(png|jpg|jpeg|webp)$/i.test(value);

      default:
        return value.trim().length > 0;
    }
  };

  const isSameAsDatabase = (character, field, reportedValue) => {
    const dbValue = character[field];

    // Convert reported value to comparable form
    let parsedReported = reportedValue;

    if (Array.isArray(dbValue)) {
      parsedReported = reportedValue
        .split(",")
        .map(v => v.trim());
    } else if (typeof dbValue === "number") {
      parsedReported = Number(reportedValue);
    }

    return (
      normalizeValue(dbValue) ===
      normalizeValue(parsedReported)
    );
  };

  const canSendReport = () => {
    const lastSent = localStorage.getItem("vipdle_last_report_time");
    if (!lastSent) return true;

    return Date.now() - Number(lastSent) > RATE_LIMIT_MS;
  };

  const isValidUrl = (url) => {
    if (!url) return true; // source is optional
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/["()]/g, "")          // remove quotes & parentheses
      .replace(/[^a-z0-9\s]/g, "")    // remove other punctuation
      .replace(/\s+/g, " ")           // collapse spaces
      .trim();

  const normalizeValue = (val) => {
    if (Array.isArray(val)) {
      return val.map(normalize).sort().join(",");
    }
    if (typeof val === "number") {
      return val.toString();
    }
    return normalize(val);
  };

  const openWikipedia = (character) => {
    const name = character?.name;
    if (!name) return;

    const wikiUrl = character.wikipedia?.trim();

    if (wikiUrl) {
      window.open(wikiUrl, "_blank", "noopener,noreferrer");
    } else {
      const query = encodeURIComponent(`${name}`);
      window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="app-bg">
      <div className="game-card">
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>
        <button
          className="lang-btn"
          onClick={() => setLanguage((l) => (l === "pt" ? "en" : "pt"))}
          title="Change language"
        >
          {language === "pt" ? "🇵🇹" : "🇬🇧"}
        </button>
        <div className="logo-wrapper">
          <img
            src={`${process.env.PUBLIC_URL}/images/vipdle_logo_transp.png`}
            alt="VIPdle"
            className="vipdle-logo"
          />
        </div>
        <p className="subtitle">
          {t.subtitle} · {new Date().toLocaleDateString()}
        </p>

        {/* Input Section */}
        {!gameOver && (
          <form onSubmit={handleGuess} className="guess-form">
            <div className="autocomplete">
              <input
                className="guess-input"
                value={guess}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={t.guessinputplaceholder}
              />

              {showDropdown && suggestions.length > 0 && (
                <ul className="dropdown">
                  {suggestions.map((c, index) => (
                    <li
                      key={c.id}
                      className={`dropdown-item ${index === activeIndex ? "active" : ""}`}
                      onMouseDown={() => selectSuggestion(c)}
                    >
                      <img
                        src={`${process.env.PUBLIC_URL}/images/${c.image}`}
                        alt={c.name}
                        className="avatar"
                        onError={(e) => {
                          e.target.src = `${process.env.PUBLIC_URL}/images/placeholder.png`;
                        }}
                      />
                      <span>{highlightMatch(c.name, guess)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="guess-actions">
              <button className="guess-btn" disabled={gameOver}>
                {t.guess}
              </button>

              <button
                type="button"
                className="hint-btn"
                onClick={handleHint}
                disabled={gameOver || hintsUsed >= 3}
                title={`${t.hint} (${hintsUsed}/3)`}
              >
                💡
              </button>

              <button
                type="button"
                className="quit-btn"
                disabled={gameOver}
                onClick={() => {
                  if (window.confirm("Are you sure you want to quit?")) {
                    setDidQuit(true);
                    setGameOver(true);
                  }
                }}
              >
                ❌ Quit
              </button>
            </div>
          </form>
        )}
        {revealedHints.length > 0 && (
          <div className="hints-box">
            {revealedHints.map((hint, i) => (
              <div key={i} className="hint">
                💡 {t.hint} {i + 1}: {hint}
              </div>
            ))}
          </div>
        )}

        {gameOver && target && (
          <>
            <div className="final-character">
              <a
                href={target.wikipedia}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open ${target.name} on Wikipedia`}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/images/${target.image}`}
                  alt={target.name}
                  className="final-character-img clickable"
                  onClick={() => openWikipedia(target)}
                  onError={(e) => {
                    e.target.src = `${process.env.PUBLIC_URL}/images/placeholder.png`;
                  }}
                />
              </a>
            </div>

           <div className={`win-banner ${didQuit ? "lost" : "won"}`}>
              {didQuit
                ? `${t.lose_banner_before}${target.name}${t.lose_banner_after}`
                : `${t.win_banner_before}${target.name}${t.win_banner_after}`
              }
           </div>
          </>
        )}


        {/* Results Table */}
        <div className="table-wrapper">

          {/* ── DESKTOP: normal grid (header row + guess rows) ── */}
          {!isMobile && (
            <div className="table"
              style={{
                gridTemplateColumns: columns
                  .map((col) => {
                    if (col === "picture") return "56px";
                    if (col === "name") return "130px";
                    if (col === "gender") return "80px";
                    if (col === "children") return "80px";
                    if (col === "height") return "80px";
                    if (col === "job") return "150px";
                    if (col === "year") return "80px";
                    if (col === "place") return "100px";
                    if (col === "status") return "80px";
                    if (col === "fame") return "80px";
                    if (col === "generations") return "110px";
                    if (col === "zodiac") return "90px";
                    if (col === "modespecific") return "150px";
                    return "80px";
                  })
                  .join(" "),
              }}
            >
              <div className="table-header">
                {columns.map((col) => {
                  const config = COLUMN_CONFIG[col];

                  if (!config) {
                    console.error("Missing column config:", col);
                    return (
                      <div key={col} className="table-header-cell">
                        ?
                      </div>
                    );
                  }

                  let header;

                  if (typeof config.header === "function") {
                    header = config.header({ gameMode, t });
                  } else if (typeof config.header === "string") {
                    header = t?.table?.[config.header] ?? config.header;
                  } else {
                    header = config.header;
                  }

                  return (
                    <div key={col} className="table-header-cell">
                      {header}
                    </div>
                  );
                })}
              </div>
              {guesses.map((g, i) => (
                <div key={i} className="table-row">
                  {columns.map((col) => {
                    const config = COLUMN_CONFIG[col];
                    if (!config) {
                      console.error("Missing column config:", col);
                      return <div key={col} className="tile wrong">—</div>;
                    }

                    return (
                      <div
                        key={col}
                        className={`tile ${
                          config.getClass ? config.getClass(g, target, getClass) : ""
                        }`}
                      >
                        {config.render(g, target)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── MOBILE: transposed cards (one card per guess) ── */}
          {isMobile && guesses.map((g, i) => (
            <div key={i} className="mobile-card">
              {/* Avatar + name strip at the top of each card */}
              <div className="mobile-card-header">
                <img
                  src={`${process.env.PUBLIC_URL}/images/${g.image}`}
                  alt={g.name}
                  className="mobile-card-avatar"
                  onError={(e) => {
                    e.target.src = `${process.env.PUBLIC_URL}/images/placeholder.png`;
                  }}
                />
                <span className="mobile-card-name">{g.name}</span>
              </div>

              {/* Attribute rows — skip "picture" and "name", already shown above */}
              {columns
                .filter((col) => col !== "picture" && col !== "name")
                .map((col) => {
                  const config = COLUMN_CONFIG[col];
                  if (!config) return null;

                  let header;
                  if (typeof config.header === "function") {
                    header = config.header({ gameMode, t });
                  } else if (typeof config.header === "string") {
                    header = t?.table?.[config.header] ?? config.header;
                  } else {
                    header = config.header;
                  }

                  return (
                    <div key={col} className="mobile-card-row">
                      <div className="mobile-card-label">{header}</div>
                      <div
                        className={`tile ${
                          config.getClass ? config.getClass(g, target, getClass) : ""
                        }`}
                      >
                        {config.render(g, target)}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}

        </div>
        <button
          className="report-open-btn"
          onClick={() => setShowReportModal(true)}
        >
          🐞 {t.reporterror}
        </button>
      </div>
    
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Report database error</h2>

            {/* Character */}
            <label>
              Character
              <select
                value={reportCharacter}
                onChange={(e) => setReportCharacter(e.target.value)}
              >
                <option value="">Select character</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Field */}
            <label>
              Field
              <select
                value={reportField}
                onChange={(e) => setReportField(e.target.value)}
              >
                <option value="">Select field</option>
                <option value="name">Name</option>
                <option value="gender">Gender</option>
                <option value="orientation">Sexuality</option>
                <option value="children">Children</option>
                <option value="height">Height</option>
                <option value="job">Job</option>
                <option value="year">Birth year</option>
                <option value="place">Birth place</option>
                <option value="status">DoA</option>
                <option value="fame">Fame rate</option>
                <option value="generations">Fame generations</option>
                <option value="zodiac">Zodiac</option>
                <option value="image">Image</option>
              </select>
            </label>

            {/* Correct value */}
            <label>
              Correct value
              <input
                type="text"
                value={reportValue}
                onChange={(e) => setReportValue(e.target.value)}
                placeholder="Enter the correct value"
              />
            </label>

            {/* Source */}
            <label>
              Reference link
              <input
                type="url"
                value={reportSource}
                onChange={(e) => setReportSource(e.target.value)}
                placeholder="https://..."
              />
            </label>

            {/* Actions */}
            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </button>

              <button
                className="modal-send"
                onClick={sendDatabaseReport}
                disabled={
                  isSendingReport ||
                  !reportCharacter ||
                  !reportField ||
                  !reportValue
                }
              >
                {isSendingReport ? "Sending..." : "Send report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Game mode</h2>

            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`mode-btn ${
                  mode.id === gameMode.id ? "active" : ""
                }`}
                onClick={() => {
                  setGameMode(mode);
                  setShowSettings(false);
                }}
              >
                <strong>{mode.name}</strong>
                <span>{mode.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default VIPdle;
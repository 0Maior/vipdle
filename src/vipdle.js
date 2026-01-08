import "./vipdle.css";
import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import Tooltip from "./Tooltip";
import { GAME_MODES } from "./gameModes";

const RATE_LIMIT_MS = 60 * 1000; // 1 minute

const COLUMN_CONFIG = {
  picture: {
    header: "Foto",
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
    header: "Nome",
    render: (c) => c.name,
    getClass: (c, target, getClass) => getClass("name", c.name),
  },

  gender: {
    header: "Sexo",
    render: (c) => c.gender,
    getClass: (c, target, getClass) => getClass("gender", c.gender),
  },

  children: {
    header: "#Filhos",
    render: (c) => c.children,
    getClass: (c, target, getClass) => getClass("children", c.children),
  },

  height: {
    header: "Altura",
    render: (c, target) => {
      if (!c.height || !target?.height) return c.height ?? "—";

      let arrow = "";
      if (c.height < target.height) arrow = " ↑";
      if (c.height > target.height) arrow = " ↓";

      return (
        <>
          {c.height}
          <span className="arrow">{arrow}</span>
        </>
      );
    },
    getClass: (c, target, getClass) => getClass("height", c.height),
  },

  job: {
    header: (
      <>
        Profissão
        <Tooltip content="Principal ocupação pública da personagem">
          <span className="help-icon">ℹ️</span>
        </Tooltip>
      </>
    ),
    render: (c) => c.job.join(", "),
    getClass: (c, target, getClass) => getClass("job", c.job),
  },

  year: {
    header: "Nasc.",
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
    header: "Distrito",
    render: (c) => c.place,
    getClass: (c, target, getClass) => getClass("place", c.place),
  },

  status: {
    header: "DoA",
    render: (c) => c.status,
    getClass: (c, target, getClass) => getClass("status", c.status),
  },

  fame: {
    header: (
      <>
        Fama
        <Tooltip content="Nível de reconhecimento público: 1=alto, 2=médio, 3=baixo">
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
        Gerações
        <Tooltip content="Gerações que conhecem melhor a personagem">
          <span className="help-icon">ℹ️</span>
        </Tooltip>
      </>
    ),
    render: (c) => c.generations.join(", "),
    getClass: (c, target, getClass) =>
      getClass("generations", c.generations),
  },

  zodiac: {
    header: "Zodíaco",
    render: (c) => c.zodiac,
    getClass: (c, target, getClass) => getClass("zodiac", c.zodiac),
  },

  modespecific: {
    header: (gameMode) => (
      <>
        {gameMode?.modeSpecific?.label ?? "Extra"}
        {gameMode?.modeSpecific?.tooltip && (
          <Tooltip content={gameMode.modeSpecific.tooltip}>
            <span className="help-icon">ℹ️</span>
          </Tooltip>
        )}
      </>
    ),
    render: (c) => c.modespecific || "—",
    getClass: (c, target) =>
      target && c.modespecific === target.modespecific
        ? "correct"
        : "wrong",
  },
};

const VIPdle = () => {
  const [gameMode, setGameMode] = useState(GAME_MODES?.[0] ?? null);
  const [characters, setCharacters] = useState([]);

  const [target, setTarget] = useState(null);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
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
  const columns = gameMode?.columns ?? [];

  // Initialize game: Pick a random character
  useEffect(() => {
    if (!gameMode) return;

    const list = gameMode.getCharacters?.() ?? [];
    setCharacters(list);
    setTarget(list.length ? getDailyCharacter(list) : null);
    setGuesses([]);
    setGuess("");
    setGameOver(false);
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
      return;
    }

    const normalizedValue = normalize(value);
    const searchTokens = normalizedValue.split(" ");

    const matches = characters.filter((c) => {
      const names = Array.isArray(c.names)
        ? c.names
        : [c.name];

      return names.some((fullName) => {
        const normalizedName = normalize(fullName);

        // ALL search tokens must appear somewhere in the name
        return searchTokens.every(token =>
          normalizedName.includes(token)
        );
      });
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

  const getDailyCharacter = (list) => {
    const dateString = new Date().toISOString().split("T")[0];
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash += dateString.charCodeAt(i);
    }
    return list[hash % list.length];
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
      if (value === target[attr]) return "correct";
      else if (typeof value === "number" && Math.abs(value - target[attr]) <= 0.1) return "close";
      else return "wrong";
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

  const highlightMatch = (text, match) => {
    if (!match) return text;

    const start = text.toLowerCase().indexOf(match.toLowerCase());
    if (start === -1) return text;

    return (
      <>
        {text.slice(0, start)}
        <span className="highlight">
          {text.slice(start, start + match.length)}
        </span>
        {text.slice(start + match.length)}
      </>
    );
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

  return (
    <div className="app-bg">
      <div className="game-card">
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>
        <div className="logo-wrapper">
          <img
            src={`${process.env.PUBLIC_URL}/images/vipdle_logo_transp.png`}
            alt="VIPdle"
            className="vipdle-logo"
          />
        </div>
        <p className="subtitle">
          Daily character · {new Date().toLocaleDateString()}
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
                placeholder="Enter character name..."
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
            <button className="guess-btn" disabled={gameOver}>
              Guess
            </button>
          </form>
        )}

        {gameOver && (
          <div className="win-banner">
            🎉 You found {target.name}!
          </div>
        )}

        {/* Results Table */}
        <div className="table-wrapper">
          <div className="table"
            style={{
              gridTemplateColumns: columns
                .map((col) => {
                  if (col === "picture") return "56px";
                  if (col === "name") return "130px";
                  if (col === "gender") return "45px";
                  //if (col === "orientation") return "85px";
                  if (col === "children") return "60px";
                  if (col === "height") return "85px";
                  if (col === "job") return "150px";
                  if (col === "year") return "70px";
                  if (col === "place") return "100px";
                  if (col === "status") return "60px";
                  if (col === "fame") return "60px";
                  if (col === "generations") return "110px";
                  if (col === "zodiac") return "100px";
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
                  return <div key={col} className="table-header-cell">?</div>;
                }
                return (
                  <div key={col} className="table-header-cell">
                    {typeof config.header === "function"
                      ? config.header(gameMode)
                      : config.header}
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
        </div>
        <button
          className="report-open-btn"
          onClick={() => setShowReportModal(true)}
        >
          🐞 Report database error
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
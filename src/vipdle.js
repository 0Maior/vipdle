import "./vipdle.css";
import React, { useState, useEffect } from 'react';
import { CHARACTERS } from "./data/database";
import emailjs from "@emailjs/browser";

const RATE_LIMIT_MS = 60 * 1000; // 1 minute

const VIPdle = () => {
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
  

  // Initialize game: Pick a random character
  useEffect(() => {
    setTarget(getDailyCharacter());
  }, []);

  const handleGuess = (e) => {
    e.preventDefault();
    const foundChar = CHARACTERS.find(c => c.name.toLowerCase() === guess.toLowerCase());
    
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
      setSuggestions(CHARACTERS);
      return;
    }

    const normalizedValue = normalize(value);

    const matches = CHARACTERS.filter((c) => {
      // normalize to array of names
      const names = Array.isArray(c.names)
        ? c.names
        : Array.isArray(c.name)
        ? c.name
        : [c.name];

      return names.some((fullName) => {
        const normalizedName = normalize(fullName);

        // split into words AFTER normalization
        const words = normalizedName.split(/\s+/);

        return words.some((word) =>
          word.startsWith(normalizedValue)
        );
      });
    });
    
    setSuggestions(matches);
    setShowDropdown(true);
  };

  const handleFocus = () => {
    setSuggestions(CHARACTERS);
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

  const getDailyCharacter = () => {
    const today = new Date();

    // Normalize to UTC so everyone gets the same day
    const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Turn date into a number (simple hash)
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash += dateString.charCodeAt(i);
    }

    const index = hash % CHARACTERS.length;
    return CHARACTERS[index];
    //return CHARACTERS[15];
  };

  const getClass = (attr, value) => {
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
  CHARACTERS.find((c) => c.name === name);

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
      .normalize("NFD")              // separate accents
      .replace(/[\u0300-\u036f]/g, ""); // remove accents

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
          <div className="table">
            <div className="table-header">
              <div>Picture</div>
              <div>Name</div>
              <div>Gender</div>
              <div>Sexuality</div>
              <div>Children</div>
              <div>Height</div>
              <div>Job</div>
              <div>Birth Year</div>
              <div>Birth Place</div>
              <div>DoA</div>
              <div>Fame rate</div>
              <div>Fame for generations</div>
              <div>Zodiac</div>
            </div>

            {guesses.map((g, i) => (
            <div key={i} className="table-row">
              <div
                className={`tile picture-cell ${g.id === target.id ? "correct" : "wrong"}`}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/images/${g.image}`}
                  alt={g.name}
                  className="table-avatar"
                  onError={(e) => {
                    e.target.src = `${process.env.PUBLIC_URL}/images/placeholder.png`;
                  }}
                />
              </div>
              <div className={`tile ${getClass("name", g.name)}`}>{g.name}</div>
              <div className={`tile ${getClass("gender", g.gender)}`}>{g.gender}</div>
              <div className={`tile ${getClass("orientation", g.orientation)}`}>{g.orientation}</div>
              <div className={`tile ${getClass("children", g.children)}`}>{g.children}</div>
              <div className={`tile ${getClass("height", g.height)}`}>
                {g.height} {g.height === "" ? "" : target.height === "" ? "" :g.height < target.height ? "↑" : g.height > target.height ? "↓" : ""}
              </div>
              <div className={`tile ${getClass("job", g.job)}`}>  {g.job.join(", ")}</div>
              <div className={`tile ${getClass("year", g.year)}`}>
                {g.year} {g.year === "" ? "" : target.year === "" ? "" : g.year < target.year ? "↑" : g.year > target.year ? "↓" : ""}
              </div>
              <div className={`tile ${getClass("place", g.place)}`}>{g.place}</div>
              <div className={`tile ${getClass("status", g.status)}`}>{g.status}</div>
              <div className={`tile ${getClass("fame", g.fame)}`}>{g.fame}</div>
              <div className={`tile ${getClass("generations", g.generations)}`}>  {g.generations.join(", ")}</div>
              <div className={`tile ${getClass("zodiac", g.zodiac)}`}>{g.zodiac}</div>
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
                {CHARACTERS.map((c) => (
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
    </div>
  );
};

export default VIPdle;
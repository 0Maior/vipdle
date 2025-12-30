import "./vipdle.css";
import React, { useState, useEffect } from 'react';
import { CHARACTERS } from "./data/database";

const VIPdle = () => {
  const [target, setTarget] = useState(null);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);


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

    const lowerValue = value.toLowerCase();

    const matches = CHARACTERS.filter((c) => {
      // normalize to array of names
      const names = Array.isArray(c.names)
        ? c.names
        : Array.isArray(c.name)
        ? c.name
        : [c.name];

      return names.some((fullName) => {
        // split name into words
        const words = fullName.toLowerCase().split(/\s+/);

        // match if ANY word starts with input
        return words.some((word) =>
          word.startsWith(lowerValue)
        );
      });
    });
    
    setSuggestions(matches);
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
  };

  const getClass = (attr, value) => {
    // JOB: partial match allowed
    if (attr === "job") {
      const matches = value.filter(job => target.job.includes(job)).length;

      if (matches === target.job.length && value.length === target.job.length)
        return "correct";

      if (matches > 0)
        return "close";

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

  return (
    <div className="app-bg">
      <div className="game-card">
        <h1 className="title">VIP dle</h1>
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
                        src={c.image}
                        alt={c.name}
                        className="avatar"
                        onError={(e) => {
                          e.target.src = "/images/placeholder.png";
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
                  src={g.image}
                  alt={g.name}
                  className="table-avatar"
                  onError={(e) => {
                    e.target.src = "/images/placeholder.png";
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
      </div>
    </div>
  );
};

export default VIPdle;
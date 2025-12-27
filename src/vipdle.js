import React, { useState, useEffect } from 'react';

// Sample Data Pool
const CHARACTERS = [
  { id: 1, name: "Mario", job: "Plumber", age: 25, height: 155, series: "Nintendo" },
  { id: 2, name: "Gandalf", job: "Wizard", age: 2000, height: 180, series: "Lord of the Rings" },
  { id: 3, name: "Batman", job: "Vigilante", age: 35, height: 188, series: "DC" },
  { id: 4, name: "Spider-Man", job: "Student", age: 17, height: 178, series: "Marvel" },
];

const CharacterWordle = () => {
  const [target, setTarget] = useState(null);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Initialize game: Pick a random character
  useEffect(() => {
    const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    setTarget(randomChar);
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
  };

  const getFeedbackClass = (attr, value) => {
    if (value === target[attr]) return "bg-green-500 text-white"; // Exact match
    if (typeof value === 'number' && Math.abs(value - target[attr]) <= 10) return "bg-yellow-500 text-white"; // Close call
    return "bg-slate-700 text-white"; // No match
  };

  return (
    <div className="flex flex-col items-center p-8 bg-slate-900 min-h-screen text-slate-100">
      <h1 className="text-4xl font-bold mb-8">Character-dle</h1>

      {/* Input Section */}
      {!gameOver && (
        <form onSubmit={handleGuess} className="mb-8 flex gap-2">
          <input 
            className="p-2 rounded text-black"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter character name..."
          />
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">Guess</button>
        </form>
      )}

      {gameOver && <h2 className="text-2xl text-green-400 mb-4">🎉 You found {target.name}!</h2>}

      {/* Results Table */}
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-5 gap-2 mb-2 font-bold text-center border-b border-slate-600 pb-2">
          <div>Name</div>
          <div>Job</div>
          <div>Age</div>
          <div>Height</div>
          <div>Series</div>
        </div>

        {guesses.map((g, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 mb-2 text-center animate-in fade-in slide-in-from-top-4">
            <div className={`p-2 rounded ${getFeedbackClass('name', g.name)}`}>{g.name}</div>
            <div className={`p-2 rounded ${getFeedbackClass('job', g.job)}`}>{g.job}</div>
            <div className={`p-2 rounded ${getFeedbackClass('age', g.age)}`}>
                {g.age} {g.age < target.age ? "↑" : g.age > target.age ? "↓" : ""}
            </div>
            <div className={`p-2 rounded ${getFeedbackClass('height', g.height)}`}>
                {g.height}cm {g.height < target.height ? "↑" : g.height > target.height ? "↓" : ""}
            </div>
            <div className={`p-2 rounded ${getFeedbackClass('series', g.series)}`}>{g.series}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterWordle;
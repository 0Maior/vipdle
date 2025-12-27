import logo from './logo.svg';
import './App.css';

function App() {

  const handleClick = (name, e)  => {
    console.log("Hello" + name, e);
  }

  return (
    <div className="App">
     <header className="App-header">
        <button onClick={(e) => {
          handleClick(" nome", e)
          }}>Button test</button>
      </header>
    </div>
  );
}

export default App;

"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [message, setMessage] = useState<string>("");
  const [playerHand, setPlayerHand] = useState<
    { rank: string; suit: string }[]
  >([]);
  const [dealerHand, setDealerHand] = useState<
    { rank: string; suit: string }[]
  >([]);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const initGame = async () => {
      const response = await fetch("/api", { method: "GET" });
      const data = await response.json();
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setMessage(data.message);
      setScore(data.score);
    };
    initGame();
  }, []);

  async function handleHit() {
    const response = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({ action: "hit" }),
    });
    const data = await response.json();
    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  }
  async function handleStand() {
    const response = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({ action: "stand" }),
    });
    const data = await response.json();
    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  }
  async function handleReset() {
    const response = await fetch("/api", { method: "GET" });
    const data = await response.json();
    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen bg-gray-300">
      <h1 className="text-4xl bold">Welcome to Web3 Game Black Jack</h1>
      <h2
        className={`text-2xl bold mt-2 ${
          message.includes("win") ? "bg-green-500" : "bg-amber-500"
        }`}
      >
        Score: {score} <br /> {message}
      </h2>

      <div className="mt-4">
        <h2>Dealer's hand</h2>
        <div className="flex flex-row gap-2">
          {dealerHand.map((card, index) => (
            <div
              key={index}
              className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between"
            >
              <p className="self-start p-2 text-lg">{card.rank}</p>
              <p className="self-center p-2 text-3xl">{card.suit}</p>
              <p className="self-end p-2 text-lg">{card.rank}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2>Player's hand</h2>
        <div className="flex flex-row gap-2">
          {playerHand.map((card, index) => (
            <div
              key={index}
              className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between"
            >
              <p className="self-start p-2 text-lg">{card.rank}</p>
              <p className="self-center p-2 text-3xl">{card.suit}</p>
              <p className="self-end p-2 text-lg">{card.rank}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-row gap-2 mt-6">
        {message === "" ? (
          <>
            <button onClick={handleHit} className="bg-amber-300 rounded-md p-2">
              Hit
            </button>
            <button
              onClick={handleStand}
              className="bg-blue-400 rounded-md p-2"
            >
              Stand
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleReset}
              className="bg-red-500 rounded-md p-2 text-amber-50"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

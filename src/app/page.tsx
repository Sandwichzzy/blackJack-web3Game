"use client";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import {
  parseAbi,
  createPublicClient,
  createWalletClient,
  custom,
  type PublicClient,
  type WalletClient,
} from "viem";
import { avalancheFuji } from "viem/chains";

export default function Page() {
  const [message, setMessage] = useState<string>("");
  const [playerHand, setPlayerHand] = useState<
    { rank: string; suit: string }[]
  >([]);
  const [dealerHand, setDealerHand] = useState<
    { rank: string; suit: string }[]
  >([]);
  const [score, setScore] = useState<number>(0);
  const { address } = useAccount();
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const { signMessageAsync } = useSignMessage();
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [isTxLoading, setIsTxLoading] = useState<boolean>(false);

  const initGame = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api?address=${address}`, {
        method: "GET",
      });
      const data = await response.json();
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setMessage(data.message);
      setScore(data.score);
      if (typeof window !== "undefined" && window.ethereum) {
        const publicClient = createPublicClient({
          chain: avalancheFuji,
          transport: custom(window.ethereum),
        });
        const walletClient = createWalletClient({
          chain: avalancheFuji,
          transport: custom(window.ethereum),
        });
        setPublicClient(publicClient);
        setWalletClient(walletClient);
      } else {
        console.error("window.ethereum is not available");
      }
    } catch (error) {
      console.error("Failed to initialize game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleHit() {
    setIsLoading(true);
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
        },
        body: JSON.stringify({ action: "hit", address }),
      });
      const data = await response.json();
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setMessage(data.message);
      setScore(data.score);
    } catch (error) {
      console.error("Failed to hit:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStand() {
    setIsLoading(true);
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
        },
        body: JSON.stringify({ action: "stand", address }),
      });
      const data = await response.json();
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setMessage(data.message);
      setScore(data.score);
    } catch (error) {
      console.error("Failed to stand:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api?address=${address}`, {
        method: "GET",
      });
      const data = await response.json();
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setMessage(data.message);
      setScore(data.score);
    } catch (error) {
      console.error("Failed to reset:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendTx() {
    if (!publicClient || !walletClient || !address) return;

    setIsTxLoading(true);
    try {
      //get contract address
      const contractAddress = process.env
        .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
      //get abi
      const contractAbi = parseAbi([
        process.env.NEXT_PUBLIC_CONTRACT_ABI || "",
      ]);
      //Viem
      //publicClient -> simulate -> sendTx
      await publicClient.simulateContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "sendRequest",
        args: [[address], address],
        account: address,
      });
      //walletClient ->writeContract
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "sendRequest",
        args: [[address], address],
        account: address,
        chain: avalancheFuji,
      });
      console.log("txHash:", txHash);
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsTxLoading(false);
    }
  }

  async function handleSign() {
    setIsSigning(true);
    try {
      const message = `Welcome to web3 game black jack at ${new Date().toString()}`;
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api", {
        method: "POST",
        body: JSON.stringify({ action: "auth", address, message, signature }),
      });
      if (response.status === 200) {
        const { jsonwebtoken } = await response.json();
        localStorage.setItem("jwt", jsonwebtoken);
        setIsSigned(true);
        await initGame();
      }
    } catch (error) {
      console.error("Sign failed:", error);
    } finally {
      setIsSigning(false);
    }
  }

  if (!isSigned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-700 flex flex-col items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🎰 BlackJack</h1>
            <p className="text-cyan-100 text-lg">Web3 黑杰克游戏</p>
          </div>

          <div className="mb-6">
            <ConnectButton />
          </div>

          <button
            onClick={handleSign}
            disabled={isSigning}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95"
          >
            {isSigning ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                签名中...
              </div>
            ) : (
              "连接钱包开始游戏"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-700 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">🎰 BlackJack</h1>
            <p className="text-cyan-100 text-xl">Web3 黑杰克游戏</p>
          </div>
          <ConnectButton />
        </div>

        {/* Score and Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">当前分数</h2>
              <div
                className={`text-4xl font-bold px-6 py-3 rounded-xl ${
                  score > 0
                    ? "bg-green-500/80 text-white"
                    : score < 0
                    ? "bg-red-500/80 text-white"
                    : "bg-gray-500/80 text-white"
                }`}
              >
                {score}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">游戏状态</h2>
              <div
                className={`text-xl px-6 py-3 rounded-xl ${
                  message.includes("win")
                    ? "bg-green-500/80 text-white"
                    : message.includes("lose")
                    ? "bg-red-500/80 text-white"
                    : message.includes("tie")
                    ? "bg-yellow-500/80 text-white"
                    : "bg-blue-500/80 text-white"
                }`}
              >
                {message || "游戏进行中"}
              </div>
            </div>

            <button
              onClick={handleSendTx}
              disabled={isTxLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95"
            >
              {isTxLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  处理中...
                </div>
              ) : (
                "🎁 领取 NFT"
              )}
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dealer's Hand */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              庄家的牌
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {dealerHand.map((card, index) => (
                <div
                  key={index}
                  className="w-24 h-32 bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300 rounded-xl flex flex-col justify-between p-2 shadow-lg transform hover:scale-110 transition-transform duration-200"
                >
                  <p className="self-start text-sm font-bold text-gray-800">
                    {card.rank}
                  </p>
                  <p className="self-center text-2xl text-gray-700">
                    {card.suit}
                  </p>
                  <p className="self-end text-sm font-bold text-gray-800">
                    {card.rank}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Player's Hand */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              玩家的牌
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {playerHand.map((card, index) => (
                <div
                  key={index}
                  className="w-24 h-32 bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300 rounded-xl flex flex-col justify-between p-2 shadow-lg transform hover:scale-110 transition-transform duration-200"
                >
                  <p className="self-start text-sm font-bold text-gray-800">
                    {card.rank}
                  </p>
                  <p className="self-center text-2xl text-gray-700">
                    {card.suit}
                  </p>
                  <p className="self-end text-sm font-bold text-gray-800">
                    {card.rank}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="mt-8 text-center">
          {message === "" ? (
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleHit}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    处理中...
                  </div>
                ) : (
                  "🎯 要牌 (Hit)"
                )}
              </button>

              <button
                onClick={handleStand}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    处理中...
                  </div>
                ) : (
                  "✋ 停牌 (Stand)"
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  重置中...
                </div>
              ) : (
                "🔄 重新开始"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// save the score into the database
// get and put score with tables in database
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { verifyMessage } from "viem";
import jwt from "jsonwebtoken";

//初始化DynamoDB客户端
const client = new DynamoDBClient({
  region: "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_USER_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "blackJack";

async function writeScore(player: string, score: number): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      player: player, //分区键
      score: score, //存储分数
    },
  };
  try {
    await docClient.send(new PutCommand(params));
    console.log(`Score for ${player} updated to ${score}`);
  } catch (error) {
    throw new Error("Error putting item in DynamoDB: " + error);
  }
}

async function readScore(player: string): Promise<number | null> {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      player: player, //分区键
    },
  };
  try {
    const response = await docClient.send(new GetCommand(params));
    if (response.Item) {
      console.log(`Score for ${player} is ${response.Item.score}`);
      return response.Item.score as number;
    } else {
      console.log(`No score found for ${player}`);
      return null;
    }
  } catch (error) {
    throw new Error("Error reading score from DynamoDB: " + error);
  }
}

// when the game is inited, the player and dealer will be given 2 random cards respectively
export interface Card {
  rank: string;
  suit: string;
}
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const suits = ["♠", "♥", "♣", "♦"];
const initialDeck = ranks
  .map((rank) => suits.map((suit) => ({ rank: rank, suit: suit })))
  .flat();

const gameState: {
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  message: string;
  score: number;
} = {
  playerHand: [],
  dealerHand: [],
  deck: initialDeck,
  message: "",
  score: 0,
}; //最好不要用gamestate管理，直接和数据库交互

function getRandomCards(deck: Card[], count: number) {
  const randomIndexSet = new Set<number>();
  while (randomIndexSet.size < count) {
    randomIndexSet.add(Math.floor(Math.random() * deck.length));
  }
  const randomCards = deck.filter((_, index) => randomIndexSet.has(index));
  const remainingDeck = deck.filter((_, index) => !randomIndexSet.has(index));

  return [randomCards, remainingDeck];
}

function calculateHandValue(hand: Card[]) {
  let value = 0;
  let aceCount = 0;
  hand.forEach((card) => {
    if (card.rank === "A") {
      value += 11;
      aceCount++;
    } else if (card.rank === "J" || card.rank === "Q" || card.rank === "K") {
      value += 10;
    } else {
      value += parseInt(card.rank);
    }
  });
  while (value > 21 && aceCount > 0) {
    value -= 10;
    aceCount--;
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return new Response(JSON.stringify({ message: "Address is required" }), {
      status: 400,
    });
  }

  //reset the game state
  gameState.playerHand = [];
  gameState.dealerHand = [];
  gameState.message = "";
  gameState.deck = initialDeck;

  const [playerCards, remainingDeck] = getRandomCards(gameState.deck, 2);
  const [dealerCards, newDeck] = getRandomCards(remainingDeck, 2);
  gameState.deck = newDeck;
  gameState.playerHand = playerCards;
  gameState.dealerHand = dealerCards;
  gameState.message = "";

  try {
    const data = await readScore(address);
    if (!data) {
      gameState.score = 0;
    } else {
      gameState.score = data;
    }
  } catch (error) {
    console.error("Error initializing game state:", error);
    return new Response(
      JSON.stringify({ message: "error fetching data from dynamoDB" }),
      { status: 500 }
    );
  }

  return new Response(
    JSON.stringify({
      playerHand: gameState.playerHand,
      dealerHand: [gameState.dealerHand[0], { rank: "?", suit: "?" }],
      message: gameState.message,
      score: gameState.score,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, address } = body;

  if (action === "auth") {
    const { message, signature } = body;
    const isValid = await verifyMessage({
      address,
      message,
      signature,
    });
    if (!isValid) {
      return new Response(JSON.stringify({ message: "Invalid signature" }), {
        status: 400,
      });
    } else {
      const token = jwt.sign({ address }, process.env.JWT_SECRET || "", {
        expiresIn: "1h",
      });
      return new Response(
        JSON.stringify({ message: "Valid signature", jsonwebtoken: token }),
        {
          status: 200,
        }
      );
    }
  }

  //check if the token is valid
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ message: "Token is required" }), {
      status: 401,
    });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
    address: string;
  };
  if (decoded.address.toLowerCase() !== address.toLowerCase()) {
    return new Response(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }

  if (action === "hit") {
    //when hit is clicked, get a random card from the deck and add it to the player hand
    const [cards, newDeck] = getRandomCards(gameState.deck, 1);
    gameState.playerHand.push(...cards);
    gameState.deck = newDeck;

    //calculate player hand value
    //if player hand value is 21: player wins, black jack
    const playerValue = calculateHandValue(gameState.playerHand);
    if (playerValue === 21) {
      gameState.message = "Black Jack! Player wins!";
      gameState.score += 100;
    }
    //if player hand value is over 21: player loses, bust
    else if (playerValue > 21) {
      gameState.message = "Bust! Player loses!";
      gameState.score -= 100;
    }
    //if player hand value is less than 21: player can choose to hit or stand
  } else if (action === "stand") {
    //when stand is clicked , the dealer will get a random card from the deck and add it to the dealer hand
    //keep doing this until dealer has 17 or more points
    while (calculateHandValue(gameState.dealerHand) < 17) {
      const [randomCards, newDeck] = getRandomCards(gameState.deck, 1);
      gameState.deck = newDeck;
      gameState.dealerHand.push(...randomCards);
    }
    //calculate dealer hand value
    const dealerValue = calculateHandValue(gameState.dealerHand);
    //dealer hand value is 21:player loses, dealer black jack
    if (dealerValue === 21) {
      gameState.message = "Black Jack! Player loses!";
      gameState.score -= 100;
    }
    //dealer hand value is over 21: player wins, dealer bust
    else if (dealerValue > 21) {
      gameState.message = "Bust! Player wins!";
      gameState.score += 100;
    }
    //dealer hand is less than 21
    else {
      //compare with player hand value
      const playerValue = calculateHandValue(gameState.playerHand);
      if (playerValue > dealerValue) {
        gameState.message = "Player wins!";
        gameState.score += 100;
      } else if (playerValue < dealerValue) {
        gameState.message = "Player loses!";
        gameState.score -= 100;
      } else {
        gameState.message = "Draw!";
        gameState.score += 0;
      }
    }
  } else {
    return new Response(
      JSON.stringify({
        error: "Invalid action",
      }),
      {
        status: 400,
      }
    );
  }

  try {
    await writeScore(address, gameState.score);
  } catch (error) {
    console.error("Error writing score to DynamoDB:", error);
    return new Response(
      JSON.stringify({ message: "error writing score to dynamoDB" }),
      { status: 500 }
    );
  }

  return new Response(
    JSON.stringify({
      playerHand: gameState.playerHand,
      dealerHand:
        gameState.message === ""
          ? [gameState.dealerHand[0], { rank: "?", suit: "?" } as Card]
          : gameState.dealerHand,
      message: gameState.message,
      score: gameState.score,
    }),
    {
      status: 200,
    }
  );
}

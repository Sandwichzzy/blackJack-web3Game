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
};

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

export function GET() {
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
  const { action } = await request.json();
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

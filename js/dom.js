/*----- Cached Element References  -----*/
// Landing page elements
const landingPage = document.getElementById("landing");
const startBtn = document.getElementById("startBtn");

// Game header and timer
const gameHeader = document.getElementById("gameHeader");
const timerDisplay = document.getElementById("timer");

// Jam progress bar
const jamBar = document.getElementById("jamBar");

// Garden container where bushes will be created
const garden = document.getElementById("garden");

// End screen overlay and message
const endScreenOverlay = document.getElementById("endScreenOverlay");
const endScreen = document.getElementById("endScreen");
const endMessage = document.getElementById("endMessage");
const restartBtn = document.getElementById("restart");

// Sounds
const squishSound = document.getElementById("squishSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");

/*---------- Variables (state) ---------*/
// Tracks current jam progress
let jam = 0;

// Tracks countdown timer
let timeLeft = GAME_SETTINGS.timeLimit;

// Flag to temporarily block clicks (used for caterpillar special)
let clickInputLocked = false;

/*-------------- Functions -------------*/
// Updates the visible timer on the page; does not change the timeLeft itself
function updateTimerDisplay() {
  timerDisplay.textContent = `${timeLeft}s`;
}

// Shows the main game UI, called when game starts
function startGameUI() {
  landingPage.classList.add("hidden");
  gameHeader.classList.remove("hidden");
}

// Shows end screen overlay with message
function showEndScreen(message) {
  endMessage.textContent = message;
  endScreenOverlay.style.display = "flex";

// Add a smooth pop-in animation using requestAnimationFrame
  requestAnimationFrame(() => {
    endScreen.classList.add("show");
  });
}

// Creates the bushes in the garden grid
function createBushes() {
  garden.innerHTML = ""; // Clear any existing bushes

  const total = GAME_SETTINGS.rows * GAME_SETTINGS.cols; // total number of bushes

  for (let i = 0; i < total; i++) {
    // Create bush container
    const bush = document.createElement("div");
    bush.className = "bush";
    bush.dataset.stage = stages.EMPTY; // track current berry stage for this bush

    // Tree icon (🌳) always visible
    const icon = document.createElement("div");
    icon.className = "bush-icon";
    icon.textContent = "🌳";

    // Berry element (will hold 🫐, 🍇, 🍓, 🍒)
    const berry = document.createElement("div");
    berry.className = "berry";

    // Assemble the bush
    bush.appendChild(icon);
    bush.appendChild(berry);
    garden.appendChild(bush);
  }
}

// When the page finishes loading, create static bushes in the garden
document.addEventListener("DOMContentLoaded", () => {
  createBushes(); // bushes always visible
});

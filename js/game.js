/*---------- Variables (state) ---------*/
let berryIntervals = []; // Stores all intervals for berry growth so they can be stopped later
let specialInterval = null; // Interval for spawning specials (caterpillars or bunnies)
let timerInterval = null;
let gameOver = false;
let firstPlay = true;

/* START / RESTART */
// unlock audio on first click ten start game UI and logic
startBtn.onclick = () => {
  squishSound.play().catch(() => {});
  squishSound.pause();
  squishSound.currentTime = 0;

  startGameUI();
  startGame();
};

restartBtn.onclick = () => {
  resetGame();
  startGameUI();
  startGame();
};

/*-------------- Functions -------------*/
function resetGame() {
  // Resets the game state, clears timers, resets UI and bush states
  endScreenOverlay.style.display = "none";
  endScreen.classList.remove("show");
  gameOver = false;
  jam = 0;
  timeLeft = GAME_SETTINGS.timeLimit;
  clickInputLocked = false;

  // Stop all berry growth intervals
  berryIntervals.forEach((id) => clearInterval(id));
  clearInterval(specialInterval);
  clearInterval(timerInterval);
  berryIntervals = [];

  // Reset jam bar and timer display
  jamBar.style.width = "0%";
  updateTimerDisplay();

  // Enable clicks on the garden
  garden.style.pointerEvents = "auto";

  // Reset each bush to empty state
  garden.querySelectorAll(".bush").forEach((bush) => {
    const berry = bush.querySelector(".berry");
    berry.textContent = "";
    berry.className = "berry";
    bush.dataset.stage = stages.EMPTY;
    bush.onclick = null;
  });

  if (firstPlay) {
    // Hide restart button for first play
    document.getElementById("restart").style.display = "none";
  }
}

/* STARTING THE GAME */
function startGame() {
  // Starts the game: resets state, ensures bushes exist, and starts all systems
  resetGame();

  if (garden.children.length === 0) {
    createBushes();
  }

  startBerryGrowth(); // Handles berry lifecycle (growth, ripe, rotten)
  startSpecialTargets(); // Spawns special targets (caterpillar/bunny)
  startTimer(); // Starts countdown timer
}

/* TIMER */
function startTimer() {
  // Countdown timer: decreases every second, updates display, checks for lose condition
  timerInterval = setInterval(() => {
    if (gameOver) return;

    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) loseGame();
  }, 1000); //1000 milliseconds === 1 second, runs once every second
}

/* BERRY GROWTH */
// controls the full berry lifecycle for each bush (Visual classes reflect state, dataset.stage tracks internal state)
function startBerryGrowth() {
  const bushes = garden.querySelectorAll(".bush");

  bushes.forEach((bush) => {
    const berry = bush.querySelector(".berry");

    const intervalId = setInterval(() => {
      if (gameOver) return;

      const stage = Number(bush.dataset.stage);

      // Skip bushes with specials
      if (stage === stages.SPECIAL) return;

      const currentBerries = document.querySelectorAll(
        ".berry.growing, .berry.ripe, .berry.rotten"
      ).length;
      if (currentBerries >= 6 && stage === stages.EMPTY) return; // only 6 berries can populate at a time to cap clutter

      // Empty → Growing
      if (stage === stages.EMPTY) {
        if (Math.random() < 0.8) return; // 20% change to spawn
        const fruit = berries[Math.floor(Math.random() * berries.length)];
        berry.textContent = fruit;
        berry.className = "berry growing";
        bush.dataset.stage = stages.GROWING;
        return;
      }

      // Growing → Ripe
      if (stage === stages.GROWING) {
        berry.className = "berry ripe";
        bush.dataset.stage = stages.RIPE;

        // Ripe → Rotten
        setTimeout(() => {
          if (Number(bush.dataset.stage) !== stages.RIPE || gameOver) return;
          berry.className = "berry rotten";
          bush.dataset.stage = stages.ROTTEN;

          // Rotten → auto-drop penalty
          setTimeout(() => {
            if (Number(bush.dataset.stage) === stages.ROTTEN && !gameOver) {
              jam -= 5; // penalty: lose 5 jam points for letting the berry rot
              if (jam < 0) jam = 0;
              jamBar.style.width = jam + "%";

              berry.textContent = "";
              berry.className = "berry";
              bush.dataset.stage = stages.EMPTY;
            }
          }, 1000); // after turning rotten, apply penalty 1 second later
        }, 1500); // after berry stays ripe for 1.5 seconds, it rots
        return;
      }
    }, 1200 + Math.random() * 1300); // makes berries grow at slightly random speeds

    berryIntervals.push(intervalId);

    /* CLICK HANDLER */
    bush.onclick = () => {
      if (clickInputLocked || gameOver) return;

      const stage = Number(bush.dataset.stage); // converts the string to a number for the berry stages

      if (stage === stages.SPECIAL || stage === stages.GROWING) return; // Ignore clicks on special targets or growing berries

      if (stage === stages.RIPE) {
        bush.dataset.stage = stages.EMPTY;
        berry.textContent = "💥";
        squishSound.currentTime = 0;
        squishSound.play();
        updateJam(GAME_SETTINGS.jamPerBerry);

        setTimeout(() => {
          berry.textContent = "";
          berry.className = "berry";
        }, 250); // resets the visual after 250 milliseconds
        return;
      }

      // Clicking rotten berry: clears it
      if (stage === stages.ROTTEN) {
        bush.dataset.stage = stages.EMPTY;
        berry.textContent = "";
        berry.className = "berry";
      }
    };
  });
}

/* SPECIAL TARGETS */
const SPECIAL_DURATION = 4000; // Specials will stay on screen for 4 seconds === 4000ms

// Resets a bush to normal click behavior after special disappears
function restoreNormalBushClick(bush) {
  const berry = bush.querySelector(".berry");
  bush.onclick = () => {
    if (clickInputLocked || gameOver) return;

    const stage = Number(bush.dataset.stage);
    if (stage === stages.SPECIAL || stage === stages.GROWING) return;

    if (stage === stages.RIPE) {
      bush.dataset.stage = stages.EMPTY;
      berry.textContent = "💥";
      squishSound.currentTime = 0;
      squishSound.play();
      updateJam(GAME_SETTINGS.jamPerBerry);

      setTimeout(() => {
        berry.textContent = "";
        berry.className = "berry";
      }, 250);
    }

    if (stage === stages.ROTTEN) {
      bush.dataset.stage = stages.EMPTY;
      berry.textContent = "";
      berry.className = "berry";
    }
  };
}

// Spawn a special in a bush
function spawnSpecial(bush) {
  const berry = bush.querySelector(".berry");
  const roll = Math.random(); // random number between 0 and 1

  bush.dataset.stage = stages.SPECIAL;
  berry.className = "berry";

  // Caterpillar: penalizes time and locks input
  if (roll < 0.5) {
    // 50% chance to spawn
    berry.textContent = "🐛";
    bush.onclick = () => {
      if (clickInputLocked || gameOver) return;

      clickInputLocked = true;
      timeLeft -= GAME_SETTINGS.caterpillarPenalty;
      if (timeLeft < 0) timeLeft = 0;
      updateTimerDisplay();

      const overlay = document.getElementById("clickOverlay");
      overlay.style.display = "block";

      setTimeout(() => {
        clickInputLocked = false;
        overlay.style.display = "none";
      }, 3000); // can click again after 3 seconds

      berry.textContent = "";
      bush.dataset.stage = stages.EMPTY;
      restoreNormalBushClick(bush);
    };

    setTimeout(() => {
      if (
        Number(bush.dataset.stage) === stages.SPECIAL &&
        berry.textContent === "🐛"
      ) {
        berry.textContent = "";
        bush.dataset.stage = stages.EMPTY;
        restoreNormalBushClick(bush);
      }
    }, SPECIAL_DURATION); // caterpillar despawns if not clicked in time
  }

  // Bunny: adds extra time
  else if (roll < 0.7) {
    // 20% chance to spawn
    berry.textContent = "🐇";
    bush.onclick = () => {
      if (clickInputLocked || gameOver) return;

      timeLeft += GAME_SETTINGS.bunnyBonus;
      updateTimerDisplay();

      berry.textContent = "";
      bush.dataset.stage = stages.EMPTY;
      restoreNormalBushClick(bush);
    };

    setTimeout(() => {
      if (
        Number(bush.dataset.stage) === stages.SPECIAL &&
        berry.textContent === "🐇"
      ) {
        berry.textContent = "";
        bush.dataset.stage = stages.EMPTY;
        restoreNormalBushClick(bush);
      }
    }, SPECIAL_DURATION); // bunny despawns if not clicked in time
  }
}

// Periodically spawn specials in random empty bushes
function startSpecialTargets() {
  specialInterval = setInterval(() => {
    if (gameOver) return;

    const bushes = Array.from(garden.querySelectorAll(".bush")); // converts to an array for filtering
    const emptyBushes = bushes.filter(
      (b) => Number(b.dataset.stage) === stages.EMPTY // only currently empty bushes are considered
    );
    if (emptyBushes.length === 0) return; // prevents overlap if bush is not empty

    const bush = emptyBushes[Math.floor(Math.random() * emptyBushes.length)]; // randomly selects the bush
    spawnSpecial(bush);
  }, 4000 + Math.random() * 3000); // between 4 and 7 seconds this runs
}

/* JAM UPDATES */
// Updates jam progress bar and checks win condition
function updateJam(amount) {
  jam += amount;
  if (jam > 100) jam = 100;
  jamBar.style.width = jam + "%";
  if (jam >= 100) winGame();
}

/* WIN / LOSE */
function winGame() {
  winSound.currentTime = 0;
  winSound.play();
  endGame("🎉 You Win! Your jam is delicious! 😋");
}

function loseGame() {
  loseSound.currentTime = 0;
  loseSound.play();
  endGame("⏳ Time’s up! Not enough jam! 😞");
}

/* END GAME HANDLER */
// Ends the game: stops all timers, disables input, shows end screen
function endGame(message) {
  gameOver = true;

  clearInterval(timerInterval);
  clearInterval(specialInterval);
  berryIntervals.forEach((id) => clearInterval(id));

  garden.style.pointerEvents = "none";
  garden.querySelectorAll(".bush").forEach((bush) => (bush.onclick = null));

  showEndScreen(message);

  document.getElementById("restart").style.display = "block";
  firstPlay = false;
}

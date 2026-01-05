/*---------- Variables (state) ---------*/
let berryIntervals = []; // Stores all intervals for berry growth so they can be stopped later
let specialInterval = null; // Interval for spawning specials (caterpillars or bunnies)
let timerInterval = null;
let gameOver = false;
let firstPlay = true;

/* START / RESTART */
// unlock audio on first click then start game UI and logic
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
    document.getElementById("restart").style.display = "none";
  }
}

/* STARTING THE GAME */
function startGame() {
  resetGame();

  if (garden.children.length === 0) {
    createBushes();
  }

  startBerryGrowth();
  startSpecialTargets();
  startTimer();
}

/* TIMER */
function startTimer() {
  timerInterval = setInterval(() => {
    if (gameOver) return;

    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) loseGame();
  }, 1000);
}

/* BERRY GROWTH */
function startBerryGrowth() {
  const bushes = garden.querySelectorAll(".bush");

  bushes.forEach((bush) => {
    const berry = bush.querySelector(".berry");

    const intervalId = setInterval(() => {
      if (gameOver) return;

      const stage = Number(bush.dataset.stage);

      if (stage === stages.SPECIAL) return;

      const currentBerries = document.querySelectorAll(
        ".berry.growing, .berry.ripe, .berry.rotten"
      ).length;
      if (currentBerries >= 6 && stage === stages.EMPTY) return;

      if (stage === stages.EMPTY) {
        if (Math.random() < 0.8) return;
        const fruit = berries[Math.floor(Math.random() * berries.length)];
        berry.textContent = fruit;
        berry.className = "berry growing";
        bush.dataset.stage = stages.GROWING;
        return;
      }

      if (stage === stages.GROWING) {
        berry.className = "berry ripe";
        bush.dataset.stage = stages.RIPE;

        setTimeout(() => {
          if (Number(bush.dataset.stage) !== stages.RIPE || gameOver) return;
          berry.className = "berry rotten";
          bush.dataset.stage = stages.ROTTEN;

          setTimeout(() => {
            if (Number(bush.dataset.stage) === stages.ROTTEN && !gameOver) {
              jam -= 5;
              if (jam < 0) jam = 0;
              jamBar.style.width = jam + "%";

              berry.textContent = "";
              berry.className = "berry";
              bush.dataset.stage = stages.EMPTY;
            }
          }, 1000);
        }, 1500);
        return;
      }
    }, 1200 + Math.random() * 1300);

    berryIntervals.push(intervalId);

    /* CLICK HANDLER */
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
        return;
      }

      if (stage === stages.ROTTEN) {
        bush.dataset.stage = stages.EMPTY;
        berry.textContent = "";
        berry.className = "berry";
      }
    };
  });
}

/* SPECIAL TARGETS */
const SPECIAL_DURATION = 4000;

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

function spawnSpecial(bush) {
  const berry = bush.querySelector(".berry");
  const roll = Math.random();

  bush.dataset.stage = stages.SPECIAL;
  berry.className = "berry";

  // Caterpillar
  if (roll < 0.5) {
    berry.textContent = "🐛";

    bush.onclick = () => {
      if (clickInputLocked || gameOver) return;

      clickInputLocked = true;
      timeLeft -= GAME_SETTINGS.caterpillarPenalty;
      if (timeLeft < 0) timeLeft = 0;
      updateTimerDisplay();

      const overlay = document.getElementById("clickOverlay");
      const msg = document.getElementById("clickOverlayMessage");

      // BLOCK INPUT
      overlay.style.display = "block";

      // SHOW MESSAGE
      msg.classList.add("show");

      if (navigator.vibrate) navigator.vibrate(150);

      setTimeout(() => {
        clickInputLocked = false;
        overlay.style.display = "none";
        msg.classList.remove("show");
      }, 3000);

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
    }, SPECIAL_DURATION);
  }

  // Bunny unchanged
  else if (roll < 0.7) {
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
    }, SPECIAL_DURATION);
  }
}

function startSpecialTargets() {
  specialInterval = setInterval(() => {
    if (gameOver) return;

    const bushes = Array.from(garden.querySelectorAll(".bush"));
    const emptyBushes = bushes.filter(
      (b) => Number(b.dataset.stage) === stages.EMPTY
    );
    if (emptyBushes.length === 0) return;

    const bush = emptyBushes[Math.floor(Math.random() * emptyBushes.length)];
    spawnSpecial(bush);
  }, 4000 + Math.random() * 3000);
}

/* JAM UPDATES */
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

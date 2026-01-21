/**
 * Catch'em Coast
 * Dylan Samaan
 */

"use strict";

// ASSETS
let archeopsImg; // archeops sprite
let pidgeotImg; // pidgeot sprite
let emolgaImg; // emolga sprite

let pkClosed; // closed pokeball image
let pkOpen; // open pokeball image
let pkThrown; // thrown pokeball animation

let scapeImg; // background landscape
let pixelFont; // retro font

// SOUNDS
let track; // background music
let oversnd; // game over sound
let catchsnd; // catch sound
let throwsnd; // throw sound

// GAME STATE
let gameStart = true; // show title screen initially
let gameOver = false; // becomes true when timer hits 0
let isPaused = false; // pause toggle

// HUD
let score = 0; // player's score
let timer = 30; // countdown timer (seconds)
let lastSecond = 0; // ms at last second tick

// PARTICLES
let sparkles = []; // simple sparkle particles on catch

// MONS
let mons = []; // active mons array

// PLAYER BALL
const ball = {
  body: {
    x: 320,
    y: 0,
    vy: 0,
    size: 80,
    state: "idle", // idle,thrown,reloadPause,reloading,caught
    hasCaught: false,
    reloadTimer: 0,
    catchTimer: 0,
  },
};

/*
   PRELOAD
   images + sounds
   */
function preload() {
  // the three different mons
  archeopsImg = loadImage("assets/pkhunt/archeops.webp");
  pidgeotImg = loadImage("assets/pkhunt/pidgeot.webp");
  emolgaImg = loadImage("assets/pkhunt/emolga.png");

  // the player ball
  pkClosed = loadImage("assets/pkhunt/pkball-closed.png");
  pkOpen = loadImage("assets/pkhunt/pkball-open.png");
  pkThrown = loadImage("assets/pkhunt/pkball-thrown.gif");

  // backgroud and text font
  scapeImg = loadImage("assets/pkhunt/landscape.png");
  pixelFont = loadFont("assets/PressStart2P-Regular.ttf");

  // sounds
  track = loadSound("assets/pkhunt/BW2Track.mp3");
  oversnd = loadSound("assets/pkhunt/gameover.wav");
  catchsnd = loadSound("assets/pkhunt/pkcatch.mp3");
  throwsnd = loadSound("assets/pkhunt/pkthrow.mp3");
}

/*
   SETUP
   prepare canvas + initial entities
   */
function setup() {
  // keep same aspect ratio as other projects
  const aspect = 1280 / 1080;
  let targetHeight = windowHeight;
  let targetWidth = targetHeight * aspect;
  if (targetWidth > windowWidth) {
    targetWidth = windowWidth;
    targetHeight = targetWidth / aspect;
  }

  createCanvas(targetWidth, targetHeight);
  imageMode(CENTER);
  textFont(pixelFont);

  // audio volume defaults
  if (track && track.setVolume) track.setVolume(0.2);
  if (throwsnd && throwsnd.setVolume) throwsnd.setVolume(0.4);
  if (oversnd && oversnd.setVolume) oversnd.setVolume(0.3);
  if (catchsnd && catchsnd.setVolume) catchsnd.setVolume(0.3);

  // seed mons
  mons = [];
  mons.push(createMon("archeops"));
  mons.push(createMon("pidgeot"));
  mons.push(createMon("emolga"));

  // position ball on ground
  ball.body.y = height - ball.body.size / 2 - 25;
  ball.body.state = "idle";

  // HUD timing
  lastSecond = millis();
}

/*
   WINDOW RESIZE
   keep aspect on resize
   */
function windowResized() {
  const aspect = 1280 / 1080;
  let targetHeight = windowHeight;
  let targetWidth = targetHeight * aspect;
  if (targetWidth > windowWidth) {
    targetWidth = windowWidth;
    targetHeight = targetWidth / aspect;
  }
  resizeCanvas(targetWidth, targetHeight);
}

/*
   MAIN DRAW LOOP
   handles title, gameplay, pause, and gameover
   */
function draw() {
  // Title screen
  if (gameStart) {
    background("#D0D0D0");
    textAlign(CENTER, CENTER);
    textFont(pixelFont);
    textSize(96);
    stroke(0);
    strokeWeight(8);
    fill(255);
    text("CATCH'EM COAST", width / 2, height / 2 - 100);
    drawStartButton();
    return;
  }

  // Draw background
  clear();
  imageMode(CORNER);
  if (scapeImg) image(scapeImg, 0, 0, width, height);

  // Gameplay updates only when not paused and not game over
  if (!isPaused && !gameOver) {
    // update mons, ball, particles, timer
    drawMon();
    drawBall();
    updateSparkles();
    moveMon();
    moveBall();
    checkCatch();

    // handle countdown timer
    if (millis() - lastSecond > 1000) {
      timer--;
      lastSecond = millis();
    }

    // time ran out = game over
    if (timer <= 0) {
      timer = 0;
      gameOver = true;
      noLoop(); // stop draw loop until restart

      // audio + game over UI
      track && track.stop();
      oversnd && oversnd.play();

      background(0);
      textAlign(CENTER, CENTER);
      textFont(pixelFont);
      textSize(96);
      stroke(0);
      strokeWeight(8);
      fill(255, 0, 0);
      text("GAME OVER", width / 2, height / 2 - 100);

      textSize(40);
      fill(235, 205, 0);
      noStroke();
      text(`SCORE: ${nf(score, 4)}`, width / 2, height / 2);

      drawTryAgainButton();
      return; // stop further draw work this frame
    }
  }

  // Always draw mons, ball, HUD and pause icon
  drawMon();
  drawBall();
  drawHUD();
  drawPauseIcon();

  // hide cursor during active play
  noCursor();

  // show paused overlay if paused
  if (isPaused && !gameOver) {
    push();
    rectMode(CENTER);
    noStroke();
    fill(0, 0, 0, 140);
    rect(width / 2, height / 2, 500, 150, 20);
    textAlign(CENTER, CENTER);
    textFont(pixelFont);
    textSize(48);
    fill(255, 255, 0);
    text("PAUSED", width / 2, height / 2);
    pop();
  }
}

/*
   HUD
   score & timer display
   */
function drawHUD() {
  push();
  textFont(pixelFont);
  textSize(38);
  noStroke();

  // Score
  textAlign(LEFT, TOP);
  fill(0);
  text(`SCORE: ${nf(score, 4)}`, 32, 32);
  fill(235, 203, 0);
  text(`SCORE: ${nf(score, 4)}`, 30, 30);

  // Timer
  textAlign(RIGHT, TOP);
  fill(0);
  text(`TIME: ${timer}`, width - 58, 32);
  fill(235, 203, 0);
  text(`TIME: ${timer}`, width - 60, 30);

  pop();
}

/*
   MON MOVEMENT & WRAP
   handles motion, capture animation and recycling
   */
function moveMon() {
  for (let Mon of mons) {
    // if currently being captured, lerp to ball and shrink
    if (Mon.capturing) {
      Mon.x = lerp(Mon.x, Mon.targetX, 0.15);
      Mon.y = lerp(Mon.y, Mon.targetY, 0.15);
      Mon.size *= 0.9;

      if (Mon.size < 10) {
        Mon.capturing = false;
        Object.assign(Mon, createMon(Mon.type));
      }
      continue;
    }

    // normal movement
    Mon.x += Mon.vx;
    Mon.y += Mon.vy;

    // rotation + bobbing
    Mon.rotation = sin(frameCount * 0.1 + Mon.x * 0.02) * 0.3;
    Mon.y += sin(frameCount * 0.05 + Mon.x * 0.01) * 0.8;

    // clamp vertically to playable area
    Mon.y = constrain(Mon.y, 0, height * 0.7);

    // if completely offscreen, recycle the mon
    if (
      Mon.x > width + Mon.size ||
      Mon.x < -Mon.size ||
      Mon.y > height + Mon.size ||
      Mon.y < -Mon.size
    ) {
      Object.assign(Mon, createMon(Mon.type));
    }
  }
}

/*
   MON DRAW
   iterate mons and render
   */
function drawMon() {
  imageMode(CENTER);
  for (let Mon of mons) {
    push();
    translate(Mon.x, Mon.y);
    rotate(Mon.rotation);
    scale(Mon.captureScale);
    image(Mon.img, 0, 0, Mon.size, Mon.size);
    pop();
  }
}

/*
   BALL PHASES
   idle, thrown, reload, caught
   */
function moveBall() {
  const groundY = height - ball.body.size / 2 - 25;

  // idle: ball follows mouse on ground
  if (ball.body.state === "idle" && timer > 0) {
    ball.body.x = constrain(
      mouseX,
      ball.body.size / 2,
      width - ball.body.size / 2
    );
    ball.body.y = groundY;
  }

  // thrown: ball falls under gravity
  else if (ball.body.state === "thrown") {
    ball.body.y += ball.body.vy;
    ball.body.vy += 0.93 * (1080 / height);

    // if ball passed below screen, go to reload pause
    if (ball.body.y > height + ball.body.size) {
      ball.body.state = "reloadPause";
      ball.body.y = height + ball.body.size;
      ball.body.reloadTimer = 35; // frames pause while below screen
    }
  }

  // reload pause: follow mouse but wait a bit
  else if (ball.body.state === "reloadPause") {
    ball.body.reloadTimer--;
    ball.body.x = mouseX;
    if (ball.body.reloadTimer <= 0) {
      ball.body.state = "reloading";
    }
  }

  // reloading: slide ball back to ground
  else if (ball.body.state === "reloading") {
    ball.body.y -= 10 * (1080 / height);
    ball.body.x = mouseX;
    if (ball.body.y <= groundY) {
      ball.body.y = groundY;
      ball.body.state = "idle";
      ball.body.vy = 0;
      ball.body.hasCaught = false;
    }
  }

  // caught: countdown while the mon is in the open ball
  else if (ball.body.state === "caught") {
    ball.body.catchTimer--;
    if (ball.body.catchTimer === 3) {
      spawnSparkles(ball.body.x, ball.body.y);
    }
    if (ball.body.catchTimer <= 0) {
      ball.body.state = "thrown";
      ball.body.vy = 5 * (1080 / height);
    }
  }
}

/*
   BALL DRAW
   different visuals per state
   */
function drawBall() {
  push();
  translate(ball.body.x, ball.body.y);
  imageMode(CENTER);

  if (ball.body.state === "thrown") {
    image(pkThrown, 0, 0, ball.body.size, ball.body.size);
  } else if (ball.body.state === "caught") {
    image(pkOpen, 0, 0, ball.body.size * 1.7, ball.body.size * 1.2);
  } else {
    image(pkClosed, 0, 0, ball.body.size * 1.25, ball.body.size * 1.25);
  }

  pop();
}

/*
   CATCHING LOGIC
   detect overlap when ball is thrown
   */
function checkCatch() {
  if (ball.body.state !== "thrown" || ball.body.hasCaught) return;

  for (let Mon of mons) {
    const d = dist(ball.body.x, ball.body.y, Mon.x, Mon.y);
    if (d < ball.body.size / 2 + Mon.coreRadius) {
      // enter caught state and award score
      ball.body.state = "caught";
      ball.body.catchTimer = 30;
      ball.body.hasCaught = true;

      // play catch sound
      setTimeout(() => {
        catchsnd && catchsnd.play();
      }, 50);

      // scoring by type
      if (Mon.type === "archeops") score += 25;
      else if (Mon.type === "pidgeot") score += 50;
      else if (Mon.type === "emolga") score += 100;

      // animate mon toward ball then recycle later
      Mon.capturing = true;
      Mon.targetX = ball.body.x;
      Mon.targetY = ball.body.y;
      Mon.captureScale = 1;

      break;
    }
  }
}

/*
   INPUT: mousePressed
   handles pause, start, restart, and throwing
   */
function mousePressed() {
  const iconX = width - 140;
  const iconY = 50;
  const iconSize = 36;

  // pause icon toggle
  if (
    !gameStart &&
    !gameOver &&
    mouseX > iconX - iconSize / 2 &&
    mouseX < iconX + iconSize / 2 &&
    mouseY > iconY - iconSize / 2 &&
    mouseY < iconY + iconSize / 2
  ) {
    isPaused = !isPaused;
    return;
  }

  if (isPaused) return;

  // Title: start button
  if (gameStart) {
    const btnX = width / 2;
    const btnY = height / 2 + 100;
    const btnW = 500;
    const btnH = 120;
    if (
      mouseX > btnX - btnW / 2 &&
      mouseX < btnX + btnW / 2 &&
      mouseY > btnY - btnH / 2 &&
      mouseY < btnY + btnH / 2
    ) {
      gameStart = false;
      score = 0;
      timer = 30;
      lastSecond = millis();
      gameOver = false;

      // start music try to unlock audio if needed
      if (!track.isPlaying()) {
        if (typeof userStartAudio === "function") userStartAudio();
        track.loop();
      }
    }
    return;
  }

  // try again button
  if (gameOver) {
    const btnX = width / 2;
    const btnY = height / 2 + 100;
    const btnW = 500;
    const btnH = 120;
    if (
      mouseX > btnX - btnW / 2 &&
      mouseX < btnX + btnW / 2 &&
      mouseY > btnY - btnH / 2 &&
      mouseY < btnY + btnH / 2
    ) {
      restartGame();
      isPaused = false;
    }
    return;
  }

  // Throw the ball
  if (timer <= 0) return;
  if (ball.body.state === "idle") {
    ball.body.state = "thrown";
    ball.body.vy = -50 * (1080 / height);
    throwsnd && throwsnd.play();
  }
}

/*
   SPARKLES
    update simple particles
   */
function spawnSparkles(x, y) {
  sparkles = [];
  for (let i = 0; i < 10; i++) {
    sparkles.push({
      x,
      y,
      vx: random(-5, 5),
      vy: random(-4, -8),
      alpha: 255,
      size: random(6, 12),
    });
  }
}

function updateSparkles() {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.2; // gravity on sparkles
    s.alpha -= 10;
    fill(255, 255, 0, s.alpha);
    noStroke();
    ellipse(s.x, s.y, s.size);
    if (s.alpha <= 0) sparkles.splice(i, 1);
  }
}

/*
   UI BUTTONS
   start / try again visuals
   */
function drawTryAgainButton() {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textFont(pixelFont);
  textSize(48);
  fill(255);
  stroke(0);
  strokeWeight(4);
  rect(width / 2, height / 2 + 100, 500, 120, 10);
  noStroke();
  fill(0);
  text("TRY AGAIN?", width / 2, height / 2 + 100);
  pop();
}

function drawStartButton() {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textFont(pixelFont);
  textSize(48);
  fill(255);
  stroke(0);
  strokeWeight(4);
  rect(width / 2, height / 2 + 100, 500, 120, 10);
  noStroke();
  fill(0);
  text("START", width / 2, height / 2 + 100);
  pop();
}

/*
   RESTART GAME
   reset everything to fresh state
   */
function restartGame() {
  score = 0;
  timer = 30;
  lastSecond = millis();
  gameOver = false;
  loop(); // restart draw loop

  // reset ball
  ball.body.state = "idle";
  ball.body.hasCaught = false;
  ball.body.y = height - ball.body.size / 2 - 25;

  // reset mons
  mons = [];
  mons.push(createMon("archeops"));
  mons.push(createMon("pidgeot"));
  mons.push(createMon("emolga"));

  // restart track
  track && track.loop() && track.setVolume && track.setVolume(0.3);
}

/*
   PAUSE ICON
   small UI in corner to toggle pause
   */
function drawPauseIcon() {
  if (gameStart || gameOver) return;

  const iconX = width - 30;
  const iconY = 50;
  const iconSize = 36;

  push();
  rectMode(CENTER);
  noStroke();

  fill(255, 255, 255, 200);
  rect(iconX, iconY, iconSize, iconSize, 6);

  fill(0);
  if (!isPaused) {
    const barW = 4;
    const barH = 14;
    rect(iconX - 4, iconY, barW, barH);
    rect(iconX + 4, iconY, barW, barH);
  } else {
    triangle(iconX - 5, iconY - 8, iconX - 5, iconY + 8, iconX + 6, iconY);
  }
  pop();
}

/*
   MON FACTORY
   returns a fresh mon object for a given type
   */
function createMon(type) {
  let props;
  switch (type) {
    case "archeops":
      props = {
        img: archeopsImg,
        size: random(150, 180),
        baseSpeed: random(2, 4),
      };
      break;
    case "pidgeot":
      props = {
        img: pidgeotImg,
        size: random(100, 140),
        baseSpeed: random(6, 9),
      };
      break;
    case "emolga":
      props = {
        img: emolgaImg,
        size: random(60, 90),
        baseSpeed: random(12, 15),
      };
      break;
    default:
      props = { img: archeopsImg, size: 120, baseSpeed: 3 };
  }

  const movingRight = random() < 0.5;
  const angle = random(-PI / 4, PI / 4);
  const speed = props.baseSpeed;

  const startX = movingRight ? -props.size : width + props.size;
  const vx = cos(angle) * speed * (movingRight ? 1 : -1);
  const vy = sin(angle) * speed;

  return {
    type,
    img: props.img,
    x: startX,
    y: random(50, height * 0.8),
    vx,
    vy,
    size: props.size,
    coreRadius: props.size * 0.75,
    rotation: sin(frameCount * 0.1) * 0.3,
    capturing: false,
    captureScale: 1,
  };
}

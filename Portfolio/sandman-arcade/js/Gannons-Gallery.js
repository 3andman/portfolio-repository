/**
 * Gannon's Gallery
 * Dylan Samaan
 */

"use strict";

//  GAME STATES
let gameStart = true; // title/menu visible
let gameOver = false; // flagged when you die
let score = 0; // points for breaking pots
let health = 3; // 3 hearts to start

//  ASSETS
let pixelFont;
let slingImg, potImg, bkgImg, retImg, nutImg; // images
let track, slingSnd, hitSnd, overSnd; // primary sounds
let hurt, dead, low; // health / low sounds
let healthImages = []; // heart images
let breakFrames = []; // pot break frames

//  FALLING POTS / DIFFICULTY
let fallingPots = []; // currently active falling pots
let nextPotTimer = 0; // frames until next pot spawn
let difficulty = 0.5; // global difficulty multiplier
const difInc = 0.00015; // difficulty ramp per frame
const difMax = 2.8; // cap difficulty multiplier

//  SLING (player)
const sling = { x: 0, y: 0, size: 500, targetX: 0 };
const slingLag = 0.05; // smoothing for sling movement
let lastShot = 0; // timestamp of last shot fired
const shotDelay = 600; // ms between shots

//  PROJECTILES
const projectiles = []; // active nuts
const prjSize = 100; // projectile visual size
const prjSpeed = 0.06; // how speed of projectile scales with mouse

//  POT / SPAWN TUNING
const potMinInt = 30; // min frames between pot spawns
const potMaxInt = 140; // max frames between pot spawns
const potMinVY = 2.0; // base min falling speed
const potMaxVY = 5.0; // base max falling speed
const potMinSpc = 50; // min horizontal spacing between spawn x
const potGrav = 0.07; // gravity applied to pots
const potMaxAtm = 8; // attempts to find a non overlapping x per spawn

//  PRELOAD
function preload() {
  pixelFont = loadFont("assets/PressStart2P-Regular.ttf");

  // images
  slingImg = loadImage("assets/game3/sling.webp"); // slingshot
  bkgImg = loadImage("assets/game3/bkgnd.png"); // background
  retImg = loadImage("assets/game3/rtcle.png"); // reticle
  potImg = loadImage("assets/game3/pot.png"); // falling pot
  nutImg = loadImage("assets/game3/nut.webp"); // projectile nut

  // health hearts
  healthImages[0] = loadImage("assets/game3/health1.png");
  healthImages[1] = loadImage("assets/game3/health2.png");
  healthImages[2] = loadImage("assets/game3/health3.png");

  // pot break animation frames
  for (let i = 0; i < 3; i++) {
    breakFrames[i] = loadImage(`assets/game3/break${i}.png`);
  }

  // sounds
  track = loadSound("assets/game3/track.mp3");
  slingSnd = loadSound("assets/game3/slingSnd.mp3");
  hitSnd = loadSound("assets/game3/hitSnd.mp3");
  overSnd = loadSound("assets/game3/gameover.wav");
  hurt = loadSound("assets/game3/hurt.mp3");
  dead = loadSound("assets/game3/dead.mp3");
  low = loadSound("assets/game3/low.mp3");
}

//  SETUP
function setup() {
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

  // place sling near bottom middle
  sling.x = width / 2;
  sling.y = height * 0.85;
  sling.targetX = sling.x;

  // initial spawn timer
  nextPotTimer = floor(random(potMinInt, potMaxInt));

  // volumes
  if (track && track.setVolume) track.setVolume(0.1);
  if (slingSnd && slingSnd.setVolume) slingSnd.setVolume(0.8);
  if (hitSnd && hitSnd.setVolume) hitSnd.setVolume(0.1);
  if (overSnd && overSnd.setVolume) overSnd.setVolume(0.3);
  if (hurt && hurt.setVolume) hurt.setVolume(0.1);
  if (dead && dead.setVolume) dead.setVolume(0.2);
  if (low && low.setVolume) low.setVolume(0.2);
}

//  DRAW
function draw() {
  // title/menu
  if (gameStart) {
    background("#D0D0D0");

    textAlign(CENTER, CENTER);
    textSize(86);
    stroke(0);
    strokeWeight(6);
    fill(255);
    text("Gannon's Gallery", width / 2, height / 2 - 70);

    // big start button
    push();
    rectMode(CENTER);
    textFont(pixelFont);
    textSize(48);
    fill(255);
    stroke(0);
    strokeWeight(4);
    rect(width / 2, height / 2 + 100, 1000, 120, 10);
    noStroke();
    fill(0);
    text("START", width / 2, height / 2 + 100);
    pop();

    return; // skip game updates while on title
  }

  // game over screen
  if (gameOver) {
    drawGameOverScreen();
    cursor(); // show cursor on menus
    return;
  }

  // gameplay running below here

  // slowly ramp difficulty
  difficulty = min(difMax, difficulty + difInc);

  // background
  if (bkgImg) image(bkgImg, width / 2, height / 2, width, height);
  else background(213, 214, 183);

  // draw score
  push();
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(36);
  textFont(pixelFont);
  text(`SCORE: ${score}`, 20, 40);
  pop();

  // cursor handling
  noCursor();

  // spawn pots on a timer
  nextPotTimer--;
  if (nextPotTimer <= 0) {
    spawnPot();
    nextPotTimer = floor(random(potMinInt, potMaxInt));
  }

  // update entities
  updatePots();
  updateProjectiles();

  // draw sling and reticle
  sling.targetX = constrain(mouseX, sling.size / 2, width - sling.size / 2);
  sling.x = lerp(sling.x, sling.targetX, slingLag);
  if (slingImg) image(slingImg, sling.x, sling.y, sling.size, sling.size);
  if (retImg) image(retImg, mouseX, mouseY, 154, 154);

  // draw health hearts
  if (health > 0 && health <= healthImages.length) {
    image(healthImages[health - 1], 168, 140, 350, 175);
  }
}

//  GAME OVER UI
let overPlayed = false;
function drawGameOverScreen() {
  background(0);

  push();
  textAlign(CENTER, CENTER);
  textFont(pixelFont);
  textSize(96);
  stroke(0);
  strokeWeight(8);
  fill(255, 0, 0);
  text("GAME OVER", width / 2, height / 2 - 100);
  pop();

  push();
  textAlign(CENTER, CENTER);
  textFont(pixelFont);
  textSize(40);
  noStroke();
  fill(235, 205, 0);
  text(`SCORE: ${nf(score, 4)}`, width / 2, height / 2);
  pop();

  drawTryAgainButton();

  if (!overPlayed) {
    overSnd && overSnd.play();
    overPlayed = true;
  }
}

//  MOUSE INPUT
function mousePressed() {
  // start button area
  if (gameStart) {
    const btnX = width / 2;
    const btnY = height / 2 + 100;
    const btnW = 1000;
    const btnH = 120;
    if (
      mouseX > btnX - btnW / 2 &&
      mouseX < btnX + btnW / 2 &&
      mouseY > btnY - btnH / 2 &&
      mouseY < btnY + btnH / 2
    ) {
      // start game
      gameStart = false;
      gameOver = false;
      score = 0;
      health = 3;
      fallingPots = [];
      nextPotTimer = floor(random(potMinInt, potMaxInt));
      if (track && track.isLoaded && !track.isPlaying()) track.loop();
      overPlayed = false;
      return;
    }
  }

  // try again button area
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
      // restart play
      gameOver = false;
      gameStart = false;
      health = 3;
      score = 0;
      difficulty() = 0.5;
      fallingPots = [];
      nextPotTimer = floor(random(potMinInt, potMaxInt));
      if (track && track.isLoaded && !track.isPlaying()) track.loop();
      overPlayed = false;
      return;
    }
  }

  // FIRE PROJECTILE
  if (!gameStart && !gameOver) {
    const now = millis();
    if (now - lastShot >= shotDelay) {
      const dx = mouseX - sling.x;
      const dy = mouseY - sling.y;
      projectiles.push({
        x: sling.x,
        y: sling.y,
        vx: dx * prjSpeed,
        vy: dy * prjSpeed,
        displaySize: prjSize,
        angle: random(-0.5, 0.5),
        av: random(-0.04, 0.04),
      });
      slingSnd && slingSnd.play();
      lastShot = now;
    }
  }
}

//  TRY AGAIN BUTTON
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

//  SPAWN POT
function spawnPot() {
  // find a random x that doesn't clash with recent pots
  let x,
    attempts = 0;
  do {
    x = random(40, width - 40);
    attempts++;
    if (attempts > potMaxAtm) break;
  } while (fallingPots.some((p) => abs(p.x - x) < potMinSpc));

  // pot starting downward speed scales with difficulty
  const vy = random(potMinVY, potMaxVY) * difficulty;

  fallingPots.push({
    x: x,
    y: -60, // spawn slightly off screen
    vy: vy, // vertical speed
    size: random(150, 200), // visual size
    angle: random(-0.6, 0.6),
    av: random(-0.02, 0.02),
    state: "falling", // falling or broken
    breakTimer: 0,
    frame: 0, // animation frame index for break
    frames: breakFrames, // reference to break frames
  });
}

//  UPDATE POTS
function updatePots() {
  for (let i = fallingPots.length - 1; i >= 0; i--) {
    const pot = fallingPots[i];

    // if the pot has reached the bottom while still falling take damage
    if (pot.state === "falling" && pot.y - pot.size / 2 > height) {
      health--; // lose a heart
      fallingPots.splice(i, 1); // remove the pot

      // play hurt low dead sounds
      hurt && hurt.play();
      if (health === 1) {
        low && low.play();
        low && low.loop && low.loop();
      }

      if (health <= 0) {
        gameOver = true;
        dead && dead.play();
        low && low.stop && low.stop();
        track && track.stop && track.stop();
      }
      continue; // skip drawing this pot
    }

    // draw pot
    push();
    translate(pot.x, pot.y);
    rotate(pot.angle);

    if (pot.state === "falling") {
      // apply gravity
      pot.vy += potGrav;
      pot.y += pot.vy * difficulty;
      pot.angle += pot.av;

      // draw normal pot sprite
      if (potImg) image(potImg, 0, 0, pot.size, pot.size);
    } else if (pot.state === "broken") {
      // freeze motion and draw break animation
      pot.vy = 0;
      pot.angle = 0;

      // fall back to single break image if present
      if (pot.frames && pot.frames.length > 0) {
        image(pot.frames[pot.frame], 0, 0, pot.size, pot.size);
      } else {
        // fallback
        image(potImg, 0, 0, pot.size, pot.size);
      }

      // advance animation slower
      if (frameCount % 10 === 0) {
        pot.frame++;
        if (pot.frame >= pot.frames.length) {
          // animation finished remove pot
          fallingPots.splice(i, 1);
          pop();
          continue;
        }
      }
    }

    pop();
  }
}

//  UPDATE PROJECTILES=
function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    // physics integration for nut
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.45; // gravity on projectiles
    p.angle += p.av;

    // draw nut
    push();
    translate(p.x, p.y);
    rotate(p.angle);
    if (nutImg) image(nutImg, 0, 0, p.displaySize, p.displaySize);
    pop();

    // collision check vs pots
    let toRemove = false;
    for (let j = 0; j < fallingPots.length; j++) {
      const pot = fallingPots[j];
      if (pot.state !== "falling") continue;

      // simple circle ish distance
      const dx = p.x - pot.x;
      const dy = p.y - pot.y;
      const dist = sqrt(dx * dx + dy * dy);
      const nutRadius = p.displaySize * 0.5 * 0.5; // smaller than full sprite bcs of transparent background
      const potRadius = pot.size * 0.5 * 0.5;

      if (dist <= nutRadius + potRadius) {
        // mark pot broken
        pot.state = "broken";
        pot.breakTimer = 0;
        score++;
        hitSnd && hitSnd.play();
        toRemove = true;
        break; // one nut only breaks one pot
      }
    }

    // remove nut if marked or out of bounds
    if (
      toRemove ||
      p.x < -200 ||
      p.x > width + 200 ||
      p.y < -200 ||
      p.y > height + 200
    ) {
      projectiles.splice(i, 1);
    }
  }
}

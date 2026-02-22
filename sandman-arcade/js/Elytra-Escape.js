/**
 * Elytra Escape
 * Dylan Samaan
 */

"use strict";

// ASSETS

let bgImg; // scrolling background image
let birdImg; // bird sprite
let pipeTopImg; // top pipe graphic (stretches vertically)
let pipeBottomImg; // bottom pipe graphic
let pixelFont; // retro font

// sounds
let track; // backbround
let flap; // each mouse click
let pnt1; // every 1 point
let pnt10; // every 10 points
let gameOverSound; // womp womp game over

// GAME STATE

let gameStart = true; // title screen visible
let gameOver = false; // when the player dies
let score = 0; // how many pipes passed

// BIRD

const bird = {
  x: 0,
  y: 0,
  vy: 0,
  size: 150,
  hitScale: 0.25,
};

// time bookkeeping for restart
let gameOverTime = 0; // when game over screen first shown
const restartDelay = 1000; // wait this long before letting space bar = restart

// BACKGROUND SCROLLING

let bgX = 0; // current offset of background
let bgSpeed = 7; // how fast the background scrolls

// PIPES

let pipes = []; // active pipes
let pipeInterval = 200; // frames between pipe spawns
let frameCountSinceLastPipe = 0; // counter to spawn pipes

// pipe spawn tuning & physics
const gravity = 0.5;
const jumpStrength = -11;

// internal constants for pipes
const DEFAULT_PIPE_WIDTH = 180; // visual width of pipe
const PIPE_GAP_MIN = 300; // minimum gap height
const PIPE_GAP_MAX = 420; // maximum gap height

// PRELOAD

function preload() {
  // load images
  bgImg = loadImage("assets/game2/bg-loop.png");
  birdImg = loadImage("assets/game2/bird.png");
  pipeTopImg = loadImage("assets/game2/pipe_top.png");
  pipeBottomImg = loadImage("assets/game2/pipe_bottom.png");
  pixelFont = loadFont("assets/PressStart2P-Regular.ttf");

  // sounds
  track = loadSound("assets/game2/track.mp3");
  flap = loadSound("assets/game2/flap.mp3");
  pnt1 = loadSound("assets/game2/1.mp3");
  pnt10 = loadSound("assets/game2/10.mp3");
  gameOverSound = loadSound("assets/game2/gameover.wav");
}

// SETUP

function setup() {
  // keep the same aspect ratio
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

  // volume defaults
  if (track && track.setVolume) track.setVolume(0.3);
  if (gameOverSound && gameOverSound.setVolume) gameOverSound.setVolume(0.3);
  if (flap && flap.setVolume) flap.setVolume(0.4);
  if (pnt1 && pnt1.setVolume) pnt1.setVolume(0.2);
  if (pnt10 && pnt10.setVolume) pnt10.setVolume(0.5);

  // initial bird placement
  bird.x = width * 0.3;
  bird.y = height * 0.5;
  bird.vy = 0;

  // initial game variables
  score = 0;
  gameStart = true;
  gameOver = false;
  gameOverTime = 0;
  bgX = 0;
  bgSpeed = 7;

  // create one pipe right away
  pipes = [];
  pipes.push(new Pipe());
  frameCountSinceLastPipe = 0;
}

// WINDOW RESIZE HANDLING

function windowResized() {
  // same aspect maintaining logic as setup
  const aspect = 1280 / 1080;
  let targetHeight = windowHeight;
  let targetWidth = targetHeight * aspect;
  if (targetWidth > windowWidth) {
    targetWidth = windowWidth;
    targetHeight = targetWidth / aspect;
  }
  resizeCanvas(targetWidth, targetHeight);

  // if still on the title, keep bird centered visually
  if (gameStart && !gameOver) {
    bird.x = width * 0.3;
    bird.y = height * 0.5;
    bird.vy = 0;
  }
}

// MAIN DRAW LOOP

function draw() {
  // always draw the scrolling background first
  drawScrollingBackground();

  // Title Screen
  if (gameStart) {
    background("#D0D0D0"); // in case bg image fails

    textAlign(CENTER, CENTER);
    textFont(pixelFont);
    textSize(96);
    stroke(0);
    strokeWeight(6);
    fill(255);
    text("Elytra Escape", width / 2, height / 2 - 80);

    drawStartButton();
    return; // skip physics & HUD while on the title
  }

  // update bird physics if not dead
  if (!gameOver) {
    updateBird();
  }

  // spawn pipes on an interval
  frameCountSinceLastPipe++;
  if (frameCountSinceLastPipe > pipeInterval) {
    pipes.push(new Pipe());
    frameCountSinceLastPipe = 0;
  }

  // update and render pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.update();
    pipe.show();

    // check collision only while playing
    if (!gameOver && pipe.hits(bird)) {
      gameOver = true;
      track && track.stop();
      gameOverSound && gameOverSound.play();
      // mark when game over happened so we can delay restarts
      if (gameOverTime === 0) gameOverTime = millis();
    }

    // scoring when pipe passed
    if (!gameOver && !pipe.passed && pipe.x + pipe.w < bird.x - bird.size / 2) {
      pipe.passed = true;
      score++;
      pnt1 && pnt1.play();
      if (score % 10 === 0) pnt10 && pnt10.play();
    }

    // remove pipes that moved off screen
    if (pipe.x + pipe.w < 0) {
      pipes.splice(i, 1);
    }
  }

  // slightly increases background speed over time
  if (!gameOver && !gameStart) {
    bgSpeed = min(bgSpeed + 0.004, 20); // gentle ramp
    // keep pipe spacing consistent by adjusting spawn interval to distance / speed
    const targetPipeDistance = 800; // pixels between pipes visually
    pipeInterval = max(60, targetPipeDistance / bgSpeed); // clamp minimum interval
  }

  // render bird and hud
  imageMode(CENTER);
  drawBird();
  drawHud();

  // hide cursor during active play
  noCursor();

  // draw game over and Try Again
  if (gameOver) {
    // ensure we have recorded when the game over happened
    if (gameOverTime === 0) gameOverTime = millis();

    // dark overlay GAME OVER text
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

    // score on screen
    push();
    textAlign(CENTER, CENTER);
    textFont(pixelFont);
    textSize(40);
    noStroke();
    fill(235, 205, 0);
    text(`SCORE: ${nf(score, 4)}`, width / 2, height / 2);
    pop();

    drawTryAgainButton();

    // stop the track if it remained playing
    track && track.stop();

    // don't fall through further
    return;
  }
}

// BACKGROUND

function drawScrollingBackground() {
  // draw the background twice and move them left to loop
  imageMode(CORNER);
  const bgW = width;
  const bgH = height;

  // left and right copies
  image(bgImg, bgX, 0, bgW, bgH);
  image(bgImg, bgX + bgW, 0, bgW, bgH);

  // move left each frame
  bgX -= bgSpeed;

  // wrap the offset when one image has fully scrolled by
  if (bgX <= -bgW) {
    bgX += bgW;
  }
}

// BIRD PHYSICS & DRAW

function updateBird() {
  // gravity constantly accelerates the bird down
  bird.vy += gravity;

  // integrate velocity into position
  bird.y += bird.vy;

  // floor collision
  if (bird.y + bird.size / 2 > height) {
    bird.y = height - bird.size / 2;
    bird.vy = 0;
    if (!gameOver) {
      gameOver = true;
      gameOverSound && gameOverSound.play();
      if (gameOverTime === 0) gameOverTime = millis();
    }
  }

  // ceiling clamp
  if (bird.y - bird.size / 2 < 0) {
    bird.y = bird.size / 2;
    bird.vy = 0;
  }
}

function drawBird() {
  imageMode(CENTER);
  image(birdImg, bird.x, bird.y, bird.size, bird.size);
}

// HUD + SCORE

function drawHud() {
  push();
  textFont(pixelFont);
  textSize(38);
  noStroke();

  // drop shadow style score
  textAlign(LEFT, TOP);
  fill(0);
  text(`SCORE: ${nf(score, 4)}`, 32, 32);
  fill(235, 203, 0);
  text(`SCORE: ${nf(score, 4)}`, 30, 30);
  pop();
}

// INPUTS\

function keyPressed() {
  // flap

  // immediate flap on gamestart
  if (gameStart) {
    gameStart = false;
    gameOver = false;
    score = 0;
    pipes = [];
    pipes.push(new Pipe());
    frameCountSinceLastPipe = 0;
    bgSpeed = 7;
    pipeInterval = 200;
    bird.x = width * 0.3;
    bird.y = height * 0.45;
    bird.vy = jumpStrength; // give the player a starting hop

    // try to start the music
    if (track && track.isLoaded && track.isLoaded() && !track.isPlaying()) {
      track.loop();
      track.play();
    }

    // unlock audio context if necessary
    if (
      typeof getAudioContext === "function" &&
      getAudioContext().state !== "running"
    ) {
      getAudioContext()
        .resume()
        .then(() => {});
    }

    // play flap sound
    flap && flap.play();
    return;
  }

  // allow restart after restartDelay milliseconds
  if (gameOver) {
    if (millis() - gameOverTime < restartDelay) {
      // too soon to restart = ignore key presses
      return;
    }

    // Reset core gameplay state for a fresh run
    score = 0;
    gameOver = false;
    gameStart = false;
    bird.x = width * 0.3;
    bird.y = height * 0.5;
    bird.vy = jumpStrength; // immediate jump on restart

    pipes = [];
    pipes.push(new Pipe());
    frameCountSinceLastPipe = 0;

    bgSpeed = 7;
    pipeInterval = 200;

    gameOverTime = 0;
    // restart music if available
    track && track.loop() && track.play();
    return;
  }

  // Normal flap while playing
  bird.vy = jumpStrength;
  flap && flap.play();
}

// START + TRY AGAIN UI

function drawStartButton() {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textFont(pixelFont);
  textSize(48);

  const btnX = width / 2;
  const btnY = height / 2 + 100;
  const btnW = 1000;
  const btnH = 120;

  fill(255);
  stroke(0);
  strokeWeight(4);
  rect(btnX, btnY, btnW, btnH, 10);

  noStroke();
  fill(0);
  text("PRESS SPACE TO START", btnX, btnY);
  pop();
}

function drawTryAgainButton() {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textFont(pixelFont);
  textSize(48);

  const btnX = width / 2;
  const btnY = height / 2 + 100;
  const btnW = 900;
  const btnH = 120;

  fill(255);
  stroke(0);
  strokeWeight(4);
  rect(btnX, btnY, btnW, btnH, 10);

  noStroke();
  fill(0);
  text("SPACE TO TRY AGAIN", btnX, btnY);
  pop();
}

// PIPE CLASS

class Pipe {
  constructor() {
    // pick a random gap height for variety
    this.gap = random(PIPE_GAP_MIN, PIPE_GAP_MAX); // gap height between top and bottom pipe

    // choose top gap start such that gap fits on screen with some margin
    const minTop = height * 0.1;
    const maxTop = height * 0.6;
    this.top = random(minTop, maxTop);

    // bottom edge of gap is top + gap height
    this.bottom = this.top + this.gap;

    // start X off right edge
    this.x = width;

    // visual width
    this.w = DEFAULT_PIPE_WIDTH;

    // used for scoring + hit detection
    this.passed = false;

    // hitbox tweals
    this.hitInsetX = 22; // reduce horizontal area a bit for forgiving collisions
    this.hitTopTrim = 6; // vertical overlap
    this.hitBottomTrim = 6;

    // smaller hitbox scale
    this.hitScale = 0.75;
  }

  // move the pipe left each frame
  update() {
    this.x -= bgSpeed;
  }

  // draw the top and bottom pipe using corner-mode for easier positioning
  show() {
    imageMode(CORNER);
    // top piece stretched
    image(pipeTopImg, this.x, 0, this.w, this.top);
    // bottom piece drawn
    image(pipeBottomImg, this.x, this.bottom, this.w, height - this.bottom);
  }

  // collision test
  hits(birdObj) {
    // shrunk horizontal bounds of pipe
    const left = this.x + this.hitInsetX;
    const right = this.x + this.w - this.hitInsetX;

    // effective vertical gap edges after trimming
    const topGap = this.top + this.hitTopTrim;
    const bottomGap = this.bottom - this.hitBottomTrim;

    // player hitbox size
    const hb = (birdObj.size * birdObj.hitScale) / 2;
    const birdLeft = birdObj.x - hb;
    const birdRight = birdObj.x + hb;
    const birdTop = birdObj.y - hb;
    const birdBottom = birdObj.y + hb;

    // is there horizontal overlap with the pipe columns?
    const horizOverlap = birdRight > left && birdLeft < right;
    // is the bird overlapping the top pipe vertically?
    const overlapTopPipe = birdTop < topGap;
    // is the bird overlapping the bottom pipe vertically?
    const overlapBottomPipe = birdBottom > bottomGap;

    // collision when horizontally overlapping and vertically outside the gap
    if (horizOverlap && (overlapTopPipe || overlapBottomPipe)) {
      return true;
    }
    return false;
  }
}

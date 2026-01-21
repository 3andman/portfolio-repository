/**
 * Inside Dylan's Mind
 * Dylan Samaan
 *
 * Oh my gosh I dug myself into a hole with this one.
 * I wanted a stary sky that flickers, with shooting stars and
 * a meteor shower when you press the mouse. I want a nice moon and montains
 * and a foreground with a road and trees that are moving as if the
 * viewer is flying to the left following a car. I want the car to look
 * specifically like my favorite car lol, and I want it to flash it's
 * headlights when you click spacebar.
 *
 *I did not get to make the car in time :(
 *I'll come back to the project whenever I have free time.
 */

"use strict";

let shootingStars = []; //Shooting Stars Values
let nextShootingStar = 0; //Frame Counter
let stars = []; //Twinkling Stars Values
let roadLines = []; //Road Lines Values
let roadLineSpeed = 3; //Speed of Lines
let roadHeight = 170; //Height
let laneLength = 30; //Length of Dashed Lines
let laneSpacing = 50; //Space Between Each Dashed Line
let trees = []; //Front Row Tree Values
let treeSpeed = 0.7; //Speed of Front Row Trees
let backTrees = []; //Back Row Tree Values
let backTreeSpeed = 0.3; //Speed of Back Row Trees
let layla;

function preload() {
  soundFormats("mp3");
  layla = loadSound("./layla.mp3");
}

function setup() {
  createCanvas(1000, 800);
  noStroke(); //Defaults shapes to have no stroke

  layla.play();
  layla.setVolume(0.3);

  // Road Lines Setup
  //Loops them and places them at equal X spacing, X changes each frame
  for (let x = 0; x < width + laneLength; x += laneLength + laneSpacing) {
    roadLines.push({ x: x, y: height - roadHeight / 2 });
  }

  // Front row trees
  let spacing = 100;
  for (let x = 0; x < width + 200; x += spacing) {
    //Spawns and moves them
    trees.push({
      x: x + random(-30, 30), //Random spacing
      y: height - roadHeight - 40, // Keep them right above the road

      type: random() < 0.7 ? "pine" : "round", //70% chance of being Pine tree
      scale: random(0.8, 1.4), // Size variation
    });
  }

  // Back row trees
  let lastBackX = -999; //Impossible starting value so it can always spawn
  let backSpacing = random(20, 40); // Random Spacing

  for (let x = 0; x < width + 100; x += backSpacing) {
    //Spawns and moves them

    let tx = x + random(-30, 30); // Random offset to horizontal position

    if (tx - lastBackX < backSpacing) {
      // Gap from last tree

      tx = lastBackX + backSpacing + random(3, 20); //No two trees are placed too close
    }

    backTrees.push({
      x: tx,
      y: height - roadHeight - 40, //Keep them right above the road
      type: random() < 0.7 ? "pine" : "round", //70% chance of being Pine tree
      scale: random(0.5, 1.0), //Size Variation
    });

    lastBackX = tx; // Remember last tree’s position
  }

  // Making Twinkling Stars
  for (let i = 0; i < 300; i++) {
    //Spawns 300 background stars
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      phase: random(TWO_PI), //Phasing 2x the radius
      speed: random(0.01, 0.05), //Twinkle Speed
    });
  }
}

function draw() {
  background(10, 10, 30); //Dark Navy Blue

  //  Twinkling Stars
  for (let i = 0; i < stars.length; i++) {
    //Loops through every star stored(300)
    let star = stars[i];
    let brightness = map(
      //Converts Sine wave values to Brightness values
      sin(frameCount * star.speed + star.phase), //Uses Sine to create a phase that goes between -1 and 1,
      // frame count works like a clock, multiplying it by star speed cahnges how fast it twinkles,
      // adding star phase makes them start at different phases so they're not in sync
      -1,
      1,
      10, //Brightness goes between 10 and 300
      300
    );
    fill(brightness); //No color
    ellipse(star.x, star.y, star.size);
  }

  //  Spawn Shooting Stars
  if (frameCount >= nextShootingStar) {
    //Spawns Shooting Star based on frame count
    let startX = -50; //Spawns Slightly off-screen
    let startY = random(height / 2); //Only in the top half of the screen

    let angle = random(PI / 6, PI / 3); //Always downward tragectory (60° to 30°)
    let speed = random(4, 7); //Random velocity

    shootingStars.push({
      x: startX,
      y: startY,
      vx: cos(angle) * speed, //Horizontal angle * speed
      vy: sin(angle) * speed * 0.5, //Verticle angle * speed but slower
      len: random(1, 3), //Trail length variety
    });

    nextShootingStar = frameCount + int(random(50, 150)); // Wait before next one
  }

  //  Draw & Update Shooting Stars
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    // Removes end of tail
    let s = shootingStars[i];

    let tailX = s.x - s.vx * s.len; //Subtracts x distance by velocity to decide where the tail should end
    let tailY = s.y - s.vy * s.len; //Subtracs y distance by velocity

    stroke(255, 180);
    strokeWeight(2);
    line(s.x, s.y, tailX, tailY);

    noStroke();
    fill(255);
    ellipse(s.x, s.y, 3, 3);

    s.x += s.vx; //Position + veloctity to move them
    s.y += s.vy;

    if (s.x < -200 || s.x > width + 200 || s.y > height + 200) {
      shootingStars.splice(i, 1); //Deletes them after tail reaches boundaries
    }
  }

  //Draw the moon
  noStroke();

  for (let r = 200; r > 50; r -= 30) {
    //Draws circles sizing from 200 to 50
    fill(255, 255, 200, map(r, 200, 50, 10, 60)); //Size and Transparency Range
    ellipse(width - 150, 150, r);
  }

  fill(240, 240, 220); //Moon
  ellipse(width - 150, 150, 100);

  fill(200, 200, 180, 180); //Craters with transparency value
  ellipse(width - 170, 140, 15);
  ellipse(width - 140, 160, 10);
  ellipse(width - 160, 170, 7);

  // Draw the Mountains
  drawMountains();

  // Draw back trees
  for (let tree of backTrees) {
    // Loops the back trees
    push();
    translate(tree.x, tree.y); //Moves the origin of the tree
    scale(tree.scale); //Random Scale
    // Round tree values
    if (tree.type === "round") {
      fill(60, 45, 20);
      rect(10, -40, 8, 40);
      fill(30, 80, 30);
      stroke(10, 50, 10);
      ellipse(15, -55, 40, 40);
      ellipse(0, -45, 40, 40);
      ellipse(30, -45, 40, 40);
      //Pine tree values
    } else if (tree.type === "pine") {
      fill(60, 45, 20);
      rect(8, -40, 6, 40);
      fill(20, 70, 20);
      stroke(10, 40, 10);
      triangle(-18, -40, 34, -40, 8, -80);
      triangle(-13, -60, 28, -60, 8, -100);
      triangle(-8, -80, 23, -80, 8, -120);
    }

    pop();

    // Move back tree
    tree.x -= backTreeSpeed; //Moves the trees slowly each frame
    if (tree.x < -50) {
      //Checks if tree goes off-screen

      let maxX = width + random(50, 200); //Randomizes when they respawn
      let minGap = 90; //Minimum distance between trees

      let rightmost = max(backTrees.map((t) => t.x)); //Makes sure they don't overlap
      tree.x = max(maxX, rightmost + minGap); //Natural Spacing

      tree.type = random() < 0.7 ? "pine" : "round"; //70% chance of Pine tree
      tree.scale = random(0.5, 1.2);
    }
  }

  // Draw Front Trees
  for (let tree of trees) {
    //Loops through front row trees
    push();
    translate(tree.x, tree.y); // Moves the origin of the tree
    scale(tree.scale); // Random Scale

    stroke(10, 60, 10);
    strokeWeight(0.5);

    if (tree.type === "round") {
      // Draw round tree
      // Round Trunk
      noStroke();
      fill(80, 50, 20);
      rect(10, -40, 10, 40);

      // Round Leaves
      stroke(5, 40, 5);
      strokeWeight(0.5);
      fill(30, 120, 30);
      ellipse(15, -60, 50, 50);
      ellipse(0, -50, 50, 50);
      ellipse(30, -50, 50, 50);
    } else if (tree.type === "pine") {
      // Draw pine tree
      // Pine Trunk
      noStroke();
      fill(80, 50, 20);
      rect(3, -40, 10, 40);

      // Pine leaves
      stroke(5, 40, 5);
      strokeWeight(0.5);
      fill(20, 100, 20);
      triangle(-20, -40, 35, -40, 7.5, -80);
      triangle(-15, -60, 30, -60, 7.5, -100);
      triangle(-10, -80, 25, -80, 7.5, -120);
    }

    pop();

    // Move tree inside the loop
    tree.x -= treeSpeed; // Moves trees to the left
    if (tree.x < -100) {
      // Respawn tree when it goes off-screen
      tree.x = width + random(50, 150);
      tree.type = random() < 0.5 ? "round" : "pine";
      tree.scale = random(1, 1.7);
    }
  }
  // Draw the Grass
  fill(60, 90, 60);
  rect(0, height - roadHeight - 40, width, 50); // Rect right above the road

  // Draw the Road
  fill(50);
  rect(0, height - roadHeight, width, roadHeight); // Draws the road
  fill(40);

  fill(255);
  for (let line of roadLines) {
    // Loops through road lines
    rect(line.x, line.y - 5, laneLength, 10);
    line.x -= roadLineSpeed; //Moves the lines to the left

    if (line.x + laneLength < 0) {
      // Checks if off-screen and respawns
      line.x = width;
    }
  }
}

// Spawn Shooting Stars
function mousePressed() {
  let count = int(random(4, 7)); // Amount of shooting stars
  for (let i = 0; i < count; i++) {
    // Loops once for each shhoting star
    let startX = -50; // Start off-screen
    let startY = random(height / 2); // Starts in top half

    let angle = random(PI / 6, PI / 3); // Random angle between 60° and 30°
    let speed = random(4, 6); // Random Velocity

    shootingStars.push({
      x: startX,
      y: startY,
      vx: cos(angle) * speed, // Horizontal speed
      vy: sin(angle) * speed * 0.5, // Vertical slower speed
      len: random(1, 3), // Random tail lenght
    });
  }
}

function drawMountains() {
  noStroke();
  // Back Layer
  fill(180);
  triangle(100, 650, 300, 300, 500, 650);
  triangle(400, 650, 650, 250, 900, 650);

  // Middle layer
  fill(120);
  triangle(250, 650, 450, 350, 700, 650);
  triangle(600, 650, 850, 300, 1050, 650);

  // Front Layer
  fill(90);
  triangle(-50, 650, 200, 400, 450, 650);
  triangle(350, 650, 600, 380, 850, 650);
}

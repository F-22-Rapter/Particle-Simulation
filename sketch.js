let particles = [];
let simulateElectrostatic = true; // Toggle between electrostatic and gravitational forces
let protonCharge = 1; // Charge for protons
let neutronCharge = 0; // Charge for neutrons
let electronCharge = -1; // Charge for electrons
let protonMass = 1883; // Simplified mass
let neutronMass = 1883; // Simplified mass
let electronMass = 400; // Simplified mass
let k = 1000; // Simplified electrostatic constant
let G = 1e-6; // Simplified gravitational constant
let positiveForce = true; // Toggle for positive or negative force
let mouseForceMagnitude = 10; // Adjustable force magnitude for mouse
let softeningFactor = 0.1; // Factor to prevent division by zero or instability
let photonEmissionSpeed = 3; // Speed threshold for photon emission
let photonEnergyLoss = 0.1; // Fraction of speed lost upon photon emission
let strongnuclearConstant = 0
let showPhotons = false; // Toggle visibility of photons
let photons = []; // Store emitted photons
// Global variables for world transformations
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;
let worldSize = 5000; // Define the size of the world
let keySpawnTimers = {}; // Track time keys are held
let mousegravity = 1000;
let mouseelectrostaic = 1000000;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(30);

  // Apply transformations
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // Draw world boundaries
  stroke(100);
  noFill();
  rect(-worldSize / 2, -worldSize / 2, worldSize, worldSize);

  // Spawn particles based on key hold duration
  handleKeySpawn();

  // Display particles
  for (let particle of particles) {
    particle.update();
    particle.show();
  }

  // Display photons
  if (showPhotons) {
    for (let photon of photons) {
      photon.update();
      photon.show();
    }
  }

  // Remove photons that are off-screen
  photons = photons.filter(photon => photon.isOnScreen());

  // Draw HUD (untransformed for clarity)
  resetMatrix();
  drawHUD();
}

function mouseDragged() {
  // Adjust the offsets for dragging
  offsetX += movedX;
  offsetY += movedY;
}

function mouseWheel(event) {
  // Zooming at mouse position
  const zoomFactor = event.delta > 0 ? 0.9 : 1.1;
  const mouseWorldX = (mouseX - offsetX) / scaleFactor;
  const mouseWorldY = (mouseY - offsetY) / scaleFactor;

  scaleFactor *= zoomFactor;
  scaleFactor = constrain(scaleFactor, 0.00005, 1000); // Limit zoom levels

  // Adjust offsets to keep zoom centered on mouse
  offsetX = mouseX - mouseWorldX * scaleFactor;
  offsetY = mouseY - mouseWorldY * scaleFactor;
}

function keyPressed() {
  // Initialize spawn timer for key
  if (!keySpawnTimers[key]) {
    keySpawnTimers[key] = millis();
    spawnParticleByKey(key); // Spawn one particle immediately
  }

  // Other key-based interactions
  if (key === "q") frameRate(0);
  if (key === "w") frameRate(60);
  if (key === "e") frameRate(5);
  if (key === "C" || key === "c") particles = []; // Clear all particles
  if (key === "P" || key === "p") showPhotons = !showPhotons; // Toggle photon visibility
}

function keyReleased() {
  // Remove spawn timer for key
  delete keySpawnTimers[key];
}

function handleKeySpawn() {
  for (let key in keySpawnTimers) {
    let elapsed = millis() - keySpawnTimers[key];
    if (elapsed > 500) { // Start spawning continuously after 500ms
      spawnParticleByKey(key);
    }
  }
}

function spawnParticleByKey(key) {
  const x = mouseX / scaleFactor - offsetX / scaleFactor;
  const y = mouseY / scaleFactor - offsetY / scaleFactor;
  if (x >= -worldSize / 2 && x <= worldSize / 2 && y >= -worldSize / 2 && y <= worldSize / 2) {
    if (key === "1") particles.push(new Proton(x, y));
    if (key === "2") particles.push(new Neutron(x, y));
    if (key === "3") particles.push(new Electron(x, y));


  }
}

function drawHUD() {
  // Reset transformations to draw HUD in screen space
  resetMatrix();
  
  fill(255);
  textSize(16);
  
  text("Press 1: Proton, 2: Neutron, 3: Electron", width / 2, 20);
  text("Press C: Clear Particles", width / 2, 40);
  text(`Photons: ${showPhotons ? "Visible" : "Hidden"} (Toggle with P)`, width / 2, 60);
  text("Drag to move, Scroll to zoom", width / 2, 80);
}




class Particle {
  constructor(x, y, charge, mass, color) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.charge = charge;
    this.mass = mass;
    this.color = color;
  }

  applyForce(force) {
    this.ax += force.x / this.mass;
    this.ay += force.y / this.mass;
  }

  emitPhoton() {
    let speed = sqrt(this.vx ** 2 + this.vy ** 2);
    if (speed > photonEmissionSpeed && (this instanceof Neutron || this instanceof Proton)) {
      let direction = createVector(this.vx, this.vy).normalize();
      photons.push(new Photon(this.x, this.y, direction));
      this.vx *= 1 - photonEnergyLoss;
      this.vy *= 1 - photonEnergyLoss;
    }
    if (speed > photonEmissionSpeed*7 && (this instanceof Electron)) {
      let direction = createVector(this.vx, this.vy).normalize();
      photons.push(new Photon(this.x, this.y, direction));
      this.vx *= 1 - photonEnergyLoss;
      this.vy *= 1 - photonEnergyLoss;
    }
  }

  update() {

    this.vx += this.ax;
    this.vy += this.ay;
    this.x += this.vx;
    this.y += this.vy;
    this.ax = 0;
    this.ay = 0;

    // Emit photons if moving fast enough
    this.emitPhoton();

    // Screen wrapping
    if (this.x < -0.5*worldSize) this.x = 0.5*worldSize;
    if (this.x > 0.5*worldSize) this.x = -0.5*worldSize;
    if (this.y < -0.5*worldSize) this.y = 0.5*worldSize;
    if (this.y > 0.5*worldSize) this.y = -0.5*worldSize;

    function resolveCollision(thisObj, otherObj) {
      let dx = otherObj.x - thisObj.x;
      let dy = otherObj.y - thisObj.y;
      let distance = dist(thisObj.x, thisObj.y, otherObj.x, otherObj.y);
      let minDistance = 10; 
  
      if (distance < minDistance) {
          let overlap = minDistance - distance;
          let angle = atan2(dy, dx);
          
          // Push each circle away equally
          let moveX = (overlap / 2) * cos(angle);
          let moveY = (overlap / 2) * sin(angle);
  
          thisObj.x -= moveX;
          thisObj.y -= moveY;
          otherObj.x += moveX;
          otherObj.y += moveY;
      }
  }

    // Interaction with other particles
    for (let other of particles) {
      if (this !== other) {

        let r = dist(this.x, this.y, other.x, other.y);
        if (r > 0) {
          let direction = createVector(
            other.x - this.x,
            other.y - this.y
          ).normalize();

          // Gravitational force
          let gravForceMag = (G * (this.mass * other.mass)) / (r^2 + softeningFactor);
          let gravForce = direction.copy().mult(gravForceMag);
          this.applyForce(gravForce);

          // Electrostatic force
          if (simulateElectrostatic) {
            let electroForceMag = (k * (this.charge * other.charge)) / (r^2 + softeningFactor);
            // Correct attraction/repulsion logic
            if (this.charge * other.charge < 0) electroForceMag = Math.abs(electroForceMag);
            else electroForceMag = -Math.abs(electroForceMag);
            let electroForce = direction.copy().mult(electroForceMag);
            this.applyForce(electroForce);
          }

          // Strong nuclear force (short-range attraction)
          if (
            (this instanceof Proton && other instanceof Neutron) ||
            (this instanceof Neutron && other instanceof Proton)
          ) {
            let nuclearForceMag 
            if (r < 20 && r >11) {
              nuclearForceMag = strongnuclearConstant;

            }         
            let nuclearForce = direction.copy().mult(nuclearForceMag);
            this.applyForce(nuclearForce);

          }
          if (
            (this instanceof Proton && other instanceof Proton) 
          ) {
            resolveCollision(this,other);
          }
          if (
            (this instanceof Neutron && other instanceof Neutron)
          ) {
            resolveCollision(this,other);
          }
        }
      }
    }
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, 10);
  }
}

class Photon {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.vx = direction.x * 10; // Photon speed
    this.vy = direction.y * 10;
    this.color = color(255, 255, 0);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  isOnScreen() {
    return this.x >= -0.5*worldSize && this.x <= 0.5*worldSize && this.y >= -0.5*worldSize && this.y <= 0.5*worldSize;
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, 5);
  }
}

class Proton extends Particle {
  constructor(x, y) {
    super(x, y, protonCharge, protonMass, color(255, 0, 0));
  }
}

class Neutron extends Particle {
  constructor(x, y) {
    super(x, y, neutronCharge, neutronMass, color(255, 255, 0));
  }
}

class Electron extends Particle {
  constructor(x, y) {
    super(x, y, electronCharge, electronMass, color(0, 0, 255));
  }
}



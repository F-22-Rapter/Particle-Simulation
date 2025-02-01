let particles = [];
let simulateElectrostatic = true; // Toggle between electrostatic and gravitational forces
let protonCharge = 1; // Charge for protons
let neutronCharge = 0; // Charge for neutrons
let electronCharge = -1; // Charge for electrons
let protonMass = 1883; // Simplified mass
let neutronMass = 1883; // Simplified mass
let electronMass = 100; // Simplified mass
let protonRadius = 30;
let nuetronRadius = 25;
let electronRadius = 10;
let k = 9e5; // Simplified electrostatic constant
let G = 1e-6; // Simplified gravitational constant
let positiveForce = true; // Toggle for positive or negative force
let mouseForceMagnitude = 10; // Adjustable force magnitude for mouse
let softeningFactor = 0.1; // Factor to prevent division by zero or instability
let photonEmissionSpeed = 3; // Speed threshold for photon emission
let photonEnergyLoss = 0.5; // Fraction of speed lost upon photon emission
let strongnuclearConstant = 9e7
let nuclearMAX = 52;
let nuclearMIN = 17;
let showPhotons = false; // Toggle visibility of photons
let photons = []; // Store emitted photons
// Global variables for world transformations
let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;
let worldSize = 10000; // Define the size of the world
let keySpawnTimers = {}; // Track time keys are held
let mousegravity = 1000;
let mouseelectrostaic = 1000000;
let freazed = true;
let worldtime = true;
let boundx = -worldSize*0.5 + 0.5*window.innerWidth;
let boundy = -worldSize*0.5 + + 0.5*window.innerHeight
let circlex = 0.5*window.innerWidth
let circley =  0.5*window.innerHeight


function setup() {

  createCanvas(window.innerWidth, window.innerHeight);
  textAlign(CENTER, CENTER);
}
function ChangeLook(){

}

function draw() {
  background(0);


  // Apply transformations
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // Draw world boundaries
  stroke(255);
  noFill();
  rect(boundx, boundy, worldSize, worldSize);

  // circle bound
  // circle(0.5*window.innerWidth,0.5*window.innerHeight,worldSize); 

  // Spawn particles based on key hold duration
  handleKeySpawn();
  stroke(100);
  // Display particles
  for (let particle of particles) {
    if(worldtime){    
      particle.update();
    }
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
  if (key === "q"){ worldtime = false;
  frameRate(60)}
  if (key === "w") {worldtime = true 
  frameRate(60)};
  if (key === "e") {worldtime = true
    frameRate(5)};
  if (key === "C" || key === "c") particles = []; // Clear all particles
  if (key === "P" || key === "p") {
    showPhotons = !showPhotons
    photons = [];
} // Toggle photon visibility
  if (keyCode === SHIFT) freazed = !freazed;
}

function keyReleased() {
  // Remove spawn timer for key
  delete keySpawnTimers[key];
}



function handleKeySpawn() {

  for (let key in keySpawnTimers) {
    let elapsed = millis() - keySpawnTimers[key];
    if (elapsed > 500) { // Start spawning continuously after 500ms
      if(frameCount % 5 == 0){
        spawnParticleByKey(key);
      }
    }
  }
}

function spawnParticleByKey(key) {
  const x = mouseX / scaleFactor - offsetX / scaleFactor;
  const y = mouseY / scaleFactor - offsetY / scaleFactor;
  if (x >= -worldSize*0.5+0.5*window.innerWidth && x <= worldSize*0.5+0.5*window.innerWidth && y >= -worldSize*0.5+0.5*window.innerHeight && y <= worldSize*0.5+0.5*window.innerHeight) {

    if (key === "1") particles.push(new Proton(x, y,freazed));
    if (key === "2") particles.push(new Neutron(x, y,freazed));
    if (key === "3") particles.push(new Electron(x, y,freazed));


  }

}
function movePoint180(cx, cy, x, y) {
  // Rotate the point 180 degrees around the center (cx, cy)
  let newX = 2 * cx - x;
  let newY = 2 * cy - y;
  return { x: newX, y: newY };
}

function drawHUD() {
  // Reset transformations to draw HUD in screen space
  resetMatrix();
  
  fill(255);
  textSize(14);
  
  text("Press 1: Proton, 2: Neutron, 3: Electron, Hold key for continuous spawning", width / 2, 20);
  text("Press C: Clear Particles", width / 2, 40);
  text(`Photons: ${showPhotons ? "Visible" : "Hidden"} (Toggle with P)`, width / 2, 60);
  text("Drag to move, Scroll to zoom", width / 2, 100);
  if(freazed){
    text("Spawning particles: Moving (Toggle with Shift)", width / 2, 80);
  }else{
    text("Spawning particles: Freezed (Toggle with Shift)", width / 2, 80); 
  }
  text("Q: Time stop W: Time start E: Time 5fps", width / 2, 120);
  if(frameRate() <= 6 || worldtime){
    text("Time Start FPS: " + round(frameRate(),0) , width / 2, 140);
  }else{
    text("Time Frozen FPS: 0", width / 2, 140); 
  }
}




class Particle {
  constructor(x, y, charge, mass, color,freeze,particlesize) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.charge = charge;
    this.mass = mass;
    this.color = color;
    this.freeze = freeze;
    this.particlesize = particlesize;
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
    if (this.x < -0.5*worldSize+circlex) this.x = 0.5*worldSize+circlex;
    if (this.x > 0.5*worldSize+circlex) this.x = -0.5*worldSize+circlex;
    if (this.y < -0.5*worldSize+circley) this.y = 0.5*worldSize+circley;
    if (this.y > 0.5*worldSize+circley) this.y = -0.5*worldSize+circley;

    //screen wraping for circle
    // if(dist(this.x,this.y,circlex,circley)>0.5*worldSize){
    //   let opposite = movePoint180(circlex,circley,this.x,this.y)
    //   this.x = opposite.x
    //   this.y = opposite.y
    // }


    function resolveCollision(thisObj, otherObj) {
      let dx = otherObj.x - thisObj.x;
      let dy = otherObj.y - thisObj.y;
      let distance = dist(thisObj.x, thisObj.y, otherObj.x, otherObj.y);
      let minDistance = 10; 
  
      if (distance < minDistance ) {
          let overlap = minDistance - distance;
          let angle = atan2(dy, dx);
          
          // Push each circle away equally
          let moveX = (overlap / 2) * cos(angle);
          let moveY = (overlap / 2) * sin(angle);
  
          thisObj.x -= moveX;
          thisObj.y -= moveY;
          if(otherObj.isfrozen()){
            otherObj.x += moveX;
            otherObj.y += moveY;
          }

      }
  }
  if(this.freeze){
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
            if (r < nuclearMAX && r >nuclearMIN) {
              nuclearForceMag = strongnuclearConstant;

            }        
            if (r < nuclearMIN) {
              nuclearForceMag = -strongnuclearConstant;

            }          
            let nuclearForce = direction.copy().mult(nuclearForceMag);
            this.applyForce(nuclearForce);

          }
          // resolveCollision(this,other);

          // if (
          //   (this instanceof Proton && other instanceof Proton) 
          // ) {
          //   resolveCollision(this,other);
          // }
          // if (
          //   (this instanceof Neutron && other instanceof Neutron)
          // ) {
          //   resolveCollision(this,other);
          // }
        }
      }
    } 
    }
  }
  isfrozen(){
    return(this.freeze);
  }
  show() {

    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.particlesize);
    if(!this.freeze){
      noStroke();
      fill(0);
      ellipse(this.x, this.y, 4);
    }
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
    return this.x >= -0.5*worldSize+0.5*window.innerWidth && this.x <= 0.5*worldSize+0.5*window.innerWidth && this.y >= -0.5*worldSize+0.5*window.innerHeight&& this.y <= 0.5*worldSize+0.5*window.innerHeight;
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, 5);
  }
}

class Proton extends Particle {
  constructor(x, y,freeze) {
    super(x, y, protonCharge, protonMass, color(255, 0, 0),freeze,protonRadius);
  }
}

class Neutron extends Particle {
  constructor(x, y,freeze) {
    super(x, y, neutronCharge, neutronMass, color(255, 255, 0),freeze,nuetronRadius);
  }
}

class Electron extends Particle {
  constructor(x, y,freeze) {
    super(x, y, electronCharge, electronMass, color(0, 0, 255),freeze,electronRadius);
  }
}



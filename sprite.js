const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
var scoreElement = document.querySelector(".scorer");
var lifeElement = document.querySelector(".lifeplayer");
var lifeElementEnemy = document.querySelector(".lifeenemy");

canvas.width = 1440;
canvas.height = 810;

class Sprite {
    constructor({
        imageSrc,
        framewidth = 1,
        frameheight = 1,
        scale = 1,
        framerate = 1,
        framebuffer = 3,
        positionx = 0,
        positiony = 0,
        columns = 1,
        rows = 1,
        aligned = true
    }) {
        this.canvas = canvas;
        this.context = context;
        this.imagesource = new Image();
        this.imagesource.onload = () => {
            this.width = this.framewidth * this.scale;
            this.height = this.frameheight * this.scale;
            this.loaded = true;
            if (this.aligned) {
                this.numframes = Math.floor(this.imagesource.width / this.framewidth);
            } else {
                this.numframes = this.columns * this.rows;
            }
        };
        this.imagesource.src = imageSrc;
        this.scale = scale;
        this.currentframe = 0;
        this.elapsedframes = 0;
        this.framerate = framerate;
        this.framebuffer = framebuffer;
        this.framewidth = framewidth;
        this.frameheight = frameheight;
        this.positionx = positionx;
        this.positiony = positiony;
        this.speed = 1;
        this.ismoving = false;
        this.columns = columns;
        this.rows = rows;
        this.aligned = aligned; // Whether the frames are aligned in a single row
    }

    drawsprite() {
        if (this.loaded) {
            this.context.imageSmoothingEnabled = false;
            let sx = (this.currentframe % this.columns) * this.framewidth;
            let sy = Math.floor(this.currentframe / this.columns) * this.frameheight;
            
            // Correct vertical alignment
            const verticalOffset = this.aligned ? 0 : this.frameheight / 2;
    
            this.context.drawImage(
                this.imagesource,
                sx,
                sy,
                this.framewidth,
                this.frameheight,
                this.positionx,
                this.positiony - verticalOffset, // Adjust the drawing position to correct alignment
                this.width,
                this.height
            );
        }
    }
    
    

    updateframes() {
        this.elapsedframes++;
        if (this.elapsedframes % this.framebuffer === 0) {
            if (this.currentframe < this.numframes - 1) {
                this.currentframe++;
                // Update position based on current frame
                this.positionx += this.velocityX;
                if (this.positionx < 0) {
                    this.positionx = 0;
                } else if (this.positionx + this.width > this.canvas.width) {
                    this.positionx = this.canvas.width - this.width;
                }
            } else {
               this.currentframe = 0;
            }
        }
    }
    

    move() {
        if (this.ismoving) {
            requestAnimationFrame(this.move.bind(this));
        }
    }

    startmoving() {
        this.ismoving = true;
        this.move();
    }

  

    stopmoving() {
        this.ismoving = false;
    }

    update() {
        this.drawsprite();
        this.updateframes();
    }
}

class Actor extends Sprite {
    constructor({
        imageSrc,
        framewidth = 1,
        frameheight = 1,
        scale = 1,
        framerate = 1,
        framebuffer = 3,
        positionx = 0,
        positiony = 0,
        animations,
    }) {
        super({imageSrc, framewidth, frameheight, scale, framerate, framebuffer, positionx, positiony});
        this.animations = animations;
        for (let key in this.animations) {
            const image = new Image();
            image.src = this.animations[key].imageSrc;
            this.animations[key].image = image;
        }
        this.currentAnimation = null;
        this.velocityX = 0; // Add velocityX property to store horizontal velocity
        this.needsredraw = false; 
        this.isjumping = false;
        this.jumpstart = 0; 
        this.jumpheight = 100;
        this.jumpduration = 1000;
        this.score = 0; 
        this.life = 100;
        this.maxLife = 100;
        this.isDead = false;
        this.isAttacking;
    }

    jump() {
        if (!this.isjumping) {
            this.isjumping = true;
            const initialY = this.positiony;
            const jumpUp = () => {
                const timeElapsed = Date.now() - this.jumpstart;
                if (timeElapsed < this.jumpduration / 2) {
                    this.positiony = initialY - (this.jumpheight * (timeElapsed / (this.jumpduration / 2)));
                    requestAnimationFrame(jumpUp);
                } else {
                    jumpDown();
                }
            };

            const jumpDown = () => {
                const timeElapsed = Date.now() - this.jumpstart - (this.jumpduration / 2);
                if (timeElapsed < this.jumpduration / 2) {
                    this.positiony = initialY - this.jumpheight + (this.jumpheight * (timeElapsed / (this.jumpduration / 2)));
                    requestAnimationFrame(jumpDown);
                } else {
                    this.positiony = initialY;
                    this.isjumping = false;
                }
            };

            this.jumpstart = Date.now();
            requestAnimationFrame(jumpUp);
        }
    }

    // Method to move left
    moveLeft() {
        this.velocityX = -1 * this.speed; // Set horizontal velocity to move left
        this.needsRedraw = true; // Indicate a redraw is necessary
        if(this.positiony < this.canvas.height - 560){
            this.positiony = 560; 
        }
    }

    // Method to move right
    moveRight() {
        this.velocityX = this.speed; // Set horizontal velocity to move right
        this.needsRedraw = true; // Indicate a redraw is necessary
    }
    // Override updateframes to update position based on animation frames
    updateframes() {
        this.elapsedframes++;
        if (this.elapsedframes % this.framebuffer === 0) {
            if (this.currentframe < this.numframes - 1) {
                this.currentframe++;
                // Update position based on current frame
                this.positionx += this.velocityX;
                if (this.positionx < 0) {
                    this.positionx = 0;
                } else if (this.positionx + this.width > this.canvas.width) {
                    this.positionx = this.canvas.width - this.width;
                }
                this.needsRedraw = true;
            } else {
                this.currentframe = 0;
            }
        }
    }

    switchSprite(key) {
        if (this.currentAnimation === key || !this.loaded) return;
        this.currentframe = 0;
        this.imagesource = this.animations[key].image;
        this.framebuffer = this.animations[key].framebuffer;
        this.framerate = this.animations[key].framerate;
        this.framewidth = this.animations[key].framewidth;
        this.frameheight = this.animations[key].frameheight;
        this.columns = this.animations[key].columns;
        this.rows = this.animations[key].rows;
        this.aligned = this.animations[key].aligned;
        this.scale = this.animations[key].scale || this.scale;
        this.currentAnimation = key;
        this.width = this.framewidth * this.scale;
        this.height = this.frameheight * this.scale;
        this.needsRedraw = true; // Indicate a redraw is necessar
    }

    // Method to set the speed of the actor
    setSpeed(newSpeed) {
        this.speed = newSpeed;
    }

    setPositionY(newY) {
        this.positiony = newY;
    }

    setPositionX(newX){
        this.positionx = newX;
    }

    setJumpHeight(newJumpHeight){
        this.jumpheight = newJumpHeight;
    }

    setJumpDuration(newJumpDuration){
        this.jumpduration = newJumpDuration;
    }

    updateScore(points){
        this.score += points; 
    }

    removeLife(lostLife){
        this.life -= lostLife;
    }
    addLife(newLife){
        this.life += newLife;
    }
    gotHit() {
        this.removeLife(10);
        
        if (this.life <= 0) {
            this.life = 0;
            this.switchSprite('dead');
        } else {
            this.switchSprite('hurt');
            
            // Annuler le délai précédent s'il y en a un en cours
            if (this.hitTimeout) {
                clearTimeout(this.hitTimeout);
            }
            
            playSound("heartbeatdeath");
    
            // Définir un nouveau délai pour revenir à l'état idle après 5 secondes
            this.hitTimeout = setTimeout(() => {
                this.switchSprite('idle');
            }, 5000); // 5000 millisecondes = 5 secondes
        }
    }
    
    
}

class MovableSprite extends Sprite {
    constructor(params) {
        super(params);
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 1;
    }

    move() {
        if (this.ismoving) {
            this.positionx -= this.speed;
            requestAnimationFrame(this.move.bind(this));
        }
    }

    startmoving() {
        this.ismoving = true;
        this.move();
    }

    stopmoving() {
        this.ismoving = false;
    }

    setSpeed(newSpeed) {
        this.speed = newSpeed;
    }
    addLife(newLife){
        this.life += newLife;
    }
    removeLife(lostLife){
        this.life -=lostLife; 
    }
}

class Block extends MovableSprite {
    constructor(params) {
        super(params);
    }

    moveBlock() {
        this.velocityX = -this.speed;
        this.startmoving();
    }
    update(){
        super.update(); //appel de la classe parente
        if (this.positionx + this.width < 0) {
            this.positionx = this.canvas.width;  // Repositionner à la droite de l'écran
        }
    }
    
}

const block = new Block({
    imageSrc: "images/block.png",
    framewidth: 449,
    frameheight: 810,
    scale: 0.1,
    framerate: 1,
    framebuffer: 1,
    positionx: 1400,
    positiony: 745,
    aligned: true
});

const girl = new Actor({
    imageSrc: "images/Kunoichi/Idle.png",
    framewidth: 128,
    frameheight: 128,
    scale: 4,
    framerate: 10,
    framebuffer: 3,
    positionx: 200,
    positiony: 280,
    aligned: true,
    animations: {
        runLeft: {
            imageSrc: "images/Kunoichi/RunLeft.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 8,
            rows: 1,
            aligned: true, 
            scale: 4
        },
        runRight: {
            imageSrc: "images/Kunoichi/Run.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer:3,
            columns: 8,
            rows: 1,
            aligned: true,
            scale: 4
        },
        idle: { // Ajout de l'animation idle
            imageSrc: "images/Kunoichi/Idle.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 9,
            rows: 1,
            aligned: true,
            scale: 4
        },
        jumpSprite:{
            imageSrc: "images/Kunoichi/Jump.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 10,
            rows: 1,
            aligned: true,
            scale: 4
        },
        walk:{
            imageSrc: "images/Kunoichi/Walk.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 8,
            rows: 1,
            aligned: true,
            scale: 4

        },

        dead:{
            imageSrc: "images/Kunoichi/Dead.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 5,
            rows: 1,
            aligned: true,
            scale: 4

        },
        hurt:{
            imageSrc: "images/Kunoichi/Hurt.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 2,
            rows: 1,
            aligned: true,
            scale: 4

        },
        firstAttack:{
            imageSrc: "images/Kunoichi/Attack_1.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 6,
            rows: 1,
            aligned: true,
            scale: 4

        },

        secondAttack:{
            imageSrc: "images/Kunoichi/Attack_2.png",
            framewidth: 128,
            frameheight: 128,
            framerate: 10,
            framebuffer: 3,
            columns: 8,
            rows: 1,
            aligned: true,
            scale: 4

        },

    }
});

const enemy = new Actor({
    imageSrc: "images/Ninja_Monk/Idle.png",
    framewidth: 96,
    frameheight: 96,
    scale: 3.5,
    framerate: 10,
    framebuffer: 3,
    positionx: 1000,
    positiony: 450,
    aligned: true,
    animations: {
        runLeft: {
            imageSrc: "images/Ninja_Monk/Run.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 8,
            rows: 1,
            aligned: true, 
            scale: 3.5
        },
        runRight: {
            imageSrc: "images/Ninja_Monk/RunRight.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer:3,
            columns: 8,
            rows: 1,
            aligned: true,
            scale: 3.5
        },
        idle: { // Ajout de l'animation idle
            imageSrc: "images/Ninja_Monk/Idle.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 7,
            rows: 1,
            aligned: true,
            scale: 3.5
        },
        jumpSprite:{
            imageSrc: "images/Ninja_Monk/Jump.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 9,
            rows: 1,
            aligned: true,
            scale: 3.5
        },
        walk:{
            imageSrc: "images/Ninja_Monk/Walk.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 7,
            rows: 1,
            aligned: true,
            scale: 3.5

        },

        dead:{
            imageSrc: "images/Ninja_Monk/Dead.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 5,
            rows: 1,
            aligned: true,
            scale: 3.5

        },
        hurt:{
            imageSrc: "images/Ninja_Monk/Hurt.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 4,
            rows: 1,
            aligned: true,
            scale: 3.5

        },
        firstAttack:{
            imageSrc: "images/Ninja_Monk/Attack_1.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 5,
            rows: 1,
            aligned: true,
            scale: 3.5

        },

        secondAttack:{
            imageSrc: "images/Ninja_Monk/Attack_2.png",
            framewidth: 96,
            frameheight: 96,
            framerate: 10,
            framebuffer: 3,
            columns: 5,
            rows: 1,
            aligned: true,
            scale: 3.5

        },

    }



});


const backgroundImage = new Image();
backgroundImage.src = "./images/truebackground.png";
var scoreElement = document.querySelector(".scorer");
let timerInterval;
let checkDeadInterval;

function playSound(name) {
    var audio = new Audio("sounds/" + name + ".mp3");
    audio.play();
}

function playWav(name) {
    var audio = new Audio("sounds/" + name + ".wav");
    audio.play();
}

function startTimeandScore() {
    decreaseTimer()
    timerInterval = setInterval(() => {
        girl.updateScore(25);
        scoreElement.textContent = `Score: ${girl.score}`;
        lifeElement.textContent = `Player: ${girl.life}`;
        lifeElementEnemy.textContent = `Enemy: ${enemy.life}`;
        
        if (girl.score % 1000 === 0) {
            playWav("nextmille");
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function determineWinner({ girl, enemy, timerId }) {
    clearTimeout(timerId)
    playWav("levelcomplete2")
    document.querySelector('.timer').style.display = 'flex'
    if (girl.life === enemy.life) {
      document.querySelector('.timer').innerHTML = 'Tie'
    } else if (girl.life > enemy.life) {
      document.querySelector('.timer').innerHTML = 'Player Wins'
      enemy.drawsprite('dead');
    } else if (girl.life < enemy.life) {
      document.querySelector('.timer').innerHTML = 'Enemy Wins'
      girl.drawsprite('dead');
    }
}
  
  let timer = 60;
  let timerId;
  function decreaseTimer() {
    if (timer > 0) {
      timerId = setTimeout(decreaseTimer, 1000)
      timer--
      document.querySelector('.timer').innerHTML = timer
    }
  
    if (timer === 0) {
      determineWinner({ girl, enemy, timerId });
    }
  }
  

function startGame() {
    startTimeandScore();
   // block.startmoving();
   // block.setSpeed(3);
}



function resetGame() {
    girl.score = 0;
    girl.life = 100;
    scoreElement.textContent = `Score: ${girl.score}`;
    lifeElement.textContent = `Life: ${girl.life}`;
   //girl.positionx = 200;
   // block.startmoving();
   // block.setSpeed(3);
}


function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  //  block.update();
    girl.update();
    enemy.update();
    if (collision({
        object1:girl,
        object2: enemy
    }) && enemy.isAttacking && enemy.currentframe === 2) {
        girl.gotHit();
        enemy.isAttacking = false;

    }

    if (collision({
        object1:girl,
        object2: enemy
    }) && girl.isAttacking && (girl.currentframe === 3 || girl.currentframe === 4)) {
        enemy.gotHit();
        girl.isAttacking = false;
       
    }


    //if the enemy misses
   /* if(enemy.isAttacking && player.currentframe === 2){
        player.isAttacking = false
    }*/

    if(girl.life <= 0){
       // block.stopmoving();
       if (girl.currentAnimation === 'dead' && girl.currentframe === girl.numframes - 1 && girl.positiony == 280) {
        // Arrêter l'animation et l'affichage du personnage
       /// girl.currentframe = girl.numframes -1;
        girl.isDead = true;
        girl.stopmoving();
        //girl.setPositionY(280);
       // playSound("lose");
        stopTimer();
        clearInterval(checkDeadInterval);
        return;
    }
        
    } 

    if (enemy.life <= 0) {
        if (enemy.currentAnimation === 'dead' && enemy.currentframe === enemy.numframes - 1 && enemy.positiony == 450) {
            enemy.isDead = true;
            enemy.stopmoving();
           // playSound("lose");
            stopTimer();
            clearInterval(checkDeadInterval);
            clearTimeout(countdownTimer); // Arrêter le compte à rebours
            return;
        }
    }

     // end game based on health
  if (enemy.life <= 0 ||girl.life <= 0) {
    determineWinner({ girl, enemy, timerId });
  }
    requestAnimationFrame(animate);
}


function collision({ object1, object2 }) {
    return (
      object1.positiony + object1.height >= object2.positiony &&
      object1.positiony <= object2.positiony + object2.height &&
      object1.positionx <= object2.positionx + object2.width &&
      object1.positionx + object1.width >= object2.positionx
    );
  }

function detectCollisionBlock(spriteA, spriteB) {
    const offsetRigt = 110; // Adjust this value as needed
    const offsetTop = 30;
    const offsetLeft = 180; 
    const aRect = {
        left: spriteA.positionx + offsetLeft,
        right: spriteA.positionx + spriteA.width - offsetRigt,
        top: spriteA.positiony,
        bottom: spriteA.positiony + spriteA.height,
    };
    const bRect = {
        left: spriteB.positionx + offsetRigt,
        right: spriteB.positionx + spriteB.width,
        top: spriteB.positiony + offsetTop,
        bottom: spriteB.positiony + spriteB.height,
    };

    return (
        aRect.left < bRect.right &&
        aRect.right > bRect.left &&
        aRect.top < bRect.bottom &&
        aRect.bottom > bRect.top

    );
}


// Add event listeners for controlling animations and movement
window.addEventListener('keydown', (event) => {
    if(!girl.isDead){
    switch (event.key) {
        case 'ArrowLeft':
            girl.switchSprite('runLeft');
            girl.moveLeft();
            girl.setSpeed(40);
            girl.setPositionY(280);
            girl.startmoving();
            break;

        case 'ArrowRight':
            girl.switchSprite('runRight');
            girl.moveRight();
            girl.setSpeed(40);
            girl.setPositionY(280);
            girl.startmoving();
            break;

        case 'ArrowUp': 
            girl.switchSprite('jumpSprite');
            girl.jump();
            girl.setJumpHeight(200); //100
            girl.setJumpDuration(1500); //1000
            //girl.startmoving();
            break;
        case 'ArrowDown':
            girl.isAttacking = true;
            girl.switchSprite('secondAttack');
            playSound("sword");
            break;
        
        case 'a': 
            enemy.switchSprite('runLeft');
            enemy.moveLeft();
            enemy.setSpeed(40);
            enemy.setPositionY(450);
            enemy.startmoving();
            break;

        case 'd':
            enemy.switchSprite('runRight');
            enemy.moveRight();
            enemy.setSpeed(40);
            enemy.setPositionY(450);
            enemy.startmoving();
            break;

        case 'w': 
            enemy.switchSprite('jumpSprite');
            enemy.jump();
            enemy.setJumpHeight(200); //100
            enemy.setJumpDuration(1500); //1000
            //girl.startmoving();
            break;

        case ' ':
            enemy.isAttacking = true;
            enemy.switchSprite('firstAttack');
            playSound("sword");
            break;
    
    }
}
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
            girl.stopmoving();
            girl.velocityX = 0; // Reset horizontal velocity on key release
            girl.setPositionY(280);
            girl.switchSprite('idle'); // Switch to idle animation on key release
            break;
    }

    switch(event.key){
        case 'a': 
        case 'd':
        case 'w':
        case ' ':
            enemy.stopmoving();
            enemy.velocityX = 0; // Reset horizontal velocity on key release
            enemy.setPositionY(450);
            enemy.switchSprite('idle'); // Switch to idle animation on key release
            break;
    }
});

document.addEventListener("DOMContentLoaded", function() {
    animate();
    startGame();
});
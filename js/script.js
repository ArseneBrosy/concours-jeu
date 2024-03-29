// Jeu de tir
// by Arsène Brosy
import levelsJSON from "../json/levels.json" assert {type: "json"};
const DEBUG_MODE = false;

let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let playerSprite = new Image();
playerSprite.src = "./images/player/run/tile0.png"

//#region FIREBASE
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIOahi3ZGMTaknRbtRbixnQvae6rIZmcA",
  authDomain: "the-runner-f8249.firebaseapp.com",
  projectId: "the-runner-f8249",
  storageBucket: "the-runner-f8249.appspot.com",
  messagingSenderId: "260235442636",
  appId: "1:260235442636:web:c9d0c798fca39e6faa0569"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//#endregion

//#region CONSTANTES
const PLAYER_SPEED = 6;
const JUMP_FORCE = 10;
const GRAVITY_FORCE = 0.5;
const DASH_SIZE = 125;
const DASH_TIME = 7;
const EFFECT_DISTANCE = 50;
const WIN_ANIMATION_TIME = 700;
const WIN_ANIMATION_DELAY = 700;
//#endregion

//#region VARIABLES
let hardcoreMode = false;
let gameStarted = 0;
let canJump = false;
let canDash = false;
let isOnWall = false;
let trailTime = 0;
let dashSize = DASH_SIZE;
let started = false;
let ended = false;
let gameEnded = false;
let startedTimer = false;

let playerPositions = [];

let deaths = 0;
let deathAnimation = false;
let winAnimation = false;
let winCircleSize = 141;
let winAnimationStarted = 0;

let levelIndex = 0;
let trailX = 0;
let trailY = 0;

let globalAnimationIndex = 0;
let globalAnimationIndexCounter = 0;

const ANIMATIONS = [
    {
        name: "idle",
        size: 4,
        speed: 10
    },
    {
        name: "run",
        size: 6,
        speed: 5
    },
    {
        name: "jump_start",
        size: 2,
        speed: 3
    },
    {
        name: "jump_air",
        size: 1,
        speed: 1
    },
    {
        name: "jump_air_down",
        size: 2,
        speed: 3
    },
    {
        name: "jump_end",
        size: 1,
        speed: 1
    },
    {
        name: "slide",
        size: 1,
        speed: 1
    },
]

let player = {
    x: levelsJSON[levelIndex].spawn.x,
    y: levelsJSON[levelIndex].spawn.y,
    px: levelsJSON[levelIndex].spawn.x,
    py: levelsJSON[levelIndex].spawn.y,
    velocityX: 0,
    velocityY: 0,
    size: 40,
    animation: 0
};
let jumpSide = levelsJSON[levelIndex].dir;

let background = new Image();

//#endregion

//#region FUNCTIONS
function Distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.abs(x1 - x2)**2 + Math.abs(y1 - y2)**2);
}

function lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

    // if uA and uB are between 0-1, lines are colliding
    return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
}
//#endregion

function loop() {
    canvas.width = 1000;
    canvas.height = 1000;

    if (gameEnded) {
        document.getElementById("endscreen").classList.add("active");
        document.getElementById("playerendscreen").src = "./images/player/run/" + (globalAnimationIndex % 6) + ".png";

        globalAnimationIndexCounter ++;
        if (globalAnimationIndexCounter >= 5) {
            globalAnimationIndexCounter = 0;
            globalAnimationIndex ++;
        }

        requestAnimationFrame(loop);
        return;
    }

    //#region COLLISONS
    let bottomDis = player.velocityY;
    canJump = false;
    for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
        // bottom
        let actualBottomDis = levelsJSON[levelIndex].walls[i].y1 - (player.y + player.size / 2);
        if (actualBottomDis > -player.velocityY && actualBottomDis < bottomDis && levelsJSON[levelIndex].walls[i].x1 < player.x + player.size / 2 && levelsJSON[levelIndex].walls[i].x2 > player.x - player.size / 2) {
            bottomDis = actualBottomDis;
            player.velocityY = 0;
            if (player.velocityX === 0) {
                player.animation = 0;
            } else {
                player.animation = 1;
            }
            canJump = true;
            canDash = true;
        }
        if (isOnWall > 0 ) { isOnWall--; }
        // right
        if (player.velocityX >= 0 && player.x + player.size/2 + player.velocityX >= levelsJSON[levelIndex].walls[i].x1 && player.x + player.size/2 <= levelsJSON[levelIndex].walls[i].x1 && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
            player.x += levelsJSON[levelIndex].walls[i].x1 - (player.x + player.size/2);
            player.velocityX = 0;
            player.animation = 6;
            jumpSide = -1;
            canJump = true;
            canDash = true;
            isOnWall = 5;
        }
        // left
        if (player.velocityX <= 0 && player.x - player.size/2 + player.velocityX <= levelsJSON[levelIndex].walls[i].x2 && player.x - player.size/2 >= levelsJSON[levelIndex].walls[i].x2 && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
            player.x -= (player.x - player.size/2) - levelsJSON[levelIndex].walls[i].x2;
            player.velocityX = 0;
            player.animation = 6;
            jumpSide = 1;
            canJump = true;
            canDash = true;
            isOnWall = 5;
        }
    }
    for (let i = 0; i < levelsJSON[levelIndex].orbs.length; i++) {
        if (Distance(levelsJSON[levelIndex].orbs[i].x, levelsJSON[levelIndex].orbs[i].y, player.x, player.y) <= EFFECT_DISTANCE) {
            canJump = true;
            canDash = true;
        }
    }
    //#endregion

    //#region MOVE PLAYER
    if (trailTime === 0 && !ended) {
        player.x += player.velocityX;
        player.y += bottomDis;
        player.velocityY += GRAVITY_FORCE;
    }

    if (player.velocityY < 0) {
        let wallDistance = Infinity;
        for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
            if (levelsJSON[levelIndex].walls[i].x1  < player.x + player.size / 2 &&
                levelsJSON[levelIndex].walls[i].x2  > player.x - player.size / 2 &&
                levelsJSON[levelIndex].walls[i].y2  < player.y) {
                    let distance = (player.y - player.size / 2) - levelsJSON[levelIndex].walls[i].y2;
                    wallDistance = distance < wallDistance ? distance : wallDistance;
            }
        }
        if (wallDistance < 0) {
            player.y -= wallDistance;
            player.velocityY = 0;
        }
    }
    //#endregion

    //#region ANIMATIONS
    if (player.animation == 2 && globalAnimationIndex % ANIMATIONS[2].size == ANIMATIONS[2].size - 1) {
        player.animation = 3;
        globalAnimationIndex = 0;
    }
    if (player.animation === 6 && isOnWall === 0) {
        player.animation = 3;
    }
    //#endregion

    //#region DEATH
    if ((player.y > 1000 || player.y < 0 || player.x > 1000 || player.x < 0) && !deathAnimation && !winAnimation) {
        deaths ++;
        if (DEBUG_MODE) {
            if (hardcoreMode) {
                levelIndex = 0;
                deaths = 0;
                startedTimer = false;
            }
            player = {
                x: levelsJSON[levelIndex].spawn.x,
                y: levelsJSON[levelIndex].spawn.y,
                px: levelsJSON[levelIndex].spawn.x,
                py: levelsJSON[levelIndex].spawn.y,
                velocityX: 0,
                velocityY: 0,
                size: 40,
                animation: 0
            };
        } else {
            deathAnimation = true;
            document.querySelector("#deathtexttransparent").innerHTML = " ";
            for (let i = 0; i < deaths.toString().length; i++) {
                document.querySelector("#deathtexttransparent").innerHTML += "-";
            }
            document.querySelector("#deathtextbefore").innerHTML = deaths - 1;
            document.querySelector("#deathtextafter").innerHTML = deaths;
            document.getElementById("blur").classList.add("active");
            setTimeout(() => {
                document.getElementById("blur").classList.remove("active");
                deathAnimation = false;
                if (hardcoreMode) {
                    levelIndex = 0;
                    deaths = 0;
                    startedTimer = false;
                }
                player = {
                    x: levelsJSON[levelIndex].spawn.x,
                    y: levelsJSON[levelIndex].spawn.y,
                    px: levelsJSON[levelIndex].spawn.x,
                    py: levelsJSON[levelIndex].spawn.y,
                    velocityX: 0,
                    velocityY: 0,
                    size: 40,
                    animation: 0
                };
                jumpSide = levelsJSON[levelIndex].dir;
            }, 1800);
        }
        started = false;
        jumpSide = levelsJSON[levelIndex].dir;
    }
    //#endregion

    //#region WIN
    let leftLine = lineLine(player.x, player.y, player.px, player.py, levelsJSON[levelIndex].end.x1, levelsJSON[levelIndex].end.y1, levelsJSON[levelIndex].end.x1, levelsJSON[levelIndex].end.y2);
    let rightLine = lineLine(player.x, player.y, player.px, player.py, levelsJSON[levelIndex].end.x2, levelsJSON[levelIndex].end.y1, levelsJSON[levelIndex].end.x2, levelsJSON[levelIndex].end.y2);
    let topLine = lineLine(player.x, player.y, player.px, player.py, levelsJSON[levelIndex].end.x1, levelsJSON[levelIndex].end.y1, levelsJSON[levelIndex].end.x2, levelsJSON[levelIndex].end.y1);
    let bottomLine = lineLine(player.x, player.y, player.px, player.py, levelsJSON[levelIndex].end.x1, levelsJSON[levelIndex].end.y2, levelsJSON[levelIndex].end.x2, levelsJSON[levelIndex].end.y2);
    let touchEnd = leftLine || rightLine || topLine || bottomLine;
    if (touchEnd && !winAnimation) {
        console.log(`level ${levelIndex} completed`);
        ended = true;
        if (DEBUG_MODE) {
            levelIndex++;
            if (levelsJSON.length <= levelIndex) {
                gameEnded = true;
            }
            player = {
                x: levelsJSON[levelIndex].spawn.x,
                y: levelsJSON[levelIndex].spawn.y,
                px: levelsJSON[levelIndex].spawn.x,
                py: levelsJSON[levelIndex].spawn.y,
                velocityX: 0,
                velocityY: 0,
                size: 40,
                animation: 0
            };
        } else {
            winAnimation = true;
            canvas.style.clipPath = `circle(${winCircleSize}% at ${player.x / 10}% ${player.y / 10}%)`;
            winAnimationStarted = new Date().getTime();
            player.velocityX = 0;
            player.animation = 0;
            setTimeout(() => {
                levelIndex++;
                if (levelsJSON.length <= levelIndex) {
                    gameEnded = true;
                }
                player = {
                    x: levelsJSON[levelIndex].spawn.x,
                    y: levelsJSON[levelIndex].spawn.y,
                    px: levelsJSON[levelIndex].spawn.x,
                    py: levelsJSON[levelIndex].spawn.y,
                    velocityX: 0,
                    velocityY: 0,
                    size: 40,
                    animation: 0
                };
                jumpSide = levelsJSON[levelIndex].dir;
                winAnimation = false;
            }, WIN_ANIMATION_TIME);
        }
        started = false;
        ended = false;
        jumpSide = levelsJSON[levelIndex].dir;
    }
    if (winAnimation) {
        winCircleSize = parseInt(141 * (1 - ((new Date().getTime() - winAnimationStarted) / WIN_ANIMATION_TIME)));
        canvas.style.clipPath = `circle(${winCircleSize}% at ${player.x / 10}% ${player.y / 10}%)`;
    } else if (winCircleSize < 141 && new Date().getTime() - (WIN_ANIMATION_TIME + WIN_ANIMATION_DELAY) >= winAnimationStarted) {
        winCircleSize = parseInt(141 * (((new Date().getTime() - winAnimationStarted - (WIN_ANIMATION_TIME + WIN_ANIMATION_DELAY)) / WIN_ANIMATION_TIME)));
        canvas.style.clipPath = `circle(${winCircleSize}% at ${player.x / 10}% ${player.y / 10}%)`;
    }
    //#endregion

    //#region DRAW
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "red";

    background.src = "./images/levels/level" + levelIndex + ".png";
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // hardcore mode
    document.getElementById("harcoremode").style.display = startedTimer ? "none" : "flex";

    // player
    if (trailTime > 0) {
        trailTime --;
        playerSprite.src = "./images/player/jump_air/0" + (jumpSide == -1 ? "flip" : "") + ".png";
        ctx.drawImage(playerSprite, trailX + dashSize * (DASH_TIME - trailTime) / DASH_TIME * jumpSide, trailY, player.size, player.size);
    } else {
        playerSprite.src = "./images/player/" + ANIMATIONS[player.animation].name + "/" + (globalAnimationIndex % ANIMATIONS[player.animation].size) + (jumpSide == -1 ? "flip" : "") + ".png";
        ctx.drawImage(playerSprite, player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    }

    // timer
    if (startedTimer) {
        let gameTime = new Date().getTime() - gameStarted;
        let minutes = parseInt(gameTime / 60000);
        let seconds = parseInt(gameTime / 1000) % 60;
        let decimals = parseInt(gameTime / 100) % 10;
        let decimalsPrecise = parseInt(gameTime / 10) % 100;
        document.getElementById("timer").innerHTML = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${decimals}`
        document.getElementById("timertextendscreen").innerHTML = `<img src="./images/GUI/timer.png">${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${decimalsPrecise}`
    } else {
        document.getElementById("timer").innerHTML = `0:00.0`
    }

    // death
    document.getElementById("deathtextendscreen").innerHTML = "<img src='./images/GUI/skull.png'>" + deaths;

    if (DEBUG_MODE) {
        // player
        ctx.fillStyle = "red";
        ctx.lineWidth = 5;

        playerPositions.push([player.x, player.y]);
        for (let i = 0; i < playerPositions.length; i++) {
            ctx.fillRect(playerPositions[i][0]-2, playerPositions[i][1]-2, 4, 4);
        }

        // grid
        ctx.fillStyle = "grey";
        for (let i = 0; i <= canvas.width; i+= 50) {
            ctx.fillRect(i, 0, 1, canvas.height);
        }
        for (let i = 0; i <= canvas.width; i+= 50) {
            ctx.fillRect(0, i, canvas.width, 1);
        }

        // walls
        for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
            ctx.strokeRect(levelsJSON[levelIndex].walls[i].x1, levelsJSON[levelIndex].walls[i].y1, levelsJSON[levelIndex].walls[i].x2 - levelsJSON[levelIndex].walls[i].x1, levelsJSON[levelIndex].walls[i].y2 - levelsJSON[levelIndex].walls[i].y1);
        }

        // orbs
        ctx.fillStyle = "green";
        for (let i = 0; i < levelsJSON[levelIndex].orbs.length; i++) {
            ctx.fillRect(levelsJSON[levelIndex].orbs[i].x - 5, levelsJSON[levelIndex].orbs[i].y - 5, 10, 10);
        }

        // ends
        ctx.strokeStyle = "blue";
        ctx.strokeRect(levelsJSON[levelIndex].end.x1, levelsJSON[levelIndex].end.y1, levelsJSON[levelIndex].end.x2 - levelsJSON[levelIndex].end.x1, levelsJSON[levelIndex].end.y2 - levelsJSON[levelIndex].end.y1);
        
        //player
        ctx.fillStyle = "blue"
        ctx.fillRect(player.x - player.size/2, player.y - player.size/2, player.size, player.size);
        
        // player line
        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.moveTo(player.px, player.py);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
    }

    //#endregion
    globalAnimationIndexCounter ++;
    if (globalAnimationIndexCounter >= ANIMATIONS[player.animation].speed) {
        globalAnimationIndexCounter = 0;
        globalAnimationIndex ++;
    }
    player.px = player.x;
    player.py = player.y;
    requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !deathAnimation) {
        if (!startedTimer) {
            gameStarted = new Date().getTime();
            startedTimer = true;
            document.getElementById("logo").classList.add("quited");
        }
        if (canJump) {
            if (player.velocityX === 0) {
                player.velocityX = PLAYER_SPEED * jumpSide;
                player.animation = 1;
                globalAnimationIndex = 0;
            }
            if (started) {
                player.velocityY = -JUMP_FORCE;
                player.animation = 2;
                globalAnimationIndex = 0;
            } else {
                started = true;
                playerPositions = [];
            }
        } else if (canDash) {
            trailX = player.x - player.size/2;
            trailY = player.y - player.size/2;
            dashSize = DASH_SIZE;
            if (jumpSide === 1) {
                for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
                    if (levelsJSON[levelIndex].walls[i].x1 > player.x && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
                        let distance = levelsJSON[levelIndex].walls[i].x1 - (player.x + player.size);
                        distance = distance < 0 ? 0 : distance;
                        dashSize = distance < dashSize ? distance : dashSize;
                    }
                }
            } else {
                for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
                    if (levelsJSON[levelIndex].walls[i].x2  < player.x && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
                        let distance = (player.x - player.size) - levelsJSON[levelIndex].walls[i].x2;
                        distance = distance < 0 ? 0 : distance;
                        dashSize = distance < dashSize ? distance : dashSize;
                    }
                }
            }
            player.x += dashSize * jumpSide;
            canDash = false;
            trailTime = parseInt(DASH_TIME * dashSize / DASH_SIZE);
        }
    }
    if (e.code === "KeyX" && !startedTimer) {
        hardcoreMode = !hardcoreMode;
        document.getElementById("harcoremode").innerHTML = `<img src="images/GUI/X.png">hardcore mode: ${hardcoreMode ? "on" : "off"}`;
    }
});

document.addEventListener("touchstart", () => {
    if (!deathAnimation) {
        if (!startedTimer) {
            gameStarted = new Date().getTime();
            startedTimer = true;
            document.getElementById("logo").classList.add("quited");
        }
        if (canJump) {
            if (player.velocityX === 0) {
                player.velocityX = PLAYER_SPEED * jumpSide;
                player.animation = 1;
                globalAnimationIndex = 0;
            }
            if (started) {
                player.velocityY = -JUMP_FORCE;
                player.animation = 2;
                globalAnimationIndex = 0;
            } else {
                started = true;
                playerPositions = [];
            }
        } else if (canDash) {
            trailX = player.x - player.size/2;
            trailY = player.y - player.size/2;
            dashSize = DASH_SIZE;
            if (jumpSide === 1) {
                for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
                    if (levelsJSON[levelIndex].walls[i].x1 > player.x && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
                        let distance = levelsJSON[levelIndex].walls[i].x1 - (player.x + player.size);
                        distance = distance < 0 ? 0 : distance;
                        dashSize = distance < dashSize ? distance : dashSize;
                    }
                }
            } else {
                for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
                    if (levelsJSON[levelIndex].walls[i].x2  < player.x && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
                        let distance = (player.x - player.size) - levelsJSON[levelIndex].walls[i].x2;
                        distance = distance < 0 ? 0 : distance;
                        dashSize = distance < dashSize ? distance : dashSize;
                    }
                }
            }
            player.x += dashSize * jumpSide;
            canDash = false;
            trailTime = parseInt(DASH_TIME * dashSize / DASH_SIZE);
        }
    }
});

// start game
requestAnimationFrame(loop);
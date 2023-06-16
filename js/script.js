// Jeu de tir
// by Arsène Brosy
import levelsJSON from "../json/levels.json" assert {type: "json"};

let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let playerSprite = new Image();
playerSprite.src = "./images/player/run/tile0.png"

//#region CONSTANTES
const PLAYER_SPEED = 6;
const JUMP_FORCE = 10;
const GRAVITY_FORCE = 0.5;
const DASH_SIZE = 125;
const DASH_TIME = 7;
const EFFECT_DISTANCE = 50;
const DEBUG_MODE = true;
//#endregion

//#region VARIABLES
let canJump = false;
let canDash = false;
let isOnWall = false;
let trailTime = 0;
let dashSize = DASH_SIZE;
let started = false;
let ended = false;

let deaths = 0;
let deathAnimation = false;

let levelIndex = 5;
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
//#endregion

function loop() {
    canvas.width = 1000;
    canvas.height = 1000;

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
    if ((player.y > 1000 || player.y < 0 || player.x > 1000 || player.x < 0) && !deathAnimation) {
        deaths ++;
        if (DEBUG_MODE) {
            player = {
                x: levelsJSON[levelIndex].spawn.x,
                y: levelsJSON[levelIndex].spawn.y,
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
                player = {
                    x: levelsJSON[levelIndex].spawn.x,
                    y: levelsJSON[levelIndex].spawn.y,
                    velocityX: 0,
                    velocityY: 0,
                    size: 40,
                    animation: 0
                };
            }, 1800);
        }
        started = false;
        jumpSide = levelsJSON[levelIndex].dir;
    }
    //#endregion

    //#region WIN
    if (Distance(levelsJSON[levelIndex].end.x, levelsJSON[levelIndex].end.y, player.x, player.y) <= EFFECT_DISTANCE) {
        ended = true;
        levelIndex++;
        player = {
            x: levelsJSON[levelIndex].spawn.x,
            y: levelsJSON[levelIndex].spawn.y,
            velocityX: 0,
            velocityY: 0,
            size: 40,
            animation: 0
        };
        started = false;
        ended = false;
        jumpSide = levelsJSON[levelIndex].dir;
    }
    //#endregion

    //#region DRAW
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "red";

    background.src = "./images/levels/level" + levelIndex + ".png";
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    if (DEBUG_MODE) {
        ctx.fillStyle = "grey";
        for (let i = 0; i <= canvas.width; i+= 50) {
            ctx.fillRect(i, 0, 1, canvas.height);
        }
        for (let i = 0; i <= canvas.width; i+= 50) {
            ctx.fillRect(0, i, canvas.width, 1);
        }
    }
    
    // player
    ctx.fillStyle = "red";
    ctx.lineWidth = 5;
    if (trailTime > 0) {
        trailTime --;
        playerSprite.src = "../images/player/jump_air/0" + (jumpSide == -1 ? "flip" : "") + ".png";
        ctx.drawImage(playerSprite, trailX + dashSize * (DASH_TIME - trailTime) / DASH_TIME * jumpSide, trailY, player.size, player.size);
    } else {
        playerSprite.src = "../images/player/" + ANIMATIONS[player.animation].name + "/" + (globalAnimationIndex % ANIMATIONS[player.animation].size) + (jumpSide == -1 ? "flip" : "") + ".png";
        ctx.drawImage(playerSprite, player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    }    
    
    if (DEBUG_MODE) {
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
        ctx.fillStyle = "blue";
        ctx.fillRect(levelsJSON[levelIndex].end.x - 5, levelsJSON[levelIndex].end.y - 5, 10, 10);
    }
    //#endregion
    globalAnimationIndexCounter ++;
    if (globalAnimationIndexCounter >= ANIMATIONS[player.animation].speed) {
        globalAnimationIndexCounter = 0;
        globalAnimationIndex ++;
    }
    requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !deathAnimation) {
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
            }
        } else if (canDash) {
            trailX = player.x - player.size/2;
            trailY = player.y - player.size/2;
            dashSize = DASH_SIZE;
            if (jumpSide === 1) {
                for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
                    if (levelsJSON[levelIndex].walls[i].x1 > player.x + player.size && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
                        let distance = levelsJSON[levelIndex].walls[i].x1 - (player.x + player.size);
                        dashSize = distance < dashSize ? distance : dashSize;
                    }
                }
            } else {
                for (let i = 0; i < levelsJSON[levelIndex].walls.length; i++) {
                    if (levelsJSON[levelIndex].walls[i].x2 < player.x - player.size && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
                        let distance = (player.x - player.size) - levelsJSON[levelIndex].walls[i].x2;
                        dashSize = distance < dashSize ? distance : dashSize;
                    }
                }
            }
            player.x += dashSize * jumpSide;
            canDash = false;
            trailTime = DASH_TIME;
        }
    }
});

// start game
requestAnimationFrame(loop);
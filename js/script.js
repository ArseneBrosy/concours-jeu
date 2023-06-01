// Jeu de tir
// by Arsène Brosy
import levelsJSON from "../json/levels.json" assert {type: "json"};

let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

//#region CONSTANTES
const PLAYER_SPEED = 6;
const JUMP_FORCE = 10;
const GRAVITY_FORCE = 0.5;
const DASH_SIZE = 125;
const DASH_TIME = 5;
const EFFECT_DISTANCE = 50;
const DRAW_GRID = false;
const DRAW_HITBOXES = false;
const DRAW_LEVEL = true;
//#endregion

//#region VARIABLES
let canJump = false;
let canDash = false;
let trailTime = 0;
let dashSize = DASH_SIZE;
let started = false;
let ended = false;

let levelIndex = 0;
let trailX = 0;
let trailY = 0;

let player = {
    x: levelsJSON[levelIndex].spawn.x,
    y: levelsJSON[levelIndex].spawn.y,
    velocityX: 0,
    velocityY: 0,
    size: 20
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
            canJump = true;
            canDash = true;
        }
        // right
        if (player.velocityX >= 0 && player.x + player.size/2 + player.velocityX >= levelsJSON[levelIndex].walls[i].x1 && player.x + player.size/2 <= levelsJSON[levelIndex].walls[i].x1 && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
            player.x += levelsJSON[levelIndex].walls[i].x1 - (player.x + player.size/2);
            player.velocityX = 0;
            jumpSide = -1;
            canJump = true;
            canDash = true;
        }
        // left
        if (player.velocityX <= 0 && player.x - player.size/2 + player.velocityX <= levelsJSON[levelIndex].walls[i].x2 && player.x - player.size/2 >= levelsJSON[levelIndex].walls[i].x2 && levelsJSON[levelIndex].walls[i].y1 < player.y + player.size / 2 && levelsJSON[levelIndex].walls[i].y2 > player.y - player.size / 2) {
            player.x -= (player.x - player.size/2) - levelsJSON[levelIndex].walls[i].x2;
            player.velocityX = 0;
            jumpSide = 1;
            canJump = true;
            canDash = true;
        }
    }
    for (let i = 0; i < levelsJSON[levelIndex].orbs.length; i++) {
        if (Distance(levelsJSON[levelIndex].orbs[i].x, levelsJSON[levelIndex].orbs[i].y, player.x, player.y) <= EFFECT_DISTANCE) {
            canJump = true;
            canDash = true;
        }
    }
    //#endregion

    //#endregion MOVE PLAYER
    if (trailTime === 0 && !ended) {
        player.x += player.velocityX;
        player.y += bottomDis;
        player.velocityY += GRAVITY_FORCE;
    }
    //#endregion

    //#region DEATH
    if (player.y > 1000) {
        player = {
            x: levelsJSON[levelIndex].spawn.x,
            y: levelsJSON[levelIndex].spawn.y,
            velocityX: 0,
            velocityY: 0,
            size: 20
        };
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
            size: 20
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

    if (DRAW_LEVEL) {
        background.src = "./images/levels/level" + levelIndex + ".png";
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    if (DRAW_GRID) {
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
        ctx.fillRect(trailX + dashSize * (DASH_TIME - trailTime) / DASH_TIME * jumpSide, trailY, player.size, player.size);
    } else {
        ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    }
    
    if (DRAW_HITBOXES) {
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
    requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (canJump) {
            if (player.velocityX === 0) {
                player.velocityX = PLAYER_SPEED * jumpSide;
            }
            if (started) {
                player.velocityY = -JUMP_FORCE;
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
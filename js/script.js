// Jeu de tir
// by Arsène Brosy
let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

//#region CONSTANTES
const PLAYER_SPEED = 6;
const JUMP_FORCE = 10;
const GRAVITY_FORCE = 0.5;
const DASH_SIZE = 125;
const DASH_TIME = 7;
//#endregion

//#region VARIABLES
// souris
let mouseX = 0;
let mouseY = 0;

let canJump = false;
let canDash = false;
let canWallJump = false;
let jumpSide = 1;
let trailTime = 0;
let dashSize = DASH_SIZE;
let started = false;

let walls = [
    [
        {
            x1: 25,
            y1: 900,
            x2: 250,
            y2: 1000
        },
        {
            x1: 350,
            y1: 750,
            x2: 400,
            y2: 850
        },
        {
            x1: 175,
            y1: 650,
            x2: 225,
            y2: 750
        },
        {
            x1: 650,
            y1: 700,
            x2: 850,
            y2: 800
        },
        {
            x1: 950,
            y1: 300,
            x2: 1000,
            y2: 650
        },
        {
            x1: 550,
            y1: 450,
            x2: 650,
            y2: 550
        },
        {
            x1: 50,
            y1: 300,
            x2: 200,
            y2: 350
        },
        {
            x1: 0,
            y1: 100,
            x2: 50,
            y2: 250
        },
    ]
];
let orbs = [
    [
        {
            x: 500,
            y: 730
        },
        {
            x: 390,
            y: 375
        },
    ]
];
let ends = [
    {
        x: 0,
        y: 0
    }
];
let spawns = [
    {
        x: 100,
        y: 890
    }
];
let levelIndex = 0;
let trailX = 0;
let trailY = 0;

let player = {
    x: spawns[levelIndex].x,
    y: spawns[levelIndex].y,
    velocityX: 0,
    velocityY: 0,
    size: 20
};

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
    let canMoveDown = true;
    let bottomDis = player.velocityY;
    canJump = false;
    for (let i = 0; i < walls[levelIndex].length; i++) {
        // bottom
        let actualBottomDis = walls[levelIndex][i].y1 - (player.y + player.size / 2);
        if (actualBottomDis > -player.velocityY && actualBottomDis < bottomDis && walls[levelIndex][i].x1 < player.x + player.size / 2 && walls[levelIndex][i].x2 > player.x - player.size / 2) {
            bottomDis = actualBottomDis;
            canMoveDown = false;
            player.velocityY = 0;
            canJump = true;
            canDash = true;
        }
        // right
        if (player.velocityX >= 0 && player.x + player.size/2 + player.velocityX >= walls[levelIndex][i].x1 && player.x + player.size/2 <= walls[levelIndex][i].x1 && walls[levelIndex][i].y1 < player.y + player.size / 2 && walls[levelIndex][i].y2 > player.y - player.size / 2) {
            player.x += walls[levelIndex][i].x1 - (player.x + player.size/2);
            player.velocityX = 0;
            jumpSide = -1;
            canJump = true;
            canDash = true;
        }
        // left
        if (player.velocityX <= 0 && player.x - player.size/2 + player.velocityX <= walls[levelIndex][i].x2 && player.x - player.size/2 >= walls[levelIndex][i].x2 && walls[levelIndex][i].y1 < player.y + player.size / 2 && walls[levelIndex][i].y2 > player.y - player.size / 2) {
            player.x -= (player.x - player.size/2) - walls[levelIndex][i].x2;
            player.velocityX = 0;
            jumpSide = 1;
            canJump = true;
            canDash = true;
        }
    }
    for (let i = 0; i < orbs[levelIndex].length; i++) {
        if (Distance(orbs[levelIndex][i].x, orbs[levelIndex][i].y, player.x, player.y) <= player.size * 2) {
            canJump = true;
            canDash = true;
        }
    }
    //#endregion

    //#endregion MOVE PLAYER
    if (trailTime === 0) {
        player.x += player.velocityX;
        player.y += bottomDis;
        player.velocityY += GRAVITY_FORCE;
    }
    //#endregion

    //#region DEATH
    if (player.y > 1000) {
        player = {
            x: spawns[levelIndex].x,
            y: spawns[levelIndex].y,
            velocityX: 0,
            velocityY: 0,
            size: 20
        };
        started = false;
        jumpSide = 1;
    }
    //#endregion

    //#region DRAW
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.strokeStyle = "red";
    
    // player
    if (trailTime > 0) {
        trailTime --;
        ctx.fillRect(trailX + dashSize * (DASH_TIME - trailTime) / DASH_TIME * jumpSide, trailY, player.size, player.size);
    } else {
        ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    }
    
    // walls
    for (let i = 0; i < walls[levelIndex].length; i++) {
        ctx.strokeRect(walls[levelIndex][i].x1, walls[levelIndex][i].y1, walls[levelIndex][i].x2 - walls[levelIndex][i].x1, walls[levelIndex][i].y2 - walls[levelIndex][i].y1);
    }

    // orbs
    ctx.fillStyle = "green";
    for (let i = 0; i < orbs[levelIndex].length; i++) {
        ctx.fillRect(orbs[levelIndex][i].x - 5, orbs[levelIndex][i].y - 5, 10, 10);
    }

    // ends
    ctx.fillStyle = "blue";
    ctx.fillRect(ends[levelIndex].x - 5, ends[levelIndex].y - 5, 10, 10);
    //#endregion
    requestAnimationFrame(loop);
}

document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

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
                for (let i = 0; i < walls[levelIndex].length; i++) {
                    if (walls[levelIndex][i].x1 > player.x + player.size && walls[levelIndex][i].y1 < player.y + player.size / 2 && walls[levelIndex][i].y2 > player.y - player.size / 2) {
                        let distance = walls[levelIndex][i].x1 - (player.x + player.size);
                        dashSize = distance < dashSize ? distance : dashSize;
                    }
                }
            } else {
                for (let i = 0; i < walls[levelIndex].length; i++) {
                    if (walls[levelIndex][i].x2 < player.x - player.size && walls[levelIndex][i].y1 < player.y + player.size / 2 && walls[levelIndex][i].y2 > player.y - player.size / 2) {
                        let distance = (player.x - player.size) - walls[levelIndex][i].x2;
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
import { BallIcon, PetSize } from '../common/types';
import { PetElement } from './pets';
import { BallState } from './states';

/// Bouncing ball components, credit https://stackoverflow.com/a/29982343
const gravity: number = 0.6,
    damping: number = 0.9,
    traction: number = 0.8,
    interval: number = 1000 / 24; // msec for single frame
let then: number = 0; // last draw
var ballState: BallState;
let ballIcon: BallIcon = 'openai';

var canvas: HTMLCanvasElement | null;
var ballRadius: number;
var floor: number;

// OpenAI mark from Simple Icons, in a 24 by 24 view box.
const openAiLogo = new Path2D(
    'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
);

// Claude Code mark, in a 24 by 24 view box.
const claudeLogo = new Path2D(
    'M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z',
);

function calculateBallRadius(size: PetSize): number {
    if (size === PetSize.nano) {
        return 2;
    } else if (size === PetSize.small) {
        return 3;
    } else if (size === PetSize.medium) {
        return 4;
    } else if (size === PetSize.large) {
        return 8;
    } else {
        return 1; // Shrug
    }
}

export function setupBallThrowing(
    canvasName: string,
    petSize: PetSize,
    floor_: number,
): void {
    canvas = document.getElementById(canvasName) as HTMLCanvasElement;
    ballRadius = 6 + calculateBallRadius(petSize);
    floor = floor_;
}

function resetBall(): void {
    if (ballState) {
        ballState.paused = true;
    }
    if (canvas) {
        canvas.style.display = 'block';
    }
    ballState = new BallState(100, 100, 4, 5);
}

export function dynamicThrowOn(pets: PetElement[]) {
    let startMouseX: number;
    let startMouseY: number;
    let endMouseX: number;
    let endMouseY: number;
    console.log('Enabling dynamic throw');
    window.onmousedown = (e) => {
        ballIcon = 'openai';
        if (ballState) {
            ballState.paused = true;
        }
        if (canvas) {
            canvas.style.display = 'block';
        }
        endMouseX = e.clientX;
        endMouseY = e.clientY;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        ballState = new BallState(e.clientX, e.clientY, 0, 0);

        pets.forEach((petEl) => {
            if (petEl.pet.canChase && canvas) {
                petEl.pet.chase(ballState, canvas);
            }
        });
        ballState.paused = true;

        drawBall();

        window.onmousemove = (ev) => {
            ev.preventDefault();
            if (ballState) {
                ballState.paused = true;
            }
            startMouseX = endMouseX;
            startMouseY = endMouseY;
            endMouseX = ev.clientX;
            endMouseY = ev.clientY;
            ballState = new BallState(ev.clientX, ev.clientY, 0, 0);
            drawBall();
        };
        window.onmouseup = (ev) => {
            ev.preventDefault();
            window.onmouseup = null;
            window.onmousemove = null;

            ballState = new BallState(
                endMouseX,
                endMouseY,
                endMouseX - startMouseX,
                endMouseY - startMouseY,
            );
            pets.forEach((petEl) => {
                if (petEl.pet.canChase && canvas) {
                    petEl.pet.chase(ballState, canvas);
                }
            });
            throwBall();
        };
    };
}

export function dynamicThrowOff() {
    console.log('Disabling dynamic throw');
    window.onmousedown = null;
    if (ballState) {
        ballState.paused = true;
    }
    if (canvas) {
        canvas.style.display = 'none';
    }
}

export function throwBall() {
    if (!canvas) {
        return;
    }

    if (!ballState.paused) {
        requestAnimationFrame(throwBall);
    }

    // throttling the frame rate
    const now = Date.now();
    const elapsed = now - then;
    if (elapsed <= interval) {
        return;
    }
    then = now - (elapsed % interval);

    if (ballState.cx + ballRadius >= canvas.width) {
        ballState.vx = -ballState.vx * damping;
        ballState.cx = canvas.width - ballRadius;
    } else if (ballState.cx - ballRadius <= 0) {
        ballState.vx = -ballState.vx * damping;
        ballState.cx = ballRadius;
    }
    if (ballState.cy + ballRadius + floor >= canvas.height) {
        ballState.vy = -ballState.vy * damping;
        ballState.cy = canvas.height - ballRadius - floor;
        // traction here
        ballState.vx *= traction;
    } else if (ballState.cy - ballRadius <= 0) {
        ballState.vy = -ballState.vy * damping;
        ballState.cy = ballRadius;
    }

    ballState.vy += gravity;

    ballState.cx += ballState.vx;
    ballState.cy += ballState.vy;
    drawBall();
}

function drawBall() {
    if (!canvas) {
        return;
    }
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(ballState.cx, ballState.cy, ballRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.save();
    ctx.translate(ballState.cx, ballState.cy);
    const scale = (ballRadius * 1.8) / 24;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12);
    const isClaude = ballIcon === 'claude';
    ctx.fillStyle = isClaude ? '#c15f3c' : '#111';
    ctx.fill(isClaude ? claudeLogo : openAiLogo);
    ctx.restore();
}

export function throwAndChase(pets: PetElement[], icon: BallIcon = 'openai') {
    ballIcon = icon;
    resetBall();
    throwBall();
    pets.forEach((petEl) => {
        if (petEl.pet.canChase && canvas) {
            petEl.pet.chase(ballState, canvas);
        }
    });
}

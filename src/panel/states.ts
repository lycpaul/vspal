import { PetChatState, PetColor, PetType } from '../common/types';

export interface IPetType {
    nextFrame(): void;

    // Special methods for actions
    canSwipe: boolean;
    canChase: boolean;
    swipe(): void;
    chase(ballState: BallState, canvas: HTMLCanvasElement): void;
    speed: number;
    climbSpeed: number;
    climbHeight: number;
    fallSpeed: number;
    isMoving: boolean;
    hello: string;

    // State API
    getState(): PetInstanceState;
    recoverState(state: PetInstanceState): void;
    recoverFriend(friend: IPetType): void;

    // Positioning
    bottom: number;
    left: number;
    readonly maxLeft: number;
    /** Highest `bottom` a grounded pet may walk to (pets roam between `floor` and this). */
    readonly maxBottom: number;
    /** Size of a walking-grid cell (one sprite). */
    readonly gridSize: number;
    fitToViewport(): void;
    positionBottom(bottom: number): void;
    positionLeft(left: number): void;
    width: number;
    floor: number;

    // Friends API
    name: string;
    emoji: string;
    hasFriend: boolean;
    friend: IPetType | undefined;
    makeFriendsWith(friend: IPetType): boolean;
    isPlaying: boolean;

    showSpeechBubble(message: string, duration: number): void;
    remove(): void;
}

export class PetInstanceState {
    currentStateEnum: States | undefined;
}

export class PetElementState {
    chat?: PetChatState;
    petState: PetInstanceState | undefined;
    petType: PetType | undefined;
    petColor: PetColor | undefined;
    elLeft: string | undefined;
    elBottom: string | undefined;
    petName: string | undefined;
    petFriend: string | undefined;
}

export class PetPanelState {
    petStates: Array<PetElementState> | undefined;
    petCounter: number | undefined;
}

export enum HorizontalDirection {
    left,
    right,
    natural, // No change to current direction
}

export const enum States {
    sitIdle = 'sit-idle',
    walkRight = 'walk-right',
    walkLeft = 'walk-left',
    runRight = 'run-right',
    runLeft = 'run-left',
    lie = 'lie',
    wallHangLeft = 'wall-hang-left',
    wallDigLeft = 'wall-dig-left',
    wallNap = 'wall-nap',
    climbWallLeft = 'climb-wall-left',
    jumpDownLeft = 'jump-down-left',
    land = 'land',
    swipe = 'swipe',
    idleWithBall = 'idle-with-ball',
    chase = 'chase',
    chaseFriend = 'chase-friend',
    standRight = 'stand-right',
    standLeft = 'stand-left',
}

export enum FrameResult {
    stateContinue,
    stateComplete,
    // Special states
    stateCancel,
}

export class BallState {
    cx: number;
    cy: number;
    vx: number;
    vy: number;
    paused: boolean;

    constructor(cx: number, cy: number, vx: number, vy: number) {
        this.cx = cx;
        this.cy = cy;
        this.vx = vx;
        this.vy = vy;
        this.paused = false;
    }
}

export function isStateAboveGround(state: States): boolean {
    return (
        state === States.climbWallLeft ||
        state === States.wallDigLeft ||
        state === States.wallNap ||
        state === States.jumpDownLeft ||
        state === States.land ||
        state === States.wallHangLeft
    );
}

/** Move `current` toward `target` by at most `step`. */
function stepToward(current: number, target: number, step: number): number {
    if (Math.abs(target - current) <= step) {
        return target;
    }
    return current + Math.sign(target - current) * step;
}

/** Clamp a `bottom` value to the area grounded pets can walk in. */
export function clampToGround(pet: IPetType, bottom: number): number {
    return Math.max(pet.floor, Math.min(bottom, pet.maxBottom));
}

/*
 * Grounded pets walk on a grid: columns start at the left edge, rows start at
 * the floor, and cells are `pet.gridSize` (one sprite) wide.
 */

/** Chance of turning up or down at each grid point while walking. */
const GRID_TURN_CHANCE = 0.4;

/** Index of the highest row the pet can walk on (0 is the floor). */
function topGridRow(pet: IPetType): number {
    return Math.max(0, Math.floor((pet.maxBottom - pet.floor) / pet.gridSize));
}

function gridRowBottom(pet: IPetType, row: number): number {
    return pet.floor + row * pet.gridSize;
}

function nearestGridRow(pet: IPetType): number {
    const row = Math.round((pet.bottom - pet.floor) / pet.gridSize);
    return Math.max(0, Math.min(topGridRow(pet), row));
}

/**
 * Move one step toward a point without moving diagonally: line up
 * horizontally first, then move vertically.
 * Returns the direction to face.
 */
function stepCardinal(
    pet: IPetType,
    targetLeft: number,
    targetBottom: number,
    step: number,
): HorizontalDirection {
    const left = Math.max(0, Math.min(targetLeft, pet.maxLeft));
    if (Math.abs(left - pet.left) > 0.5) {
        const direction =
            left < pet.left
                ? HorizontalDirection.left
                : HorizontalDirection.right;
        pet.positionLeft(stepToward(pet.left, left, step));
        return direction;
    }
    pet.positionBottom(
        stepToward(pet.bottom, clampToGround(pet, targetBottom), step),
    );
    return HorizontalDirection.natural;
}

export function resolveState(state: string, pet: IPetType): IState {
    switch (state) {
        case States.sitIdle:
            return new SitIdleState(pet);
        case States.walkRight:
            return new WalkRightState(pet);
        case States.walkLeft:
            return new WalkLeftState(pet);
        case States.runRight:
            return new RunRightState(pet);
        case States.runLeft:
            return new RunLeftState(pet);
        case States.lie:
            return new LieState(pet);
        case States.wallHangLeft:
            return new WallHangLeftState(pet);
        case States.wallDigLeft:
            return new WallDigLeftState(pet);
        case States.wallNap:
            return new WallNapState(pet);
        case States.climbWallLeft:
            return new ClimbWallLeftState(pet);
        case States.jumpDownLeft:
            return new JumpDownLeftState(pet);
        case States.land:
            return new LandState(pet);
        case States.swipe:
            return new SwipeState(pet);
        case States.idleWithBall:
            return new IdleWithBallState(pet);
        case States.chaseFriend:
            return new ChaseFriendState(pet);
        case States.standRight:
            return new StandRightState(pet);
        case States.standLeft:
            return new StandLeftState(pet);
    }
    return new SitIdleState(pet);
}

export interface IState {
    label: string;
    spriteLabel: string;
    horizontalDirection: HorizontalDirection;
    pet: IPetType;
    nextFrame(): FrameResult;
}

class AbstractStaticState implements IState {
    label = States.sitIdle;
    idleCounter: number;
    spriteLabel = 'idle';
    holdTime = 50;
    pet: IPetType;

    horizontalDirection = HorizontalDirection.left;

    constructor(pet: IPetType) {
        this.idleCounter = 0;
        this.pet = pet;
    }

    nextFrame(): FrameResult {
        this.idleCounter++;
        if (this.idleCounter > this.holdTime) {
            return FrameResult.stateComplete;
        }
        return FrameResult.stateContinue;
    }
}

export class SitIdleState extends AbstractStaticState {
    label = States.sitIdle;
    spriteLabel = 'idle';
    horizontalDirection = HorizontalDirection.right;
    holdTime = 50;
}

export class LieState extends AbstractStaticState {
    label = States.lie;
    spriteLabel = 'lie';
    horizontalDirection = HorizontalDirection.right;
    holdTime = 50;
}

export class WallHangLeftState extends AbstractStaticState {
    label = States.wallHangLeft;
    spriteLabel = 'wallgrab';
    horizontalDirection = HorizontalDirection.left;
    holdTime = 50;
}

export class WallDigLeftState extends AbstractStaticState {
    label = States.wallDigLeft;
    spriteLabel = 'walldig';
    horizontalDirection = HorizontalDirection.left;
    holdTime = 60;
}

export class WallNapState extends AbstractStaticState {
    label = States.wallNap;
    spriteLabel = 'wallnap';
    horizontalDirection = HorizontalDirection.right;
    holdTime = 50;
}

export class LandState extends AbstractStaticState {
    label = States.land;
    spriteLabel = 'land';
    horizontalDirection = HorizontalDirection.left;
    holdTime = 10;
}

export class SwipeState extends AbstractStaticState {
    label = States.swipe;
    spriteLabel = 'swipe';
    horizontalDirection = HorizontalDirection.natural;
    holdTime = 15;
}

export class IdleWithBallState extends AbstractStaticState {
    label = States.idleWithBall;
    spriteLabel = 'with_ball';
    horizontalDirection = HorizontalDirection.left;
    holdTime = 30;
}

type GridLeg = { axis: 'x' | 'y'; target: number };

/**
 * Walks to the wall in `direction` along grid lines: straight horizontal and
 * vertical legs, turning up or down only at grid points. Ending at the wall
 * keeps the pet sequences (e.g. walk left, then climb the left wall) working.
 */
class GridWalkState implements IState {
    label: States = States.walkRight;
    spriteLabel = 'walk';
    horizontalDirection = HorizontalDirection.right;
    pet: IPetType;
    speedMultiplier = 1;
    idleCounter: number;
    holdTime = 60;
    /** +1 walks to the right wall, -1 to the left wall. */
    direction = 1;
    private leg: GridLeg | undefined;
    private lastAxis: GridLeg['axis'] | undefined;

    constructor(pet: IPetType) {
        this.pet = pet;
        this.idleCounter = 0;
    }

    private get wall(): number {
        return this.direction > 0 ? this.pet.maxLeft : 0;
    }

    private planLeg(): GridLeg {
        const pet = this.pet;
        const size = pet.gridSize;

        // Get back onto a row first (e.g. after chasing or a resize).
        const row = nearestGridRow(pet);
        const rowBottom = gridRowBottom(pet, row);
        if (pet.bottom !== rowBottom) {
            return { axis: 'y', target: rowBottom };
        }

        // At a grid point, sometimes turn up or down to another row.
        const topRow = topGridRow(pet);
        if (
            this.lastAxis === 'x' &&
            pet.left !== this.wall &&
            topRow > 0 &&
            Math.random() < GRID_TURN_CHANCE
        ) {
            let newRow = Math.floor(Math.random() * topRow);
            if (newRow >= row) {
                newRow++;
            }
            return { axis: 'y', target: gridRowBottom(pet, newRow) };
        }

        // Otherwise walk 1-3 cells along the row, stopping at a column or the wall.
        const cells = 1 + Math.floor(Math.random() * 3);
        const column =
            this.direction > 0
                ? Math.floor(pet.left / size + 0.01) + cells
                : Math.ceil(pet.left / size - 0.01) - cells;
        const target = column * size;
        return {
            axis: 'x',
            target:
                this.direction > 0
                    ? Math.min(target, this.wall)
                    : Math.max(target, this.wall),
        };
    }

    nextFrame(): FrameResult {
        this.idleCounter++;
        if (!this.pet.isMoving) {
            return this.idleCounter > this.holdTime
                ? FrameResult.stateComplete
                : FrameResult.stateContinue;
        }
        this.leg ??= this.planLeg();
        if (this.leg.axis === 'x' && this.pet.left === this.wall) {
            return FrameResult.stateComplete;
        }
        const step = this.pet.speed * this.speedMultiplier;
        if (this.leg.axis === 'x') {
            this.pet.positionLeft(
                stepToward(this.pet.left, this.leg.target, step),
            );
            if (this.pet.left === this.leg.target) {
                this.finishLeg();
            }
        } else {
            this.pet.positionBottom(
                stepToward(this.pet.bottom, this.leg.target, step),
            );
            if (this.pet.bottom === this.leg.target) {
                this.finishLeg();
            }
        }
        return FrameResult.stateContinue;
    }

    private finishLeg() {
        this.lastAxis = this.leg?.axis;
        this.leg = undefined;
    }
}

export class WalkRightState extends GridWalkState {
    label = States.walkRight;
    horizontalDirection = HorizontalDirection.right;
    direction = 1;
}

export class WalkLeftState extends GridWalkState {
    label = States.walkLeft;
    horizontalDirection = HorizontalDirection.left;
    direction = -1;
}

export class RunRightState extends WalkRightState {
    label = States.runRight;
    spriteLabel = 'walk_fast';
    speedMultiplier = 1.6;
    holdTime = 130;
}

export class RunLeftState extends WalkLeftState {
    label = States.runLeft;
    spriteLabel = 'walk_fast';
    speedMultiplier = 1.6;
    holdTime = 130;
}

export class ChaseState implements IState {
    label = States.chase;
    spriteLabel = 'run';
    horizontalDirection = HorizontalDirection.left;
    ballState: BallState;
    canvas: HTMLCanvasElement;
    pet: IPetType;

    constructor(
        pet: IPetType,
        ballState: BallState,
        canvas: HTMLCanvasElement,
    ) {
        this.pet = pet;
        this.ballState = ballState;
        this.canvas = canvas;
    }

    nextFrame(): FrameResult {
        if (this.ballState.paused) {
            return FrameResult.stateCancel; // Ball is already caught
        }
        // Height of the ball above the bottom of the panel.
        const ballBottom = this.canvas.height - this.ballState.cy;
        const direction = stepCardinal(
            this.pet,
            this.ballState.cx - this.pet.width / 2,
            ballBottom - this.pet.width / 2,
            this.pet.speed,
        );
        if (direction !== HorizontalDirection.natural) {
            this.horizontalDirection = direction;
        }

        if (
            ballBottom < this.pet.bottom + this.pet.width &&
            ballBottom > this.pet.bottom - 15 &&
            this.ballState.cx > this.pet.left - 15 &&
            this.ballState.cx <= this.pet.left + this.pet.width
        ) {
            // hide ball
            this.canvas.style.display = 'none';
            this.ballState.paused = true;
            return FrameResult.stateComplete;
        }
        return FrameResult.stateContinue;
    }
}

export class ChaseFriendState implements IState {
    label = States.chaseFriend;
    spriteLabel = 'run';
    horizontalDirection = HorizontalDirection.left;
    pet: IPetType;

    constructor(pet: IPetType) {
        this.pet = pet;
    }

    nextFrame(): FrameResult {
        if (!this.pet.hasFriend || !this.pet.friend?.isPlaying) {
            return FrameResult.stateCancel; // Friend is no longer playing.
        }
        const friend = this.pet.friend;
        const direction = stepCardinal(
            this.pet,
            friend.left,
            friend.bottom,
            this.pet.speed,
        );
        if (direction !== HorizontalDirection.natural) {
            this.horizontalDirection = direction;
        }

        return FrameResult.stateContinue;
    }
}

export class ClimbWallLeftState implements IState {
    label = States.climbWallLeft;
    spriteLabel = 'wallclimb';
    horizontalDirection = HorizontalDirection.left;
    pet: IPetType;
    targetBottom: number;

    constructor(pet: IPetType) {
        this.pet = pet;
        // Climb the same distance regardless of how far up the ground the
        // pet was walking, without leaving the viewport.
        this.targetBottom = Math.min(
            Math.max(pet.climbHeight, pet.bottom + pet.climbHeight - pet.floor),
            window.innerHeight - pet.width,
        );
    }

    nextFrame(): FrameResult {
        this.pet.positionBottom(this.pet.bottom + this.pet.climbSpeed);
        if (this.pet.bottom >= this.targetBottom) {
            return FrameResult.stateComplete;
        }
        return FrameResult.stateContinue;
    }
}

export class JumpDownLeftState implements IState {
    label = States.jumpDownLeft;
    spriteLabel = 'fall_from_grab';
    horizontalDirection = HorizontalDirection.right;
    pet: IPetType;

    constructor(pet: IPetType) {
        this.pet = pet;
    }

    nextFrame(): FrameResult {
        this.pet.positionBottom(this.pet.bottom - this.pet.fallSpeed);
        if (this.pet.bottom <= this.pet.floor) {
            this.pet.positionBottom(this.pet.floor);
            return FrameResult.stateComplete;
        }
        return FrameResult.stateContinue;
    }
}

export class StandRightState extends AbstractStaticState {
    label = States.standRight;
    spriteLabel = 'stand';
    horizontalDirection = HorizontalDirection.right;
    holdTime = 60;
}

export class StandLeftState extends AbstractStaticState {
    label = States.standLeft;
    spriteLabel = 'stand';
    horizontalDirection = HorizontalDirection.left;
    holdTime = 60;
}

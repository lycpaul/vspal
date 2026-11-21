import { PetColor, PetSize, PetSpeed } from '../common/types';
import { IPetType } from './states';
import { ISequenceTree } from './sequences';
import {
    States,
    IState,
    resolveState,
    PetInstanceState,
    isStateAboveGround,
    clampToGround,
    BallState,
    ChaseState,
    HorizontalDirection,
    FrameResult,
} from './states';

// Pets get z-indexes in [PET_Z_INDEX_BASE, PET_Z_INDEX_BASE + PET_Z_INDEX_RANGE],
// which must stay between --pet-canvas-container-z-index and --bubble-z-index in pets.css.
const PET_Z_INDEX_BASE = 10;
const PET_Z_INDEX_RANGE = 9990;

export class InvalidStateError extends Error {
    fromState: States;
    petType: string;

    constructor(fromState: States, petType: string) {
        super(`Invalid state ${fromState} for pet type ${petType}`);
        this.fromState = fromState;
        this.petType = petType;
    }
}

export abstract class BasePetType implements IPetType {
    label: string = 'base';
    static count: number = 0;
    sequence: ISequenceTree = {
        startingState: States.sitIdle,
        sequenceStates: [],
    };
    static possibleColors: PetColor[];
    currentState: IState;
    currentStateEnum: States;
    holdState: IState | undefined;
    holdStateEnum: States | undefined;
    private el: HTMLImageElement;
    private collision: HTMLDivElement;
    private speech: HTMLDivElement;
    private _left: number;
    private _bottom: number;
    petRoot: string;
    _floor: number;
    _friend: IPetType | undefined;
    private readonly reaction: HTMLSpanElement;
    private _name: string;
    private _speed: number;
    private _size: PetSize;
    protected _climbSpeed: number = 1;
    protected _climbHeight: number = 100;
    protected _fallSpeed: number = 5;

    constructor(
        spriteElement: HTMLImageElement,
        collisionElement: HTMLDivElement,
        speechElement: HTMLDivElement,
        size: PetSize,
        left: number,
        bottom: number,
        petRoot: string,
        floor: number,
        name: string,
        speed: number,
    ) {
        this.el = spriteElement;
        this.collision = collisionElement;
        this.speech = speechElement;
        this.reaction = speechElement.ownerDocument.createElement('span');
        this.reaction.className = 'pet-reaction';
        this.speech.replaceChildren(this.reaction);
        this.petRoot = petRoot;
        this._floor = floor;
        this._left = left;
        this._bottom = bottom;
        this._size = size;
        this.initSprite();
        this.currentStateEnum = this.sequence.startingState;
        this.currentState = resolveState(this.currentStateEnum, this);

        this._name = name;
        this._speed = this.randomizeSpeed(speed);
        if (this._name.toLowerCase() === 'debug') {
            console.log(
                `Creating pet ${this._name} of size ${this._size} at position (${this._left}, ${this._bottom}) with speed ${this._speed}`,
            );
        }

        // Increment the static count of the Pet class that the constructor belongs to
        (this.constructor as any).count += 1;
    }

    private initSprite() {
        this.el.style.bottom = `${this._bottom}px`;
        this.updateDepth();
        this.el.style.width = 'auto';
        this.el.style.height = 'auto';
        this.fitToViewport();
        this.hideSpeechBubble();
    }

    fitToViewport(): void {
        const size = this.gridSize;
        this.el.style.maxWidth = `${size}px`;
        this.el.style.maxHeight = `${size}px`;
        this.collision.style.width = `${size}px`;
        this.collision.style.height = `${size}px`;
        this.positionLeft(this._left);
        // Undefined while the constructor is still running.
        if (
            this.currentStateEnum !== undefined &&
            !isStateAboveGround(this.currentStateEnum)
        ) {
            this.positionBottom(clampToGround(this, this._bottom));
        }
    }

    get maxLeft(): number {
        return Math.max(0, window.innerWidth - this.gridSize);
    }

    /** Pets may walk anywhere in the bottom half of the panel. */
    get maxBottom(): number {
        return Math.max(
            this._floor,
            Math.floor(window.innerHeight / 2) - this.gridSize,
        );
    }

    get gridSize(): number {
        return Math.max(
            1,
            Math.min(
                Math.round(this.calculateSpriteWidth(this._size) * 1.2),
                window.innerWidth,
            ),
        );
    }

    get left(): number {
        return this._left;
    }

    get bottom(): number {
        return this._bottom;
    }

    private repositionAccompanyingElements() {
        this.collision.style.left = `${this._left}px`;
        this.collision.style.bottom = `${this._bottom}px`;
        this.speech.style.setProperty('--pet-left', `${this._left}px`);
        this.speech.style.bottom = `${this._bottom + this.gridSize}px`;
    }

    calculateSpriteWidth(size: PetSize): number {
        if (size === PetSize.nano) {
            return 30;
        } else if (size === PetSize.small) {
            return 40;
        } else if (size === PetSize.medium) {
            return 55;
        } else if (size === PetSize.large) {
            return 110;
        } else {
            return 30; // Shrug
        }
    }

    positionBottom(bottom: number): void {
        this._bottom = bottom;
        this.el.style.bottom = `${this._bottom}px`;
        this.updateDepth();
        this.repositionAccompanyingElements();
    }

    /** Draw pets lower on screen (closer to the viewer) in front of pets further up. */
    private updateDepth(): void {
        const depth = Math.max(
            0,
            Math.min(
                PET_Z_INDEX_RANGE,
                PET_Z_INDEX_RANGE - Math.round(this._bottom),
            ),
        );
        this.el.style.zIndex = `${PET_Z_INDEX_BASE + depth}`;
    }

    positionLeft(left: number): void {
        this._left = Number.isFinite(left)
            ? Math.max(0, Math.min(left, this.maxLeft))
            : 0;
        this.el.style.left = `${this._left}px`;
        this.repositionAccompanyingElements();
    }

    get width(): number {
        return this.el.width;
    }

    get floor(): number {
        return this._floor;
    }

    get hello(): string {
        // return the sound of the name of the animal
        return ` says hello 🤗!`;
    }

    getState(): PetInstanceState {
        // Temporary states puts the real state in holdStateEnum which is not persisted
        return {
            currentStateEnum: this.holdStateEnum ?? this.currentStateEnum,
        };
    }

    get speed(): number {
        return this._speed;
    }

    randomizeSpeed(speed: number): number {
        const min = speed * 0.7;
        const max = speed * 1.3;
        const newSpeed = Math.random() * (max - min) + min;
        return newSpeed;
    }

    /**
     * The speed at which the pet can climb.
     * Default is 1.
     */
    get climbSpeed(): number {
        return this._climbSpeed;
    }

    /**
     * The height to which a pet can climb.
     * Default is 100.
     */
    get climbHeight(): number {
        return this._climbHeight;
    }

    /**
     * The speed at which the pet falls when it is in the air.
     * Default is 5.
     */
    get fallSpeed(): number {
        return this._fallSpeed;
    }

    get isMoving(): boolean {
        return this._speed !== PetSpeed.still;
    }

    recoverFriend(friend: IPetType) {
        // Recover friends..
        this._friend = friend;
    }

    recoverState(state: PetInstanceState) {
        // Pet may not have the recovered state in its sequence, leading to an invalid state
        const recoveredStateEnum =
            state.currentStateEnum ?? this.sequence.startingState;
        const hasRecoveredStateInSequence = this.sequence.sequenceStates.some(
            (s) => s.state === recoveredStateEnum,
        );
        this.currentStateEnum = hasRecoveredStateInSequence
            ? recoveredStateEnum
            : this.sequence.startingState;
        this.currentState = resolveState(this.currentStateEnum, this);

        if (!isStateAboveGround(this.currentStateEnum)) {
            // Keep the saved position, but within the walkable area as the
            // theme (and so the floor) or panel size may have changed.
            this.positionBottom(clampToGround(this, this.bottom));
        }
    }

    get canSwipe() {
        return !isStateAboveGround(this.currentStateEnum);
    }

    get canChase() {
        return !isStateAboveGround(this.currentStateEnum) && this.isMoving;
    }

    showSpeechBubble(message: string, duration: number = 3000) {
        this.reaction.textContent = message;
        this.speech.setAttribute('data-reaction-visible', '');
        setTimeout(() => {
            this.hideSpeechBubble();
        }, duration);
    }

    hideSpeechBubble() {
        this.speech.removeAttribute('data-reaction-visible');
    }

    swipe() {
        if (this.currentStateEnum === States.swipe) {
            return;
        }
        this.holdState = this.currentState;
        this.holdStateEnum = this.currentStateEnum;
        this.currentStateEnum = States.swipe;
        this.currentState = resolveState(this.currentStateEnum, this);
        this.showSpeechBubble('🤗');
    }

    chase(ballState: BallState, canvas: HTMLCanvasElement) {
        this.currentStateEnum = States.chase;
        this.currentState = new ChaseState(this, ballState, canvas);
    }

    faceLeft() {
        this.el.style.transform = 'scaleX(-1)';
    }

    faceRight() {
        this.el.style.transform = 'scaleX(1)';
    }

    setAnimation(face: string) {
        if (this.el.src.endsWith(`_${face}_8fps.gif`)) {
            return;
        }
        this.el.src = `${this.petRoot}_${face}_8fps.gif`;
    }

    chooseNextState(fromState: States): States {
        // Work out next state
        var possibleNextStates: States[] | undefined = undefined;
        for (var i = 0; i < this.sequence.sequenceStates.length; i++) {
            if (this.sequence.sequenceStates[i].state === fromState) {
                possibleNextStates =
                    this.sequence.sequenceStates[i].possibleNextStates;
                break;
            }
        }
        if (!possibleNextStates) {
            throw new InvalidStateError(fromState, this.label);
        }
        // randomly choose the next state
        const idx = Math.floor(Math.random() * possibleNextStates.length);
        return possibleNextStates[idx];
    }

    nextFrame() {
        if (
            this.currentState.horizontalDirection === HorizontalDirection.left
        ) {
            this.faceLeft();
        } else if (
            this.currentState.horizontalDirection === HorizontalDirection.right
        ) {
            this.faceRight();
        }
        this.setAnimation(this.currentState.spriteLabel);

        // What's my buddy doing?
        if (
            this.hasFriend &&
            this.currentStateEnum !== States.chaseFriend &&
            this.isMoving
        ) {
            if (
                this.friend?.isPlaying &&
                !isStateAboveGround(this.currentStateEnum)
            ) {
                this.currentState = resolveState(States.chaseFriend, this);
                this.currentStateEnum = States.chaseFriend;
                return;
            }
        }

        var frameResult = this.currentState.nextFrame();
        if (frameResult === FrameResult.stateComplete) {
            // If recovering from swipe..
            if (this.holdState && this.holdStateEnum) {
                this.currentState = this.holdState;
                this.currentStateEnum = this.holdStateEnum;
                this.holdState = undefined;
                this.holdStateEnum = undefined;
                return;
            }

            var nextState = this.chooseNextState(this.currentStateEnum);
            this.currentState = resolveState(nextState, this);
            this.currentStateEnum = nextState;
        } else if (frameResult === FrameResult.stateCancel) {
            if (this.currentStateEnum === States.chase) {
                var nextState = this.chooseNextState(States.idleWithBall);
                this.currentState = resolveState(nextState, this);
                this.currentStateEnum = nextState;
            } else if (this.currentStateEnum === States.chaseFriend) {
                var nextState = this.chooseNextState(States.idleWithBall);
                this.currentState = resolveState(nextState, this);
                this.currentStateEnum = nextState;
            }
        }
    }

    get hasFriend(): boolean {
        return this._friend !== undefined;
    }

    get friend(): IPetType | undefined {
        return this._friend;
    }

    get name(): string {
        return this._name;
    }

    makeFriendsWith(friend: IPetType): boolean {
        this._friend = friend;
        console.log(this.name, ": I'm now friends ❤️ with ", friend.name);
        return true;
    }

    get isPlaying(): boolean {
        return (
            this.isMoving &&
            (this.currentStateEnum === States.runRight ||
                this.currentStateEnum === States.runLeft)
        );
    }

    get emoji(): string {
        return '🐶';
    }

    get size(): PetSize {
        return this._size;
    }

    remove(): void {}
}

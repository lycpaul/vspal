export interface PetChatTurn {
    role: 'user' | 'pet';
    text: string;
}

export const PET_CHAT_EFFORTS = [
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
    'ultra',
] as const;

export interface PetChatOptions {
    model?: string;
    reasoningEffort?: (typeof PET_CHAT_EFFORTS)[number];
}

export interface PetChatState {
    turns: PetChatTurn[];
    options?: PetChatOptions;
    pending?: { id: string; text: string; options?: PetChatOptions };
    unread?: boolean;
    usedFallback?: boolean;
}

export interface PetChatRequest {
    command: 'pet-chat';
    id: string;
    petName: string;
    turns: PetChatTurn[];
    options?: PetChatOptions;
}

export interface PetChatReply {
    command: 'pet-chat-reply';
    id: string;
    text?: string;
}

export type BallIcon = 'openai' | 'claude';

export const enum PetColor {
    codex = 'codex',
    claudecode = 'claudecode',
    side_eye = 'side_eye',
    plus_eyes = 'plus_eyes',
    equals_eyes = 'equals_eyes',
    cross_eyes = 'cross_eyes',
    slant_eyes = 'slant_eyes',
    arch_eyes = 'arch_eyes',
    caret_eyes = 'caret_eyes',
    ring_eyes = 'ring_eyes',
    dot_eyes = 'dot_eyes',
    squint_eyes = 'squint_eyes',
    openai_light = 'openai_light',
    openai_dark = 'openai_dark',
    octocat = 'octocat',
    brown = 'brown',
    whiteface = 'whiteface',
    piedpearl = 'piedpearl',
    lightbrown = 'lightbrown',
    black = 'black',
    green = 'green',
    blue = 'blue',
    yellow = 'yellow',
    gray = 'gray',
    grayJimothy = 'gray_jimothy',
    purple = 'purple',
    red = 'red',
    white = 'white',
    orange = 'orange',
    akita = 'akita',
    socksblack = 'socks black',
    socksbeige = 'socks beige',
    socksbrown = 'socks brown',
    paintbeige = 'paint beige',
    paintblack = 'paint black',
    paintbrown = 'paint brown',
    magical = 'magical',
    warrior = 'warrior',
    pink = 'pink',
    solidWhite = 'solid_white',
    chocolate = 'chocolate',
    cream = 'cream',
    brownTabby = 'brown_tabby',
    silverTabby = 'silver_tabby',
    gingerTabby = 'ginger_tabby',
    creamTabby = 'cream_tabby',
    grayWhite = 'gray_white',
    gingerWhite = 'ginger_white',
    tabbyWhite = 'tabby_white',
    tortoiseshell = 'tortoiseshell',
    diluteTortie = 'dilute_tortie',
    calico = 'calico',
    diluteCalico = 'dilute_calico',
    sealPoint = 'seal_point',
    bluePoint = 'blue_point',
    null = 'null',
}

export const enum PetType {
    agent = 'agent',
    bunny = 'bunny',
    cat = 'cat',
    chicken = 'chicken',
    clippy = 'clippy',
    cockatiel = 'cockatiel',
    crab = 'crab',
    dog = 'dog',
    deno = 'deno',
    finley = 'finley',
    fox = 'fox',
    frog = 'frog',
    horse = 'horse',
    mod = 'mod',
    monkey = 'monkey',
    morph = 'morph',
    panda = 'panda',
    raccoon = 'raccoon',
    rat = 'rat',
    rocky = 'rocky',
    rubberduck = 'rubber-duck',
    skeleton = 'skeleton',
    snail = 'snail',
    snake = 'snake',
    squirrel = 'squirrel',
    totoro = 'totoro',
    turtle = 'turtle',
    zappy = 'zappy',
    null = 'null',
}

export const enum PetSpeed {
    still = 0,
    verySlow = 1,
    slow = 2,
    normal = 3,
    fast = 4,
    veryFast = 5,
}

export const enum PetSize {
    nano = 'nano',
    small = 'small',
    medium = 'medium',
    large = 'large',
}

export const enum ExtPosition {
    panel = 'panel',
    explorer = 'explorer',
}

export const enum Theme {
    none = 'none',
    forest = 'forest',
    castle = 'castle',
    beach = 'beach',
    winter = 'winter',
    autumn = 'autumn',
    library = 'library',
    barn = 'barn',
}

export const enum ColorThemeKind {
    light = 1,
    dark = 2,
    highContrast = 3,
    highContrastLight = 4,
}

export class WebviewMessage {
    text: string;
    command: string;

    constructor(text: string, command: string) {
        this.text = text;
        this.command = command;
    }
}

export const ALL_PETS = [
    PetType.agent,
    PetType.bunny,
    PetType.cat,
    PetType.chicken,
    PetType.clippy,
    PetType.cockatiel,
    PetType.crab,
    PetType.dog,
    PetType.deno,
    PetType.finley,
    PetType.fox,
    PetType.frog,
    PetType.horse,
    PetType.mod,
    PetType.monkey,
    PetType.morph,
    PetType.panda,
    PetType.raccoon,
    PetType.rat,
    PetType.rocky,
    PetType.rubberduck,
    PetType.skeleton,
    PetType.snail,
    PetType.snake,
    PetType.squirrel,
    PetType.totoro,
    PetType.turtle,
    PetType.zappy,
];
export const ALL_COLORS = [
    PetColor.codex,
    PetColor.claudecode,
    PetColor.side_eye,
    PetColor.plus_eyes,
    PetColor.equals_eyes,
    PetColor.cross_eyes,
    PetColor.slant_eyes,
    PetColor.arch_eyes,
    PetColor.caret_eyes,
    PetColor.ring_eyes,
    PetColor.dot_eyes,
    PetColor.squint_eyes,
    PetColor.openai_light,
    PetColor.openai_dark,
    PetColor.octocat,
    PetColor.black,
    PetColor.blue,
    PetColor.brown,
    PetColor.lightbrown,
    PetColor.whiteface,
    PetColor.piedpearl,
    PetColor.green,
    PetColor.yellow,
    PetColor.gray,
    PetColor.grayJimothy,
    PetColor.purple,
    PetColor.red,
    PetColor.white,
    PetColor.orange,
    PetColor.akita,
    PetColor.socksblack,
    PetColor.socksbeige,
    PetColor.socksbrown,
    PetColor.paintbeige,
    PetColor.paintblack,
    PetColor.paintbrown,
    PetColor.magical,
    PetColor.warrior,
    PetColor.solidWhite,
    PetColor.chocolate,
    PetColor.cream,
    PetColor.brownTabby,
    PetColor.silverTabby,
    PetColor.gingerTabby,
    PetColor.creamTabby,
    PetColor.grayWhite,
    PetColor.gingerWhite,
    PetColor.tabbyWhite,
    PetColor.tortoiseshell,
    PetColor.diluteTortie,
    PetColor.calico,
    PetColor.diluteCalico,
    PetColor.sealPoint,
    PetColor.bluePoint,
    PetColor.null,
];
export const ALL_SCALES = [
    PetSize.nano,
    PetSize.small,
    PetSize.medium,
    PetSize.large,
];
export const ALL_THEMES = [
    Theme.none,
    Theme.forest,
    Theme.castle,
    Theme.beach,
    Theme.winter,
    Theme.autumn,
    Theme.library,
    Theme.barn,
];

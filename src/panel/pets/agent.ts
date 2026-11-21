import { PetColor, PetSize } from '../../common/types';
import { Mod } from './mod';

export class Agent extends Mod {
    label = 'agent';
    static possibleColors = [
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
    ];

    override calculateSpriteWidth(size: PetSize): number {
        const usesLargerSprite =
            this.petRoot.endsWith(`/${PetColor.claudecode}`) ||
            this.petRoot.endsWith(`/${PetColor.octocat}`);
        return Math.min(
            super.calculateSpriteWidth(size),
            usesLargerSprite ? 80 : 70,
        );
    }

    get hello(): string {
        return 'Ready to code!';
    }
}

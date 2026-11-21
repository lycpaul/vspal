import {
    PET_CHAT_EFFORTS,
    PetChatReply,
    PetChatRequest,
    PetChatState,
} from '../common/types';
import { IPetType } from './states';

function petReply(pet: IPetType, message: string): string {
    if (/\b(hi|hello|hey)\b/i.test(message)) {
        return pet.hello;
    }
    if (/\bname\b/i.test(message)) {
        return `I'm ${pet.name}! 🤗`;
    }
    if (/\b(ball|fetch|play)\b/i.test(message)) {
        return 'Let’s play! I’m ready to chase the ball. 🐾';
    }
    if (/\b(bye|goodbye)\b/i.test(message)) {
        return 'See you around! 🤗';
    }
    if (/\b(pat|pet|hug|cuddle)\b/i.test(message)) {
        return 'That feels nice. Stay a little longer? 🤗';
    }
    return 'I’m happy you stopped by. Want to play or hang out? 🐾';
}

export class PetConversation {
    private readonly statusIcon = document.createElement('span');
    private dialog?: HTMLDialogElement;
    private refreshDialog?: () => void;

    constructor(
        private readonly pet: IPetType,
        private readonly avatarSrc: string,
        private readonly bubble: HTMLElement,
        private readonly sendRequest: (request: PetChatRequest) => void,
        private readonly save: () => void,
        private readonly state: PetChatState = { turns: [] },
    ) {
        this.statusIcon.className = 'pet-chat-bubble-status';
        this.statusIcon.setAttribute('aria-hidden', 'true');
        this.bubble.append(this.statusIcon);
        this.updateBubble();
    }

    get snapshot(): PetChatState | undefined {
        return this.state.turns.length ? this.state : undefined;
    }

    resume(): void {
        const { pending, turns } = this.state;
        if (pending) {
            this.sendRequest({
                command: 'pet-chat',
                id: pending.id,
                petName: this.pet.name.slice(0, 256),
                options: pending.options,
                turns: turns.slice(-12).map(({ role, text }) => ({
                    role,
                    text: text.slice(0, 2000),
                })),
            });
        }
    }

    receive(reply: PetChatReply): boolean {
        const { pending } = this.state;
        if (!pending || reply.id !== pending.id) {
            return false;
        }
        const text = reply.text || petReply(this.pet, pending.text);
        this.state.turns.push({ role: 'pet', text });
        this.state.pending = undefined;
        this.state.usedFallback = !reply.text;
        this.state.unread = !this.dialog?.open;
        this.changed();
        return true;
    }

    private updateBubble(): void {
        const { pending, unread } = this.state;
        const status = pending ? '💭' : unread ? '💡' : '';
        const label = pending
            ? `${this.pet.name} is thinking`
            : unread
              ? `Read ${this.pet.name}’s new reply`
              : `Chat with ${this.pet.name}`;
        this.statusIcon.textContent = status;
        this.bubble.toggleAttribute('data-chat-status', !!status);
        this.bubble.setAttribute('aria-label', label);
        this.bubble.title = label;
        this.bubble.tabIndex =
            status || document.body.classList.contains('pat-mode') ? 0 : -1;
    }

    private changed(): void {
        this.updateBubble();
        this.refreshDialog?.();
        this.save();
    }

    close(): void {
        this.dialog?.close();
    }

    open(): void {
        if (this.dialog?.open) {
            return;
        }

        const pet = this.pet;
        const dialog = document.createElement('dialog');
        this.dialog = dialog;
        dialog.className = 'pet-chat';
        dialog.setAttribute('aria-label', `Chat with ${pet.name}`);

        const title = document.createElement('h2');
        title.textContent = pet.name;
        const avatar = document.createElement('img');
        avatar.className = 'pet-chat-avatar';
        avatar.src = this.avatarSrc;
        avatar.alt = '';
        const identity = document.createElement('div');
        identity.className = 'pet-chat-identity';
        identity.append(avatar, title);
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'pet-chat-close';
        close.setAttribute('aria-label', 'Close chat');
        close.title = 'Close chat';
        close.addEventListener('click', () => dialog.close());
        const header = document.createElement('header');
        header.append(identity, close);

        const options = document.createElement('details');
        options.className = 'pet-chat-options';
        const summary = document.createElement('summary');
        summary.textContent = 'Model & effort';
        const fields = document.createElement('div');
        fields.className = 'pet-chat-option-fields';

        const modelLabel = document.createElement('label');
        modelLabel.textContent = 'Model ID';
        const model = document.createElement('input');
        model.value = this.state.options?.model ?? '';
        model.placeholder = 'VS Code default';
        model.maxLength = 128;
        model.spellcheck = false;
        model.setAttribute('list', 'pet-chat-models');
        const models = document.createElement('datalist');
        models.id = 'pet-chat-models';
        models.append(new Option('GPT-6-Luna', 'gpt-6-luna'));
        models.append(new Option('GPT-6-Sol', 'gpt-6-sol'));
        modelLabel.append(model);

        const effortLabel = document.createElement('label');
        effortLabel.textContent = 'Reasoning effort';
        const effort = document.createElement('select');
        const effortLabels = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            xhigh: 'Extra high',
            max: 'Max',
            ultra: 'Ultra',
        };
        effort.append(new Option('VS Code default', ''));
        for (const value of PET_CHAT_EFFORTS) {
            effort.append(new Option(effortLabels[value], value));
        }
        effort.value = this.state.options?.reasoningEffort ?? '';
        effortLabel.append(effort);

        const saveOptions = () => {
            this.state.options = {
                model: model.value.trim() || undefined,
                reasoningEffort: PET_CHAT_EFFORTS.find(
                    (value) => value === effort.value,
                ),
            };
            this.save();
        };
        model.addEventListener('input', saveOptions);
        effort.addEventListener('change', saveOptions);
        fields.append(modelLabel, effortLabel);
        options.append(summary, fields, models);

        const messages = document.createElement('div');
        messages.className = 'pet-chat-messages';
        messages.setAttribute('role', 'log');
        const status = document.createElement('p');
        status.className = 'pet-chat-status';
        status.setAttribute('role', 'status');

        const form = document.createElement('form');
        const input = document.createElement('input');
        input.setAttribute('aria-label', 'Message');
        input.placeholder = 'Say something…';
        input.maxLength = 2000;
        const send = document.createElement('button');
        send.type = 'submit';
        send.className = 'pet-chat-send';
        send.setAttribute('aria-label', 'Send message');
        send.title = 'Send message';
        const updateSend = () => {
            send.disabled = !!this.state.pending || !input.value.trim();
        };
        input.addEventListener('input', updateSend);
        form.append(input, send);

        let renderedTurns = 0;
        this.refreshDialog = () => {
            for (const turn of this.state.turns.slice(renderedTurns)) {
                const outgoing = turn.role === 'user';
                const message = document.createElement('p');
                message.className = outgoing
                    ? 'pet-chat-message pet-chat-outgoing'
                    : 'pet-chat-message';
                const author = document.createElement('strong');
                author.textContent = outgoing ? 'You' : pet.name;
                message.append(author, document.createTextNode(turn.text));
                messages.append(message);
            }
            if (renderedTurns !== this.state.turns.length) {
                renderedTurns = this.state.turns.length;
                messages.scrollTop = messages.scrollHeight;
            }
            status.textContent = this.state.pending
                ? 'Waiting for Codex…'
                : this.state.usedFallback
                  ? 'Codex couldn’t reply. Using a built-in reply.'
                  : '';
            updateSend();
        };
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const text = input.value.trim();
            if (!text || this.state.pending) {
                return;
            }
            this.state.turns.push({ role: 'user', text });
            this.state.pending = {
                id: String(crypto.getRandomValues(new Uint32Array(4))),
                text,
                options: this.state.options,
            };
            input.value = '';
            this.changed();
            this.resume();
            input.focus();
        });

        dialog.append(header, options, messages, status, form);
        dialog.addEventListener(
            'close',
            () => {
                if (this.dialog === dialog) {
                    this.dialog = undefined;
                    this.refreshDialog = undefined;
                }
                dialog.remove();
            },
            { once: true },
        );
        document.body.append(dialog);
        if (!this.state.turns.length) {
            this.state.turns.push({ role: 'pet', text: pet.hello });
        }
        dialog.showModal();
        this.state.unread = false;
        this.changed();
        messages.scrollTop = messages.scrollHeight;
        input.focus();
    }
}

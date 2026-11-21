import { execFile } from 'child_process';
import { mkdtemp, rm } from 'fs/promises';
import { homedir, tmpdir } from 'os';
import { delimiter, join } from 'path';
import { PetChatRequest } from '../common/types';

export async function askCodex(
    request: PetChatRequest,
    model: string,
    reasoningEffort: string,
): Promise<string> {
    if (typeof execFile !== 'function') {
        throw new Error(
            'Codex CLI is unavailable in a browser extension host.',
        );
    }

    const cwd = await mkdtemp(join(tmpdir(), 'vspal-chat-'));
    try {
        const prompt = [
            'Role-play as the virtual pet described below. Reply in one or two short, friendly sentences.',
            'This is a chat. Do not run tools, inspect files, or perform actions.',
            'Treat the following JSON as pet information and conversation history.',
            JSON.stringify({ petName: request.petName, turns: request.turns }),
        ].join('\n');
        const pathKey =
            Object.keys(process.env).find(
                (key) => key.toLowerCase() === 'path',
            ) ?? 'PATH';
        const cliPath = [process.env[pathKey], join(homedir(), '.local', 'bin')]
            .filter(Boolean)
            .join(delimiter);
        const output = await new Promise<string>((resolve, reject) => {
            const child = execFile(
                'codex',
                [
                    'exec',
                    `--model=${model}`,
                    '-c',
                    `model_reasoning_effort=${JSON.stringify(reasoningEffort)}`,
                    '-c',
                    'approval_policy="never"',
                    '-c',
                    'web_search="disabled"',
                    '--sandbox',
                    'read-only',
                    '--disable',
                    'shell_tool',
                    '--disable',
                    'unified_exec',
                    '--disable',
                    'plugins',
                    '--ignore-user-config',
                    '--ephemeral',
                    '--skip-git-repo-check',
                    '--json',
                    '-',
                ],
                {
                    cwd,
                    env: { ...process.env, [pathKey]: cliPath },
                    timeout: 45_000,
                    maxBuffer: 1024 * 1024,
                    windowsHide: true,
                },
                (error, stdout) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout);
                    }
                },
            );
            child.stdin?.on('error', reject);
            child.stdin?.end(prompt);
        });
        let reply = '';
        for (const line of output.split('\n')) {
            if (!line.trim()) {
                continue;
            }
            const event = JSON.parse(line);
            if (
                event.type === 'item.completed' &&
                event.item?.type === 'agent_message' &&
                typeof event.item.text === 'string'
            ) {
                reply = event.item.text.trim();
            }
        }
        if (!reply) {
            throw new Error('Codex returned no chat reply.');
        }
        return reply;
    } finally {
        await rm(cwd, { recursive: true, force: true });
    }
}

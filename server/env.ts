import { env } from 'node:process';

/** Return environment variable value if set otherwise throw. */
export function getVar(name: string): string {
    const value = env[name];
    if (typeof value === 'undefined')
        throw Error(`Environment variable ${name} is not set.`);
    return value;
}

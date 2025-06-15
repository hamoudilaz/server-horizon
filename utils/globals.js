const held = new Map();
const demoHeld = new Map();
export const sessions = new Map();

export function setHeldAmount(mint, amount) {
    held.set(mint, amount);
}

export function getHeldAmount(mint) {
    return held.get(mint) || 0;
}



export function setDemoAmount(session, mint, amount) {
    const s = session
    if (!s) return;
    const prev = s.tokens.get(mint) || 0;
    const updated = prev + amount;
    if (updated <= 0) {
        s.tokens.delete(mint);
    } else {
        s.tokens.set(mint, updated);
    }
}


export function getDemoAmount(session, mint) {
    const s = session
    return s?.tokens.get(mint) || 0;
}

const held = new Map(); // Global in-memory token holding

export function setHeldAmount(mint, amount) {
    held.set(mint, amount);
}

export function getHeldAmount(mint) {
    return held.get(mint) || 0;
}

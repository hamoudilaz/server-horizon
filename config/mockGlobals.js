import { jest } from '@jest/globals';

export async function mockGlobals() {
    jest.unstable_mockModule('../../helpers/constants.js', () => ({
        connection: {}, // mock Connection to avoid real setup
        calculateFee: jest.fn(() => 0), // in case used
    }));

    // optionally mock swap modules too
    jest.unstable_mockModule('../../engine/execute.js', () => ({
        swap: jest.fn().mockResolvedValue({ result: 'MOCK_TX' })
    }));

    // mock token holding logic if needed
    jest.unstable_mockModule('../../utils/globals.js', () => ({
        getHeldAmount: () => 10_000_000,
        setHeldAmount: () => { },
    }));
}

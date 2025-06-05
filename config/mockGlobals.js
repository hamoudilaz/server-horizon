import { jest } from '@jest/globals';

export async function mockGlobals() {
    jest.unstable_mockModule('../config/constant.js', () => ({
        Connection: class {
            constructor() { }
        },
        calculateFee: jest.fn(() => 0),
    }));


    jest.unstable_mockModule('../engine/execute.js', () => ({
        swap: jest.fn().mockResolvedValue({ result: 'MOCK_TX' })
    }));

    jest.unstable_mockModule('../utils/globals.js', () => ({
        getHeldAmount: () => 10_000_000,
        setHeldAmount: () => { },
    }));

}

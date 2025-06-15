/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // This tells ts-jest how to handle ES Modules
    transform: {
        '^.+\\.m?tsx?$': ['ts-jest', { useESM: true }],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1', // Helps resolve module imports correctly
    },
};
module.exports = {
    plugins: [
        ['@babel/plugin-transform-class-properties'],
        ['@babel/plugin-transform-object-rest-spread'],
        ['@babel/plugin-transform-runtime', { regenerator: false }],
    ],
    presets: ['@babel/env', '@babel/react', '@babel/preset-typescript'],
};

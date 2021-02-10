module.exports = {
    presets: ['@babel/env', '@babel/react'],
    plugins: [
        ['babel-plugin-styled-components'],
        ['@babel/plugin-proposal-class-properties'],
        ['@babel/plugin-proposal-object-rest-spread'],
        ['@babel/plugin-transform-runtime', { regenerator: false }],
    ],
};

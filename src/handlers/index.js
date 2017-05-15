const compose = require('koa-compose')

const douyuHandler = require('./douyu-playback.js');

module.exports = async function (opts) {
    const ctx = Object.assign({}, opts);

    const handlers = compose([
        douyuHandler
    ]);

    try {
        await handlers(ctx);

        return ctx.result;
    } catch (e) {
        console.error('Error happend during handler: ', e.message);
    }
};
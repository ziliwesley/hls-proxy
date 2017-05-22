const compose = require('koa-compose')

const douyuPlaybackHandler = require('./douyu-playback.js');
const douyuStreamHandler = require('./douyu-stream.js');

async function defaultHanlder(ctx) {
    ctx.result = {
        error: 10000,
        message: 'Not Supported'
    };
}

module.exports = async function (opts) {
    const ctx = Object.assign({}, opts);

    const handlers = compose([
        douyuPlaybackHandler,
        douyuStreamHandler,
        defaultHanlder
    ]);

    try {
        await handlers(ctx);

        return ctx.result;
    } catch (e) {
        console.error('Error happend during handler: ', e.message);
    }
};
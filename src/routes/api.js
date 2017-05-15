const Router = require('koa-router');
const { isObject } = require('lodash');

const handlers = require('../handlers/');

const router = new Router();

router.post('/api/detect', async (ctx, next) => {
    await next();

    if (isObject(ctx.request.body)) {
        ctx.body = await handlers(ctx.request.body);
    } else {
        ctx.body = {
            mess: 'request body type not supported'
        };
    }
});

module.exports = router;
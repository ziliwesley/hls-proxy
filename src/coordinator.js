const cp = require('child_process');
const crypto = require('crypto');

const { dir } = require('./fs.js');

const finishedWorkerIds = new Set();
const workers = new Map();

// Hash url source as id
function calcSourceHash(source) {
    const hash = crypto.createHash('sha1');

    hash.update(source);

    return hash.digest('hex');
}

// Should store related resutls to a persistent storeage, 
// something like a database. But here simply push to a set
// and save it in memory
function logWorkerResult(id) {
    finishedWorkerIds.add(id);
}

// Load already processed streams from local disk
exports.readFinishedPlaybacks = function () {
    const children = dir('static/assets/playback');

    if (children) {
        children.forEach((file) => {
            if (file.type === 'dir') {
                logWorkerResult(file.name);
            }
        });
    }
}

// Create a worker to process the stream
exports.createWorker = function ({source, audioOnly = false} = {}) {
    const id = calcSourceHash(source);
    let worker;

    if (workers.has(id)) {
        throw `worker "${id}" already exists.`;
    } else if (finishedWorkerIds.has(id)) {
        throw `worker "${id}" already done.`;
    } else {
        worker = cp.fork(`${__dirname}/ffmpeg-worker.js`);

        worker.on('message', (mess) => {
            switch (mess.action) {
                case 'RETIRE':
                    logWorkerResult(id);
                    break;
                case 'PROGRESS':
                    console.log(`[${id}] updated: ${mess.progress}%`);
                    break;
                default:
                    break;
            }
        });

        workers.set(id, worker);

        console.log(`new worker [pid :${worker.pid}] created.`);

        // Send instructions to worker
        worker.send({
            action: 'INIT',
            id: id,
            source: source,
            audioOnly: audioOnly
        });
    }
};
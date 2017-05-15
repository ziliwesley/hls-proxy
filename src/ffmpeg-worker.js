// ffmpeg-worker
const FfmpegCommand = require('fluent-ffmpeg');
const mkdirp = require('mkdirp');
const path = require('path');
const command = new FfmpegCommand();

// Prepare to terminate the child process, but ask the
// coordinator first
function retireWorker(withErrors = false) {
    process.send({
        action: 'RETIRE',
        withErrors: withErrors
    });

    // Kill ffmpeg process
    command.kill();
    // Kill the worker process
    process.exit(0);
}

function updateProgress(progress) {
    process.send({
        action: 'PROGRESS',
        progress: progress
    });
}

function createProxy(id, url, audioOnly) {
    const dir = `static/assets/playback/${id}`
    const destDir = path.resolve(__dirname, `../${dir}`);

    console.log('mkdir: ', destDir);
    mkdirp(path.resolve(__dirname, `../${dir}`));

    command.input(url)
        .native();

    if (audioOnly) {
        // Extract audio stream only
        command
            .noVideo()
            .audioCodec('copy')
    } else {
        // Proxy and mirror the remote stream
        command
            .videoCodec('copy')
            .audioCodec('copy')
    }

    command
        .addOutputOption('-f segment')
        .addOutputOption(`-segment_list ${destDir}/index.m3u8`)
        .addOutputOption('-segment_time 10')
        .addOutputOption('-segment_format mpegts')
        .addOutputOption('-frame_size 160')
        .addOutput(`${destDir}/playback%05d.ts`)
        .on('progress', progress => {
            updateProgress(progress.percent);
        })
        .on('error', err => {
            console.log(err);
            console.log(`error happened during process: ${err.message}`);
        })
        .on('end', () => {
            console.log('done');
            retireWorker();
        });

    command.run();
}

process.on('message', (mess) => {
    switch (mess.action) {
        case 'INIT':
            createProxy(mess.id, mess.source, mess.audioOnly);
            break;
        default:
            break;
    }
});

// Handle unexpected end
process.on('uncaughtException', (error) => {
    console.log(`terminating worker due to: ${error}`);
    retireWorker(true);
});

console.log(`worker [pid: ${process.pid}] started, awaiting further instruction.`);


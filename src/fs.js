const projectDir = require('fs-jetpack');

// path: relative path to project's root directory
exports.dir = function (path) {
    return projectDir.inspectTree(path);
};
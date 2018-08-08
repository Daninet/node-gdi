module.exports = { cleanup: () => {} };
const path = require('path');
const fs = require('fs');

if (process.__nexe) {

  function getDirName () {
    const endOffset = process.__nexe.layout.resourceStart;
    const contentSize = process.__nexe.layout.contentSize;
    const fd = fs.openSync(process.execPath, 'r');
    const result = Buffer.alloc(contentSize);
    fs.readSync(fd, result, 0, contentSize, endOffset - contentSize);
    fs.closeSync(fd);
    const str = result.toString();
    const index = str.lastIndexOf(';mkdirp(\'');
    return str.slice(index + 9, index + 17);
  }

  const dirName = getDirName();

  var deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file, index){
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    } else {
      console.log('err');
    }
  };

  module.exports = { cleanup: () => {
    deleteFolderRecursive(`./${dirName}`);
  }};
}

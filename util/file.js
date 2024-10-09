const fs = require("fs");

const deleteFile = (filePath) => {
  //경로에 있는 파일삭제
  fs.unlink(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
};

exports.deleteFile = deleteFile;

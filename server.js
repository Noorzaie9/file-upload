const path = require("path");
const fs = require("fs");

const express = require("express");
const multer = require("multer");
const app = express();


const audioExtensions = ["wav", "mp3", "ogg", "wma", "m4a"];

const videoExtensions = [
  "mp4",
  "avi",
  "mov",
  "wmv",
  "flv",
  "mkv",
  "3gp",
  "webm",
];

const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

const documentExtensions = ["epub"];

const allowedExtensions = [... audioExtensions, ...videoExtensions, ...imageExtensions, ...documentExtensions];

function getFolderByExtension (filename){
    const ext = path.extname(filename).slice(1).toLocaleLowerCase();
    return ext || "others"
}

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        const folder = getFolderByExtension(file.originalname);
        const dir = path.join(__dirname, `upload/${folder}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
      
          cb(null, dir);

    },
    filename: function (req, file, cb){
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

function fileFilter(req, file, cb){
    const ext = path.extname(file.originalname).slice(1).toLocaleLowerCase();
    if (allowedExtensions.includes(ext)){
        cb(null, true);
    }else{
        cb(new Error(`Only ${allowedExtensions.join(', ')} files are allowed.`), false);
    }
}
const upload = multer({
    storage,
    fileFilter,
    limits: {fileSize: 1024 * 1024 * 100}, // 100 MB
});


app.post("/upload", upload.single("file"), (req, res) => {
    const file = req.file;
  
    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded."
      });
    }
  
    const relativePath = path.join(
      "upload",
      path.basename(path.dirname(file.path)),
      file.filename
    );
  
    res.status(201).json({
      status: "success",
      message: "File uploaded!",
      path: relativePath
    });
  });
  

app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'error',
        message: 'File is too large. Maximum allowed size is 100MB.'
      });
    }
  
    // Other multer errors
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
  
    // General errors
    res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error'
    });
  });


app.get("/get-file", (req, res) => {
    const filePath = req.query.path;
  
    if (!filePath) {
      return res.status(400).json({
        status: "fail",
        message: "File path is required!"
      });
    }
  
    const fullPath = path.join(__dirname, filePath);
  
    // Optional: prevent directory traversal attacks
    const safeBase = path.join(__dirname, "upload");
    if (!fullPath.startsWith(safeBase)) {
      return res.status(403).json({
        status: "error",
        message: "Access denied."
      });
    }
  
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({
          status: "error",
          message: "File not found."
        });
      }
  
      res.sendFile(fullPath);
    });
  });
  
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
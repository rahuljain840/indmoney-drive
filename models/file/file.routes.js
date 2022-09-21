const FileController = require('./file.controller')
const AuthController = require("../authorization/auth.js")
const FolderController = require('../folder/folder.controller')
const path = require("path")
const crypto = require('crypto')
const multer = require('multer')
const fs = require('fs')
const GridFsStorage = require('multer-gridfs-storage')
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

exports.routesConfig = function (app) {
    app.post('/api/file/uploadFile', [
        FolderController.checkIfFolderExistForFile,
        upload.single('file'),
        AuthController.proofTokenForUpload,
        FileController.removeFileWihCheck,
        FileController.uploadFile
    ]);

    app.post('/api/file/getFiles', [
        AuthController.proofToken,
        FileController.getFiles
    ]);

    app.delete('/api/file/deleteFile', [
        AuthController.proofToken,
        FileController.isOwner,
        FileController.deleteFile,
        FileController.deleteFileGrid,
    ]);

    app.post('/api/file/getFile', [
        AuthController.proofToken,
        FileController.getFile,
        FileController.getFileFormStorage,
    ]);

}

const user_id = 'root1';

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folderPath = req.result.path;
        //   fs.mkdirSync(folderPath, { recursive: true });
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        
        cb(null, file.originalname) //Appending extension
    }
})

const upload = multer({ storage });
const FolderController = require('./folder.controller')
const AuthController = require("../authorization/auth.js")

exports.routesConfig = function (app) {
	app.post('/api/folder/createFolder', [
        AuthController.proofToken,
        FolderController.checkIfFolderExist,
        FolderController.createFolder,
    ]);

    app.post('/api/folder/getFolders', [
        AuthController.proofToken,
        FolderController.getFolders
    ]);

    app.delete('/api/folder/deleteFolders', [
        AuthController.proofToken,
        FolderController.isOwner,
        FolderController.getFolder,
        FolderController.deleteFolders
    ]);

    app.patch('/api/folder/modifyFolder', [
        AuthController.proofToken,
        FolderController.isOwner,
        FolderController.modify,
    ]);
}

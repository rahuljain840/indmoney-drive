const FolderController = require('./folder.model')
const FileController = require('../file/file.model')
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const fs = require('fs');

exports.createFolder = async (req, res, next) => {
    crypto.randomBytes(16, (err, buf) => {
        if (err) return res.status(403).send({ err: "Error creating folder" })

        FolderController.getFolder(req.body.parent)
            .then((result) => {
                const basepath = result !== null ? result.path : 'public/root1';

                var idFolder = buf.toString('hex') + Date.now()
                const path = basepath + "/" + req.body.name;

                fs.mkdirSync(path, { recursive: true });

                req.body = {
                    idFolder: idFolder,
                    owner: req.body.owner,
                    name: req.body.name,
                    parent: req.body.parent,
                    path: path,
                    linkView: crypto.createHash('sha256').update(idFolder).digest('hex'),
                }

                FolderController.saveFolder(req.body)
                    .then((result) => {
                        res.status(200).send(result)
                    })
                    .catch(err => {
                        console.log('err...', err);
                        res.status(403).send({ err: "Error creating folder" })
                    })

            })
            .catch(err => {
                console.log('err...', err);

                res.status(403).send({ err: "Error creating folder" })
            })

    })
}

exports.addFolderToParent = (req, res, next) => {
    FolderController.addFolderToParent(req.body.parent, req.body.idFolder)
        .then((result) => {
            res.status(200).send({})
        })
        .catch(err => {
            res.status(403).send({ err: "Error adding id to parent folder" })
        })
}

exports.getFolder = (req, res, next) => {
    FolderController.getFolder(req.body.idFolder)
        .then((result) => {
            if (result !== null) {
                req.body.result = result;
                return next()
            } else {
                res.status(403).send({ err: "Error this folder doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.checkIfFolderExistForFile = (req, res, next) => {
    if (req.body.parent === "/") {
        req.body.deleteFile = true
        return next()
    }

    console.log('req.body.parent...');

    FolderController.getFolder(req.query.folder)
        .then((result) => {
            console.log('result...', result);
            if (result !== null) {
                req.body.parent = result.idFolder;
                req.result = result;
                return next()
            } else {
                req.body.deleteFile = true
                return next()
            }
        })
        .catch(err => {
            req.body.deleteFile = true
            return next()
        })
}

exports.checkIfFolderExist = (req, res, next) => {
    if (req.body.parent === "/") {
        return next()
    }

    FolderController.getFolder(req.body.parent)
        .then((result) => {
            if (result !== null) {
                req.body.parent = result.idFolder
                return next()
            } else {
                res.status(403).send({ err: "Error this folder doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.getFolders = (req, res, next) => {
    FolderController.getFolders(req.body.owner, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting folder" })
        })
}

exports.deleteFolders = async (req, res, next) => {
    console.log('delete folders');
    var folders = [req.body.idFolder]
    
    var allFolders = new Set()
    allFolders.add(req.body.idFolder)
    console.log('delete folders length', folders.length);

    while (folders.length !== 0) {
        await FolderController.deleteFolders(folders)
            .then((result) => {
                console.log('delete folders...', result);

                folders = result

                for (let a = 0; a < result.length; ++a) {
                    allFolders.add(result[a])
                }

                if (folders.length === 0) {

                    allFolders = [...allFolders]

                    FileController.deleteFilesByParents(allFolders)
                        .then(() => {
                            const dir = req.body.result.path;
                            fs.rmSync(dir, { recursive: true, force: true });
                        })
                        .catch(() => { })

                    return res.status(201).send({});
                }
            })
            .catch(err => {
                return res.status(403).send({ err: "Error deleting folder" })
            })
    }
}

exports.isOwner = (req, res, next) => {
    FolderController.isOwner(req.body.owner, req.body.idFolder)
        .then((result) => {
            if (result === null) {
                res.status(403).send({ err: "No folder found" })
            } else if (result.owner !== req.body.owner) {
                res.status(403).send({ err: "You are not authorized to access this folder" })
            } else {
                return next()
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error isOwner folder" })
        })
}

exports.modify = (req, res, next) => {
    FolderController.modify(req.body.owner, req.body.idFolder, req.body.name)
        .then((result) => {
            res.status(201).send({});
        })
        .catch(err => {
            res.status(403).send({ err: "Error modifying folder" })
        })
}

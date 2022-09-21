const FileController = require('./file.model')
const crypto = require("crypto")
const path = require("path")

exports.uploadFile = (req, res) => {

    crypto.randomBytes(16, (err, buf) => {
        if (err) {
            return reject({ err: "Error uploading file" })
        }
        var filename = buf.toString('hex') + Date.now() + path.extname(req.file.originalname);

        req.body = {
            linkView: req.body.linkView,
            idFile: filename,
            name: req.file.originalname,
            owner: req.body.owner,
            parent: req.body.parent,
            type: req.file.mimetype,
            path: req.file.path
        }

        FileController.uploadFile(req.body)
            .then((result) => {
                res.status(201).send(result);
            })
            .catch(err => {
                res.status(403).send({ err: "Error uploading file" })
            })
    });



}

exports.getFileFormStorage = (req, res) => {
    FileController.getFileFormStorage(req, res);
}

exports.getFile = (req, res, next) => {
    FileController.getFile(req.body.idFile)
        .then((result) => {
            if (result !== null) {
                req.body.result = result
                return next()
            } else {
                res.status(403).send({ err: "Error this file doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting file" })
        })
}

exports.getFileById = (req, res, next) => {
    FileController.getFileById(req.params.id)
        .then((result) => {
            if (result !== null) {
                req.body.result = result;
                return next()
            } else {
                res.status(403).send({ err: "Error this file doesn't exist" })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting file by id" })
        })
}

exports.getFiles = (req, res, next) => {
    FileController.getFiles(req.body.owner, req.body.parent)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting files" })
        })
}

exports.removeFile = (req, res, next) => {
    FileController.removeFile(req.body.idFile)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error removing file" })
        })
}

exports.removeFileWihCheck = (req, res, next) => {
    if (req.body.deleteFile !== undefined) {
        FileController.removeFile(req.body.idFile)
            .then((result) => {
                res.status(201).send(result);
            })
            .catch(err => {
                res.status(403).send({ err: "Error removing file" })
            })
    } else {
        return next()
    }
}

exports.deleteFile = (req, res, next) => {
    FileController.deleteFile(req.body.owner, req.body.idFile)
        .then((result) => {
            return next()
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting file" })
        })
}

exports.deleteFileGrid = (req, res) => {
    FileController.deleteFileGrid(req.body.idFile)
        .then((result) => {
            res.status(201).send({})
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting file from grid" })
        })
}

exports.isOwner = (req, res, next) => {
    FileController.isOwner(req.body.owner, req.body.idFile)
        .then((result) => {
            if (result === null) {
                res.status(403).send({ err: "No file found or you are not authorized to access this file" })
            } else if (result.owner !== req.body.owner) {
                res.status(403).send({ err: "You are not authorized to access this file" })
            } else {
                return next()
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error deleting file" })
        })
}

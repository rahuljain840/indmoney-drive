const mongoose = require('mongoose')
require('mongoose-double')(mongoose)
mongoose.set('useCreateIndex', true)

const FolderModel = new mongoose.Schema({
	idFolder: { type: String, trim: true, default: "", require: true },
	owner: { type: String, trim: true, default: "", require: true }, // is a token
	parent: { type: String, trim: true, default: "", require: true }, // idFolder of parent
	name: { type: String, trim: true, default: "", require: true }, // name folder
	path: { type: String, trim: true, default: "", require: true }, //  folder path
	linkView: { type: String, trim: true, default: "" }, // sha id
	createdAt: { type: Date, default: Date.now },
})

const Folder = mongoose.model('Folder', FolderModel, 'Folder')


exports.saveFolder = (folderData) => {
	return new Promise((resolve, reject) => {
		const folder = new Folder(folderData)
		folder.save(function (err, newfolder) {
			if (err) return reject(err)
			resolve(newfolder)
		})
	})
}

exports.getFolder = (idFolder) => {
	return new Promise((resolve, reject) => {
		Folder.findOne({ idFolder: idFolder }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.getFolders = (owner, parent) => {
	return new Promise((resolve, reject) => {
		
		Folder.find({ parent: parent, $or: [{ owner: owner }] }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.getFoldersById = (idFolder) => {
	return new Promise((resolve, reject) => {
		Folder.find({ parent: idFolder }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.deleteFolders = async (folders) => {
	return new Promise((resolve, reject) => {
		console.log('folders...', folders);
		Folder.find({ parent: { $in: folders } }, {}, function (err, folder) {
			console.log('folder...', folder);

			var newFolders = []
			for (let a = 0; a < folder.length; ++a) {
				newFolders.push(folder[a]['idFolder'])
			}

			Folder.deleteMany({ idFolder: { $in: folders } }, {}, function (err, folder) {
				if (err) return reject(err)
				resolve(newFolders)
			})
		})
	})
}

exports.isOwner = (owner, idFolder) => {
	return new Promise((resolve, reject) => {
		Folder.findOne({ owner: owner, idFolder: idFolder }, {}, function (err, folder) {
			if (err) return reject(err)
			resolve(folder)
		})
	})
}

exports.modify = (owner, idFolder, name) => {
	return new Promise((resolve, reject) => {
		Folder.findOneAndUpdate({ owner: owner, idFolder: idFolder },
			{ $set: { name: name } },
			{ new: true }, function (err, folder) {
				if (err) return reject(err)
				resolve(folder)
			})
	})
}
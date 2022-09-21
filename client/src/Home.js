import React, { Component } from 'react';

import { Upload, message, Input as InputAntd } from 'antd';
import { UploadOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';

import {
	Button, TextField, IconButton, Menu,
	MenuItem, ListItemIcon, Typography,
	FormControlLabel, Divider, TextareaAutosize,
	InputAdornment, Checkbox
} from '@material-ui/core';
import FolderIcon from '@material-ui/icons/Folder';
import LockIcon from '@material-ui/icons/Lock';
import FolderSharedIcon from '@material-ui/icons/FolderShared';
import SearchIcon from '@material-ui/icons/Search';
import SettingsIcon from '@material-ui/icons/Settings';
import DraftsIcon from '@material-ui/icons/Drafts';
import EditIcon from '@material-ui/icons/Edit';
import ShareIcon from '@material-ui/icons/Share';

import Modal from 'react-bootstrap/Modal';
import { Row } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';

// import Note from './Note'

import "./Home.css"

var timerId, hide;

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			owner: "",
			token: "",
			path: window.location.href,
			name: "",
			password: "",
			visible: false,
			showModal: false,
			disableBottons: false,
			showPassword: false,
			folders: [],
			files: [],
			notes: [],
			search: "",
			viewLink: null,
			passwords: [],
			modifyFolder: false,
			isType: "",
			previewImg: [],

			url: null,
			downloading: false,
			viewFileClicked: false,
			downloadFileClicked: false,
			showModalFile: false,

			mouseX: null,
			mouseY: null,
			showFoldersMenu: false,
			showMainMenu: false,
			infos: null,

			titleNote: "",
			textNote: "",
			idNote: "",
			savingNote: false,
			indexMouseOverNote: -1,

			showModalAccount: false,
			newToken: "",

			isMobile: window.matchMedia("only screen and (max-width: 760px)").matches,
		}

		this.getFoldersAndFiles = this.getFoldersAndFiles.bind(this)
	}

	UNSAFE_componentWillMount = () => {
		if (window.localStorage.getItem("passwords") === null) {
			window.localStorage.setItem("passwords", JSON.stringify([]))
			this.setState({
				passwords: [],
			})
		} else {
			this.setState({
				passwords: JSON.parse(window.localStorage.getItem("passwords")),
			})
		}
		if (window.localStorage.getItem("owner") !== null && window.localStorage.getItem("token") !== null) {
			this.setState({
				owner: window.localStorage.getItem("owner"),
				token: window.localStorage.getItem("token")
			}, () => {
				this.getFoldersAndFiles()
			})
		} else {
			var token = this.generate_token(32)
			this.sha256(token)
				.then((proofToken) => {
					this.setState({
						owner: proofToken,
						token: token
					}, () => {
						window.localStorage.setItem("owner", this.state.owner)
						window.localStorage.setItem("token", this.state.token)
						this.getFoldersAndFiles()
					})
				})
				.catch((e) => {
					console.log(e)
				})
		}

		if (window.localStorage.getItem("message1") === null) {
			if (this.getParent() === "/") {
				var msg = ""
				if (this.state.isMobile === false) {
					msg = "Right click on file/folder for more actions"
				} else {
					msg = "Long press on file/folder for more actions"
				}
				message.info(msg, 6)
			}

			window.localStorage.setItem("message1", "true")
		}

	}

	getFoldersAndFiles = () => {
		var data = {
			parent: this.getParent(),
			owner: this.state.owner,
			token: this.state.token,
		}

		fetch("/api/folder/getFolders", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.setState({
						folders: data
					}, () => {
						this.getFiles()
					})
				} else {
					console.error('Error:', data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getFiles = () => {
		var data = {
			parent: this.getParent(),
			owner: this.state.owner,
			token: this.state.token,
			passwords: this.state.passwords,
		}

		fetch("/api/file/getFiles", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					let nulls = []
					for (let a = 0; a < data.length; ++a) {
						nulls.push(null)
					}
					this.setState({
						files: data,
						previewImg: nulls
					}, () => {
						this.getPreviewsImgs(data)
					})
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	sha256 = async (message) => {
		const msgBuffer = new TextEncoder('utf-8').encode(message)
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('')
		return hashHex
	}

	generate_token = (length) => {
		var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("")
		var b = []
		for (var i = 0; i < length; i++) {
			var j = (Math.random() * (a.length - 1)).toFixed(0)
			b[i] = a[j]
		}
		return b.join("")
	}

	getParent = () => {
		var parent = this.state.path.split("/")
		parent = parent[parent.length - 1]

		if (parent.length === 0) {
			parent = "/"
		}

		return parent
	}

	createFolder = () => {
		if (this.state.name.length === 0) {
			message.error(`Insert a name please\n`);
			return
		}

		var data = {
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			name: this.state.name
		}
		fetch("/api/folder/createFolder", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.getFoldersAndFiles()
					message.success(`${this.state.name} folder uploaded successfully`);
				} else {
					message.error(`Folder upload failed.`)
				}

				this.setState({
					showModal: false,
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	modifyFolder = () => {
		if (this.state.name.length === 0) {
			message.error(`Insert a name please\n`);
			return
		}

		var data = {
			owner: this.state.owner,
			token: this.state.token,
			idFolder: this.state.infos.idFolder,
			name: this.state.name
		}
		fetch("/api/folder/modifyFolder", {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					this.getFoldersAndFiles()

					message.success(`${this.state.name} folder updated successfully`);
				} else {
					message.error(`Folder update failed.`)
				}

				this.setState({
					showModal: false,
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	downloadFile = () => {
		if (this.state.downloading === false) {
			var link = document.createElement('a')
			link.href = this.state.url
			link.setAttribute('download', this.state.name)
			link.click()
		} else {
			this.setState({
				downloadFileClicked: true,
			})
		}
	}

	showMessageUploadFile = (info) => {
		if (info.file.status === 'done') {
			setTimeout(hide, 0)
			message.success(`${info.file.name} file uploaded successfully`);
			this.getFoldersAndFiles()
		} else if (info.file.status === 'error') {
			setTimeout(hide, 0)
			message.error(`${info.file.name} file upload failed.`);
		}
	}

	clickFolder = () => {
		window.location.href = "/" + this.state.infos.idFolder
	}

	clickFile = (showModel = true) => {

		var data = {
			idFile: this.state.infos.idFile,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			passwords: this.state.passwords,
		}

		this.setState({
			name: this.state.infos.name,
			// showModalFile: showModel,
			downloading: true,
		})

		fetch("/api/file/getFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				this.setState({
					url: URL.createObjectURL(data),
					downloading: false
				}, () => {
					if (showModel === true) {
						var win = window.open(this.state.url, '_blank')
						win.focus()
					}

					if (this.state.viewFileClicked === true) {
						this.setState({
							viewFileClicked: false
						}, () => {
							this.viewFile()
						})
					}
					if (this.state.downloadFileClicked === true) {
						this.setState({
							downloadFileClicked: false
						}, () => {
							this.downloadFile()
						})
					}
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	viewFile = () => {
		if (this.state.downloading === false) {
			window.location.href = this.state.url
		} else {
			this.setState({
				viewFileClicked: true,
			})
		}
	}

	openModal = (modifyFolder = false) => {
		if (modifyFolder === true) {
			this.setState({
				showModal: true,
				modifyFolder: modifyFolder,
				name: this.state.infos.name,
				password: this.state.infos.password,
				visible: this.state.infos.visibleToEveryone,				
			}, () => { })
		} else {
			this.setState({
				showModal: true,
				modifyFolder: modifyFolder,
				name: "",
				visible: false,
				password: "",
				showPassword: false,
			}, () => { })
		}
	}

	closeModal = () => {
		this.setState({
			showModal: false,
			modifyFolder: false,
			showModalFile: false,
			showModalAccount: false,
		}, () => { })
	}

	closeMenu = () => {
		this.setState({
			mouseX: null,
			mouseY: null,
			showFoldersMenu: false,
			showMainMenu: false,
		})
	}

	remove = () => {
		var data = {}
		var url = ""

		if (this.state.isType === "file") {
			data = {
				idFile: this.state.infos.idFile,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/file/deleteFile"
		} else if (this.state.isType === "folder") {
			data = {
				idFolder: this.state.infos.idFolder,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/folder/deleteFolders"
		} else {
			data = {
				idNote: this.state.infos.idNote,
				owner: this.state.owner,
				token: this.state.token,
			}
			url = "/api/note/deleteNote"
		}

		fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
				if (data.err === undefined) {
					message.success(`${this.state.isType} deleted`)
					this.getFoldersAndFiles()
				} else {
					message.error(data.err)
				}
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	getMineType = (mime_type) => {
		let icon_classes = {
			// Media
			'image': 'far fa-file-image',
			'audio': 'far fa-file-audio',
			'video': 'far fa-file-video',
			// Documents
			'application/pdf': 'far fa-file-pdf',
			'application/msword': 'far fa-file-word',
			'application/vnd.ms-word': 'far fa-file-word',
			'application/vnd.oasis.opendocument.text': 'far fa-file-word',
			'application/vnd.openxmlformats-officedocument.wordprocessingml': 'far fa-file-word',
			'application/vnd.ms-excel': 'far fa-file-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml': 'far fa-file-excel',
			'application/vnd.oasis.opendocument.spreadsheet': 'far fa-file-excel',
			'application/vnd.ms-powerpoint': 'far fa-file-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml': 'far fa-file-powerpoint',
			'application/vnd.oasis.opendocument.presentation': 'far fa-file-powerpoint',
			'text/plain': 'far fa-file-text',
			'text/html': 'far fa-file-code',
			'application/json': 'far fa-file-code',
			// Archives
			'application/gzip': 'far fa-file-archive',
			'application/zip': 'far fa-file-archive',
		}

		for (let k in icon_classes) {
			if (mime_type.indexOf(k) === 0) {
				return icon_classes[k]
			}
		}
		return 'far fa-file'
	}

	saveNewToken = () => {
		var token = this.state.newToken
		if (token.length < 8) {
			message.error("Token must be at least 8 characters long")
			return
		}
		this.sha256(token)
			.then((proofToken) => {
				this.setState({
					owner: proofToken,
					token: token,
					newToken: "",
				}, () => {
					window.localStorage.setItem("owner", this.state.owner)
					window.localStorage.setItem("token", this.state.token)
				})

				message.success("Secret token updated")
			})
			.catch((e) => {
				console.log(e)
			})
	}

	validURL(str) {
		var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
			'(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
		return !!pattern.test(str);
	}

	// some magic to add space as it should be
	parseMarkdown(data) {
		data = data.split("\n")
		var newData = []
		var start = false
		for (let a = 0; a < data.length; ++a) {
			if (data[a].length === 0) {
				if (start === false || a < 1 || data[a - 1].length === 0 || data[a + 1].length === 0) {
					continue
				}
				if (["*", "-", "+"].includes(data[a - 1].trim()[0]) === true ||
					["*", "-", "+"].includes(data[a + 1].trim()[0]) === true ||
					(a !== data.length - 1 && data[a + 1].trim().split(". ").length >= 2 && isNaN(parseInt(data[a + 1].trim().split(". ")[0])) === false)) {
					newData.push("")
					continue
				}
				newData.push("\\")
				newData.push("\\")
			} else {
				start = true

				let split_for_url = data[a].trim().split(" ")
				for (let b = 0; b < split_for_url.length; ++b) {
					if (this.validURL(split_for_url[b])) {
						if (!split_for_url[b].startsWith("https://") && !split_for_url[b].startsWith("http://")) {
							split_for_url[b] = "https://" + split_for_url[b]
						}
						let new_url = split_for_url[b].replace("https://", "").replace("http://", "").replace("www.", "")
						split_for_url[b] = "[" + new_url + "](" + split_for_url[b] + ")"
					}
				}

				data[a] = split_for_url.join(" ")

				var check_number_list = data[a].trim().split(". ")

				if (check_number_list.length >= 2 && isNaN(parseInt(check_number_list[0])) === false) {
					newData.push(data[a])
					/*
					check cases like:
						1. asd
						2. asd
						text. a	
					*/
					if (a !== data.length - 1) {
						var check_number_list_next = data[a + 1].trim().split(". ")
						if (check_number_list_next.length < 2 ||
							(check_number_list_next.length >= 2 && isNaN(parseInt(check_number_list_next[0])))) {
							newData.push("")
						}
					}
					continue
				}

				if (a !== data.length - 1 && data[a + 1].length > 0 &&
					["*", "-", "+"].includes(data[a + 1].trim()[0]) === false &&
					(data[a + 1].trim().split(". ").length < 2 || (data[a + 1].trim().split(". ").length >= 2 && isNaN(parseInt(data[a + 1].trim().split(". ")[0]))))) {
					newData.push(data[a] + "\\")
				} else {
					newData.push(data[a])
				}
			}
		}
		return newData.join("\n")
	}

	getPreviewsImgs = (data) => {
		console.log(data)
		for (let a = 0; a < data.length; ++a) {
			if (data[a].type.startsWith('image')) {
				this.getImagePreview(data[a], a)
			}
		}
	}

	getImagePreview = (item, idx) => {
		var data = {
			idFile: item.idFile,
			owner: this.state.owner,
			token: this.state.token,
			parent: this.getParent(),
			passwords: this.state.passwords,
		}

		fetch("/api/file/getFile", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.blob())
			.then(data => {
				let url = URL.createObjectURL(data)
				this.setState(prevState => {
					let p = prevState.previewImg
					p[idx] = url
					return {
						previewImg: p
					}
				})
			})
			.catch((error) => {
				console.error('Error:', error)
			})
	}

	render() {
		return (
			<div>
				{/* right click folder / file */}
				<Menu
					keepMounted
					open={this.state.showMainMenu === true}
					onClose={this.closeMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						this.state.mouseY !== null && this.state.mouseX !== null
							? { top: this.state.mouseY, left: this.state.mouseX }
							: undefined
					}
				>
					{this.state.isType === "file" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner && this.state.path.includes("/file/") === false &&
								<div>
									<MenuItem onClick={() => {
										this.remove()
										this.closeMenu()
									}}>
										<ListItemIcon>
											<DraftsIcon fontSize="small" />
										</ListItemIcon>
										<Typography variant="inherit" noWrap>
											Remove
										</Typography>
									</MenuItem>
								</div>
							}

							<MenuItem onClick={() => {
								this.downloadFile()
								this.closeMenu()
							}}>
								<ListItemIcon>
									<DraftsIcon fontSize="small" />
								</ListItemIcon>
								<Typography variant="inherit" noWrap>
									Download
								</Typography>
							</MenuItem>
						</div>}

					{this.state.isType === "folder" &&
						<div style={{ width: "250px" }}>
							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<MenuItem onClick={() => {
									this.remove()
									this.closeMenu()
								}}>
									<ListItemIcon>
										<DraftsIcon fontSize="small" />
									</ListItemIcon>
									<Typography variant="inherit" noWrap>
										Remove
									</Typography>
								</MenuItem>}

							{this.state.infos !== null && this.state.owner === this.state.infos.owner &&
								<MenuItem onClick={() => {
									this.openModal(true)
									this.closeMenu()
								}}>
									<ListItemIcon>
										<DraftsIcon fontSize="small" />
									</ListItemIcon>
									<Typography variant="inherit" noWrap>
										Modify
									</Typography>
								</MenuItem>}
						</div>}

				</Menu>

				{/* change account */}
				<Modal show={this.state.showModalAccount} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter" style={{ width: "100%" }}>
							Settings
						</Modal.Title>
					</Modal.Header>
					<Modal.Body style={{ overflowY: "auto", wordBreak: "break-word", width: "100%", maxHeight: "calc(100vh - 200px)", minHeight: "400px" }}>
						<div>
							<h4>Your secret token:</h4>
							<TextField
								label="Secret token"
								defaultValue={this.state.token}
								InputProps={{ readOnly: true }}
								variant="filled"
							/>

							<h4 style={{ paddingTop: "30px" }}>Change account:</h4>
							<TextField
								label="New secret token"
								defaultValue=""
								variant="outlined"
								style={{ width: "70%", marginTop: "5px" }}
								onChange={(e) => this.setState({
									newToken: e.target.value
								})}
							/>
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginTop: "15px", marginLeft: "10px"
							}}
								onClick={this.saveNewToken}>Save</Button>
						</div>
					</Modal.Body>
				</Modal>

				{/* create file with name, password, visible */}
				<Modal show={this.state.showModal} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							{this.state.modifyFolder === true ? "Modify Folder" : "New Folder"}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
							<div>
								<InputAntd defaultValue={this.state.name} placeholder="Folder name" onChange={(e) => this.setState({
									name: e.target.value
								})} />
							</div>							
						</div>

					</Modal.Body>
					<Modal.Footer>
						<Button variant="contained" style={{ backgroundColor: "white" }} onClick={this.closeModal} >Cancel</Button>
						{this.state.modifyFolder === true ?
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginLeft: "20px",
								marginRight: "20px"
							}}
								onClick={this.modifyFolder}>Save</Button>
							:
							<Button variant="contained" style={{
								backgroundColor: "#4caf50",
								marginLeft: "20px",
								marginRight: "20px"
							}}
								onClick={this.createFolder}>Create</Button>
						}

					</Modal.Footer>
				</Modal>

				{/* show view or download on click file */}
				<Modal show={this.state.showModalFile} onHide={this.closeModal}
					size="md"
					aria-labelledby="contained-modal-title-vcenter"
					centered>
					<Modal.Header closeButton>
						<Modal.Title id="contained-modal-title-vcenter">
							File {this.state.name.length > 15 ? (this.state.name.split("").splice(0, 15).join("") + "...") : this.state.name}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingLeft: "30px", paddingRight: "30px", textAlign: "center" }}>
							<Button variant="contained" style={{ backgroundColor: "#fbc02d" }} onClick={this.viewFile}>View</Button>
							<Button variant="contained" style={{
								backgroundColor: "#4caf50", marginLeft: "20px", marginRight: "20px"
							}}
								onClick={this.downloadFile}>Download</Button>
						</div>
					</Modal.Body>
				</Modal>

				<div className="container">
					<div>

						<IconButton onClick={() =>
							this.setState({
								showModalAccount: true,
								newToken: "",
							})}
							style={{ marginTop: "20px", marginLeft: "5px" }}
						>
							<SettingsIcon className="icons" />
						</IconButton>
					</div>

					<div style={{ margin: "20px" }}>
						<Row style={{ justifyContent: "center" }}>
							<div>
								<div style={{ margin: "10px" }} onClick={() => {
									if (this.getParent() === "/") {
										message.error("Select or create a folder before uploading files");
									}
								}}>
									<Upload directory webkitdirectory {...{
										disabled: (this.getParent() === "/" || this.state.disableBottons === true) ? true : false,
										name: 'file',
										action: `api/file/uploadFile?folder=${this.getParent()}`,
										beforeUpload: (file, fileList, d) => {
											var files = fileList
											let size = 16000000
											for (var a = 0; a < files.length; a++) {
												if (files[a].size > size) {
													message.error(`${files[a].name} is too large, please pick a smaller file\n`);
													return false
												}
											}

											hide = message.loading('Uploading..', 0)

											return true
										},
										data: {
											owner: this.state.owner,
											token: this.state.token,
											parent: this.getParent()		
										},
										showUploadList: false,
										onChange: this.showMessageUploadFile
									}}>

										<Button
											variant="contained"
											className="buttons-folders"
											disabled={this.state.disableBottons}
											style={{
												textAlign: "left",
												justifyContent: "left",
												backgroundColor: "#2196f3",
												borderRadius: "7px",
												width: "auto"
											}}
											startIcon={<UploadOutlined />}>
											Upload Directory
										</Button>
									</Upload>
								</div>
							</div>

							<div>
								<div style={{ margin: "10px" }} onClick={() => {
									if (this.getParent() === "/") {
										message.error("Select or create a folder before uploading files");
									}
								}}>
									<Upload {...{
										disabled: (this.getParent() === "/" || this.state.disableBottons === true) ? true : false,
										name: 'file',
										action: `api/file/uploadFile?folder=${this.getParent()}`,
										beforeUpload: (file, fileList) => {
											var files = fileList
											let size = 16000000
											for (var a = 0; a < files.length; a++) {
												if (files[a].size > size) {
													message.error(`${files[a].name} is too large, please pick a smaller file\n`);
													return false
												}
											}

											hide = message.loading('Uploading..', 0)

											return true
										},
										data: {
											owner: this.state.owner,
											token: this.state.token,
											parent: this.getParent()
										},
										showUploadList: false,
										onChange: this.showMessageUploadFile
									}}>

										<Button
											variant="contained"
											className="buttons-folders"
											disabled={this.state.disableBottons}
											style={{
												textAlign: "left",
												justifyContent: "left",
												backgroundColor: "#2196f3",
												borderRadius: "7px",
												width: "auto"
											}}
											startIcon={<UploadOutlined />}>
											Upload File
										</Button>
									</Upload>
								</div>
							</div>

							<div>
								<Button
									variant="contained"
									className="buttons-folders"
									disabled={this.state.disableBottons}
									style={{
										margin: "10px",
										textAlign: "left",
										justifyContent: "left",
										backgroundColor: "#ff9800",
										borderRadius: "7px",
										marginLeft: "20px",
										width: "auto"
									}}
									startIcon={<FolderAddOutlined />}
									onClick={this.openModal}>
									Create Folder
								</Button>
							</div>

						</Row>
					</div>

					<Row style={{ maxHeight: "230px", overflow: "auto", overflowY: "scroll", justifyContent: "center" }}>
						{this.state.folders.length > 0 && this.state.folders.filter(item => {
							if (this.state.search.length > 0) {
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.name.toLowerCase())
							} else {
								return true
							}
						}).map((item) => {
							return (
								<div className="folders" key={item._id}>
									<Button
										variant="contained"
										className="buttons-folders"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left", justifyContent: "left",
											borderRadius: "7px", fontSize: "17px", paddingLeft: "20px"
										}}
										startIcon={<FolderIcon className="icons" style={{ marginRight: "10px" }} />}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												showMainMenu: true,
												isType: "folder",
												infos: item,
											})
										}}
										onClick={() => {
											this.setState({
												isType: "folder",
												infos: item,
											}, () => {
												this.clickFolder()
											})
										}}
									>
										<Typography variant="inherit" noWrap>
											{item.name}
										</Typography>
									</Button>
								</div>
							)
						})}
					</Row>

					<Divider />

					<Row style={{ overflow: "auto", overflowY: "scroll", justifyContent: "center", height: "auto" }}>

						{this.state.files.length > 0 && this.state.files.filter(item => {
							if (this.state.search.length > 0) {
								let re = new RegExp(this.state.search.toLowerCase(), "i")
								return re.test(item.name.toLowerCase())
							} else {
								return true
							}
						}).map((item, idx) => {
							return (
								<div className="files" key={item._id}>
									<Button
										props={item}
										variant="contained"
										className="buttons-files"
										style={{
											textTransform: 'none', backgroundColor: "white", textAlign: "left",
											justifyContent: "left", fontSize: "17px", paddingLeft: "20px"
										}}
										onContextMenu={(e) => {
											e.preventDefault()
											this.setState({
												mouseX: e.clientX - 2,
												mouseY: e.clientY - 4,
												showMainMenu: true,
												isType: "file",
												infos: item,
											}, () => this.clickFile(false))
										}}
										onClick={() => {
											this.setState({
												isType: "file",
												infos: item,
											}, () => {
												this.clickFile()
											})
										}}
									>
										{item.type.startsWith('image') ?
											<img width="210" height="210" src={(this.state.previewImg.length - 1 >= idx && this.state.previewImg[idx] !== null) ? this.state.previewImg[idx] : ""} />
											:
											<i className={this.getMineType(item.type)} style={{ fontSize: "50px", marginRight: "10px" }}></i>
										}
										{item.type.startsWith('image') === false &&
											<Typography variant="inherit" noWrap>
												{item.name}
											</Typography>}
									</Button>
								</div>
							)
						})}

					</Row>
				</div>
			</div>
		);
	}
}

export default Home;
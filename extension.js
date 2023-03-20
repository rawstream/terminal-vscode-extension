const { TextEncoder } = require('util')
const vscode = require('vscode')
const defaultSettings = require('./MyTerminals.json')
let SETTINGS = null

/**
 * Read and parse settings file. Returns settings object or null.
 * @returns Object || null
 */
async function getSettings() {
	const settingsFile = await vscode.workspace.findFiles('.vscode/**/MyTerminals.json', 'node_modules', 1)
		.then(files => files?.[0] || null)
	if (!settingsFile) {
		return null
	}

	return vscode.workspace.fs.readFile(settingsFile).then(data => {
		const contents = data.toString()
		try {
			SETTINGS = JSON.parse(contents) || null
			return SETTINGS
		} catch (error) {
			vscode.window.showErrorMessage('Invalid MyTerminals.json file.')
			SETTINGS = null
			return null
		}
	})
}

// Create new settings file
function createSettingsFile() {
	const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri?.path
	if (!rootPath) {
		vscode.window.showErrorMessage('Please open a workspace.')
	}
	const uri = vscode.Uri.file(`${rootPath}/.vscode/MyTerminals.json`)
	const content = new TextEncoder('utf8').encode(JSON.stringify(defaultSettings, null, 2))
	vscode.workspace.fs.writeFile(uri, content).then(() => {
		vscode.window.showInformationMessage('Created MyTerminals.json')
	})
}

/**
 * Validate settings object
 * @param {Object} settings 
 * @returns Boolean
 */
function validateSettings(settings) {
	if (!settings) {
		vscode.window.showWarningMessage('Could not find MyTerminals.json file.', 'Create now', 'Maybe later').then(answer => {
			if (answer === 'Create now') {
				createSettingsFile()
			}
		})
		return false
	}
	else if (!settings.terminals?.length) {
		vscode.window.showErrorMessage('No terminals specified in MyTerminals.json file.')
		return false
	}
	return true
}

/**
 * Check if a workspace is open
 * @returns Boolean
 */
function workspaceIsOpen() {
	if (!vscode.workspace.workspaceFolders?.length) {
		vscode.window.showErrorMessage('Please open a workspace.')
		return false
	}
	return true
}

/**
 * Open the passed terminals
 * @param {Array} terminals 
 */
function openTerminals(terminals) {
	const workspaceUri = vscode.workspace.workspaceFolders[0].uri
	terminals.forEach(t => {
		const { name, icon, color, message, commands, path, shellPath } = t
		const cwd = path ? vscode.Uri.joinPath(workspaceUri, path) : null
		const currentTerminal = vscode.window.createTerminal({
			name,
			iconPath: new vscode.ThemeIcon(icon),
			color: new vscode.ThemeColor(color),
			message,
			cwd,
			shellPath: shellPath || vscode.env.shell
		})

		commands?.forEach(c => {
			if (typeof c === 'string') {
				currentTerminal.sendText(c)
			}
		})
	})
}

/**
 * Focus on specified terminal. Default: first terminal specified.
 * @param {Array} terminals 
 */
function focus(terminals) {
	const terminalWithFocus = terminals.findIndex(t => t.focus === true)
	vscode.window.terminals[terminalWithFocus > -1 ? terminalWithFocus : 0].show()
}

/**
 * Create file system watcher for settings file
 */
function watchSettingsFile() {
	if (!workspaceIsOpen()) {
		return
	}
	const workspaceFolder = vscode.workspace.workspaceFolders[0]
	const pattern = new vscode.RelativePattern(workspaceFolder, '.vscode/MyTerminals.json')
	const watcher = vscode.workspace.createFileSystemWatcher(pattern)
	let handleEvents = true
	const handler = async () => {
		if (handleEvents) {
			handleEvents = false
			const settings = await getSettings()
			const hasValidSettings = validateSettings(settings)
			if (hasValidSettings) {
				SETTINGS = settings
			}
			setTimeout(() => {
				handleEvents = true
			}, 2000)
		}
	}
	watcher.onDidCreate(handler)
	watcher.onDidChange(handler)
	watcher.onDidDelete(() => {
		SETTINGS = null
	})

}


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	watchSettingsFile()
	SETTINGS = await getSettings()

	// Open all defined terminals
	const openTerminalsCommand = vscode.commands.registerCommand('terminal-vscode-extension.openTerminals', async () => {
		if (!workspaceIsOpen()) {
			return
		}
		const hasValidSettings = validateSettings(SETTINGS)
		if (!hasValidSettings) {
			return
		}
		const terminals = SETTINGS.terminals
		openTerminals(terminals)
		if (!SETTINGS.silence) {
			focus(terminals)
		}
	})

	// Kill all open terminals
	const killTerminalsCommand = vscode.commands.registerCommand('terminal-vscode-extension.killTerminals', () => {
		vscode.window.terminals.forEach(terminal => {
			terminal.dispose()
		})
	})

	// Create settings file
	const initSettingsFileCommand = vscode.commands.registerCommand('terminal-vscode-extension.initSettingsFile', () => {
		createSettingsFile()
	})

	// Select terminals to open
	const openSelectedCommand = vscode.commands.registerCommand('terminal-vscode-extension.openSelected', async () => {
		if (!workspaceIsOpen()) {
			return
		}
		const hasValidSettings = validateSettings(SETTINGS)
		if (!hasValidSettings) {
			return
		}
		const quickPickList = SETTINGS.terminals.map(t => t.name)
		vscode.window.showQuickPick(quickPickList, { canPickMany: true }).then(list => {
			const terminals = SETTINGS.terminals.filter(t => list.includes(t.name))
			openTerminals(terminals)
			if (!SETTINGS.silence) {
				focus(terminals)
			}
		})
	})
	context.subscriptions.push(openTerminalsCommand, killTerminalsCommand, initSettingsFileCommand, openSelectedCommand)
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}

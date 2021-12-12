const { TextEncoder } = require('util')
const vscode = require('vscode')
const defaultSettings = require('./MyTerminals.json')

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
			return JSON.parse(contents)
		} catch (error) {
			vscode.window.showErrorMessage('Invalid MyTerminals.json file.')
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
	if(!settings.terminals?.length) {
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
	terminals.forEach(t => {
		const {name, icon, color, message} = t
		vscode.window.createTerminal({
			name,
			iconPath: new vscode.ThemeIcon(icon),
			color: new vscode.ThemeColor(color),
			message
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
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	if (vscode.workspace.workspaceFolders?.length) {
		const settings = await getSettings()
		validateSettings(settings)
	}
	
	// Open all defined terminals
	const openTerminalsCommand = vscode.commands.registerCommand('terminal-vscode-extension.openTerminals', async () => {
		if (!workspaceIsOpen()) {
			return
		}
		const settings = await getSettings()
		const hasValidSettings = validateSettings(settings)
		if (!hasValidSettings) {
			return
		}
		const terminals = settings.terminals
		openTerminals(terminals)	
		if (!settings.silence)	{
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
		const settings = await getSettings()
		const hasValidSettings = validateSettings(settings)
		if (!hasValidSettings) {
			return
		}
		const quickPickList = settings.terminals.map(t => t.name)	
		vscode.window.showQuickPick(quickPickList, {canPickMany: true}).then(list => {
			const terminals = settings.terminals.filter(t => list.includes(t.name))
			openTerminals(terminals)
			if (!settings.silence)	{
				focus(terminals)
			}
		})
	})
	context.subscriptions.push(openTerminalsCommand, killTerminalsCommand, initSettingsFileCommand, openSelectedCommand)		
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

const { TextEncoder } = require('util')
const vscode = require('vscode')

// Read settings file and parse. Returns settings object or null.
async function getSettings() {
	const settingsFile = await vscode.workspace.findFiles('.vscode/**/MyTerminals.json', 'node_modules', 1)
	.then(files => files?.[0] || null)
	if (!settingsFile) {
		return null
	}

	return vscode.workspace.fs.readFile(settingsFile).then(buffer => {
		const contents = buffer.toString()
		try {
			return JSON.parse(contents)
		} catch (error) {
			vscode.window.showErrorMessage('Invalid MyTerminals.json file.')
			return null
		}
	})
}

// Validate the parsed settings object
async function validateSettings(settings) {	
	if (!settings) {
		vscode.window.showWarningMessage('Could not find MyTerminals.json file.', 'Create now', 'Maybe later').then(answer => {
			if (answer === 'Create now') {
				init()
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

// Create new settings file
function init() {
	const defaultSettings = require('./MyTerminals.json')
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
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	if (vscode.workspace.workspaceFolders?.length) {
		const settings = await getSettings()
		validateSettings(settings)
	}
	
	const openTerminalsCommand = vscode.commands.registerCommand('terminal-vscode-extension.openTerminals', async () => {
		if (!vscode.workspace.workspaceFolders?.length) {
			return vscode.window.showErrorMessage('Please open a workspace.')
		}
		const settings = await getSettings()
		const hasValidSettings = validateSettings(settings)
		if (!hasValidSettings) {
			return
		}		

		settings.terminals.forEach(t => {
			const {name, icon, color, message} = t
			vscode.window.createTerminal({
				name,
				iconPath: new vscode.ThemeIcon(icon),
				color: new vscode.ThemeColor(color),
				message
			})
		})
		
		// Focus on terminal
		const terminalWithFocus = settings.terminals.findIndex(t => t.focus === true)			
		vscode.window.terminals[terminalWithFocus > -1 ? terminalWithFocus : 0].show()
	})

	const killTerminalsCommand = vscode.commands.registerCommand('terminal-vscode-extension.killTerminals', () => {
		vscode.window.terminals.forEach(terminal => {
			terminal.dispose()
		})
	})

	const initSettingsFileCommand = vscode.commands.registerCommand('terminal-vscode-extension.initSettingsFile', () => {
		init()
	})
	context.subscriptions.push(openTerminalsCommand, killTerminalsCommand, initSettingsFileCommand)		
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

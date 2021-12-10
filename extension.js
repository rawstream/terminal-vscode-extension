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


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	let settings = await getSettings()
	if (!settings) {
		vscode.window.showWarningMessage('Could not find MyTerminals.json file.', 'Create now', 'Maybe later').then(answer => {
			if (answer === 'Create now') {
				console.log('A new file will be created') // @TODO
			}
			return
		})
	}
	
	const openTerminalsCommand = vscode.commands.registerCommand('terminal-vscode-extension.openTerminals', async () => {
		settings = await getSettings()

		if(!settings?.terminals?.length) {
			return vscode.window.showErrorMessage('No terminals specified in MyTerminals.json file.')
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
	context.subscriptions.push(openTerminalsCommand, killTerminalsCommand)		
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

# MyTerminals

Define your terminal configurations in a MyTerminals.json file.
Run all specified terminals at once or select specific terminals.

## How to use:
- Bring up the command pallette
- Select one of the commands as mentioned below.
- Press [enter] to confirm or [escape] to cancel.

![Command pallette](/images/command-pallette.png)


### Available commands:
#### MyTerminals: Init
Creates a MyTerminals.json settings file in your projects `.vscode` folder.
See [settings](#available-settings) for available configuration options.

#### MyTerminals: Open
Launch the configured terminals.

#### MyTerminals: Kill
Kill all open terminals.

#### MyTerminals: Select
Choose a terminal configuration to open.
 

## Settings:
All configuration options shown below are optional.

```jsonc
// .vscode/MyTerminals.json
{
  "silence": false, // Don't focus on the terminal panel if set to true
  "terminals": [
    {
      "name": "Git",
      "icon": "git-merge", 
      "color": "terminal.ansiBlue",
      "message": "run 'npm run serve' to start dev server", // Message written to the terminal on first launch.
      "focus": false, // Terminal tab gets focus if set to true 
      "path": "backend/", // Path for the current working directory to be used for the terminal. Relative to workspace root.
      "shellPath": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", // Path to custom shell executable to be used in the terminal
      "commands": ["npm run serve"] // Command(s) to be executed on launch.
    }    
  ]
}
```

 > See Visual Studio Code's [Icon Listing](https://code.visualstudio.com/api/references/icons-in-labels#icon-listing) for a list of optional icons.

> See Visual Studio Code's [Integrated Terminal Colors](https://code.visualstudio.com/api/references/theme-color#integrated-terminal-colors). The `terminal.ansi*` theme keys are recommended for the best contrast and consistency across themes.


## Release Notes
### 1.2.2
Fixed typo in readme
### 1.2.1
More neutral defaults when running MyTerminals: Init
### 1.2.0
Fixed: Configured icons and colors are correctly shown for VSCode v1.70 and above.
Added option for custom shellPath.
Updated README.md 

### 1.1.0
Added **How to use** section to README.md

### 1.0.0

Initial release of MyTerminals

---

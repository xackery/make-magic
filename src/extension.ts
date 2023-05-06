// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let items: vscode.QuickPickItem[] = [];

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting make-magic');

	items.push({label:"(none)", description:"no Makefile found"});

	refreshMakefile();
	if (vscode.workspace.workspaceFolders !== undefined) {
		let watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], "[Mm]akefile"));
		watcher.onDidChange(() => {
			refreshMakefile();
		});
		watcher.onDidCreate(() => {
			refreshMakefile();
		});
		watcher.onDidDelete(() => {
			refreshMakefile();
		});
	}

	let disposable = vscode.commands.registerCommand('make-magic.make', () => {
		vscode.window.showQuickPick(items).then(selection => {
			if (!selection) {
				return;
			}
			if (selection.label === "(none)") {
				return;
			}
			let focusTerminal:vscode.Terminal = (vscode.window.activeTerminal ? vscode.window.activeTerminal : vscode.window.createTerminal());
			focusTerminal.show(false);
			focusTerminal.sendText(`make ${selection.label}`);
		});
	});

	context.subscriptions.push(disposable);
}

export function refreshMakefile() {
	// if Makefile exists in root path of workspace folder, read it line by line
	if (vscode.workspace.workspaceFolders === undefined) {
		return;
	}
	if (vscode.workspace.workspaceFolders.length === 0) {
		return;
	}

	items = [];

	let path = vscode.workspace.workspaceFolders[0].uri.fsPath + "/Makefile";
	vscode.workspace.fs.stat(vscode.Uri.file(path)).then(stat => {
		if (stat.type === vscode.FileType.File) {
			parseMakefile(path);
		}
	});

	path = vscode.workspace.workspaceFolders[0].uri.fsPath + "/makefile";
	vscode.workspace.fs.stat(vscode.Uri.file(path)).then(stat => {
		if (stat.type === vscode.FileType.File) {
			parseMakefile(path);
		}
	});

	if (items.length === 0) {
		items.push({ label: "(none)", description: "no Makefile found" });
	}
}

export function parseMakefile(path:string) {
	const pattern = /^([\w\-]+):/m;
	let lastComment = "";

	vscode.workspace.openTextDocument(path).then(doc => {
		items = [];
		// read line by line
		for (let i = 0; i < doc.lineCount; i++) {
			const line = doc.lineAt(i);
			const match = pattern.exec(line.text);
			if (match !== null) {
				// get target name
				let targetName = match[1];
				// add target to items
				items.push({label:targetName, description:lastComment ? lastComment : targetName});
			}
			let comment = line.text.trim();
			if (comment.startsWith("#")) {
				lastComment = comment.substring(1).trim();
			} else if (!comment.startsWith(".PHONY")) {
        		lastComment = "";
      		}
		}
	});
}


// This method is called when your extension is deactivated
export function deactivate() {}

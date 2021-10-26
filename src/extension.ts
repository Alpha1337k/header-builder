import * as vscode from 'vscode';
import * as fs from 'fs';
import { Parser } from './parser';
import { Inserter } from './inserter';
import { languageDemiliters } from './delimiters';


var parser : Parser | undefined;
var inserter: Inserter = new Inserter();

function getHeaderFile(url:string): string {
	while (url !== "") {
			
		url = url.substr(0, url.lastIndexOf('/'));
		console.log(url + '/.header');
		if (fs.existsSync(url + '/.header'))
		{
			return url + "/.header";
		}
	}
	return "";
}

function updateParser(path:string) {
	if (parser === undefined || path !== parser.path || fs.statSync(path).mtime > parser.lastEditDate)
	{
		try {
			parser = new Parser(fs.readFileSync(path).toString().split('\n'), path);
			vscode.window.showInformationMessage("Updated .header config!");
		} catch (error: any) {
			parser = undefined;
			vscode.window.showErrorMessage((error as Error).message);
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "header-builder" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('header-builder.applyHeader', () => {
		if (vscode.window.activeTextEditor === undefined)
			return;
		const activeEditor = vscode.window.activeTextEditor;
		const hPath = getHeaderFile(activeEditor.document.uri.path);

		if (hPath === "")
			vscode.window.showErrorMessage("No header found!");
		else
		{
			updateParser(hPath);
			if (parser === undefined)
				return;
			const delim = languageDemiliters[activeEditor.document.languageId];
			if (delim === undefined)
			{
				vscode.window.showErrorMessage("Error: document type not supported.");
				return;
			}
			parser.createBanner(activeEditor.document.uri.path, delim).then((banner: string) =>
			{
				vscode.window.activeTextEditor?.edit((edit) => {
					inserter.applyHeader(banner, activeEditor.document, edit, delim);
				});
			});
		}
	}));

	const watcher = (subscriptions: vscode.Disposable[]) => 
		vscode.workspace.onWillSaveTextDocument((event: vscode.TextDocumentWillSaveEvent) => {
		
		const hPath = getHeaderFile(event.document.uri.path);
		if (hPath === "")
			return;
		if (vscode.window.activeTextEditor === undefined)
			return;
		const editor: vscode.TextEditor = vscode.window.activeTextEditor;

		updateParser(hPath);
		if (parser === undefined || parser.runOnSave === false)
			return;
		const delim = languageDemiliters[event.document.languageId];
		if (delim === undefined)
		{
			return;
		}
		event.waitUntil(
			Promise.resolve	(
				parser.createBanner(event.document.uri.path, delim).then((banner: string) => {
					console.log("banner:\n", banner);
					editor.edit((edit) => {
						inserter.applyHeader(banner, event.document, edit, delim, false);
					});
				})
			)
		);
	});
	watcher(context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {}

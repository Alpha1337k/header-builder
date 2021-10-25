import * as vscode from 'vscode';
import * as fs from 'fs'
import { Parser } from './parser';
import { Inserter } from './inserter';
import { languageDemiliters } from './delimiters';


var parser : Parser;
var inserter: Inserter = new Inserter();

function getHeaderFile(url:string): string {
	while (url != "") {
			
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
	if (parser === undefined || path !== parser.path)
	{
		parser = new Parser(fs.readFileSync(path).toString().split('\n'), path);
	}
	else
	{
		const stat = fs.statSync(path)
		if (stat.mtime > parser.lastEditDate)
		{
			parser = new Parser(fs.readFileSync(path).toString().split('\n'), path);
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
			vscode.window.showInformationMessage('Wow we found a header! ' + hPath);
			updateParser(hPath);
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
				})
			});
		}
	}));

	const watcher = (subscriptions: vscode.Disposable[]) => 
		vscode.workspace.onWillSaveTextDocument((event: vscode.TextDocumentWillSaveEvent) => {
		
		const hPath = getHeaderFile(event.document.uri.path);
		if (hPath === "")
		{
			vscode.window.showErrorMessage("No .header file found!");
			return;
		}
		if (vscode.window.activeTextEditor === undefined)
			return;
		const editor: vscode.TextEditor = vscode.window.activeTextEditor;

		vscode.window.showInformationMessage('SAVED: Wow we found a header! ' + hPath);
		updateParser(hPath);

		if (parser.runOnSave === false)
			return;
		const delim = languageDemiliters[event.document.languageId];
		if (delim === undefined)
		{
			vscode.window.showErrorMessage("Error: document type not supported.");
			return;
		}
		event.waitUntil(
			Promise.resolve	(
				parser.createBanner(event.document.uri.path, delim).then((banner: string) => {
					console.log("banner: ", banner);
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

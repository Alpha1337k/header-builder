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

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "header-builder" is now active!');

	async function bannertest() {
		if (vscode.window.activeTextEditor)
			console.log(await parser.createBanner(vscode.window.activeTextEditor?.document.uri.path, languageDemiliters[vscode.window.activeTextEditor.document.languageId]));
	}

	context.subscriptions.push(vscode.commands.registerCommand('header-builder.applyHeader', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor === undefined)
			return;
		let url : string = activeEditor.document.uri.path;

		const hPath = getHeaderFile(url);

		if (hPath === "")
			vscode.window.showErrorMessage("No header found!");
		else
		{
			vscode.window.showInformationMessage('Wow we found a header! ' + url);
			parser = new Parser(fs.readFileSync(hPath).toString().split('\n'));

			bannertest();
		}
	}));

	const watcher = (subscriptions: vscode.Disposable[]) => vscode.workspace.onWillSaveTextDocument((event: vscode.TextDocumentWillSaveEvent) => {
		let url : string = event.document.uri.path;
		
		const hPath = getHeaderFile(url);
		if (vscode.window.activeTextEditor === undefined)
			return;
		const editor: vscode.TextEditor = vscode.window.activeTextEditor;
		if (hPath === "")
			vscode.window.showErrorMessage("No header found!");
		else
		{
			vscode.window.showInformationMessage('SAVED: Wow we found a header! ' + url);
			if (parser === undefined)
				parser = new Parser(fs.readFileSync(hPath).toString().split('\n'));

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
							inserter.applyHeader(banner, event.document, edit, delim);
						});
					})
				)
			);
		}
	});
	watcher(context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from 'vscode';
import * as fs from 'fs'
import { Parser } from './parser';

export function activate(context: vscode.ExtensionContext) {
	var parser : Parser;
	console.log('Congratulations, your extension "header-builder" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('header-builder.helloWorld', () => {

		vscode.window.showInformationMessage('Hello World from header-builder!');
	}));

	async function bannertest() {
		console.log(await parser.createBanner());
	}

	context.subscriptions.push(vscode.commands.registerCommand('header-builder.applyHeader', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor === undefined)
			return;
		let url : string = activeEditor.document.uri.path;

		while (url != "") {
			
			url = url.substr(0, url.lastIndexOf('/'));
			console.log(url + '/.header');
			if (fs.existsSync(url + '/.header'))
			{
				vscode.window.showInformationMessage('Wow we found a header!' + url);
				parser = new Parser(fs.readFileSync(url + '/.header').toString().split('\n'));

				bannertest();

				return;
			}
		}
		vscode.window.showInformationMessage("no header found!");
	}));

}

// this method is called when your extension is deactivated
export function deactivate() {}

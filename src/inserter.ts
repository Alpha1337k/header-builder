import * as vscode from 'vscode';

export class Inserter {
	constructor() {
		
	}

	headerExists(text: vscode.TextDocument, len: number, delim: string[]): boolean
	{
		let i = 0;
		for (; i < text.lineCount && i < len; i++) {
			const e = text.lineAt(i);
			if (e.text.startsWith(delim[0]) && e.text.endsWith(delim[1]))
				continue;
			return false;
		}
		if (i === text.lineCount && len > i)
			return false;
		return true;
	}

	applyHeader(banner: string, doc: vscode.TextDocument, 
		editor: vscode.TextEditorEdit, delim: string[], createIfMissing?: boolean)
	{
		let len: number = 0;
		for(var i=len=0; i<banner.length; len+=+('\n'===banner[i++]));
	
		if (this.headerExists(doc, len, delim) === true)
		{
			editor.replace(new vscode.Range(0, 0, len, 0), banner);
		}
		else if (createIfMissing !== false)
		{
			editor.insert(new vscode.Position(0, 0), banner);
		}
	}
}
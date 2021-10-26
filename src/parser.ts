import { exec } from "child_process";
import * as fs from 'fs';

class HeaderVar {
	name	: string;
	padding	: number = 0;
	command	: string;
	trim	: boolean = false;
	constructor(exp: RegExpMatchArray) {
		this.name = exp[1];
		if (exp[2])
			this.padding = parseInt(exp[2]);
		if (exp[3])
			this.trim = exp[3] === "1" ? true : false;
		this.command = exp[4];

		// fuck newlines
		this.trim = true;
	}
}

export class Parser {
	// headerfile data
	lastEditDate:	Date;
	path:			string;

	variables: HeaderVar[] = [];
	banner:string = '';

	// settings
	runOnSave: boolean = true;
	constructor(text: string[], path: string) {
		const regX = /\$(\w+)\s*(?:\((?:,?\s*padding:\s*(\d+))?\s*(?:,?\s*trim:\s*(\d+))?\))?\s*=\s*(.*)/;
		const settingsRegX = /!(\w+)\s+(\d)+/;

		this.lastEditDate = fs.statSync(path).mtime;
		this.path = path;
		for (let i = 0; i < text.length; i++) {
			const e = text[i];
			if (e[0] === '$')
			{
				const data = e.match(regX);
				console.log(data);
				if (data === null)
					throw new Error(`Error! line ${i}: parsing error`);
				else
					this.variables.push(new HeaderVar(data));
			}
			else if (e[0] === '!')
			{
				const data = e.match(settingsRegX);
				console.log(data);
				if (data === null)
					throw new Error(`Error! line ${i}: parsing error`);
				else
					if (data[1] === 'RunOnSave')
						this.runOnSave = data[2] === '1' ? true : false;
			}
			else if (e === '===')
			{
				// begin banner
				for (let x = i + 1; x < text.length; x++) {
					const b = text[x];
					this.banner += b + '\n';
				}
				break;
			}
		}
	}

	async #createResult(hv: HeaderVar, filename: string): Promise<string> {
		return new Promise(resolve => {
			let fileRx = new RegExp('\\$FILE', 'g');
			exec(hv.command.replace(fileRx, filename), (error, stdout, stderr) => {
				if (error) {
					console.log(`error: ${error.message}`);
					return;
				}
				if (stderr) {
					console.log(`stderr: ${stderr}`);
					return;
				}
				if (hv.trim)
					stdout = stdout.replace(/\n/g, '');
				if (stdout.length < hv.padding)
				{
					const toadd = " ".repeat(hv.padding - stdout.length);
					stdout += toadd;
				}
				return resolve(stdout);
			});
		});
	}

	async createBanner(filename: string, delimiters: string[] | undefined): Promise<string> {
		if (delimiters === undefined)
			return "";

		let results: string[] = [];
		for (let i = 0; i < this.variables.length; i++) {
			const e = this.variables[i];
			results.push(await this.#createResult(e, filename));
		}
		let rv: string = this.banner;
		
		
		for (let i = 0; i < this.variables.length; i++) {
			const e = this.variables[i];
			const regX = new RegExp('\\$' + e.name + 'p*(?=[^A-Z])', 'g');
			rv = rv.replace(regX, results[i]);
		}
		let fileRx = new RegExp('\\$FILEp*', 'g');
		rv = rv.replace(fileRx, filename);
		rv = delimiters[0] + rv.replace(/\n/g, delimiters[1] + '\n' + delimiters[0]);
		rv = rv.substr(0, rv.length - delimiters[1].length);


		return rv;
	}
}
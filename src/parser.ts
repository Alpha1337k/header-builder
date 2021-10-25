import { exec } from "child_process";

class HeaderVar {
	name: string;
	padding: number = 0;
	command: string;
	trim	: boolean = false;
	constructor(exp: RegExpMatchArray) {
		this.name = exp[1];
		if (exp[2])
			this.padding = parseInt(exp[2]);
		if (exp[3])
			this.trim = exp[3] == "1" ? true : false;
		this.command = exp[4];
	}
}

export class Parser {

	variables: HeaderVar[] = [];
	banner:string = '';
	constructor(text: string[]) {
		let regX = /\$(\w+)\s*(?:\((?:,?\s*padding:\s*(\d+))?\s*(?:,?\s*trim:\s*(\d+))?\))?\s*=\s*(.*)/;

		for (let i = 0; i < text.length; i++) {
			const e = text[i];
			if (e[0] == '$')
			{
				const data = e.match(regX);
				console.log(data);
				if (data != null)
					this.variables.push(new HeaderVar(data));
			}
			// begin banner
			else if (e == '===')
			{
				for (let x = i + 1; x < text.length; x++) {
					const b = text[x];
					this.banner += b + '\n';
				}
				break;
			}
		}
	}

	async #createResult(hv: HeaderVar): Promise<string> {
		return new Promise(resolve => {
			exec(hv.command, (error, stdout, stderr) => {
				if (error) {
					console.log(`error: ${error.message}`);
					return;
				}
				if (stderr) {
					console.log(`stderr: ${stderr}`);
					return;
				}
				if (hv.trim)
					stdout = stdout.replace('\n', '');
				if (stdout.length < hv.padding)
				{
					const toadd = " ".repeat(hv.padding - stdout.length);
					stdout += toadd;
				}
				console.log(stdout.length)
				return resolve(stdout);
			});
		});
	}

	async createBanner(): Promise<string> {
		let results: string[] = [];
		for (let i = 0; i < this.variables.length; i++) {
			const e = this.variables[i];
			results.push(await this.#createResult(e));
		}
		let rv: string = this.banner;
		
		
		for (let i = 0; i < this.variables.length; i++) {
			const e = this.variables[i];
			const regX = new RegExp('\\$' + e.name, 'g');
			rv = rv.replace(regX, results[i]);
		}
		return rv;
	}

}
# header-builder README

## Create and update headers quickly
Want your own dynamic headers on your projects, but cant be arsed to do much work? Fear no more! By setting up a simple config file you will be up in no time!

## How to use
- Mac: <kbd>⌘</kbd> + <kbd>⌥</kbd> + <kbd>H</kbd>
- Linux: <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>H</kbd>

## Commands
- Header Builder: Create headers in all files.

## Config file
> Sample file can be found in the sample directory

> There is only one reserved keyword: `$FILE`. This will give the path of the file.

Create a new file called .header in the root of your scope. Variables are defined in the `$NAME=command` manner. The `command` part will be executed just like in the shell.

You can quickly add padding using `$NAME(padding:x)=command`. At the end of the config file, write `===` followed by a newline. The rest will be used as banner. `$NAME` will be resolved to the command listed above. If needed you can add p characters at the end for visual padding.

If you wish to disable on save changes, you can add the `!RunOnSave 0` setting to the header.



## Bugs and such
Please make a pull request or issue on my [repository](https://github.com/Alpha1337k/header-builder). Thanks!

## License
MIT

**Enjoy!**

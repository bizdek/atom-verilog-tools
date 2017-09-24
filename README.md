# verilog-tools

Handy tools for easier Verilog development in Atom.

### Install
This package requires [python](https://www.python.org/) with installed python package [pyverilog](https://pypi.python.org/pypi/pyverilog).

Pyverilog can be installed via pip:

`python -m pip install pyverilog`

Verilog-tools can be installed through Atom. Alternatively, you can use `apm`:

`apm install verilog-tools`

When using for the first time, additional delay will appear as parser tables are generated.

### Features
Currently package operates on the first opened project folder.

###### Feature list
All features are accessed via packages menu or `ctrl+shift+p` if not otherwise specified.
- Link file features
  - Create link file - will generate empty link file in project folders
  - Link(Files, Folders, Include folders) - will append files/folders to link file
- Import file - will copy file to project folder
- Insert header - will insert content from header file specified in settings to start of the active file
- Copy module (Accessed via intensions `alt+enter`) - will copy module to clipboard
- Generate test bench (Accessed via intensions `alt+enter`) - generates new test bench

Currently functionalities used via intensions use first verilog module in file and all intension are accessed everywhere in file.

Package operates on project folder and subfolders, for any additional files use `verilog-links.json` file in project root for linking additional files and adding other project based features.

Example:
```json
{
    "linkFiles": [],
    "linkFolders": [],
    "linkIncludeFolders": [],
    "defines": [],
    "header": null
}
```
###### Configurations
Option | Description
-------|------------
linkFiles | Array of files to be linked.
linkFolders | Array of folders which will be linked.
linkIncludeFolders | Array of folders used only for include files search.
defines | Additional defines passed to preprocessor.
header | If not null, this file will override the settings file for header insert.


### Work in progress
Additional features are coming soon!

import * as vscode from 'vscode';
import { spawn } from 'child_process';

const allowedCommands = new Set([
  "reverse","upper","calc","time","echo","ls","pwd","cd","whoami","sysinfo",
  "disk","rand","grep","cat","head","tail","cp","mv","rm","mkdir","touch",
  "stat","info","wc","json","http_get","http","b64e","b64d","find","cowsay",
  "os-type","lupdate","date","uname","hostname","uptime","sleep","basename",
  "dirname","which","true","false","yes","sort","uniq","clear","apt","sudo",
  "!pwsh","!cmd","!mt","multithread","lupdate","!SuppressDebug"
]);

export function activate(context: vscode.ExtensionContext) {
  // === Semantic Tokens ===
  const legend = new vscode.SemanticTokensLegend(
    ['keyword','string','number','command','parameter','argument','invalid'],
    []
  );

  const provider: vscode.DocumentSemanticTokensProvider = {
    provideDocumentSemanticTokens(document: vscode.TextDocument) {
      const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
      const text = document.getText();
      let match;

      // Keywords
      const keywordRegex = /\b(if|else|return)\b/gi;
      while ((match = keywordRegex.exec(text))) {
        const start = document.positionAt(match.index);
        tokensBuilder.push(new vscode.Range(start, start.translate(0, match[0].length)), 'keyword');
      }

      // Strings
      const stringRegex = /"([^"]*)"/gi;
      while ((match = stringRegex.exec(text))) {
        const start = document.positionAt(match.index);
        tokensBuilder.push(new vscode.Range(start, start.translate(0, match[0].length)), 'string');
      }

      // Zahlen
      const numberRegex = /\b\d+\b/gi;
      while ((match = numberRegex.exec(text))) {
        const start = document.positionAt(match.index);
        tokensBuilder.push(new vscode.Range(start, start.translate(0, match[0].length)), 'number');
      }

      // Commands am Zeilenanfang
      const commandRegex = /^(\w+)/gm;
      while ((match = commandRegex.exec(text))) {
        const command = match[1];
        const start = document.positionAt(match.index);
        if (allowedCommands.has(command)) {
          tokensBuilder.push(new vscode.Range(start, start.translate(0, command.length)), 'command');
        } else {
          tokensBuilder.push(new vscode.Range(start, start.translate(0, command.length)), 'invalid');
        }
      }

      // Parameter
      const parameterRegex = /\b[A-Z][A-Z0-9_]*\b/g;
      while ((match = parameterRegex.exec(text))) {
        const start = document.positionAt(match.index);
        tokensBuilder.push(new vscode.Range(start, start.translate(0, match[0].length)), 'parameter');
      }

      // Argumente
      const argumentRegex = /--[a-zA-Z0-9_-]+/g;
      while ((match = argumentRegex.exec(text))) {
        const start = document.positionAt(match.index);
        tokensBuilder.push(new vscode.Range(start, start.translate(0, match[0].length)), 'argument');
      }

      return tokensBuilder.build();
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: 'latin' },
      provider,
      legend
    )
  );

  // === Diagnostics für Squiggles ===
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('latin');
  context.subscriptions.push(diagnosticCollection);

  function checkDocument(doc: vscode.TextDocument) {
    if (doc.languageId !== 'latin') return;
    const diagnostics: vscode.Diagnostic[] = [];
    const text = doc.getText();
    const regex = /^(\w+)/gm;
    let match;
    while ((match = regex.exec(text))) {
      const command = match[1];
      if (!allowedCommands.has(command)) {
        const range = new vscode.Range(
          doc.positionAt(match.index),
          doc.positionAt(match.index + command.length)
        );
        diagnostics.push({
          severity: vscode.DiagnosticSeverity.Error,
          range,
          message: `Unbekannter Command: "${command}"`
        });
      }
    }
    diagnosticCollection.set(doc.uri, diagnostics);
  }

  vscode.workspace.onDidOpenTextDocument(checkDocument);
  vscode.workspace.onDidChangeTextDocument(e => checkDocument(e.document));

  // === Run Script Command ===
  const runCommand = vscode.commands.registerCommand("latin.runScript", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor");
      return;
    }
    const filePath = editor.document.fileName;
    runLatinScript(filePath);
  });
  context.subscriptions.push(runCommand);
}

import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";

function runLatinScript(scriptPath: string) {
  const outputChannel = vscode.window.createOutputChannel("Latin Script");
  outputChannel.show(true);

  try {
    // Lies den Inhalt der Datei .luw-config-path
    const configFile = path.join(process.env.USERPROFILE || "C:/Users/<Name>", ".luw-config-path");
    const appPath = fs.readFileSync(configFile, "utf-8").trim();

    // Ordner, in dem app.py liegt
    const baseDir = path.dirname(appPath);

    // Pfad zu latin.exe im selben Ordner
    const latinExe = path.join(baseDir, "latin.exe");

    execFile(latinExe, ["--script", scriptPath], (error, stdout, stderr) => {
      if (stdout) outputChannel.append(stdout);
      if (stderr) outputChannel.appendLine("[error] " + stderr);
      if (error) outputChannel.appendLine("[exec error] " + error.message);
    });
  } catch (err: any) {
    outputChannel.appendLine("[config error] " + err.message);
  }
}

export function deactivate() {}
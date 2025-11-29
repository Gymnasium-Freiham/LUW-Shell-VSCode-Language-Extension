import * as vscode from 'vscode';
import { spawn } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  const provider = new LatinDebugConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider('latin', provider)
  );
}

class LatinDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration
  ): vscode.DebugConfiguration | null {
    if (!config.program) {
      vscode.window.showErrorMessage("No script specified");
      return null; // verhindert Start
    }

    const outputChannel = vscode.window.createOutputChannel("Latin Script");
    const proc = spawn('latin', ['--script', config.program]);

    proc.stdout.on('data', (data: Buffer) => {
      outputChannel.append(data.toString());
    });

    proc.stderr.on('data', (data: Buffer) => {
      outputChannel.appendLine("[error] " + data.toString());
    });

    proc.on('exit', (code: number | null) => {
      outputChannel.appendLine(`\nLatin script exited with code ${code}`);
      outputChannel.show(true);
    });

    // Wir geben null zurück, damit VS Code keinen echten Debugger erwartet
    return null;
  }
}

export function runLatinScript(scriptPath: string) {
  const outputChannel = vscode.window.createOutputChannel("Latin Script");

  const proc = spawn('latin', ['--script', scriptPath]);

  proc.stdout.on('data', (data: Buffer) => {
    outputChannel.append(data.toString());
  });

  proc.stderr.on('data', (data: Buffer) => {
    outputChannel.appendLine("[error] " + data.toString());
  });

  proc.on('exit', (code: number | null) => {
    outputChannel.appendLine(`\nLatin script exited with code ${code}`);
    outputChannel.show(true); // öffnet automatisch das Output-Fenster
  });
}
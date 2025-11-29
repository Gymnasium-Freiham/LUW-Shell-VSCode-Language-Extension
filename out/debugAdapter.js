"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.runLatinScript = runLatinScript;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
function activate(context) {
    const provider = new LatinDebugConfigurationProvider();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('latin', provider));
}
class LatinDebugConfigurationProvider {
    resolveDebugConfiguration(folder, config) {
        if (!config.program) {
            vscode.window.showErrorMessage("No script specified");
            return null; // verhindert Start
        }
        const outputChannel = vscode.window.createOutputChannel("Latin Script");
        const proc = (0, child_process_1.spawn)('latin', ['--script', config.program]);
        proc.stdout.on('data', (data) => {
            outputChannel.append(data.toString());
        });
        proc.stderr.on('data', (data) => {
            outputChannel.appendLine("[error] " + data.toString());
        });
        proc.on('exit', (code) => {
            outputChannel.appendLine(`\nLatin script exited with code ${code}`);
            outputChannel.show(true);
        });
        // Wir geben null zurück, damit VS Code keinen echten Debugger erwartet
        return null;
    }
}
function runLatinScript(scriptPath) {
    const outputChannel = vscode.window.createOutputChannel("Latin Script");
    const proc = (0, child_process_1.spawn)('latin', ['--script', scriptPath]);
    proc.stdout.on('data', (data) => {
        outputChannel.append(data.toString());
    });
    proc.stderr.on('data', (data) => {
        outputChannel.appendLine("[error] " + data.toString());
    });
    proc.on('exit', (code) => {
        outputChannel.appendLine(`\nLatin script exited with code ${code}`);
        outputChannel.show(true); // öffnet automatisch das Output-Fenster
    });
}

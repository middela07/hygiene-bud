import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting test suite');

    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('your.extension.id');
        assert.ok(extension);
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('your.extension.id');
        await extension?.activate();
        assert.ok(extension?.isActive);
    });

    // Test your command
    test('Command should execute successfully', async () => {
        // Replace with your actual command ID
        const commandId = 'your.command.id';
       
        // Simulate command execution
        await vscode.commands.executeCommand(commandId);
       
        // Add assertions based on what your command should do
        // For example, if it creates a file:
        const fileUri = vscode.Uri.file(path.join(__dirname, 'test.txt'));
        const fileExists = await vscode.workspace.fs.stat(fileUri)
            .then(() => true)
            .catch(() => false);
        assert.ok(fileExists);
    });

    // Test workspace changes
    test('Workspace edit should work', async () => {
        const document = await vscode.workspace.openTextDocument({
            content: 'Hello World',
            language: 'plaintext'
        });

        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, new vscode.Position(0, 5), ' VS Code');
       
        const success = await vscode.workspace.applyEdit(edit);
        assert.ok(success);
        assert.strictEqual(document.getText(), 'Hello VS Code World');
    });
});
const vscode = require('vscode');
const path = require('path');
const axios = require('axios'); // For API requests

let userStyleGuide = "";  // Variable to store the user-provided style guide

function activate(context) {
    console.log('Activating Hygiene Buddy extension'); // Debug log

    // Register the command to show the floating buddy
    const showBuddyCommand = vscode.commands.registerCommand('hygienebuddy.showBuddy', () => { // Updated command name
        // Create a webview panel
        const panel = vscode.window.createWebviewPanel(
            'floatingBuddy',
            'Hygiene Buddy',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        // Set the HTML content of the webview
        panel.webview.html = getBuddyWebviewContent(panel.webview, context.extensionPath);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'saveStyleGuide') {
                userStyleGuide = message.styleGuide;  // Save the style guide in memory
                vscode.window.showInformationMessage('Style guide updated!');
            }
        });

        // Listen to text document changes to analyze code in real-time
        const subscription = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor.document) {
                const codeSnippet = event.document.getText();
                analyzeCode(panel.webview, codeSnippet);
            }
        });

        // Clean up event listeners when the panel is closed
        panel.onDidDispose(() => {
            subscription.dispose();
        });
    });

    context.subscriptions.push(showBuddyCommand);
}

// Function to generate the HTML content for the floating buddy
function getBuddyWebviewContent(webview, extensionPath) {
    const buddyImageUri = webview.asWebviewUri(vscode.Uri.file(
        path.join(extensionPath, 'media', 'buddy.png')
    ));

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Floating Buddy</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: rgba(255, 255, 255, 0);
                overflow: hidden;
                font-family: Arial, sans-serif;
            }
            #buddy {
                width: 100px;
                height: auto;
                position: absolute;
                cursor: move;
                top: 20px;
                left: 20px;
            }
            #styleGuideInput {
                width: 90%;
                height: 100px;
                margin-top: 20px;
                font-family: Arial, sans-serif;
            }
            #saveButton {
                margin-top: 10px;
                padding: 5px 10px;
            }
            #feedback {
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <img id="buddy" src="${buddyImageUri}" alt="Hygiene Buddy" />
        <textarea id="styleGuideInput" placeholder="Enter your style guide here..."></textarea>
        <button id="saveButton">Save Style Guide</button>
        <div id="feedback"></div>

        <script>
            const vscode = acquireVsCodeApi();
            const buddy = document.getElementById('buddy');
            let offsetX, offsetY;

            // Dragging functionality for buddy image
            buddy.addEventListener('mousedown', (e) => {
                offsetX = e.clientX - buddy.offsetLeft;
                offsetY = e.clientY - buddy.offsetTop;
                document.addEventListener('mousemove', moveBuddy);
                document.addEventListener('mouseup', stopMovingBuddy);
            });

            function moveBuddy(e) {
                buddy.style.left = (e.clientX - offsetX) + 'px';
                buddy.style.top = (e.clientY - offsetY) + 'px';
            }

            function stopMovingBuddy() {
                document.removeEventListener('mousemove', moveBuddy);
                document.removeEventListener('mouseup', stopMovingBuddy);
            }

            // Handle style guide saving
            document.getElementById('saveButton').addEventListener('click', () => {
                const styleGuide = document.getElementById('styleGuideInput').value;
                vscode.postMessage({ command: 'saveStyleGuide', styleGuide });
            });

            // Display feedback from the extension
            window.addEventListener('message', event => {
                document.getElementById('feedback').innerHTML = event.data.feedback || '';
            });
        </script>
    </body>
    </html>`;
}

// Function to analyze code using the Google API
async function analyzeCode(webview, codeSnippet) {
    const apiKey = vscode.workspace.getConfiguration("hygienebuddy").get("googleApiKey");

    if (!apiKey) {
        console.error("Google API key is missing. Set it in the extension settings.");
        webview.postMessage({ feedback: "Google API key is missing. Please set it in the extension settings." });
        return;
    }

    try {
        const prompt = `Analyze this code:\n${codeSnippet}\n\nBased on the following style guide:\n${userStyleGuide}\nProvide suggestions for improvement.`;
        const response = await axios.post('https://api.generativeai.com/generate', {
            prompt: prompt,
            model: "gemini-1.5-flash"
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        // Send feedback to the webview
        const feedback = response.data.text || "No suggestions.";
        webview.postMessage({ feedback });
    } catch (error) {
        console.error('Error analyzing code:', error);
        webview.postMessage({ feedback: "Error analyzing code. Please check the console for details." });
    }
}

exports.activate = activate;

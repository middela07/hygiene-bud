const vscode = require('vscode');
const path = require('path');
const axios = require('axios'); // For API requests

let userStyleGuide = "";  // Variable to store the user-provided style guide

function activate(context) {
    console.log('Activating Hygiene Buddy extension'); // Debug log

    // Register the command to show the floating buddy
    const showBuddyCommand = vscode.commands.registerCommand('hygienebuddyWorks.showBuddy', () => {
        vscode.window.showInformationMessage('Hygiene Buddy command Executed!');
        const panel = vscode.window.createWebviewPanel(
            'floatingBuddy',
            'Hygiene Buddy',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        panel.webview.html = getBuddyWebviewContent(panel.webview, context.extensionPath);

        // Listen for messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            console.log("Received message from webview:", message); // Log incoming messages

            if (message.command === 'saveStyleGuide') {
                userStyleGuide = message.styleGuide;  // Save the style guide in memory
                console.log("Style guide updated:", userStyleGuide); // Log updated style guide
                vscode.window.showInformationMessage('Style guide updated!');
            }
        });

        // Add debounce logic here
        let debounceTimer;

        const subscription = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor.document) {
                clearTimeout(debounceTimer); // Clear previous timer
                debounceTimer = setTimeout(() => {
                    const codeSnippet = event.document.getText();
                    console.log("Document changed, analyzing code snippet:", codeSnippet); // Log document changes
                    analyzeCode(panel.webview, codeSnippet); // Analyze the code snippet after delay
                }, 1000); // Delay of 1000ms (1 second)
            }
        });

        panel.onDidDispose(() => {
            subscription.dispose(); // Clean up on panel close
        });
    });

    context.subscriptions.push(showBuddyCommand);
}

// Function to analyze code using the API
async function analyzeCode(webview, codeSnippet) {
    const apiKey = "AIzaSyCWn7bbb7-vIeyfILE9oVaRRWhVGhpF_RM"; // Replace with your actual API key

    if (!apiKey) {
        console.error("Google API key is missing. Set it in the extension settings.");
        webview.postMessage({ feedback: "Google API key is missing. Please set it in the extension settings." });
        return;
    }

    try {
        const prompt = `Act like a friendly, cute Code Hygiene assistant. Analyze this code:\n${codeSnippet}\n\nBased on the following style guide:\n${userStyleGuide}\n\nGive simple one-line suggestions that give the line number of the code style error and how to fix it.`;

        console.log("Sending prompt to API:", prompt); // Log the prompt sent to the API

        const response = await axios.post('https://api.generativeai.com/generate', {
            prompt: prompt,
            model: "gemini-1.5-flash"
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        console.log("Received response from API:", response.data); // Log the API response

        const formattedFeedback = response.data.text || "No feedback available.";
        console.log("Formatted feedback:", formattedFeedback); // Log formatted feedback

        webview.postMessage({ feedback: formattedFeedback });
        
    } catch (error) {
        console.error("Error analyzing code:", error); // Log any errors
        webview.postMessage({ feedback: "Error analyzing code. Please check the console for details." });
    }
}

// Function to generate the HTML content for the floating buddy
function getBuddyWebviewContent(webview, extensionPath) {
    const buddyImagePath = path.join(extensionPath, 'media', 'buddy.png');
    const buddyImageUri = webview.asWebviewUri(vscode.Uri.file(buddyImagePath));

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
            #container {
                position: fixed; /* Keep it fixed on the screen */
                bottom: 20px;
                right: 20px;
                z-index: 1000; /* Ensure it appears above other elements */
            }
            #buddy {
                width: 150px; /* Increased width */
                height: auto; /* Maintain aspect ratio */
                cursor: move;
            }
            #suggestionsBox, #apiResponseBox {
                width: 200px; /* Fixed width */
                height: auto; /* Auto height based on content */
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 10px;
                display: none; /* Initially hidden */
            }
            #suggestionsBox {
                background-color: #f4f4f4;
            }
            #apiResponseBox {
                background-color: #e0f7fa;
                border-color: #00796b;
            }
            #styleGuideContainer {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                width: 300px;
                background-color: #fff;
                border: 1px solid #ccc;
                border-radius: 10px;
                padding: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            #styleGuideInput {
                width: 100%;
                height: 100px;
                font-family: Arial, sans-serif;
                resize: none;
            }
            #saveButton {
                margin-top: 10px;
                padding: 5px 10px;
            }
        </style>
    </head>
    <body>
        <div id="container">
            <img id="buddy" src="${buddyImageUri}" alt="Hygiene Buddy" />
            <textarea id="suggestionsBox" placeholder="Suggestions based on code analysis will appear here..." readonly></textarea>
            <textarea id="apiResponseBox" placeholder="API response will appear here..." readonly></textarea>
        </div>

        <div id="styleGuideContainer">
            <textarea id="styleGuideInput" placeholder="Enter your style guide here..."></textarea>
            <button id="saveButton">Save Style Guide</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const buddy = document.getElementById('buddy');
            const suggestionsBox = document.getElementById('suggestionsBox');
            const apiResponseBox = document.getElementById('apiResponseBox');
            const styleGuideInput = document.getElementById('styleGuideInput');
            let offsetX, offsetY;

            buddy.addEventListener('mousedown', (e) => {
                offsetX = e.clientX - buddy.offsetLeft;
                offsetY = e.clientY - buddy.offsetTop;
                document.addEventListener('mousemove', moveBuddy);
                document.addEventListener('mouseup', stopMovingBuddy);
            });

            function moveBuddy(e) {
                buddy.style.left = (e.clientX - offsetX) + 'px';
                buddy.style.top = (e.clientY - offsetY) + 'px';
                suggestionsBox.style.left = (e.clientX - offsetX) + 'px'; // Adjust suggestions box position
                suggestionsBox.style.top = (e.clientY - offsetY - 100) + 'px'; // Adjust suggestions box position
            }

            function stopMovingBuddy() {
                document.removeEventListener('mousemove', moveBuddy);
                document.removeEventListener('mouseup', stopMovingBuddy);
            }

            document.getElementById('saveButton').addEventListener('click', () => {
                const styleGuide = styleGuideInput.value;
                console.log("Saving style guide from webview:", styleGuide); // Log saved style guide from webview
                vscode.postMessage({ command: 'saveStyleGuide', styleGuide });
                styleGuideInput.value = "";  // Clear style guide input
                styleGuideInput.placeholder = "Style guide saved. You can edit it anytime.";
            });

            window.addEventListener('message', event => {
                const message = event.data;
                console.log("Received message in webview:", message); // Log message received in webview

                if (message.feedback) {
                    suggestionsBox.value = "Suggestions: " + message.feedback; // Update suggestions box with feedback
                    suggestionsBox.style.display = 'block';

                    apiResponseBox.value = "API Response: " + message.feedback; // Show the raw API response in the new box
                    apiResponseBox.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>`;
}

// This is the method to deactivate the extension, if needed
function deactivate() {}

module.exports = {
    activate,
    deactivate
};

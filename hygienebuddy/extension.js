const vscode = require('vscode');
const path = require('path');

function activate(context) {
    // Register the command to show the floating buddy
    context.subscriptions.push(
        vscode.commands.registerCommand('hygiene-buddy.showBuddy', () => {
            // Create a webview panel
            const panel = vscode.window.createWebviewPanel(
                'floatingBuddy',   // Internal ID
                'Hygiene Buddy',    // Title shown to users
                vscode.ViewColumn.Two, // Open beside the code
                {
                    enableScripts: true,       // Enable JavaScript
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))] // Allow access to media folder
                }
            );

            // Set the HTML content of the webview
            panel.webview.html = getBuddyWebviewContent(panel.webview, context.extensionPath);

            // Optional: Make it less obtrusive by setting size or transparency if needed.
            panel.webview.options = { retainContextWhenHidden: true };
        })
    );
}

function getBuddyWebviewContent(webview, extensionPath) {
    // Get the URI to load the image
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
                background-color: rgba(255, 255, 255, 0); /* Transparent background */
                overflow: hidden;
            }
            #buddy {
                width: 100px; /* Adjust size as needed */
                height: auto;
                position: absolute;
                cursor: move;
                top: 20px;
                left: 20px;
            }
        </style>
    </head>
    <body>
        <img id="buddy" src="${buddyImageUri}" alt="Hygiene Buddy" />
        
        <script>
            // JavaScript to make the buddy draggable
            const buddy = document.getElementById('buddy');
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
            }

            function stopMovingBuddy() {
                document.removeEventListener('mousemove', moveBuddy);
                document.removeEventListener('mouseup', stopMovingBuddy);
            }
        </script>
    </body>
    </html>`;
}

exports.activate = activate;

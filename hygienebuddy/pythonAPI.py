import google.generativeai as genai
import os

# Configure the generative AI client with your API key
genai.configure(api_key=os.environ["API_KEY"])

# Initialize the generative model
model = genai.GenerativeModel("gemini-1.5-flash")

# Prompt the user for their coding style guide input directly
print("Please paste your coding style guide below. Enter '-done' to finish:")
style_guide = ""
while True:
    line = input()
    if line == "-done":
        break
    style_guide += line + "\n"

print("\nYour style guide has been stored successfully!")
# Create a loop for code snippet analysis
while True:
    print("Enter the code you want analyzed. Enter '-done' to finish:")
    code_snippet = ""
    
    while True:
        line = input()
        if line == "-done":
            break
        code_snippet += line + "\n"

    # Check if the code snippet is not empty before calling the model
    if code_snippet:
        prompt = (
            f"Act like a friendly, cute Code Hygiene assistant. Analyze this code:\n"
            f"{code_snippet}\n\nBased on the following style guide:\n"
            f"{style_guide}\n\nGive simple one-line suggestions that give the line number of the code style error and how to fix it"
        )
        response = model.generate_content(prompt)
        print("\nGenerated Feedback:")
        print(response.text)
    else:
        print("Error: The code snippet cannot be empty. Please provide valid input.")

    # Ask the user if they want to analyze another code snippet
    continue_prompt = input("\nDo you want to analyze another code snippet? (yes/no): ").strip().lower()
    if continue_prompt != 'yes':
        print("Exiting the program. Goodbye!")
        break
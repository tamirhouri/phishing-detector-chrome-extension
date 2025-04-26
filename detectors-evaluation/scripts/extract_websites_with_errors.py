import json

# Path to the JSON file
file_path = "../generated/results.json"

# Load the JSON data
with open(file_path, "r") as file:
    data = json.load(file)

# Extract websites with an error property
websites_with_errors = [entry["rec_id"] for entry in data if "error" in entry]

# Print the results
print("Websites with errors:")
# for website in websites_with_errors:
print(websites_with_errors)
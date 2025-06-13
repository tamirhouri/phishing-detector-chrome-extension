import json

# Path to the JSON file
file_path = "../generated/results_with_rec_id.json"
output_file_path = "../generated/websites_with_errors.json" 

# Load the JSON data
with open(file_path, "r") as file:
    data = json.load(file)

# Extract websites with an error property
websites_with_errors = [entry["rec_id"] for entry in data if "error" in entry]

# Print the results
print("Websites with errors:")
# for website in websites_with_errors:
print(websites_with_errors)

with open(output_file_path, "w") as output_file:
    json.dump(websites_with_errors, output_file, indent=4)
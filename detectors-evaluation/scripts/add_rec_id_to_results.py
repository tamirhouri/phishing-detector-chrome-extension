import csv
import json

# Paths to the files
json_file_path = "detectors-evaluation/generated/results.json"
csv_file_path = "detectors-evaluation/data/index.csv"
output_file_path = "detectors-evaluation/generated/results_with_rec_id.json"

# Load the JSON data
with open(json_file_path, "r") as json_file:
    json_data = json.load(json_file)

# Load the CSV data
csv_data = {}
with open(csv_file_path, "r") as csv_file:
    reader = csv.DictReader(csv_file)
    for row in reader:
        csv_data[row["website"]] = row["rec_id"]

# Add rec_id to JSON records
for record in json_data:
    if "website" in record and record["website"] in csv_data:
        record["rec_id"] = csv_data[record["website"]]

# Write the updated JSON data to a new file
with open(output_file_path, "w") as output_file:
    json.dump(json_data, output_file, indent=4)

print(f"Updated JSON data written to {output_file_path}")
# Bold font and white color for the console.
Color_Off='\033[0m
BWhite=\033[1;37m

# Generate tags for a release automatically.
# Update the tag.py file before running this script.
tags:
	@echo "$(BWhite)- Generating Git tags ...$(Color_Off)"
	@python3 scripts/tag.py >> tags.log


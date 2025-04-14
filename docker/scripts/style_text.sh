#!/bin/bash

# Color name to code mapping
# Using function-based approach for macOS compatibility
function color_code() {
  case "$1" in
  "black") echo "30" ;;
  "red") echo "31" ;;
  "green") echo "32" ;;
  "yellow") echo "33" ;;
  "blue") echo "34" ;;
  "magenta") echo "35" ;;
  "cyan") echo "36" ;;
  "white") echo "37" ;;
  "gray") echo "90" ;;
  *) echo "" ;;
  esac
}

# Get available colors
function available_colors() {
  echo "black red green yellow blue magenta cyan white gray"
}

# Modifiers
BOLD=1
ITALIC=3
UNDERLINE=4
REVERSE=7
STRIKETHROUGH=9

styleText() {
  local MODIFIERS=""
  while [[ $# -gt 0 ]]; do
    if [[ "$1" != -* ]]; then
      break
    fi
    case "$1" in
    -b | --bold)
      MODIFIERS="${MODIFIERS};$BOLD"
      shift
      ;;
    -i | --italic)
      MODIFIERS="${MODIFIERS};$ITALIC"
      shift
      ;;
    -u | --underline)
      MODIFIERS="${MODIFIERS};$UNDERLINE"
      shift
      ;;
    -s | --strikethrough)
      MODIFIERS="${MODIFIERS};$STRIKETHROUGH"
      shift
      ;;
    -r | --reverse)
      MODIFIERS="${MODIFIERS};$REVERSE"
      shift
      ;;
    -c | --color)
      local COLOR_CODE=$(color_code "$2")
      if [[ -n "$2" && -n "$COLOR_CODE" ]]; then
        MODIFIERS="${MODIFIERS};$COLOR_CODE"
        shift 2
      else
        echo "Invalid color name: $2"
        echo "Available colors: $(available_colors)"
        return 1
      fi
      ;;
    --)
      shift
      break
      ;;
    *)
      echo
      echo
      echo "Unknown option: $0 '$(printCyan -i -- "$1")'"
      local help=""
      help+="Usage: styleText [OPTIONS] TEXT\n"
      help+="Options:\n"
      printf "$help"
      {
        echo "  -b, --bold|Bold text"
        echo "  -i, --italic|Italic text"
        echo "  -u, --underline|Underline text"
        echo "  -s, --strikethrough|Strikethrough text"
        echo "  -r, --reverse|Reverse colors"
        echo "  -c, --color|Text color name ($(available_colors))"
      } | column -t -s '|'
      exit 1
      ;;
    esac
  done
  local ANSI_ESCAPE=$(printf "\033[${MODIFIERS}m")
  local ANSI_END=$(printf "\033[m")
  printf "$ANSI_ESCAPE%s$ANSI_END" "$@"
}

printWhite() {
  styleText -c white "$@"
}

printCyan() {
  styleText -c cyan "$@"
}

printMagenta() {
  styleText -c magenta "$@"
}

printBlue() {
  styleText -c blue "$@"
}

printYellow() {
  styleText -c yellow "$@"
}

printGreen() {
  styleText -c green "$@"
}

printRed() {
  styleText -c red "$@"
}

printGray() {
  styleText -c gray "$@"
}

printInfo() {
  printf -- "[ $(printBlue "INFO") ] $@\n"
}

printWarn() {
  printf -- "[ $(printYellow "WARN") ] $@\n"
}

printError() {
  printf -- "[ $(printRed "ERROR") ] $@\n"
}

printCommand() {
  printf -- "$(printGreen -b "$") $@\n"
}

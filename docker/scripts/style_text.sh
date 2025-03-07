#!/bin/bash

# Color name to code mapping
declare -A COLORS=(
  [black]=30
  [red]=31
  [green]=32
  [yellow]=33
  [blue]=34
  [magenta]=35
  [cyan]=36
  [white]=37
  [gray]=90
)

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
      if [[ -n "$2" && -n "${COLORS[$2]}" ]]; then
        MODIFIERS="${MODIFIERS};${COLORS[$2]}"
        shift 2
      else
        echo "Invalid color name: $2"
        echo "Available colors: ${!COLORS[@]}"
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
        echo "  -c, --color|Text color name (${!COLORS[@]})"
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

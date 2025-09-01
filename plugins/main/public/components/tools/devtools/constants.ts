export const CONSOLE_CONTAINER = {
  padding: 8,
};

export class DEV_TOOLS_BUTTONS {
  static ID = 'wz-dev-tools-buttons';
  static PLAY_BUTTON_ID = `${DEV_TOOLS_BUTTONS.ID}--send-request`;
  static DOCS_BUTTON_ID = `${DEV_TOOLS_BUTTONS.ID}--go-to-api-reference`;
}

export class EDITOR_MIRRORS {
  static ID = 'wz-dev-tools-editor';
  static SEPARATOR_ID = `${EDITOR_MIRRORS.ID}--separator`;
  static INPUT_ID = `${EDITOR_MIRRORS.ID}--input`;
  static OUTPUT_ID = `${EDITOR_MIRRORS.ID}--output`;
  static RIGHT_COLUMN_ID = `${EDITOR_MIRRORS.ID}--right-column`;
  static LEFT_COLUMN_ID = `${EDITOR_MIRRORS.ID}--left-column`;
}

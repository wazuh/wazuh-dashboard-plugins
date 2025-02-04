import React, { useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';

interface XMLEditorProps {
  data: any;
  onChange?: (value: string) => void;
}

export const XMLEditor: React.FC<XMLEditorProps> = ({ data, onChange }) => {
  const [xmlContent, setXmlContent] = useState('');

  const jsonToXml = (obj: any, indent = 0) => {
    const spaces = ' '.repeat(indent);
    let xml = '';

    for (const prop in obj) {
      if (Array.isArray(obj[prop])) {
        for (const item of obj[prop]) {
          xml += `${spaces}<${prop}>${
            typeof item === 'object'
              ? '\n' + jsonToXml(item, indent + 2) + spaces
              : item
          }</${prop}>\n`;
        }
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        xml += `${spaces}<${prop}>\n${jsonToXml(
          obj[prop],
          indent + 2,
        )}${spaces}</${prop}>\n`;
      } else {
        xml += `${spaces}<${prop}>${obj[prop]}</${prop}>\n`;
      }
    }

    return xml;
  };

  useEffect(() => {
    const xmlData = `${jsonToXml(data)}`;

    setXmlContent(xmlData);
  }, [data]);

  const handleEditorChange = (value: string) => {
    setXmlContent(value);
    onChange?.(value);
  };

  return (
    <MonacoEditor
      language='xml'
      value={xmlContent}
      onChange={handleEditorChange}
      lineNumbers='on'
      roundedSelection={false}
      scrollBeyondLastLine={false}
      readOnly={false}
      theme='vs'
      height='70vh'
    />
  );
};

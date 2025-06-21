import React, { useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import yaml from 'js-yaml';

interface YAMLEditorProps {
  data: any;
  onChange?: (value: string) => void;
}

export const YAMLEditor: React.FC<YAMLEditorProps> = ({ data, onChange }) => {
  const [yamlContent, setYamlContent] = useState('');

  useEffect(() => {
    if (typeof data === 'string') {
      return setYamlContent(data);
    }

    const yamlData = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });

    setYamlContent(yamlData);
  }, [data]);

  const handleEditorChange = (value: string) => {
    setYamlContent(value);
    onChange?.(value);
  };

  return (
    <MonacoEditor
      language='yaml'
      value={yamlContent}
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

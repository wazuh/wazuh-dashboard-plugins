export interface MetadataSchema {
  enable: boolean;
  name: string;
  metadata: {
    module: string;
    title: string;
    description: string;
    compatibility: string;
    versions: string[];
    author: {
      name: string;
      date: string;
      email?: string;
    };
    references: string[];
  };
  check?: string | Record<string, string>[];
  normalize?: {
    map: Record<string, string>[];
    check?: string | Record<string, string>[];
    parse?: string | string[];
  }[];
  parse?: string | string[];
  definitions?: string | string[];
  allow?: string;
  outputs?: string;
}

export const metadataInitialValues: MetadataSchema = {
  enable: false,
  name: '',
  metadata: {
    module: '',
    title: '',
    description: '',
    compatibility: '',
    versions: [''],
    author: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      email: '',
    },
    references: [''],
  },
  check: '',
  normalize: [],
  definitions: '',
  allow: '',
  outputs: '',
};

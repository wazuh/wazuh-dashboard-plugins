export interface MetadataSchema {
  enable: boolean;
  name: string;
  status: string;
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
  status: '',
  metadata: {
    module: '',
    title: '',
    description: '',
    compatibility: '',
    versions: [],
    author: {
      name: '',
      date: '',
      email: '',
    },
    references: [],
  },
  check: '',
  parse: '',
  normalize: [],
  definitions: '',
  allow: '',
  outputs: '',
};

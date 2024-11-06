export type RecordMock<T> = {
  [K in keyof T]: T[K] extends Function
    ? jest.Mock
    : T[K] extends {}
    ? RecordMock<T[K]>
    : T[K];
};
export type DeepPartialRecordMock<T> = Partial<{
  [K in keyof T]: T[K] extends Function
    ? jest.Mock
    : T[K] extends Date
    ? T[K]
    : T[K] extends {}
    ? DeepPartialRecordMock<T[K]>
    : T[K];
}>;

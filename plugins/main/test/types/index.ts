export type RecordMock<T> = {
  [K in keyof T]: T[K] extends Function ? jest.Mock : T[K] extends {} ? RecordMock<T[K]> : T[K];
};
export type PartialRecordMock<T> = Partial<
  {
    [K in keyof T]: T[K] extends Function
      ? jest.Mock
      : T[K] extends {}
      ? PartialRecordMock<T[K]>
      : T[K];
  }
>;

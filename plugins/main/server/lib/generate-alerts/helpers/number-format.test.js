const { NumberFormatter } = require('./number-formatter');

describe('NumberFormatter', () => {
  it('should_return_number_without_padding_by_default', () => {
    expect(NumberFormatter.pads(1)).toEqual('1');
  });
  it('should_not_add_padding_when_single_digit', () => {
    expect(NumberFormatter.pads(1, 1)).toEqual('1');
  });
  it('should_pad_number_with_zeros', () => {
    expect(NumberFormatter.pads(1, 2)).toEqual('01');
  });
  it('should_pad_number_with_specified_number_of_zeros', () => {
    expect(NumberFormatter.pads(1, 5)).toEqual('00001');
  });
  it('should_throw_range_error_for_invalid_count_value', () => {
    expect(() => { NumberFormatter.pads(1, -1) }).toThrow('Invalid count value');
  });
});

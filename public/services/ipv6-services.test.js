import { compressIPv6 } from "./ipv6-services";

describe('[settings] Input validation', () => {
  it.each`
    value                                               | expectedValidation
    ${'192.168.100.1'}                                  | ${'192.168.100.1'}
    ${'FE80:1234:2223:A000:2202:B3FF:FE1E:8329'}        | ${'FE80:1234:2223:A000:2202:B3FF:FE1E:8329'}
    ${'FE80:0034:0223:A000:0002:B3FF:0000:8329'}        | ${'FE80:34:223:A000:2:B3FF:0:8329'}  
    ${'FE80:1234:2223:0000:0000:B3FF:FE1E:8329'}        | ${'FE80:1234:2223::B3FF:FE1E:8329'}
    ${'FE80:0000:0000:A000:0000:0000:0000:8329'}        | ${'FE80:0:0:A000::8329'}
    ${'FE80:0000:0000:0000:2202:00FF:0E1E:8329'}        | ${'FE80::2202:FF:E1E:8329'}
    ${'0000:0000:0000:0000:2202:00FF:0E1E:8329'}        | ${'::2202:FF:E1E:8329'}
    ${'2202:00FF:0E1E:8329:2202:0000:0000:0000'}        | ${'2202:FF:E1E:8329:2202::'}
    ${'0000:0000:0000:0000:0000:0000:0000:0000'}        | ${'::'}
    ${undefined}                                        | ${undefined}
    ${234}                                              | ${234}
    `('$value | $expectedValidation', ({ value, expectedValidation }) => {
    expect(
      compressIPv6(value)).toBe(expectedValidation);
  });
});

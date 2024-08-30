/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const httpClientMock = jest.fn();

httpClientMock.delete = jest.fn(() => ({
  then: jest.fn(() => ({
    catch: jest.fn(),
  })),
}));
httpClientMock.get = jest.fn(() => ({
  then: jest.fn(() => ({
    then: jest.fn(() => ({
      catch: jest.fn()
    })),
    catch: jest.fn(),
  })),
  catch: jest.fn(() => ({
    then: jest.fn(() => ({
      catch: jest.fn()
    })),
    catch: jest.fn(),
  })),
}));
httpClientMock.head = jest.fn();
httpClientMock.post = jest.fn(() => ({
  then: jest.fn(() => ({
    catch: jest.fn(),
  })),
}));
httpClientMock.put = jest.fn(() => ({
  then: jest.fn(() => ({
    catch: jest.fn(),
  })),
}));

export default httpClientMock;

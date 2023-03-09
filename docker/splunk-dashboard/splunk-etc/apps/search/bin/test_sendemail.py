import unittest
import sys
from sendemail import createOrganizedResultBuffer

class TestOrganizedResultBuffer(unittest.TestCase):

    def testISO8859(self):
    	if sys.version_info >= (3, 0):
    		from io import BufferedReader, BytesIO
    		test_bytes = b'h\xe8llo'
    		reader = BufferedReader(BytesIO(test_bytes))
    		wrapped = createOrganizedResultBuffer(reader)
    		read_bytes = wrapped.read()
    		self.assertEqual(read_bytes, 'h\\xe8llo')
    	else:
    		# This test only runs on python 3
    		pass

    def testShiftJIS(self):
    	if sys.version_info >= (3, 0):
    		from io import BufferedReader, BytesIO
    		test_bytes = b'\x5c500'
    		reader = BufferedReader(BytesIO(test_bytes))
    		wrapped = createOrganizedResultBuffer(reader)
    		read_bytes = wrapped.read()
    		self.assertEqual(read_bytes, '\\500')
    	else:
    		# This test only runs on python 3
    		pass

if __name__ == '__main__':
	unittest.main()

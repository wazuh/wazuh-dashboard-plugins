# coding=utf-8

#
# streambag search operator, for generating test data in streaming manner

import os, sys, time, datetime
import splunk.util as util
import splunk.Intersplunk as isp
import logging as logger
import traceback
from builtins import range

DEFAULT_ARGS = {
    'chunks':       10,
    'chunkdelay':   0,
    'rowcount':     100,
    'multiline':    False,
    'distribution': 'flat',

    'timeformat':   1,
    'interval':     60 * 17,
    'basetime':     time.time(),
    'timeorder':    'reverse',

    'fieldcount':   0,
    'constant':     '"double quotes" \'single quotes\' \\slashes\\ `~!@#$%^&*()-_=+{}|;:<>,./? [brackets]',
    'host':         'HAL_9000',
    'source':       'SpaceOdyssey',
    'sourcetype':   'fictional',
    'punct':        '`~!@#$%^&*()-_=+\\"\'{}|;:<>,./?[]',
    
    'filler':       '',
    'utf8':         False,
    'mvfield':      ''
}

ARG_SEPARATOR = ';'

utf8Samples = [
    ('Albanian', 'Unë mund të ha qelq dhe nuk më gjen gjë.'),
    ('Arabic', 'أنا قادر على أكل الزجاج و هذا لا يؤلمني.', 'ltr'),
    ('Armenian', 'Կրնամ ապակի ուտել և ինծի անհանգիստ չըներ։'),
    ('Chinese', ' 我能吞下玻璃而不傷身體'),
    ('Danish', 'Jeg kan spise glas, det gør ikke ondt på mig.'),
    ('Euro', '€.'),
    ('French', 'Je peux manger du verre, ça ne me fait pas de mal.'),
    ('Georgian', 'მინას ვჭამ და არა მტკივა.'),
    ('Greek', 'Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα.'),
    ('Hawaiian', 'Hiki iaʻu ke ʻai i ke aniani; ʻaʻole nō lā au e ʻeha.'),
    ('Hebrew', 'אני יכול לאכול זכוכית וזה לא מזיק לי.', 'ltr'),
    ('Hindi', 'मैं काँच खा सकता हूँ और मुझे उससे कोई चोट नहीं पहुंचती.'),
    ('Hindi', 'मैं काँच खा सकता हूँ, मुझे उस से कोई पीडा नहीं होती.'),
    ('Icelandic', 'Ég  get etið gler án þess að meiða mig.'),
    ('Japanese', '私はガラスを食べられます。それは私を傷つけません'),
    ('Korean', '나는 유리를 먹을 수 있어요. 그래도 아프지 않아요'),
    ('Macedonian', 'Можам да јадам стакло, а не ме штета.'),
    ('Mongolian', 'Би шил идэй чадна, надад хортой биш'),
    ('Old Norse', 'Ek get etið gler án þess að verða sár.'),
    ('Polish', 'Mogę jeść szkło, i mi nie szkodzi.'),
    ('Romanian', 'Pot să mănânc sticlă și ea nu mă rănește.'),
    ('Serbian', 'Mogu jesti staklo a da mi ne škodi.'),
    ('Tamil', 'நான் கண்ணாடி சாப்பிடுவேன், அதனால் எனக்கு ஒரு கேடும் வராது.'),
    ('Thai', 'ฉันกินกระจกได้ แต่มันไม่ทำให้ฉันเจ็บ'),
    ('Ukrainian', 'Я можу їсти шкло, й воно мені не пошкодить.'),
    ('Ukrainian', 'Я можу їсти шкло, й воно мені не пошкодить.'),
    ('Vietnamese', 'Tôi có thể ăn thủy tinh mà không hại gì.'),
    ('Yiddish', 'איך קען עסן גלאָז און עס טוט מיר נישט װײ.', 'ltr')
]


def generateData(chunknum, **kwargs):
    
    output = []
    
    basetime = float(kwargs['basetime'])
    
    hosts = kwargs['host'].split(ARG_SEPARATOR)
    sources = kwargs['source'].split(ARG_SEPARATOR)
    sourcetypes = kwargs['sourcetype'].split(ARG_SEPARATOR)
    
    for i in range(kwargs['rowcount']):
        
        rowset = {}

        # set time
        timedir = -1
        if kwargs['timeorder'] == 'forward': timedir = 1
        timestamp = basetime + (kwargs['interval'] * (i + chunknum * kwargs['rowcount'])) * timedir
        raw = [datetime.datetime.fromtimestamp(timestamp).isoformat()]
        rowset['_time'] = timestamp
        
        # set chunk number
        raw.append('CHUNK %d' % chunknum)
        rowset['chunk'] = chunknum

        # set row number
        raw.append('POSITION %d' % i)
        rowset['position'] = i
        
        # set primary stuff
        rowset['host'] = hosts[i % len(hosts)]
        rowset['source'] = sources[i % len(sources)]
        rowset['sourcetype'] = sourcetypes[i % len(sourcetypes)]
        rowset['_cd'] = 234

        # insert unicode samples
        if kwargs['utf8']:
            if kwargs['multiline']:
                sample = []
                for j in range(i, i + 5):
                    sample.append(utf8Samples[j % (len(utf8Samples)-1)][1])
                raw.append('\n'.join(sample))
            else:
                sample = utf8Samples[i % (len(utf8Samples)-1)]
                raw.append('lang=%s sample="%s"' % (sample[0], sample[1]))
                rowset['lang'] = sample[0]
                rowset['sample'] = sample[1]
                
            # add high-bit field name
            sample = utf8Samples[i % (len(utf8Samples)-1)]
            rowset[sample[1].split(' ')[0]] = 'field value in %s' % sample[0]
             
        # set filler
        if kwargs['filler']:
            raw.append(kwargs['filler'])
        
        # gen odd fields
#        if i % 2 != 0:
#            rowset['odd'] = i
#            raw.append('odd=%s' % i)
            
        # gen constant field value
#        rowset['fancy_constant_field'] = kwargs['constant']
#        raw.append('constant=%s' % kwargs['constant'])
        
        # gen script injection test
#        rowset['<script>alert("field_name_unescaped!")</script>'] = 'field_name_exploit_test'
#        rowset['field_value_exploit_test'] = '<script>alert("field_value_unescaped!")</script>'
#        raw.append('<script>alert("raw event unescaped!")</script>')

        # set fields
#        for j in range(kwargs['fieldcount']):
#            fieldName = 'field%s' % j
#            value = (i + 2) * (j + 2)
#            rowset[fieldName] = value
#            raw.append('%s=%s' % (fieldName, value))
        
        # construct the raw item
        splitter = kwargs['multiline'] and '\n' or ' '
        rowset['_raw'] = splitter.join(raw)

        # add a multivalued field?
        if kwargs['mvfield']:
            if (i % 3 == 0):
                rowset[kwargs['mvfield']] = [str(i)]
            elif (i % 3 == 1):
                rowset[kwargs['mvfield']] = [str(i),str(i*i)]
            else:
                rowset[kwargs['mvfield']] = [str(i),str(i*i),str(i*i*i)]            
        
        # add to result set
        output.append(rowset)
        
    return output
    

#
# main
#

# merge any passed args
args = DEFAULT_ARGS
for item in sys.argv:
    kv = item.split('=')
    if len(kv) > 1:
        val = item[item.find('=') + 1:]
        try:
            val = int(val)
        except:
            pass
        args[kv[0]] = util.normalizeBoolean(val)

# run generator
try:
    for c in range(args['chunks']):
        if (c > 0 and args['chunkdelay'] > 0):
            time.sleep(args['chunkdelay'])
        results = generateData(c, **args)
        isp.outputStreamResults(results)
except:
    sys.stdout.write("FAILED: \n")
    traceback.print_exc()

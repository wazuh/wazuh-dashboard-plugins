# User Story: As an advanced search user, I want to search on values
# retrieve from other searches without difficult subsearches, thereby
# making complex searches simpler.

# look for last error and see which user caused it
results = search('error user=*', max_count=1)
print results
for result in results:
    # output sender values for that user
    y = search('sender=* user="%s"| table sender | dedup sender' % result.user)
    output(y)
    break

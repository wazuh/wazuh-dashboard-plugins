#   Version 4.0
import re,sys,os,math
from functools import cmp_to_key
import splunk.Intersplunk as si
import logging as logger

# !!! Unclear how to score directories.  benefits vs cost.
def scorePath(depth, pathinfo, neededToEliminate):
    count = pathinfo['count']
    total = pathinfo['total']
    # benefit of deleting is files removed up until we start removing too many
    fileBenefit = count
    if count > neededToEliminate:
        fileBenefit = neededToEliminate - 1000 * (count - neededToEliminate)

    # display saving vs information lost. 
    #
    # we want to remove as many files as we can, prefering those with few events        
    # reward directories that have the close to the number of files we need to remove (not more),
    # but punishing by how many events they contains.  
    gain = 10 * fileBenefit / (1.+math.log(total+1.)) + depth
    return gain

def floatSort(v1, v2):
    x = v1[1]
    y = v2[1]
    if y > x:
        return 1
    elif x > y:
        return -1
    else:
        return 0

def listDiff(list1, list2):
    count = 0
    for v in list2:
        if v in list1:
            list1.remove(v)
            count += 1
    return count

def getArgs():
        badcounts = False
        try:
            maxcount   = int(options.get('maxcount',  '20'))
            if maxcount <= 0: 
                badcounts = True
        except:
            badcounts = True
        if badcounts:
            si.generateErrorResults("Error: invalid required 'maxcount' (1-INF) setting.")
            exit()
   
        sizefield  = options.get('sizefield',  'totalCount')
        pathfield  = options.get('pathfield',  'source')
        if sizefield == None or pathfield == None:
            si.generateErrorResults("Error: both pathfield and sizefield must be specified.")
            exit()
            
        countfield = options.get('countfield', 'count')
        delimiter = options.get('sep', os.sep)
        return maxcount, sizefield, pathfield, countfield, delimiter

def isCovered(path, dirs):
    for d in dirs:
        if path.startswith(d):
            #print("already covered: %s by %s" % (path, d))
            return True
    return False

                
def getFileGroungs(results):
    try:

        maxcount, sizefield, pathfield, countfield, delimiter = getArgs()

        if len(results) <= maxcount:
            return results
        
        total = 0
        files = {}
        for result in results:
            total += int(result.get(sizefield, "0"))
            size = int(result.get(sizefield, "0"))
            path = result.get(pathfield, "")
            # FIX TRAILING DELIMITERS -- /foo/ -> /foo adding /foo/'s count to /foo
            if path!=delimiter and path.endswith(delimiter):
                path = path[:-1]
            # FIX "" PATH TO BE "/"
            if path=="":
                path = delimiter
            files[path] = size
        
        pathobjs = []
        notCovered = []
        deleted = []
        # CREATE MAP OF PATH TO ALL FILES IN IT
        dirobjs = {}
        for path, size in files.items():
            notCovered.append(path)            
            if path == delimiter:
                myparts = [delimiter]
            else:
                myparts = path.split(delimiter)
            mypath = ""
            lastpos = len(myparts)-1
            for i, val in enumerate(myparts):
                mypath += val
                ellipse = ""
                isDir = False
                if i < lastpos:
                    mypath += delimiter
                    isDir = True

                pathinfo = dirobjs.get(mypath, { 'count':0, 'total':0, 'files':set()})
                pathinfo['isDir'] = isDir
                pathinfo['count'] += 1
                pathinfo['total'] += size
                pathinfo['files'].add(path)
                dirobjs[mypath] = pathinfo


        # SCORE EACH PATH
        pathsAndScores = []
        resultcount = len(results)
        neededToEliminate = len(results) - maxcount
        
        for mypath,val in dirobjs.items():
            depth = mypath.count(delimiter) + 1
            score = scorePath(depth, val, neededToEliminate)
            pathsAndScores.append((mypath, score))
            #print("score: %s\tpath: %s " % (score, mypath))

        # SORT PATHS BY SCORE
        pathsAndScores.sort(key = cmp_to_key(floatSort))
        dirs = []
        # FOR EACH PATH, FROM BEST-TO-CUT TO WORST, CUT UNTIL FEW ENOUGH RESULTS
        for i, pathinfo in enumerate(pathsAndScores):
            if (len(notCovered) + len(dirs)) <= maxcount:
                break
            mypath  = pathinfo[0]
            myscore = pathinfo[1]
            if isCovered(mypath, dirs):
                continue
            files = dirobjs[mypath]['files']
            #print("%u %s" % (len(files), str(myscore)))
            # REMOVE FILES COVERED BY THIS PATH FROM THE SET OF PATHS WE HAVE YET TO COVER
            removedCount = listDiff(notCovered, files)
            if removedCount > 0:
                # ADD DIRECTORY TO LIST
                dirs.append(mypath)
                #print("%u %u" % (len(notCovered), len(dirs)))
            

        filesAndDirs = list(notCovered)
        filesAndDirs.extend(dirs)
        #print("MAXCOUNT %s FILESANDDIRS %s" % (maxcount, len(filesAndDirs)))
        if len(filesAndDirs) > 0:
            results = []
            for i, mypath in enumerate(filesAndDirs):
                myinfo = dirobjs[mypath]
                count = myinfo['count']
                total = myinfo['total']
                if myinfo['isDir']:
                    mypath += "*"
                results.append({ pathfield: mypath, sizefield:total, countfield:count})
        return results
            
    except Exception as e:
        import traceback
        stack =  traceback.format_exc()
        si.generateErrorResults("Error '%s'. %s" % (e, stack))
        si.generateErrorResults("Error '%s'." % e) #(e, stack))

if __name__ == '__main__':
    keywords,options = si.getKeywordsAndOptions()
    results,dummyresults,settings = si.getOrganizedResults()
    results = getFileGroungs(results)
    si.outputResults(results)


    
##         candidates = pathsAndScores
##         while neededToEliminate > 0:
##             for mypath,myscore in candidates:
##                 info = dirobjs[mypath]
##                 count = info['count']
##                 if count > neededToEliminate:
##                     candidates.append((count,mypath,myscore))
##             if len(candidates) > 0:
##                 candidates.sort(lambda x,y: cmp(x[0],y[0]))
##                 bestPath = candidates[0][1]
##                 files = dirobjs[bestPath]['files']

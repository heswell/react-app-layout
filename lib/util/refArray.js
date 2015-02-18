/** @jsx React.DOM */
"use strict";

function refArray(refs, includeSplitters){
    
    var i=0;
    var ret = [];
    var ref;

    if (!refs) return ret;

    while(ref = refs['relay-' + i]){
        ret.push(ref);
        i++;
    }

    if (includeSplitters){
        i=1;
        while(ref = refs['splitter-' + i]){
            ret.push(ref);
            i++;
        }
    }

    return ret;

}


module.exports = refArray;
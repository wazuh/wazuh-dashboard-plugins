/*
 * Wazuh app - Elasticsearch data table raw response parser
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Aggregation which starts in level 2 
 * @param {*} data_set The raw response.
 */
const parse_start_2 = data_set => {
    const tree = {};
    for (const main_bucket of data_set.aggregations['2'].buckets) {
        if (!tree[main_bucket.key]) tree[main_bucket.key] = {};
        if (main_bucket['3'] && main_bucket['3'].buckets) {
            for (const sub_bucket of main_bucket['3'].buckets) {

                if (!tree[main_bucket.key][sub_bucket.key]) tree[main_bucket.key][sub_bucket.key] = {};

                if (sub_bucket['4'] && sub_bucket['4'].buckets) {
                    for (const sub_sub_bucket of sub_bucket['4'].buckets) {

                        if (!tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key]) tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key] = {}

                        if (sub_sub_bucket['5'] && sub_sub_bucket['5'].buckets) {
                            for (const sub_sub_sub_bucket of sub_sub_bucket['5'].buckets) {

                                if (!tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key]) {
                                    tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key] = {};
                                    tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key][sub_sub_sub_bucket.doc_count] = false;
                                }
                            }

                        } else {
                            tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key] = {};
                            tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key][sub_sub_bucket.doc_count] = false;
                        }
                    }

                }

                if (sub_bucket['5'] && sub_bucket['5'].buckets) {
                    for (const sub_sub_bucket of sub_bucket['5'].buckets) {

                        if (!tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key]) {
                            tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key] = {};
                            tree[main_bucket.key][sub_bucket.key][sub_sub_bucket.key][sub_sub_bucket.doc_count] = false;
                        }
                    }
                }

                if (!(sub_bucket['4'] && sub_bucket['4'].buckets) && !(sub_bucket['5'] && sub_bucket['5'].buckets)) {
                    tree[main_bucket.key][sub_bucket.key] = {};
                    tree[main_bucket.key][sub_bucket.key][sub_bucket.doc_count] = false;
                }
            }

        } else {
            tree[main_bucket.key] = {};
            tree[main_bucket.key][main_bucket.doc_count] = false;
        }
    }
    return tree;
};

/**
 * Aggregation which starts in level 3 
 * @param {*} data_set The raw response.
 */
const parse_start_3 = data_set => {
    const tree = {};

    for (const sub_bucket of data_set.aggregations['3'].buckets) {

        if (!tree[sub_bucket.key]) tree[sub_bucket.key] = {};

        if (sub_bucket['4'] && sub_bucket['4'].buckets) {
            for (const sub_sub_bucket of sub_bucket['4'].buckets) {

                if (!tree[sub_bucket.key][sub_sub_bucket.key]) tree[sub_bucket.key][sub_sub_bucket.key] = {}

                if (sub_sub_bucket['5'] && sub_sub_bucket['5'].buckets) {
                    for (const sub_sub_sub_bucket of sub_sub_bucket['5'].buckets) {

                        if (!tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key]) {
                            tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key] = {};
                            tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key][sub_sub_sub_bucket.doc_count] = false;
                        }
                    }

                } else {
                    tree[sub_bucket.key][sub_sub_bucket.key] = {};
                    tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_bucket.doc_count] = false;
                }
            }

        }

        if (sub_bucket['5'] && sub_bucket['5'].buckets) {
            for (const sub_sub_bucket of sub_bucket['5'].buckets) {

                if (!tree[sub_bucket.key][sub_sub_bucket.key]) {
                    tree[sub_bucket.key][sub_sub_bucket.key] = {};
                    tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_bucket.doc_count] = false;
                }
            }
        }

        if (!(sub_bucket['4'] && sub_bucket['4'].buckets) && !(sub_bucket['5'] && sub_bucket['5'].buckets)) {
            tree[sub_bucket.key] = {};
            tree[sub_bucket.key][sub_bucket.doc_count] = false;
        }
    }

    return tree;   
};

/**
 * Aggregation which starts in level 3 and continues with level 2 buckets
 * @param {*} data_set The raw response.
 */
const parse_start_3_mix_2 = data_set => {
    const tree = {};

    for (const sub_bucket of data_set.aggregations['3'].buckets) {

        if (!tree[sub_bucket.key]) tree[sub_bucket.key] = {};

        if (sub_bucket['2'] && sub_bucket['2'].buckets) {
            for (const sub_sub_bucket of sub_bucket['2'].buckets) {

                if (!tree[sub_bucket.key][sub_sub_bucket.key]) tree[sub_bucket.key][sub_sub_bucket.key] = {}

                if (sub_sub_bucket['6'] && sub_sub_bucket['6'].buckets) {
                    for (const sub_sub_sub_bucket of sub_sub_bucket['6'].buckets) {

                        if (!tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key]) {
                            tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key] = {};
                            tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_sub_bucket.key][sub_sub_sub_bucket.doc_count] = false;
                        }
                    }

                } else {
                    tree[sub_bucket.key][sub_sub_bucket.key] = {};
                    tree[sub_bucket.key][sub_sub_bucket.key][sub_sub_bucket.doc_count] = false;
                }
            }

        } 
    }

    return tree;   
};

/**
 * Generates a hierarchical tree from the raw response.
 * @param {*} data_set The raw response. Must have aggregations and buckets for level 0.
 */
const generate_tree = data_set => {
    // If we have no aggregations just return empty object
    if(!data_set || !data_set.aggregations) {
        return {};
    }

    // If the aggregation from Elasticsearch starts using level 2 
    if(data_set.aggregations['2'] && data_set.aggregations['2'].buckets) {
        return parse_start_2(data_set);
    }

    // If the aggregation from Elasticsearch starts using level 3 and continues using level 2
    if(data_set.aggregations['3'] && data_set.aggregations['3'].buckets && data_set.aggregations['3'].buckets[0] && 
       data_set.aggregations['3'].buckets[0]['2'] && data_set.aggregations['3'].buckets[0]['2'].buckets) {
        return parse_start_3_mix_2(data_set);
    }

    // If the aggregation from Elasticsearch starts using level 3 
    if(data_set.aggregations['3'] && data_set.aggregations['3'].buckets) {
         return parse_start_3(data_set);
    }

    // If none of the above conditions are true, return empty object
    return {};
};

/**
 * Generates a matrix which includes each parsed row
 * @param {*} item Hierarchical tree generated from a raw response
 */
const generate_rows = item => {
    const iter = (r, p) => {
        const keys = Object.keys(r);
        if (keys.length) {
            return keys.forEach(x => iter(r[x], p.concat(x)));
        }
        result.push(p);
    };
    const result = [];
    iter(item, []);
    return result;
};

/**
 * Public function to enter the module.
 * Always returns an array (could be empty)
 * @param {*} data_set The raw response.
 */
export default (data_set, cols) => {
    try {
        const tree = generate_tree(data_set);

        const min_size = cols.length;

        // Minimum validation for the generated tree
        if(!tree || !Object.keys(tree) || !Object.keys(tree).length) return [];

        // All rows must have same length
        const rows = generate_rows(tree).filter(item => item.length === min_size);
        
        return rows;
    } catch (error) {
        return [];
    }

};
define(
	[
		'underscore'
	],
	function(
		_
	) {
		var QUESTION_MARK_ICON = { icon: '?', cls: 'dmc-question-mark' };

		var formatPercentage = function(v, useIcons) {
			if (_.isNumber(v)) {
				return v.toFixed(0) + '%'; 
			}
			return useIcons ? QUESTION_MARK_ICON : '?';
		};

		return {
			cpu_system_pct: formatPercentage,

			mem_used: formatPercentage,

			indexing_rate: function(v, useIcons) {
				if (!_.isNumber(v)) {
					return useIcons ? QUESTION_MARK_ICON : '?';
				}
				if (v < 0.5) {
					return '0';
				}
			    if (v < 1000) {
			        return v + 'K';
			    }
			    if (v < 10000) {
			        return (v / 1000).toFixed(2) + 'M';
			    }
			    return (v / 10000).toFixed(2) + 'G';
			},

			up_down_status: function(v, useIcons) {
				if (!_.isNumber(v)) {
					return useIcons ? QUESTION_MARK_ICON : '?';
				}
                if (v >= 0 && v <= 0.999) {
			        return useIcons ? { icon: '\uEC02' } : _('Down').t();
			    }
			    if (v > 0.999) {
			        return useIcons ? { icon: '\uEC01' } : _('Up').t();
			    }
			    return '';
			},

			search_concurrency: function(v, useIcons) {
				if (!_.isNumber(v)) {
					return useIcons ? QUESTION_MARK_ICON : '?';
				}
				return v.toFixed(0);
			},

			default_cpu_system_pct: formatPercentage,

			default_mem_used: formatPercentage,

			default_indexing_rate: function(v, useIcons) {
				if (!_.isNumber(v)) {
					return useIcons ? QUESTION_MARK_ICON : '?';
				}
				if (v < 0.5) {
					return '0';
				}
			    if (v < 1000) {
			        return v + 'K';
			    }
			    if (v < 10000) {
			        return (v / 1000).toFixed(2) + 'M';
			    }
			    return (v / 10000).toFixed(2) + 'G';
			},

			default_up_down_status: function(v, useIcons) {
				if (!_.isNumber(v)) {
					return useIcons ? QUESTION_MARK_ICON : '?';
				}
                if (v >= 0 && v <= 0.999) {
                    return useIcons ? { icon: '\uEC02' } : _('Down').t();
                }
                if (v > 0.999) {
                    return useIcons ? { icon: '\uEC01' } : _('Up').t();
                }
			    return '';
			},

			default_search_concurrency: function(v, useIcons) {
				if (!_.isNumber(v)) {
					return useIcons ? QUESTION_MARK_ICON : '?';
				}
				return v.toFixed(0);
			}
		};
	}
);
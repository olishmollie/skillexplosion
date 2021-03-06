define(['jquery', 'utils/GameUtils'], function($, utils) {

    return function(options) {
        $.extend(this, options);

        this.disables = {};
        this.disable = function(id) {
            var disable = function() {
                return false;
            }
            this.disables[id] = disable;
            this.enablers.push(disable);
        };
        this.enable = function(id) {
            this.enablers.splice(this.enablers.indexOf(this.disables[id]), 1);
            delete this.disables[id];
        };
    }
})

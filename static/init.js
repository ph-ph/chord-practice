require.config({
    baseUrl: 'static',
    paths: {
        jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min',
        underscore: 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',
        bootstrap: 'http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min',
        knockout: 'http://cdnjs.cloudflare.com/ajax/libs/knockout/3.1.0/knockout-min',
        domReady: 'http://cdnjs.cloudflare.com/ajax/libs/require-domReady/2.0.1/domReady'
    },
    shim: {
        bootstrap: {
            deps: ['jquery']
        }
    }
});

require(['knockout', 'base', 'bootstrap', 'domReady!'], function(ko, appViewModel) {
    ko.bindingHandlers.logger = {
        update: function(element, valueAccessor, allBindings) {
            data = ko.toJS(valueAccessor() || allBindings());

            if (window.console && console.log) {
                console.log(element, data);
            }
        }
    };

    ko.applyBindings(new appViewModel());
});

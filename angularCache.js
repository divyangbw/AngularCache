angular.module('storage.cache', []).factory('AngularCache', function AngularCache($q, $timeout) {

    var supported = isStorageSupported();

    var clearLocalStorage = function () {

    };
    
    function setDataType(type, key) {
        
        if (type === "string") {
            return localStorage.getItem(key);
        } else if (type === "int") {
            return parseInt(localStorage.getItem(key));
        } else if (type === "float") {
            return parseFloat(localStorage.getItem(key));
        } else if (type === "bool") {
            var val =  localStorage.getItem(key);
            return val === "true" ? true : false;
        } else if (type === "json") {
            return JSON.parse(localStorage.getItem(key));
        }
        
        // Make sure an error is returned
        // FIX IT
        return Error;
        
    }
    
    function saveToLocalStorage(type, key, value) {
        
        if (type === "json") {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value);
        }
        
    }

    return {


        //TODO:
        // - pass one argument
        // - finish proper promise-chaining
        
        // Sync localStorage with the servers and return a promise containing the cache.
        // The cache has two properties:
        //  1. cache.tempStorage : a return tyoe which contains the data from localStorage. This is the data you would usually want
        //      show before making servers, assuming we have that data stored in the first place.
        //  2. A second promise, which is linked to loading data from the server. This is what
        
        sync: function (input) {

            var cache = {};
            
            // Step 1
            // Run any pre-configerations the user wants
            input.onStart();
            
            // Step 2
            // Set the data type
            cache.tempStorage = setDataType(input.dataType, input.key);
            
            // Step 3
            // Defer the result and return a promise to make things async
            var deferred = $q.defer();
            $timeout(function () {
                
                
                // This means there was data already in the cache. There is basically two things we want to accomplish
                // 1. Assuming there is already data in the cache, load that. However, we should keep in mind the server 
                // might have updated data.
                // 2. There is nothing in localStorage. Therefore, we will need to do a complete load of the server. At this point,
                // we have no idea how the data is being loaded from the server, therefore, the user will be resposible for loading
                // from the server.
                // In either case, we will still make a server call. The only difference is, at this point in time, cache.tempStorage
                // is no longer empty (or is), and lets the user set the data of their view to cache.tempStorage
                
                // Create a second promise. Again, we have no idea how getData works, just that the user is
                // responsible for any form of animations, or loading pre-runs. 
                var secondDeffer = asyncGetFromServer(input.timeout, input.getData);
                secondDeffer.then(function (dataFromServer) {
                    // First save that data to localStorage
                    saveToLocalStorage(input.dataType , input.key, dataFromServer)
                    // Next bit, which still might not work, allow the user to make an onSyncComplete call. 
                    // This allows the user to performs certain actions such as hide animation or resync the data shown.
                    input.onSyncComplete(dataFromServer);
                }, function (reason) {
                    // However, something might have happened, i.e internet failure and the getData function might have failed,
                    // allowing the user to handle that using onSyncFail
                    input.onSyncFail(reason);
                });
                
                
            }, input.timeout);
            deferred.resolve(cache);
            return deferred.promise;

        }

    };

    // Check to see if localStorage is supported
    function isStorageSupported() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }

    // Returns a promise
    // Details
    function asyncGetFromServer(timeout, getData) {

        var deferredServerCall = $q.defer();
        $timeout(function () {
            var data = getData();
            if (data) {
                deferredServerCall.resolve(data);
            } else {
                deferredServerCall.reject("Data is empty");
            }

        }, timeout);
        return deferredServerCall.promise;

    }


});
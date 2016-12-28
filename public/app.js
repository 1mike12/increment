/**
 * Created by mike on 12/12/15.
 */
var app = angular.module("app", ["ngMaterial", "ui.router"]
);

app.run(function($rootScope, $window){
    $rootScope.$on('$locationChangeSuccess', function(){
        if ($window.Appcues) {
            $window.Appcues.start();
        }
    });
});

//todo is it smart to have appcues user's id not be UUID?
//todo mention there's typo https://my.appcues.com/install/spa/22456
app.controller('MainController', function($scope, $rootScope, $window){

    $window.Appcues.anonymous()
});
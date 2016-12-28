/**
 * Created by mike on 12/12/15.
 */
var app = angular.module("app", ["ngMaterial"]
);

//todo is it smart to have appcues user's id not be UUID?
//todo mention there's typo https://my.appcues.com/install/spa/22456
app.controller('LoginController', function($scope, $rootScope, AUTH_EVENTS, AuthService){
    $scope.credentials = {
        username: '',
        password: ''
    };
    $scope.login = function(credentials){
        AuthService.login(credentials).then(function(user){
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            $scope.setCurrentUser(user);
            // Call Appcues.identify()
            Appcues.identify(currentUser.id, {
                name: currentUser.name,
                email: currentUser.email,
                created_at: currentUser.createdAt
                // Additional user properties.
            });
        }, function(){
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
        });
    };
});

app.run(function($rootScope, $window){
    $rootScope.$on('$viewContentLoaded', function(){
        if ($window.Appcues) {
            $window.Appcues.start();
        }
    });
});
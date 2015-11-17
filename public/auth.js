app.factory("authenticationSvc", function($http, $q, $window) {
	var userInfo;

	function login(userName, password) {
		var deferred = $q.defer();

		$http.post("/login", {
		  userName: userName,
		  password: password
		}).then(function(data) {
		  userInfo = {
			accessToken: data.access_token,
			userName: data.userName
		  };
		  $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
		  deferred.resolve(userInfo);
		}, function(error) {
		  deferred.reject(error);
		});

		return deferred.promise;
	}

	return {
		login: login
	};
});
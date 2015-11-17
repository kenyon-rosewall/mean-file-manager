var app = angular.module('fileServer', ['angularFileUpload']);

/*
AuthService handles all authentication, login and logout
*/
app.factory('authService', function($rootScope,$http,$window) {
	var authService = {};
	
	authService.check_authentication = function() {
		if ($window.sessionStorage["userInfo"]) {
			userInfo = JSON.parse($window.sessionStorage["userInfo"]);
			$http.post('/authenticate',userInfo)
				.success(function(data) {
					if(data.user != '' && data.access_token != '') {
						$rootScope.auth = true;
					} else {
						data.user = data.access_token = '';
						$window.sessionStorage["userInfo"] = JSON.stringify(userdata);
						$rootScope.auth = false;
					}
				})
				.error(function(data) {
					console.log('Error: ' + data);
				});
		} else {
			$rootScope.auth = false;
		}
	}
	
	authService.login = function(username,password) {
		var data = {user:username, password:password};
		$http.post('/login',data)
			.success(function(data) {
				console.log(data);
				if(data.user != '' && data.access_token != '') {
					userInfo = {
						accessToken: data.access_token,
						user: data.user
					};
					$window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
					$rootScope.auth = true;
					return true;
				} else {
					$rootScope.auth = false;
					return false;
				}
			})
			.error(function(data) {
				console.log('Error: ' + data);
				return false;
			});
	}
	
	authService.logout = function() {
		$window.sessionStorage.removeItem("userInfo");
		$rootScope.auth = false;
	}
	
	return authService;
});


app.controller('mainController', function($scope,$http,FileUploader,authService) {
	// Init function which checks auth, sets inital path, 
	// draws cookie crumbs, hides audio player and refreshes the page
	$scope.init = function() {
		authService.check_authentication($scope);
		$scope.path = '/';
		$scope.cookie_crumbs();
		$scope.audio_show = false;
		$scope.get_root();
	}
	
	// Plan to create a link on each crumb, so you can jump around with crumbs
	// instead of clicking ".." a bunch of times.
	$scope.cookie_crumbs = function() {
		var dirs = $scope.path.split('/');
		dirs.shift();
		var out = '';
		var path = '';
		
		for(var i in dirs) {
			path += '/' + dirs[i];
			out += ' / ' + dirs[i] + '</a>';
		}
		
		$scope.path_info = out;
	}
	
	// Load root directory and refresh page
	$scope.get_root = function() {
		$http.get('/files')
			.success(function(data) {
				$scope.files = data;
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	}
	
	// Utility to determine when to put a '/' between paths
	// It seems finicky due to how path.normalize() works in node.js
	$scope.fix_path = function(path,name) {
		var returnPath = path + $scope.path;
		if($scope.path != '/') returnPath += '/';
		returnPath += name;
		
		return returnPath;
	}
		
	// Whenever you click on a file or folder, determine which and either 
	// change directory or play audio file
	$scope.click = function(name,type) {
		if(type == 'folder') {
			$http.get('/files/path' + $scope.path + '/' + name)
				.success(function(data) {
					$scope.files = data.files;
					$scope.path = data.path;
					$scope.cookie_crumbs();
				})
				.error(function(data) {
					console.log('Error: ' + data);
				});
		}
		
		// Angular doesn't like to play with <audio> well, so I have to grab
		// the element, load the file and play it with js. Works fine.
		if(type == 'audio') {
			$scope.audio_show = true;
			$scope.audio_name = name.substring(0,name.length-5);
			
			var audio_el = document.getElementsByTagName('audio')[0];
			audio_el.src = $scope.fix_path('/audio', name.substring(0, name.length-1));
			audio_el.load();
			audio_el.play();
		}
	};
	
	// Adding a folder to the current path you are viewing
	$scope.submit_folder = function() {
		var postPath = $scope.fix_path('/folder', $scope.folder);
		
		$http.post(postPath)
			.success(function(data) {
				if($scope.path == '/') {
					$scope.get_root();
				} else {
					$scope.click('.','folder');
				}
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	};
	
	// Init for file uploader
	$scope.uploader = new FileUploader({
		url: '/upload/'
	});
	
	// Dummy function to handle some scope problems with the form
	// and refresh
	$scope.login = function() {
		if(authService.login($scope.loginForm.user,$scope.loginForm.password)) {
			$scope.loginForm.user = '';
			$scope.loginForm.password = '';
			$scope.get_root();
		}
	}
	
	// Dummy function to handle logout, in case I need to do
	// something special in the future
	$scope.logout = function() {
		authService.logout();
		var audio_el = document.getElementsByTagName('audio')[0];
		audio_el.pause();
	}
	
	// Init the app!
	$scope.init();
});
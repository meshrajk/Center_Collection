angular.module("CenterCollection").controller('CollectionController', ['$scope', '$mdDialog', '$mdPanel', '$localStorage',
    function ($scope, $mdDialog, $mdPanel, $localStorage) {
        var user;
        $scope.gameName = "";
        loadGames();
        $scope.players = [];
        $scope.hand = {};
        $scope.hands = [];
        $scope.games = [];
        $scope.event;
        $scope.game;
        $scope.startNewGame = function (ev) {
            $scope.event = ev;
            $mdDialog.show({
                controller: function ($scope, $mdDialog) {
                    var self = this;
                    self.parent = $scope;
                    self.cancel = function () {
                        $mdDialog.cancel();
                    };
                    self.done = function () {
                        var resopnse = { userName: self.userName, addMore: false };
                        $mdDialog.hide(resopnse);
                    };
                    self.addMoreUser = function () {
                        var resopnse = { userName: self.userName, addMore: true };
                        $mdDialog.hide(resopnse);
                    };
                },
                templateUrl: 'app/template/newUserTemplate.html',
                controllerAs: 'addUsrCtrl',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: false // Only for -xs, -sm breakpoints.
            }).then(function (resopnse) {
                $scope.addUser(resopnse);
            }, function () {
            });
        };
        $scope.restartNewGame = function (ev) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to restart?')
                .textContent('Restartin game will erase all of the current game data.')
                .ariaLabel('Resart Game')
                .targetEvent(ev)
                .ok('Please do it!')
                .cancel('No, Continue this game');

            $mdDialog.show(confirm).then(function () {
                $scope.hands = [];
                $scope.players = [];
                $scope.startNewGame(ev);
            }, function () {
                $mdDialog.hide();
            });

        }
        $scope.check = function () {
            for (var i = 0; i < 10; i++) {
                var playerPoints = [];
                for (var j = 0; j < $scope.players.length; j++) {
                    var point = getRandomArbitrary(1, 10);
                    var player = new playerPoint();
                    player.name = $scope.players[j];
                    player.point = Math.ceil(point);
                    playerPoints.push(player);
                }
                $scope.hands.push(playerPoints);
            }
            $scope.totals = [];
            for (var j = 0; j < $scope.players.length; j++) {
                var player = new playerTotalPoint();
                player.name = $scope.players[j];
                var total = 0;
                $scope.hands.forEach(function (h) {
                    console.log(h);
                    h.forEach(function (p) {
                        if (p.name == player.name) {
                            total += p.point;
                        }
                    });
                });
                player.total = Math.ceil(total);
                $scope.totals.push(player);
            }
        }
        $scope.handOver = function (ev) {
            $scope.event = ev;
            $mdDialog.show({
                controller: function ($scope, $mdDialog, locals) {
                    var self = this;
                    self.players = JSON.parse(locals.players);
                    self.cancel = function () {
                        $mdDialog.cancel();
                    };
                    self.done = function () {
                        $mdDialog.hide({ playersKhane: self.players, handFinisher: self.finisher });
                    };
                },
                templateUrl: 'app/template/whoFinished.html',
                controllerAs: 'gmOvrCtrl',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false,
                locals: {
                    players: JSON.stringify($scope.players)
                },
                fullscreen: false // Only for -xs, -sm breakpoints.
            }).then(function (resopnse) {
                $scope.addHand(resopnse);

            }, function () {
            });
        };
        $scope.addHand = function (handDetails) {
            var totalMaal = 0;
            var playersKhane = handDetails.playersKhane
            var finisher = handDetails.handFinisher;

            playersKhane.forEach(function (maal) {
                totalMaal += maal.khane ? maal.khane : 0;
            });

            calculatePointsPerHand(playersKhane, finisher, totalMaal);

            var lastHand = $scope.hands[$scope.hands.length - 1];
            $scope.players.forEach(function (plr) {
                var newhand_p = playersKhane.filter(function (r) {
                    return r.name == plr.name
                })[0];
                newhand_p.finisher = plr.name === finisher;
                plr.totalPoint = plr.totalPoint ? plr.totalPoint + newhand_p.pointThisRound : newhand_p.pointThisRound;
            });
            $scope.hands.push(playersKhane);
            $scope.saveGame();
        }
        $scope.removeHand = function (hand) {
            var i = $scope.hands.indexOf(hand);
            if (i > -1) {
                hand.forEach(function (p) {
                    $scope.players.filter(function (ps) {
                        if (ps.name == p.name) {
                            ps.totalPoint -= p.pointThisRound;
                        }
                    });
                });
                $scope.hands.splice(i, 1);
                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(false)
                        .title('Hand removed')
                        .textContent('Hand is removed.')
                        .ariaLabel('Hand removed')
                        .ok('Got it!')
                        .targetEvent(ev)
                );
            }
        }
        $scope.addUser = function (response) {
            var exitsingPlayer = $scope.players.filter(function (p) {
                return p.name == response.userName;
            });

            if (exitsingPlayer.length > 0) {
                alert("User already added");
                $scope.startNewGame($scope.event);
                return;
            }
            var p = new player();
            p.name = response.userName;
            $scope.players.push(p);
            if (response.addMore) {
                if ($scope.players.length > 5) {
                    alert("You can only add up to 6 players");
                    return;
                }
                $scope.startNewGame($scope.event);
            } else {
                var g = new game();
                g.name = makeName();
                g.hands = $scope.hands;
                g.players = $scope.players;
                $scope.game = g;
                $scope.games.push(game);
            }
        }
        $scope.saveGame = function () {
            var g = $scope.games.filter(function (s) {
                return s.gameName === $scope.gameName;
            });
            if (g) {
                var i = $scope.games.indexOf(g);
                if (i > -1)
                    $scope.games.splice(1, i, g);
            }
            $localStorage.centerCollectionGames = JSON.stringify($scope.games);
        }
        function loadGames() {
            var games = $localStorage.centerCollectionGames;
            if (games) {
                $scope.games = JSON.parse(games);
            }
        }
        function calculatePointsPerHand(playersKhane, finisher, totalMaal) {
            var totalThisHand = 0;
            playersKhane.forEach(function (plr) {
                plr.finisher = plr.name === finisher;
                if (!plr.finisher) {
                    var d = !plr.herena ? 3 : 10;
                    var total = !plr.herena ? ((plr.khane ? plr.khane : 0) * $scope.players.length) - (totalMaal + d) : (totalMaal + d) * (-1);
                    plr.pointThisRound = total;
                    totalThisHand += total;
                }
            });
            playersKhane.forEach(function (plr) {
                if (plr.finisher)
                    plr.pointThisRound = totalThisHand * (-1);
            });
        }
        function getRandomArbitrary(min, max) {
            return Math.random() * (max - min) + min;
        }
        function player(name, khane, pointThisRound, totalPoint, finisher, herena) {
            return this.name = name, this.khane = khane, this.pointThisRound = pointThisRound, this.totalPoint = totalPoint, this.finisher = finisher, this.herena = herena
        }
        function game(name, players, hands) {
            return this.name = name, this.players = players, this.hands = hands;
        }
        function makeName() {
            var text = "";
            var possible = "abcdefghijklmnopqrstuvwxyz";

            for (var i = 0; i < 5; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            var date = new Date();// Date();
            return 'Game on-' + date.getMonth() + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
        }
    }
]);

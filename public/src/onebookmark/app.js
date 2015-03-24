(function() {
  'use strict';

  angular.module('groupsApp', ['firebase'])
  .value('fbURL', 'https://onebookmark-demo.firebaseio.com/groups/')
  .factory('Groups', function($firebase, fbURL) {
    return $firebase(new Firebase(fbURL)); // jshint ignore:line
  })
  .controller('groupsCtrl', function($scope, $log, Groups, $firebase, fbURL) {

    $scope.info = "";

    $scope.newCategory = "";

    $scope.groups = JSON.parse(window.localStorage.getItem('groups') || '[]');

    $scope.$watch(function () {
      return Groups.$getIndex();
    },
    function() {
      $scope.groups = [];
      var index = Groups.$getIndex();
      if (index.length > 0) {

        // load array to add and clear
        var array = JSON.parse(localStorage.getItem('bmqueue') || "[]");
        localStorage.setItem('bmqueue', "[]");

        for (var i = 0; i < index.length; i++) {
          var group = Groups[index[i]];
          if (group) {
            group.id = index[i];
            group.editing = false;
            if (!group.categories) {
              group.categories = [];
            }
            group.$firebase = $firebase(new Firebase(fbURL + group.id)); // jshint ignore:line
            group.destroy = function() {
              this.$firebase.$remove();
            };
            group.save = function() {
              this.$firebase.title = this.title;
              this.$firebase.sortOrder = this.sortOrder;
              this.$firebase.categories = this.categories;
              this.$firebase.$save();
              this.editing = false;
            };
            array.map(function(a) {
              if (a.categoryName == group.name) {
                // push tags
                if (!group.tags) {
                  group.tags = a.topics;
                } else {
                  a.topics.map(function(t) {
                    if (group.tags.indexOf(t) == -1) {
                      group.tags.push(t);
                    }
                  });
                }
                group.categories.push({
                  title: a.title,
                  url: a.url,
                  sortOrder: group.categories.length,
                  type: "category",
                  topics: a.topics
                });
              }
            });
            group.save();
            $scope.groups.push(group);
          }
        }
        $scope.groups.sort(function(group1, group2) {
          return group1.sortOrder - group2.sortOrder;
        });

        window.localStorage.setItem('groups', JSON.stringify($scope.groups));

        $scope.group = $scope.groups[0];
      }
    }, true);

    $scope.addGroup = function() {
      if ($scope.groups.length > 10) {
        window.alert('You can\'t add more than 10 groups!');
        return;
      }
      var groupName = document.getElementById("group_name_new").value;
      if (groupName.length > 0) {
        Groups.$add({
          name: groupName,
          type: "group",
          categories: [],
          sortOrder: $scope.groups.length,
          tags: []
        });
        document.getElementById("group_name_new").value = '';
      }
    };

    $scope.editGroup = function(group) {
      group.editing = true;
    };

    $scope.cancelEditingGroup = function(group) {
      group.editing = false;
    };

    $scope.enableNewCategory = function() {
      $scope.groupEditing = true;
      setTimeout(function() {
        $('#group_name_new').focus();
      }, 500);
    }

    $scope.saveGroup = function(group) {
      group.save();
    };

    $scope.removeGroup = function(group) {
      if (window.confirm('Are you sure to remove this group?')) {
        group.destroy();
      }
    };

    $scope.saveGroups = function() {
      for (var i = $scope.groups.length - 1; i >= 0; i--) {
        var group = $scope.groups[i];
        group.sortOrder = i + 1;
        group.save();
      }
    };

    $scope.addCategory = function(group) {
      if (!group.newCategoryName || group.newCategoryName.length === 0) {
        return;
      }
      group.categories.push({
        title: group.newCategoryName,
        url: group.url,
        sortOrder: group.categories.length,
        type: "category"
      });
      group.newCategoryName = '';
      group.url = '';
      group.save();
    };

    $('#group_name_new').on('keypress', function(e) {
      if (e.keyCode == 13) {
        $scope.addGroup();
        $scope.groupEditing = false;
      }
    });

    $scope.removeCategory = function(group, category) {
      if (window.confirm('Are you sure to remove this category?')) {
        var index = group.categories.indexOf(category);
        if (index > -1) {
          group.categories.splice(index, 1)[0];
        }
        group.save();
      }
    };

    $scope.showContent = function(group) {
      $scope.group = group;
    };

    $scope.options = {
      accept: function(sourceNode, destNodes, destIndex) {
        var data = sourceNode.$modelValue;
        var destType = destNodes.$element.attr('data-type');
        return (data.type == destType); // only accept the same type
      },
      dropped: function(event) {
        console.log(event);
        var sourceNode = event.source.nodeScope;
        var destNodes = event.dest.nodesScope;
        // update changes to server
        if (destNodes.isParent(sourceNode)
          && destNodes.$element.attr('data-type') == 'category') { // If it moves in the same group, then only update group
          var group = destNodes.$nodeScope.$modelValue;
          group.save();
        } else { // save all
          $scope.saveGroups();
        }
      },
      beforeDrop: function(event) {
        if (!window.confirm('Are you sure you want to drop it here?')) {
          event.source.nodeScope.$$apply = false;
        }
      }
    };


  });

})();

/* Routers */

//Router.before(mustBeSignedIn, {except: ['index']});

/* Reset SubsManager */
SubsManager.prototype.reset = function() {
  var self = this;
  _.each(self._cacheList, function(sub) {
    delete self._cacheMap[sub.hash];
  });
  self._cacheList = [];
};

/* Subscription Managers */

var chatRoomSubs = new SubsManager({
  cacheLimit: 1,
  expireIn: 9999
});

var chatLogSubs = new SubsManager({
  cacheLimit: 5,
  expireIn: 9999
});

var chatLogPaginationSubs = new SubsManager({
  cacheLimit: 3,
  expireIn: 9999
});

var serverNickSubs = new SubsManager({
  cacheLimit: 5,
  expireIn: 9999
});
/* End Subscription Managers */


/* Configure */
preloadSubscriptions = [];
preloadSubscriptions.push('currentUser');

Router.configure({
  layoutTemplate: 'layout',
  //loadingTemplate: 'loading',
  //notFoundTemplate: 'not_found',
  waitOn: function () {
    return _.map(preloadSubscriptions, function(sub){
      // can either pass strings or objects with subName and subArguments properties
      if (typeof sub === 'object'){
        Meteor.subscribe(sub.subName, sub.subArguments);
      }else{
        Meteor.subscribe(sub);
      }
    });
  }
});
/* End configure */


/* Controllers */

BaseController = RouteController.extend({
  layoutTemplate: 'layout',
  waitOn: function () {

  },
  onAfterAction: function () {
    navManager.set();
  }
});

BaseChatController = BaseController.extend({
  template: 'chat',
  waitOn: function () {
    return chatRoomSubs.subscribe('chatRooms');
  },
  onRun: function () {
    if (navManager.isSamePage(Router.current())) {
      var pageStack = waartaa.chat.helpers.chatLogsWaypointHandler.getPageStack();
      if (pageStack.length > 0 && this.params.from &&
          moment(this.params.from).toDate().toString() ==
          pageStack[0].toString())
        waartaa.chat.helpers.chatLogsWaypointHandler.bind();
      if (this.params.direction == 'down')
        $('.chatlogs-scroll-down .chatlogs-loader-msg').show();
      else if (this.params.direction == 'up' && pageStack.length > 1)
        $('.chatlogs-scroll-up .chatlogs-loader-msg').show();
    } else {
      $('#chatlogs-loader').show();
      chatLogPaginationSubs.reset();
    }
  },
  onAfterAction: function () {
    if (this.ready()) {
      Meteor.setTimeout(function () {
        waartaa.chat.helpers.chatLogsWaypointHandler.bind();
      }, 1000);
    }
  },
  data: function (pause) {
    Meteor.setTimeout(function () {
      $('.chatlogs-loader-msg').fadeOut();
    }, 2000);
    $('#chatlogs-loader').fadeOut();
  },
  onStop: function () {
    waartaa.chat.helpers.chatLogsWaypointHandler.unbind();
  }
});
/* End controllers */


Router.map(function () {
  this.route('index', {
    path: '/',
    template: 'user_loggedout_content',
    onBeforeAction: function (pause) {
      if (Meteor.isClient)
        if (Meteor.userId()) {
          Router.go('/nchat/', {replaceState: true});
          pause();
        }
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview();
      Session.set('currentPage', 'index');
    },
    fastRender: true
  });

  this.route('nchat', {
    path: /^\/nchat$/,
    onBeforeAction: function () {
      this.redirect('/nchat/');
    }
  });

  this.route('nchat/', {
    path: /^\/nchat\/$/,
    template: 'main',
    layoutTemplate: 'viewport',
    yieldTemplates: {
      'chatSidebar': {to: 'sidebar'},
      'chatBox': {to: 'viewport'},
    }
  });

  this.route('addNetwork', {
    path: '/chat/networks/new/',
    template: 'main',
    layoutTemplate: 'viewport',
    yieldTemplates: {
      'chatSidebar': {to: 'sidebar'},
      'addNetwork': {to: 'main'},
    }
  });

  this.route('account', {
    path: /^\/settings$/,
    onBeforeAction: function(pause) {
      Router.go('/settings/', {replaceState: true});
      pause();
    }
  });

  this.route('account/', {
    path: /^\/settings\/$/,
    template: 'accountSettings',
    layoutTemplate: 'layout',
    onAfterAction: function () {
      Session.set('currentPage', 'account');
    },
    onBeforeAction: [
        function () {
            if (Meteor.isClient) {
                if(!Meteor.userId()) {
                    this.redirect('/');
                }
            }
        },
    ],
  });

  this.route('chat', {
    path: /^\/chat$/,
    onBeforeAction: function (pause) {
      Router.go('/chat/', {replaceState: true});
      pause();
    }
  });

  this.route('chat/', {
    path: /^\/chat\/$/,
    template: 'chat',
    onBeforeAction: [
      function () {
        if (Meteor.isClient) {
          if (!Meteor.userId()) {
            this.redirect('/');
            GAnalytics.pageview();
          } else {
            //ChatSubscribe();
          }
        }
      },
      function () {
        if (Meteor.isClient) {
          // we're done waiting on all subs
          if (this.ready()) {
            NProgress.done();
            if (UserServers.find().count() == 0)
              $('#server-add-btn').click();
          } else {
            NProgress.start();
          }
        }
      }
    ],
    waitOn: function () {
      return [
        Meteor.subscribe('servers'),
        Meteor.subscribe('user_servers'),
        Meteor.subscribe('user_channels'),
        Meteor.subscribe('bookmarks')
      ]
    },
    controller: 'BaseChatController',
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview('/chat/');
      Session.set('currentPage', 'chat');
    },
    fastRender: true
  });
  this.route('search', {
    path: /^\/search$/,
    onBeforeAction: function () {
      Router.go('/search/');
    }
  });
  this.route('search/', {
    path: /^\/search\/$/,
    template: 'search',
    onBeforeAction: [
      function (pause) {
        if (Meteor.isClient) {
          if (!Meteor.userId()) {
            Router.go('/');
            this.render('user_loggedout_content');
            GAnalytics.pageview();
            pause();
          } else {
            ChatSubscribe();
          }
        }
      },
      function (pause) {
        if (Meteor.isClient) {
          // we're done waiting on all subs
          if (this.ready()) {
            NProgress.done();
          } else {
            NProgress.start();
            pause(); // stop downstream funcs from running
          }
        }
      }
    ],
    waitOn: function () {
      return [
        Meteor.subscribe('user_servers'),
        Meteor.subscribe('user_channels'),
        Meteor.subscribe('bookmarks')
      ]
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview('/search/');
    },
    fastRender: true
  });


  /* Router for server chat room */
  this.route('chatRoomServer', {
    path: '/chat/server/:serverName',
    controller: BaseChatController,
    onBeforeAction: function (pause) {
      var server = UserServers.findOne({name: this.params.serverName});
      if (!server) {
        pause();
        return;
      }
      waartaa.chat.helpers.setCurrentRoom({
        roomtype: 'server', server_id: server._id, server_name: server.name
      });
      if (this.ready()) {
        var redirect = waartaa.chat.helpers.chatLogsWaypointHandler
                      .handleScrolldownResponse(this.params);
        if (redirect)
          pause();
      }
    },
    waitOn: function () {
      var userServer = UserServers.findOne(
        {name: this.params.serverName});
      if (!userServer)
        return;
      var subsManager = this.params.direction?
        chatLogPaginationSubs: chatLogSubs;
      var from = this.params.from || null;
      var direction = this.params.direction || 'down';
      var limit = this.params.limit || DEFAULT_LOGS_COUNT;
      return [
        subsManager.subscribe(
          "user_server_logs", userServer.name,
          from, direction, limit,
          function () {
            $('.chatlogs-loader-msg').fadeOut(1000);
          }
        )
      ];
    }
  });

  /* Router for channel chat room */
  this.route('chatRoomChannel', {
    path: '/chat/server/:serverName/channel/:channelName',
    controller: BaseChatController,
    onBeforeAction: function (pause) {
      var channel = UserChannels.findOne(
        {
          user_server_name: this.params.serverName,
          name: '#' + this.params.channelName
        }
      );
      if (!channel) {
        pause();
        return;
      }
      waartaa.chat.helpers.setCurrentRoom({
        roomtype: 'channel', server_id: channel.user_server_id,
        channel_id: channel._id, channel_name: channel.name,
        server_name: channel.user_server_name
      });
      if (this.ready()) {
        var redirect = waartaa.chat.helpers.chatLogsWaypointHandler
                      .handleScrolldownResponse(this.params);
        if (redirect)
          pause();
      }
    },
    waitOn: function () {
      var channel = UserChannels.findOne({
        user_server_name: this.params.serverName,
        name: '#' + this.params.channelName
      }) || {};
      var subsManager = this.params.direction?
        chatLogPaginationSubs: chatLogSubs;
      var from = this.params.from || null;
      var direction = this.params.direction || 'down';
      var limit = this.params.limit || DEFAULT_LOGS_COUNT;
      return [
        subsManager.subscribe(
          'channel_logs', '#' + this.params.channelName,
          from, direction, limit,
          function () {
            var channel = UserChannels.findOne(
              {
                user_server_name: this.params.serverName,
                name: '#' + this.params.channelName
              }
            ) || {};
            waartaa.chat.helpers.roomAccessedTimestamp.initialize(
              'channel', {
                server_name: channel.user_server_name,
                channel_name: channel.name
              }
            );
          }
        ),
        chatLogSubs.subscribe(
          'channel_nicks', channel.user_server_name, channel.name,
          Session.get('lastNick-' + channel.user_server_name +
                      '_' + channel.name),
          Session.get('startNick-' + channel.user_server_name +
                      '_' + channel.name),
          function () {
            $('.channel-nicks-loader').fadeOut(1000);
            var last_nick = ChannelNicks.findOne(
              {
                channel_name: channel.name,
                server_name: channel.user_server_name,
              },
              {
                sort: {nick: -1}
              }
            );
            var start_nick = ChannelNicks.findOne(
              {
                channel_name: channel.name,
                server_name: channel.user_server_name,
              },
              {
                sort: {nick: 1}
              }
            );
            Session.set(
              'currentLastNick-' + channel.user_server_name +
              '_' + channel.name,
              (last_nick || {}).nick);
            Session.set(
              'currentStartNick-' + channel.user_server_name +
              '_' + channel.name,
              (start_nick || {}).nick);
            if (Session.get(
              'startNick-' + channel.user_server_name + '_' + channel.name))
              $('#info-panel .nano').nanoScroller();
              $('#info-panel .nano').nanoScroller({scrollTop: 30});
          }
        )
      ];
    }
  });

  /* Router for PM chat room */
  this.route('chatRoomPM', {
    path: '/chat/server/:serverName/nick/:nick',
    controller: BaseChatController,
    onBeforeAction: function (pause) {
      var server = UserServers.findOne({name: this.params.serverName});
      if (!server) {
        pause();
        return;
      }
      var nick = this.params.nick;
      Meteor.call('toggle_pm', server._id, nick, 'create', function () {
        waartaa.chat.helpers.setCurrentRoom({
          roomtype: 'pm', server_id: server._id,
          room_id: server._id + '_' + nick,
          server_name: server.name, nick: nick
        });
      });
      Meteor.call('send_command', server.name, '/WHOIS ' + nick, {});
      if (this.ready()) {
        var redirect = waartaa.chat.helpers.chatLogsWaypointHandler
                      .handleScrolldownResponse(this.params);
        if (redirect)
          pause();
      }
    },
    waitOn: function () {
      var userServer = UserServers.findOne(
        {name: this.params.serverName});
      if (!userServer)
        return;
      var nick = this.params.nick;
      var room_id = userServer._id + '_' + nick;
      var subsManager = this.params.direction?
        chatLogPaginationSubs: chatLogSubs;
      var from = this.params.from || null;
      var direction = this.params.direction || 'down';
      var limit = this.params.limit || DEFAULT_LOGS_COUNT;
      return [
        subsManager.subscribe(
          'pm_logs', room_id, from, direction, limit,
          function () {
            waartaa.chat.helpers.roomAccessedTimestamp.initialize(
              'pm', {
                server_name: userServer.name,
                nick: nick
              }
            );
          }
        ),
        serverNickSubs.subscribe(
          'server_nicks', userServer.name, [nick]
        )
      ];
    }
  });
});

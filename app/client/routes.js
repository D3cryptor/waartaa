/* Routers */

Router.configure({
  layoutTemplate: 'viewport'
});

//Router.before(mustBeSignedIn, {except: ['index']});

Router.map(function () {
  this.route('index', {
    path: '/',
    template: 'user_loggedout_content',
    onBeforeAction: function () {
      if (Meteor.isClient)
        if (Meteor.userId()) {
          this.redirect('/nchat/');
        }
    },
    onAfterAction: function () {
      if (Meteor.isClient)
        GAnalytics.pageview();
      Session.set('currentPage', 'index');
    },
    fastRender: true
  });

  Router.map(function () {
    this.route('nchat/', {
      path: /^\/nchat\/$/,
      template: 'main',
      layoutTemplate: 'viewport',
      yieldTemplates: {
        'chatSidebar': {to: 'sidebar'},
        'chatBox': {to: 'main'},
      }
    });
  });

  this.route('account', {
    path: /^\/settings$/,
    onBeforeAction: function() {
      this.redirect('/settings/');
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

  this.route('nchat', {
    path: /^\/nchat$/,
    onBeforeAction: function () {
      this.redirect('/nchat/');
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
            ChatSubscribe();
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
});

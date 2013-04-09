// Generated by CoffeeScript 1.4.0

/*
Background Page Application Class
*/


(function() {
  var BackgroundApplication;

  BackgroundApplication = (function() {

    function BackgroundApplication(subdomain, auth_string) {
      this.subdomain = subdomain;
      this.auth_string = auth_string;
      this.client = new Harvest(this.subdomain, this.auth_string);
      this.version = '0.3.0';
      this.authorized = false;
      this.total_hours = 0.0;
      this.current_hours = 0.0;
      this.badge_flash_interval = 0;
      this.refresh_interval = 0;
      this.todays_entries = [];
      this.projects = [];
      this.clients = {};
      this.preferences = {};
      this.timer_running = false;
    }

    BackgroundApplication.prototype.upgrade_detected = function() {
      var stored_version;
      stored_version = localStorage.getItem('hayfever_version');
      if (!stored_version) {
        localStorage.setItem('hayfever_version', this.version);
        return false;
      } else {
        return stored_version === this.version;
      }
    };

    BackgroundApplication.prototype.start_refresh_interval = function() {
      return this.refresh_interval = setInterval(this.refresh_hours, 36000);
    };

    BackgroundApplication.prototype.get_preferences = function() {
      var prefs;
      prefs = localStorage.getItem('hayfever_prefs');
      if (prefs) {
        prefs = JSON.parse(prefs);
        this.preferences = prefs;
      }
      return this.preferences;
    };

    BackgroundApplication.prototype.get_auth_data = function() {
      var data;
      data = {
        subdomain: localStorage.getItem('harvest_subdomain'),
        auth_string: localStorage.getItem('harvest_auth_string'),
        username: localStorage.getItem('harvest_username')
      };
      return data;
    };

    BackgroundApplication.prototype.auth_data_exists = function() {
      var auth;
      auth = this.get_auth_data();
      return !auth.subdomain.isBlank() && !auth.auth_string.isBlank();
    };

    BackgroundApplication.prototype.set_badge = function() {
      var badge_color, badge_text, prefs;
      prefs = this.get_preferences();
      badge_color = $.hexColorToRGBA(prefs.badge_color);
      switch (prefs.badge_display) {
        case 'current':
          badge_text = prefs.badge_format === 'decimal' ? this.current_hours.toFixed(2) : this.current_hours.toClockTime();
          break;
        case 'total':
          badge_text = prefs.badge_format === 'decimal' ? this.total_hours.toFixed(2) : this.total_hours.toClockTime();
          break;
        default:
          badge_text = '';
      }
      chrome.browserAction.setBadgeBackgroundColor({
        color: badge_color
      });
      return chrome.browserAction.setBadgeText({
        text: badge_text
      });
    };

    BackgroundApplication.prototype.refresh_hours = function(callback) {
      var prefs, todays_hours,
        _this = this;
      console.log('refreshing hours');
      prefs = this.get_preferences();
      callback = typeof callback === 'function' ? callback : $.noop;
      todays_hours = this.client.get_today();
      todays_hours.success(function(json) {
        var clients, current_hours, projects, total_hours;
        _this.authorized = true;
        total_hours = 0.0;
        current_hours = '';
        _this.projects = json.projects;
        _this.project_db = TAFFY(_this.projects);
        _this.todays_entries = json.day_entries;
        $.each(_this.todays_entries, function(i, v) {
          total_hours += v.hours;
          if (v.timer_started_at != null) {
            return current_hours = parseFloat(v.hours);
          }
        });
        _this.total_hours = total_hours;
        if (typeof current_hours === 'number') {
          _this.current_hours = current_hours;
          _this.timer_running = true;
          _this.start_badge_flash();
        } else {
          _this.current_hours = 0.0;
          _this.timer_running = false;
          _this.stop_badge_flash();
        }
        if (!_this.projects.isEmpty()) {
          clients = {};
          projects = _this.projects;
          $.each(_this.projects, function(i, v) {
            var client, client_key, id_exists, project_id;
            client_key = v.client.toSlug();
            project_id = v.id;
            if (!clients[client_key]) {
              clients[client_key] = {
                name: v.client,
                projects: []
              };
            }
            client = clients[client_key];
            id_exists = _(client.projects).detect(function(p) {
              return p.id === project_id;
            });
            if (!id_exists) {
              return clients[client_key].projects.push(v);
            }
          });
        }
        _this.set_badge();
        return callback.call(_this.todays_entries);
      });
      return todays_hours.error(function(xhr, text_status, error_thrown) {
        console.log('Error refreshing hours!');
        if (xhr.status === 401) {
          _this.authorized = false;
          chrome.browserAction.setBadgeBackgroundColor({
            color: [255, 0, 0, 255]
          });
          return chrome.browserAction.setBadgeText({
            text: '!'
          });
        }
      });
    };

    BackgroundApplication.prototype.badge_color = function(alpha) {
      var color, prefs;
      prefs = this.get_preferences;
      color = $.hexColorToRGBA(prefs.badge_color, alpha);
      return chrome.browserAction.setBadgeBackgroundColor({
        color: color
      });
    };

    BackgroundApplication.prototype.badge_flash = function(alpha) {
      this.badge_color(255);
      return setTimeout(this.badge_color, 1000, 100);
    };

    BackgroundApplication.prototype.start_badge_flash = function() {
      var prefs;
      console.log('Starting badge blink');
      prefs = this.get_preferences();
      if (this.badge_flash_interval === 0 && prefs.badge_blink) {
        return this.badge_flash_interval = setInterval(this.badge_flash, 2000);
      }
    };

    BackgroundApplication.prototype.stop_badge_flash = function() {
      if (this.badge_flash_interval !== 0) {
        console.log('Stopping badge blink');
        clearInterval(this.badge_flash_interval);
        this.badge_flash_interval = 0;
        return this.badge_color(255);
      }
    };

    return BackgroundApplication;

  })();

  window.BackgroundApplication = BackgroundApplication;

}).call(this);
const { exec } = require('child_process');
let sessions = {};

const debounce = (func, wait, immediate) => {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const setTitle = (pid, uid, sessionTitle) => {
  console.log('call')
  exec(`lsof -p ${pid} | grep cwd | tr -s ' ' | cut -d ' ' -f9-`, (err, cwd) => {
    if (err) {
      console.error(err);
    } else {
      cwd = cwd.split('/').pop().replace('\n', '');

      if (cwd === process.env.USER) {
        cwd = '~';
      } else if (cwd === '') {
        cwd = '/';
      }

      store.dispatch({
        type: 'SESSION_SET_XTERM_TITLE',
        title: `${cwd} (${sessionTitle})`,
        uid
      });
    }
  });
};

const debouncedTitle = debounce(setTitle, 250)

exports.middleware = (store) => (next) => (action) => {
  switch (action.type) {
    case 'SESSION_ADD':
      sessions[action.uid] = {
        pid: action.pid
      };

      break;
    case 'SESSION_PTY_EXIT':
    case 'SESSION_USER_EXIT':
      delete sessions[action.uid];

      break;
    case 'SESSION_PTY_DATA': {
      let session = sessions[action.uid];
      debouncedTitle(session.pid, action.uid, session.title);
      break;
    } case 'SESSION_SET_PROCESS_TITLE': {
      let session = sessions[action.uid];
      sessions[action.uid].title = action.title;

      debouncedTitle(session.pid, action.uid, action.title);

      break;
    }
  }

  next(action);
};

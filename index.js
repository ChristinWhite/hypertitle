const { exec } = require('child_process');
let sessions = {};

const setTitle = (pid, uid, sessionTitle) =>
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
      setTitle(session.pid, action.uid, session.title);
      break;
    } case 'SESSION_SET_PROCESS_TITLE': {
      let session = sessions[action.uid];
      sessions[action.uid].title = action.title;

      setTitle(session.pid, action.uid, action.title);

      break;
    }
  }

  next(action);
};

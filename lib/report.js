'use babel';

export default {
  //reports successfull operation if not silent mode
  success(msg, options){
    if(!atom.config.get('verilog-tools.silent'))
     report(msg, options, "success");
  },

  warning(msg, options){
    report(msg, options, "warning");
  },

  info(msg, options){
    report(msg, options, "info");
  }
};

function report(msg, options, type) {
  if (!options) {
    var pos;
    if ((pos = msg.indexOf('\n')) != -1) {
      options = new Object();
      options.detail = msg.substring(pos + 1);
      msg = msg.substring(0, pos);
    }
  }
  switch (type) {
    case "success":
      atom.notifications.addSuccess(msg, options);
      break;
    case "info":
      atom.notifications.addInfo(msg, options);
      break;
    case "warning":
      atom.notifications.addWarning(msg, options);
      break;
    default:
      //do nothing
      break;
  }
}

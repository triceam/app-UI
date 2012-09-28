/**
 * app-UI require.js package
 */
require([
  'jquery',
  'lib/app-UI/src/libs/jquery.animate-enhanced',
  'lib/app-UI/src/libs/iscroll',
  'lib/app-UI/src/libs/noClickDelay',
  'lib/app-UI/src/viewnavigator/viewnavigator',
  'lib/app-UI/src/splitviewnavigator/splitviewnavigator',
  'lib/app-UI/src/slidingview/slidingview'
],
function() {
  return {
    ViewNavigator: window.ViewNavigator,
    SplitViewNavigator: window.SplitViewNavigator,
    SlidingView: window.SlidingView
  };
});

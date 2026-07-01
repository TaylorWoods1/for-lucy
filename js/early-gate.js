/**
 * Synchronous access check — runs before app modules load.
 * Keep REQUIRE_* flags in sync with js/config.js.
 */
(function () {
  var REQUIRE_MOBILE = true;
  var REQUIRE_INSTALL = true;

  var ua = navigator.userAgent;
  var mobile = /iPhone|iPad|iPod|Android/i.test(ua);

  var inBrowserTab =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: browser)').matches;

  var standalone =
    !inBrowserTab &&
    (navigator.standalone === true ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches));

  var blocked = (REQUIRE_MOBILE && !mobile) || (REQUIRE_INSTALL && !standalone);

  if (blocked) {
    document.documentElement.classList.add('access-blocked');
  }
})();

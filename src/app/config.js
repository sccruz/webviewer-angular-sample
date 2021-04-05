(function (exports) {
  var { Annotations } = exports;

  Annotations.Forms.EmbeddedJS.update((scope) => {
    // Scope represents the window scope that embedded javascript runs within
    // console.log(scope);
  });

  window.addEventListener("viewerLoaded", function () {
    // console.log("viewerLoaded", readerControl);
  });
})(window);

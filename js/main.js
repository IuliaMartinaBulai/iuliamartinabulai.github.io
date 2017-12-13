var app = angular.module("siteApp", ['ngRoute', 'duScroll', 'ngAnimate']);
app.value('duScrollOffset', 60);

/* ------------------------------------------------------------------------------
	Router
-------------------------------------------------------------------------------*/

app.config(function($routeProvider) {
  $routeProvider
   .when("/research/:page*?", {
     templateUrl : "html/main.html",
     controller : "researchCtrl"
    })
   .otherwise({
     redirectTo: "/research"
    })
});

app.directive("mathjaxBind", function() {
  return {
    restrict: "A",
    controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
      $scope.$watch($attrs.mathjaxBind, function(texExpression) {
        $element.html(texExpression);
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);
      });
    }]
  };
});

app.run(function($rootScope) {
  $rootScope.$on("$routeChangeSuccess", function(event, currentRoute, previousRoute) {
    window.scrollTo(0, 0);
  });

  /* ------------------------------------------------------------------------------
    Helpers
  -------------------------------------------------------------------------------*/
  
  function deepCopy(o) {
    return JSON.parse(JSON.stringify(o));
  };

  function normalize(s) {
    return s.toLowerCase().replace(/\s/g, '-');
  };

  function addAlpha(hex, alpha, value) {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      let c = hex.substring(1).split('');
      if (c.length == 3)
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      c = '0x'+c.join('');
      c = [(c>>16)&255, (c>>8)&255, c&255];
      if (value < 1)
        c = [Math.trunc(c[0]*value), Math.trunc(c[1]*value), Math.trunc(c[2]*value)]
      return 'rgba('+c.join(',')+','+alpha+')';
    }
    throw new Error('Bad Hex');
  };

  function addKeys(items) {
    let k = ""
    for (const i of items) {
      i._ref = normalize(i.title);
      if ("_key" in i) {
        k += " " + i._key;
        continue;
      }
      i._key = "";
      for (const p in i) {
        if (p[0] == "_") continue;
        if (i[p] instanceof Array && i[p][0] instanceof Object) i._key += addKeys(i[p]);
        else i._key += " " + i[p];
      }
      k += i._key;
    }
    return k;
  };

  /* ------------------------------------------------------------------------------
    Controllers
  -------------------------------------------------------------------------------*/

  $rootScope.pageSet = function($scope, $location, $http, $sce, page, def, pages) {
    if (!(def.theme in $rootScope)) $rootScope[def.theme] = new Map();
    let cache = $rootScope[def.theme];
    page = page ? page : "";
    if (cache.has(page)) return $scope.data = cache.get(page);
    if (!cache.has("_db_")) {
      console.log(def.theme + ": download data");
      cache.set("_pending_", []);
      $http.get("json/"+def.theme+".json").then(function (success) {
        cache.set("_db_", success.data);
        for (let f of cache.get("_pending_")) f();
        cache.set("_pending_", []);
      }, function (error) {
        console.log(def.theme + ": failed download\n" + JSON.stringify(error));
      });
    }
    console.log(def.theme + "/" + page + ": computing header");
    for (let p of pages)
      if (!("link" in p))
        p.link = def.theme+"/"+(p.title == "Home" ? "" : normalize(p.title));
      else p.link = def.theme+"/"+p.link;
    for (let p of pages) if (p.link == def.theme+"/"+page)
      cache.set(page, $.extend(deepCopy(def), p));
    if (!cache.has(page)) $location.url(pages[0].link);
    let c = $scope.data = cache.get(page);
    c.background = {
      'background-color': c.color,
      'background-image': "url('static/wall."+def.theme+".jpg')"
    };
    c.bgalpha = {
      'background-color': c.color,
      'box-shadow': '0px 3px 13px 2px ' + addAlpha(c.color,0.2,0.4),
      'margin-bottom': '30px'
    };
    c.pi = 0;
    c.searchKey = "";
    c.hidebar = pages[0].link == def.theme+"/"+page ? "" : "hidden-xs hidden-sm";
    c.affix = function() {
      $('#scroller').affix({
        offset: {
          top: 899, //$('#scroller').offset().top
          bottom: 104 // footer height
        }
      });
    };
    c.pages = [];
    c.contents = [];
    c.address = [];
    for (let p of pages) c.pages.push({
      title: p.title,
      link: p.link,
      current: p.title == c.title ? "current" : ""
    });
    function finish() {
      console.log(def.theme + "/" + page + ": extracting content");
      c.contents = c.painter(deepCopy(cache.get("_db_")));
      c.address = cache.get("_db_").address.map($sce.trustAsHtml);
      addKeys(c.contents);
    }
    if (cache.has("_db_")) finish();
    else cache.get("_pending_").push(finish);
    return cache.get(page);
  };
});
